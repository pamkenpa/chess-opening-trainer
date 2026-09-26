#!/usr/bin/env python3
"""
Chess opening sparring bot.

The bot announces an opening and plays the opponent's side; you play the
other side from memory, one move at a time (SAN, e.g. e4, Nf3, Bb5, O-O).
Only the opening is drilled -- the drill ends when the book line ends.

Usage:
    python trainer.py                  # start drilling (weakest openings first)
    python trainer.py --no-board       # don't print the board after each move
    python trainer.py --opening Najdorf
    python trainer.py --list           # list all openings in the book

In-drill commands:  h = hint, s = show remaining moves,
                    g = give up, b = toggle board, q = quit
"""
import argparse
import json
import os
import random
import sys

try:
    import chess
except ImportError:
    sys.exit("The 'chess' package is missing. Install it with:  pip install chess")

# ----------------------------------------------------------------------------
# The book: each drill is a single main line. "side" is the color YOU play.
# Moves are in SAN, alternating White/Black starting from the initial position.
# ----------------------------------------------------------------------------

BOOK = [
    # --------------------------- You play White ---------------------------
    dict(
        name="Italian Game",
        side="w",
        moves="e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O".split(),
        idea="Slow build-up: c3 and d3 prepare d4 later, and Bc4 eyes f7.",
    ),
    dict(
        name="Ruy Lopez (Closed)",
        side="w",
        moves="e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3".split(),
        idea="Bb5 hits the knight guarding e5; build with Re1, Bb3 and c3 before d4.",
    ),
    dict(
        name="Scotch Game (Classical)",
        side="w",
        moves="e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4".split(),
        idea="Open the center immediately with d4; the e5 push gains space.",
    ),
    dict(
        name="Queen's Gambit Declined (Classical)",
        side="w",
        moves="d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6".split(),
        idea="Pin the knight with Bg5, finish development, then prepare cxd5.",
    ),
    dict(
        name="London System",
        side="w",
        moves="d4 d5 Nf3 Nf6 Bf4 e6 e3 c5 c3 Nc6 Nbd2 Bd6 Bg3".split(),
        idea="A fixed, easy-to-remember setup: Bf4, e3, c3, Nbd2. No theory fights.",
    ),
    dict(
        name="Vienna Game (Gambit)",
        side="w",
        moves="e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3 Be7 d4".split(),
        idea="f4 strikes the center at once; recapture and hit back with d4.",
    ),
    dict(
        name="English Opening (Reversed Sicilian)",
        side="w",
        moves="c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3 Nc6 O-O".split(),
        idea="A Sicilian with an extra tempo: fianchetto and pressure d5.",
    ),
    # --------------------------- You play Black ---------------------------
    dict(
        name="Sicilian Defense (Najdorf)",
        side="b",
        moves="e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Be7".split(),
        idea="...a6 controls b5 and keeps both ...e5 and ...e6 available.",
    ),
    dict(
        name="French Defense (Steinitz)",
        side="b",
        moves="e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6".split(),
        idea="Bottle the knight in with Nfd7, then undermine e5 with ...c5.",
    ),
    dict(
        name="Caro-Kann Defense (Classical)",
        side="b",
        moves="e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7".split(),
        idea="Develop the light-squared bishop OUTSIDE the pawn chain with Bf5.",
    ),
    dict(
        name="King's Indian Defense (Mar del Plata)",
        side="b",
        moves="d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7".split(),
        idea="Fianchetto, castle, then hit the center with ...e5.",
    ),
    dict(
        name="Slav Defense (Main Line)",
        side="b",
        moves="d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4".split(),
        idea="Take on c4 and develop Bf5 before locking in with ...e6.",
    ),
    dict(
        name="Nimzo-Indian Defense (Rubinstein)",
        side="b",
        moves="d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O Nc6".split(),
        idea="Pin the knight with Bb4, then hit the center with ...d5 and ...c5.",
    ),
    dict(
        name="Philidor Defense",
        side="b",
        moves="e4 e5 Nf3 d6 d4 exd4 Nxd4 Nf6 Nc3 Be7".split(),
        idea="A solid, low-theory e5 defense: keep d6, trade in the center.",
    ),
    dict(
        name="Ruy Lopez (Closed, as Black)",
        side="b",
        moves="e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O".split(),
        idea="...a6 and ...b5 claim space; tuck the bishop to e7 and castle.",
    ),
]

