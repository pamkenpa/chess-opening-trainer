# Chess Opening Trainer

A local, private opening trainer for chess. You practice your repertoire against the
computer: you play your moves, a "repertoire bot" answers with the booked responses,
and **Stockfish 16** (running in your browser via WebAssembly) judges any deviations.

**Live site: <https://pamkenpa.github.io/chess-opening-trainer/>** — the first visit
downloads the ~40 MB neural net once, then it's cached by the browser.

## Run it

Double-click **`run.bat`** (or run `node server.js`), then open
[http://localhost:8787](http://localhost:8787) in your browser.

- The first start loads the ~40 MB neural net once from your own disk — nothing is downloaded from the internet while you play.
- Your repertoire, stats and settings are stored in the browser's localStorage (per browser profile).
- A different port: `tools\nodejs\node.exe server.js 9000`.

## What it does

| Tab | Purpose |
| --- | --- |
| **Practice** | Plays a line with you. The bot plays the opponent's booked moves; you must find yours. Wrong move → shake + coach message. |
| **Repertoire** | Your 10 built-in lines + anything you import. Filter by colour or by what's due. |
| **Stats** | Runs, clean first-try rate, streaks, and per-line due dates. |
| **Free Play** | Play a real game against Stockfish from the starting position, strength ~1350–2850 Elo, with a live eval readout. |

### Practice features

- **Hint (H)** — pulses the square the book move starts from.
- **Show move (S)** — plays the book move for you (counts as an assist).
- **Ask engine** — when you play something off-book, Stockfish compares your move with
  the book move (at the depth set in Settings). Verdicts:
  - within ~0.4 pawns → *engine-approved alternative*, saved per line and auto-accepted next time;
  - 0.4–1.5 pawns → playable, your call (can keep it, flagged as not recommended);
  - worse → clearly worse, the coach tells you how much it loses and you retry.
- **Spaced repetition lite** — a clean first-try run schedules the line further out
  (3 → 6 → 12 → up to 30 days); any assist brings it back tomorrow.
- Tips on key moves, move list, progress bar, sounds (toggleable), three board themes,
  keyboard shortcuts (H/S/R/N/F), drag-and-drop *and* click-to-move.

### Repertoire management

- **Import PGN**: paste one or many games (e.g. exported from a Lichess study or a
  database). Main line only, up to 60 plies per line; name/ECO come from the PGN tags.
- **Export/import JSON** of your custom lines.

## Built-in repertoire

White: Italian (Giuoco Pianissimo, Two Knights 4.d3), Closed Ruy Lopez,
QGD Exchange, London System.
Black: Caro-Kann Classical, Najdorf (English Attack), Slav, Berlin, QGD Orthodox.

## Project layout

```
server.js            tiny static file server (COOP/COEP headers)
run.bat              launcher (uses the bundled portable Node in tools/nodejs)
public/              the whole site — deployable to any static host as-is
  index.html         UI shell
  css/style.css      dark theme, board themes
  js/*.js            app.js (practice/repertoire/stats/free play), board.js, engine.js, lines.js, sound.js
  vendor/            chess.js + Stockfish 16 WASM + NNUE net (from npm: chess.js, stockfish)
scripts/
  validate-lines.mjs npm run validate — checks every built-in line is legal chess
```

## Publishing

The app is a **static site**: everything it needs is in `public/`, including the
Stockfish WASM and its neural net. No backend required.

- **Quick share (temporary):** with the server running,
  `tools\cloudflared.exe tunnel --url http://localhost:8787` prints a public
  `*.trycloudflare.com` URL. No account needed. The URL is ephemeral: it changes on
  each run and only works while your PC (and the two processes) are up. A remote
  visitor's first load transfers ~41 MB (the neural net); the browser caches it afterwards.
- **Permanent:** upload the contents of `public/` to any static host.
  GitHub Pages and Vercel handle the 40 MB net fine. *Cloudflare Pages does not*
  (25 MB per-file limit). Netlify may also complain about the big file — prefer
  GitHub Pages or Vercel. No build step, no headers needed (the engine build is
  single-threaded and works without COOP/COEP).

## Troubleshooting

- **"Engine error"** — the header dot turns red with a message in Settings. Reload the
  page first; both WASM builds (SIMD and no-SIMD) are bundled, the app falls back automatically.
- **Port already in use** — another instance is running; close its window or use another port.
- **Stats/lines missing** — they live in localStorage of the browser profile you used.
