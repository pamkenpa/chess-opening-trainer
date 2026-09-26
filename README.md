# Chess Opening Trainer

A learning app for chess openings. The app walks you through each opening move
by move and explains the principle behind every single move — then you can
practice the line from memory against the bot. Just the opening, no full game.

## Play online

**https://pamkenpa.github.io/chess-opening-trainer/**

Works on phone and desktop; practice progress is saved per device/browser.

## How it works

- **📖 Learn** — pick an opening and the app plays through it step by step.
  Every half-move comes with a one-line explanation of the idea (center,
  development, king safety, pins, pawn breaks…). Use **Next** and **Back**,
  or **▶▶ Auto** to watch it unfold; arrow keys work too. Each lesson starts
  with the opening's strategic intro and ends with the full line.
- **🎯 Practice** — when the story makes sense, play the same line against the
  bot from memory. Wrong moves are rejected on the spot; hints cost you the
  "perfect" mark. Your success rate per opening shapes what the app suggests
  next.

## The app (recommended)

Double-click **`ChessTrainer.html`** — it opens in your browser and works
completely offline (chess engine and piece graphics are embedded in the file).
Or use the published version above.

## Command-line version

```
python trainer.py            # same book, terminal drills
```

Optional flags: `--opening Najdorf`, `--no-board`, `--list`.
Requires Python 3 with `pip install chess`.

## Adding or editing openings

The book lives in one place: the `BOOK` list at the top of `trainer.py`.
Each entry is a name, the side you play (`"w"`/`"b"`), the line in SAN, a
strategic `intro`, a `notes` list (exactly one note per half-move), and a
one-line `idea`. After editing, rebuild the app:

```
python build_app.py          # validates every line, then rebuilds ChessTrainer.html
```

Every line is replayed through a real chess engine (and checked for canonical
SAN and note alignment) before the app is built, so typos can't slip in.

## Files

| File                 | What it is                                   |
|----------------------|----------------------------------------------|
| `ChessTrainer.html`  | The app — double-click to open               |
| `trainer.py`         | CLI version + the opening book (edit here)   |
| `build_app.py`       | Rebuilds the app from the book               |
| `app_template.html`  | App source template (used by the build)      |
| `chess.min.js`       | chess.js 0.13.4, embedded at build time      |
| `pieces/`            | cburnett SVG piece set (CC BY-SA 3.0), embedded at build time |

Piece set: 'cburnett' by Colin M.L. Burnett, licensed CC BY-SA 3.0 (via lichess).