STATS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "progress.json")

# Make chess glyphs and '·' safe on Windows terminals and piped output.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


# ----------------------------------------------------------------------------
# Book validation + helpers
# ----------------------------------------------------------------------------

def validate_book():
    """Replay every line to catch typos before the user wastes a drill."""
    problems = []
    for drill in BOOK:
        board = chess.Board()
        for san in drill["moves"]:
            try:
                board.push_san(san)
            except ValueError:
                problems.append(f"{drill['name']}: illegal or ambiguous move '{san}'")
                break
    if problems:
        sys.exit("Book self-check failed:\n  " + "\n  ".join(problems))


def parse_san(board, text):
    """Parse user input tolerantly; returns a Move or None."""
    text = text.strip()
    if not text:
        return None
    candidates = [text]
    # Accept lowercase piece letters ("nf3"), but never touch "b4"/"d5" files.
    if text[0] in "nbqrk":
        candidates.append(text[0].upper() + text[1:])
    for cand in candidates:
        try:
            return board.parse_san(cand)
        except ValueError:
            continue
    return None


def numbered_moves(moves, start=0):
    """['e4','e5',...] -> '1.e4 e5 2.Nf3 Nc6'."""
    parts = []
    for idx in range(start, len(moves)):
        if idx % 2 == 0:
            parts.append(f"{idx // 2 + 1}.{moves[idx]}")
        else:
            parts.append(moves[idx])
    return " ".join(parts)


def render_board(board, flip=False):
    """Small unicode board; flip=True puts Black at the bottom."""
    ranks = range(7, -1, -1) if not flip else range(0, 8)
    files = list(range(0, 8)) if not flip else list(range(7, -1, -1))
    lines = []
    for r in ranks:
        cells = []
        for f in files:
            piece = board.piece_at(chess.square(f, r))
            if piece:
                cells.append(piece.unicode_symbol())
            else:
                cells.append("·" if (f + r) % 2 == 0 else " ")
        lines.append(f"{r + 1}  " + " ".join(cells))
    labels = " ".join("abcdefgh"[f] for f in files)
    lines.append("   " + labels)
    return "\n".join(lines)


# ----------------------------------------------------------------------------
# Progress tracking (persisted so weak openings come back more often)
# ----------------------------------------------------------------------------

