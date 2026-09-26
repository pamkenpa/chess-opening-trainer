# Chess Opening Trainer

A drill app for memorizing chess openings. The bot announces an opening and
plays the opponent's side; you play your moves from memory. Just the opening —
no full game.

## Play online

**https://pamkenpa.github.io/chess-opening-trainer/**

Works on phone and desktop; progress is saved per device/browser.

## The app (recommended)

Double-click **`ChessTrainer.html`** — it opens in your browser and works
completely offline (the chess engine is embedded in the file). Your progress
is saved automatically in the browser.

- **Home screen** — every opening in the book as a card with your success rate,
  or hit **Start training** to get your weakest opening automatically.
- **Drill** — click a piece, then click its destination (legal moves are shown
  as dots). The board flips automatically when you play Black.
- **Buttons** — 💡 Hint (shows + pulses the theory move), 📜 Show line,
  🏳️ Give up, ↺ Restart. A drill only counts as "perfect" if you needed none
  of them and played no wrong moves.
- **Progress** — per-opening bars on the home screen; weakest openings come
  back most often. "reset progress" wipes the scoreboard.
- **Sound** — 🔊 toggles the move/click sounds.

## Command-line version

```
python trainer.py            # same book, terminal drills
```

Optional flags: `--opening Najdorf`, `--no-board`, `--list`.
Requires Python 3 with `pip install chess`.

## Adding or editing openings

The book lives in one place: the `BOOK` list at the top of `trainer.py`.
Each entry is a name, the side you play (`"w"`/`"b"`), the line in SAN, and a
one-line idea. After editing, rebuild the app:

```
python build_app.py          # validates every line, then rebuilds ChessTrainer.html
```

Every line is replayed through a real chess engine (and checked for canonical
SAN) before the app is built, so typos can't slip in.

## Files

| File                 | What it is                                   |
|----------------------|----------------------------------------------|
| `ChessTrainer.html`  | The app — double-click to open               |
| `trainer.py`         | CLI version + the opening book (edit here)   |
| `build_app.py`       | Rebuilds the app from the book               |
| `app_template.html`  | App source template (used by the build)      |
| `chess.min.js`       | chess.js 0.13.4, embedded at build time      |
