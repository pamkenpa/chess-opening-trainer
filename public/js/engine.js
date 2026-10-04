// Wrapper around the Stockfish 16 WASM build (stockfish npm package, single-threaded).
// Runs the engine in a Web Worker; all searches are serialized through a command queue.

const BUILD_SINGLE = 'stockfish-nnue-16-single';
const BUILD_NOSIMD = 'stockfish-nnue-16-no-simd';

export class Engine {
  constructor() {
    this.status = 'loading';
    this.name = '';
    this.lastError = '';
    this.simd = true;
    this.onStatus = () => {};
    this._queue = Promise.resolve();
    this._lines = [];
    this._build = BUILD_SINGLE;
    this._spawn();
  }

  _spawn() {
    // Always try the standard build first; fall back to no-SIMD only if the
    // worker actually fails (wasm feature-detection probes are unreliable).
    const file = this._build === BUILD_SINGLE ? BUILD_SINGLE : BUILD_NOSIMD;
    // Plain worker URL — the loader resolves its wasm file relative to the script
    // and wires postMessage ↔ UCI itself. (A '#wasm,worker' fragment makes it inert.)
    this.worker = new Worker(`vendor/${file}.js`, { name: 'stockfish' });
    this.worker.onmessage = (e) => this._onLine(String(e.data));
    this.worker.onerror = (err) => {
      const msg = (err && (err.message || 'unknown worker error')) || 'worker error';
      if (this._build === BUILD_SINGLE && this.status === 'loading') {
        this.simd = false;
        this._build = BUILD_NOSIMD;
        try { this.worker.terminate(); } catch { /* already dead */ }
        this._spawn();
        return;
      }
      this.status = 'error';
      this.lastError = msg;
      this.onStatus('error', this.lastError);
    };

    this.worker.postMessage('uci');
  }

  _onLine(line) {
    if (line.startsWith('id name')) {
      this.name = line.slice(8);
    } else if (line === 'uciok') {
      this.worker.postMessage('setoption name MultiPV value 1');
      this.worker.postMessage('setoption name Hash value 32');
      this.worker.postMessage('setoption name Use NNUE value true');
      this.worker.postMessage('isready');
    } else if (line === 'readyok') {
      this.status = 'ready';
      this.onStatus('ready', this.name);
    } else if (this._search) {
      this._lines.push(line);
      if (line.startsWith('bestmove')) {
        const s = this._search;
        this._search = null;
        s.resolve(this._parseResult(s, this._lines));
      }
    }
  }

  _parseResult(search, lines) {
    let best = null;
    let lastInfo = null;
    for (const l of lines) {
      if (l.startsWith('info') && l.includes(' pv ')) lastInfo = l;
      if (l.startsWith('bestmove')) best = l.split(/\s+/)[1];
    }
    let score = null;
    if (lastInfo) {
      const m = lastInfo.match(/score (cp|mate) (-?\d+)/);
      if (m) score = { type: m[1], value: parseInt(m[2], 10) };
      const pv = lastInfo.split(' pv ')[1];
      if (pv) score = score || {};
      if (pv) score.pv = pv.trim().split(/\s+/);
    }
    return { bestmove: best, score, raw: lines };
  }

  send(cmd) { this.worker.postMessage(cmd); }

  _run(job) {
    const run = this._queue.then(job);
    // keep the chain alive even if a job fails
    this._queue = run.catch(() => {});
    return run;
  }

  _posCmd(position) {
    // accepts 'startpos moves ...' or a raw FEN
    return position.startsWith('startpos') ? `position ${position}` : `position fen ${position}`;
  }

  // Evaluate a position (FEN, or 'startpos moves ...') at a fixed depth.
  // Returns { bestmove, score: {type, value, pv?} } — score is relative to the side to move.
  evaluate(position, depth = 12) {
    return this._run(() => new Promise((resolve, reject) => {
      if (this.status !== 'ready') return reject(new Error('engine not ready'));
      this._lines = [];
      this._search = { resolve, reject };
      this.send('ucinewgame');
      this.send(this._posCmd(position));
      this.send(`go depth ${depth}`);
      this._watchdog(reject);
    }));
  }

  // Pick the best move for the side to play (used by Free Play).
  // strengthElo: number | 'max'
  bestMove(position, strengthElo = 'max', movetime = 650) {
    return this._run(() => new Promise((resolve, reject) => {
      if (this.status !== 'ready') return reject(new Error('engine not ready'));
      this._lines = [];
      this._search = { resolve, reject };
      if (strengthElo === 'max') {
        this.send('setoption name UCI_LimitStrength value false');
      } else {
        this.send('setoption name UCI_LimitStrength value true');
        this.send(`setoption name UCI_Elo value ${strengthElo}`);
      }
      this.send(this._posCmd(position));
      this.send(`go movetime ${movetime}`);
      this._watchdog(reject);
    }));
  }

  _watchdog(reject, ms = 30000) {
    const search = this._search;
    setTimeout(() => {
      if (this._search === search) {
        this._search = null;
        reject(new Error('engine search timed out'));
      }
    }, ms);
  }

  // Compare candidate moves from the same position. Returns scores in centipawns
  // from the perspective of the side to move (higher = better for the mover).
  compareMoves(fen, ucis, depth = 12) {
    return this._run(async () => {
      const out = {};
      for (const uci of ucis) {
        const res = await new Promise((resolve, reject) => {
          this._lines = [];
          this._search = { resolve, reject };
          this.send('ucinewgame');
          this.send(`position fen ${fen} moves ${uci}`);
          this.send(`go depth ${depth}`);
          this._watchdog(reject);
        });
        out[uci] = res.score ? res.score : null;
      }
      return out;
    });
  }
}

export function scoreToWhiteCp(score, sideToMove) {
  // score from engine output is relative to the side that was to move at search start
  if (!score) return null;
  let cp;
  if (score.type === 'mate') cp = score.value > 0 ? 10000 - score.value : -10000 - score.value;
  else cp = score.value;
  return (sideToMove === 'white' || sideToMove === 'w') ? cp : -cp;
}

export function formatScore(cpWhite) {
  if (cpWhite == null) return '';
  if (Math.abs(cpWhite) >= 9990) {
    const mateIn = Math.max(1, Math.min(99, 10000 - Math.abs(cpWhite)));
    return (cpWhite > 0 ? '+M' : '-M') + mateIn;
  }
  return (cpWhite > 0 ? '+' : '') + (cpWhite / 100).toFixed(1);
}