def load_stats():
    try:
        with open(STATS_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def save_stats(stats):
    try:
        with open(STATS_FILE, "w", encoding="utf-8") as fh:
            json.dump(stats, fh, indent=2)
    except OSError as exc:
        print(f"(could not save progress: {exc})")


def record_result(stats, name, perfect):
    entry = stats.setdefault(name, {"drills": 0, "perfect": 0})
    entry["drills"] += 1
    if perfect:
        entry["perfect"] += 1


def pick_drill(stats, exclude=None, wanted=None):
    """Weighted random pick: never-drilled first, then frequently-failed ones."""
    if wanted:
        wanted = wanted.lower()
        for drill in BOOK:
            if wanted in drill["name"].lower():
                return drill
        print(f"No opening matches '{wanted}'. Type 'l' to see the list.")
        return None

    pool = [d for d in BOOK if d["name"] != exclude] or BOOK
    weights = []
    for drill in pool:
        entry = stats.get(drill["name"])
        if not entry or entry["drills"] == 0:
            weights.append(3.0)
        else:
            success = entry["perfect"] / entry["drills"]
            weights.append(0.3 + (1.0 - success))
    return random.choices(pool, weights=weights, k=1)[0]


def print_book_list():
    print("\nOpenings in the book:")
    for i, drill in enumerate(BOOK, 1):
        who = "White" if drill["side"] == "w" else "Black"
        own = drill["moves"][0 if drill["side"] == "w" else 1 :: 2]
        print(f"  {i:2d}. {drill['name']}  ({who}, {len(own)} moves)")
    print()


# ----------------------------------------------------------------------------
# The drill itself
# ----------------------------------------------------------------------------

def run_drill(drill, show_board):
    user_is_white = drill["side"] == "w"
    board = chess.Board()
    line = drill["moves"]

    print("\n" + "=" * 60)
    print(f"  {drill['name']}  --  you play {'White' if user_is_white else 'Black'}")
    print("  (h=hint  s=show line  g=give up  b=board  q=quit)")
    print("=" * 60)

    flawed = False        # any hint/show/wrong move spoils the "perfect" result
    quit_requested = False
    gave_up = False

    def show_pos():
        if show_board:
            print(render_board(board, flip=not user_is_white))

    idx = 0
    while idx < len(line) and not quit_requested and not gave_up:
        users_turn = (board.turn == chess.WHITE) == user_is_white
        expected = parse_san(board, line[idx])

        if not users_turn:
            board.push(expected)
            print(f"Bot plays: {line[idx]}")
            show_pos()
            idx += 1
            continue

        move_no = board.fullmove_number
        dots = "." if board.turn == chess.WHITE else "..."
        while True:
            try:
                raw = input(f"{move_no}{dots} your move: ").strip()
            except EOFError:
                quit_requested = True
                break
            if not raw:
                continue
            cmd = raw.lower()
            if cmd in ("q", "quit", "exit"):
                quit_requested = True
                break
            if cmd in ("b", "board"):
                show_board = not show_board
                if show_board:
                    print(render_board(board, flip=not user_is_white))
                continue
            if cmd in ("h", "hint"):
                flawed = True
                print(f"  Hint: the theory move is {line[idx]}")
                continue
            if cmd in ("s", "show"):
                flawed = True
                print(f"  Remaining: {numbered_moves(line, idx)}")
                continue
            if cmd in ("g", "giveup", "give up"):
                flawed = True
                gave_up = True
                print(f"  The line was: {numbered_moves(line)}")
                break
            mv = parse_san(board, raw)
            if mv is None:
                print(f"  '{raw}' is not a legal move in this position. Try again.")
                continue
            if mv != expected:
                flawed = True
                print(f"  X  {board.san(mv)} is not the theory move here. Try again.")
                continue
            board.push(mv)
            idx += 1
            break

    if quit_requested:
        return False, True

    if gave_up:
        print(f"\n  >> Gave up on: {drill['name']}")
    else:
        if show_board:
            print(render_board(board, flip=not user_is_white))
        verdict = "PERFECT" if not flawed else "complete"
        print(f"\n  >> Line {verdict}: {drill['name']}")
        print(f"     {numbered_moves(line)}")
        print(f"     Idea: {drill['idea']}")

    return not flawed, False


# ----------------------------------------------------------------------------
# Main loop
# ----------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Chess opening sparring bot")
    ap.add_argument("--opening", help="drill a specific opening (substring match)")
    ap.add_argument("--no-board", action="store_true", help="hide the board")
    ap.add_argument("--list", action="store_true", help="list openings and exit")
    args = ap.parse_args()

    validate_book()
    stats = load_stats()

    if args.list:
        print_book_list()
        return

    show_board = not args.no_board
    last_name = None

    print(__doc__.strip().splitlines()[0])
    print("Bot names an opening, you play the moves from memory. Ctrl+C to stop.\n")

    while True:
        drill = pick_drill(stats, exclude=last_name, wanted=args.opening)
        if drill is None:
            if args.opening:   # explicit --opening that matched nothing
                break
            raw = input("> ")
            if raw.lower().startswith("l"):
                print_book_list()
            elif raw.lower().startswith("q"):
                break
            continue

        perfect, quit_requested = run_drill(drill, show_board)
        if not quit_requested:
            record_result(stats, drill["name"], perfect)
        save_stats(stats)
        last_name = drill["name"]

        if quit_requested:
            break

        stop = False
        while True:
            try:
                nxt = input("\n[Enter] next drill  (l=list  s=stats  q=quit) > ").strip().lower()
            except EOFError:
                stop = True
                break
            if not nxt:
                break
            if nxt.startswith("q"):
                stop = True
                break
            if nxt.startswith("l"):
                print_book_list()
            elif nxt.startswith("s"):
                print_stats(stats)
            # anything else just re-prompts
        if stop:
            break

    print("\nSession over.")
    print_stats(stats)


def print_stats(stats):
    print("\n  Progress (share of drills finished with no hint/mistake):")
    if not stats:
        print("  (no drills recorded yet)")
        return
    rows = []
    for drill in BOOK:
        entry = stats.get(drill["name"])
        if entry and entry["drills"]:
            pct = round(100 * entry["perfect"] / entry["drills"])
            rows.append((pct, drill["name"], entry["drills"]))
    rows.sort()
    for pct, name, n in rows:
        print(f"  {pct:3d}%   ({n} drill{'s' if n != 1 else ''})   {name}")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nStopped.")
