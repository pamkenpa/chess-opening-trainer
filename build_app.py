"""Build ChessTrainer.html / index.html from app_template.html.

Injects the chess.js engine, the SVG piece set (pieces/), and the opening book
(read from trainer.py, so BOOK edits in one place update both the CLI and the
app). Every line is re-validated against python-chess first, including a
canonical-SAN check the app relies on (it compares SANs exactly), and every
note must line up 1:1 with its move.

Usage:  python build_app.py
"""
import base64
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))

from trainer import BOOK  # noqa: E402
import chess  # noqa: E402


def validate_book():
    for d in BOOK:
        board = chess.Board()
        for tok in d["moves"]:
            move = board.parse_san(tok)
            canon = board.san(move)
            if canon != tok:
                sys.exit(f"{d['name']}: '{tok}' is not canonical SAN (should be '{canon}')")
            board.push(move)
        if len(d.get("notes", [])) != len(d["moves"]):
            sys.exit(f"{d['name']}: {len(d.get('notes', []))} notes for {len(d['moves'])} moves")
        if not d.get("intro"):
            sys.exit(f"{d['name']}: missing intro")


def load_pieces():
    pieces = {}
    for color in ("w", "b"):
        for pt in ("K", "Q", "R", "B", "N", "P"):
            path = HERE / "pieces" / f"{color}{pt}.svg"
            if not path.exists():
                sys.exit(f"missing piece file: pieces/{color}{pt}.svg")
            encoded = base64.b64encode(path.read_bytes()).decode("ascii")
            pieces[color + pt] = "data:image/svg+xml;base64," + encoded
    return pieces


def main():
    validate_book()
    tpl = (HERE / "app_template.html").read_text(encoding="utf-8")
    chessjs = (HERE / "chess.min.js").read_text(encoding="utf-8")
    if "</script" in chessjs.lower():
        sys.exit("chess.min.js contains '</script' and cannot be inlined safely")
    out = tpl.replace("/*__CHESSJS__*/", chessjs)
    out = out.replace("__PIECE_JSON__", json.dumps(load_pieces()))
    out = out.replace("__BOOK_JSON__", json.dumps(BOOK, ensure_ascii=False))
    (HERE / "ChessTrainer.html").write_text(out, encoding="utf-8")
    # index.html is what GitHub Pages serves at the site root.
    (HERE / "index.html").write_text(out, encoding="utf-8")
    print(f"Built ChessTrainer.html + index.html ({len(BOOK)} openings)")


if __name__ == "__main__":
    main()
