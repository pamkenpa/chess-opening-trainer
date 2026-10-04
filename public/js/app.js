import { Chess } from '../vendor/chess.esm.js?v=3';
import { BUILTIN_LINES } from './lines.js?v=3';
import { Board } from './board.js?v=3';
import { Engine, scoreToWhiteCp, formatScore } from './engine.js?v=3';
import { sfx, setSound } from './sound.js?v=3';

/* ---------------- storage ---------------- */

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* full / private mode */ } }
};

let settings = Object.assign(
  { sound: true, coords: true, theme: 'wood', depth: 12 },
  store.get('ot.settings', {})
);
let stats = store.get('ot.stats', {});
let customLines = store.get('ot.lines', []);

function persist() {
  store.set('ot.settings', settings);
  store.set('ot.stats', stats);
  store.set('ot.lines', customLines);
}

const allLines = () => [...BUILTIN_LINES, ...customLines];
const getStats = (id) => (stats[id] = stats[id] || { runs: 0, clean: 0, streak: 0, due: 0, last: 0, alts: {} });

/* ---------------- engine ---------------- */

const engine = new Engine();
engine.onStatus = (status, info) => {
  const el = document.getElementById('engine-status');
  el.classList.toggle('ready', status === 'ready');
  el.classList.toggle('error', status === 'error');
  document.getElementById('engine-label').textContent =
    status === 'ready' ? 'Stockfish 16 ready' : status === 'error' ? 'engine error' : 'engine loading\u2026';
  document.getElementById('set-engine-info').textContent =
    status === 'ready' ? (info || 'Stockfish 16') + (engine.simd === false ? ' (no-SIMD build)' : '')
      : status === 'error' ? (info || '') : '';
};

function waitEngineReady(timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      if (engine.status === 'ready') return resolve();
      if (engine.status === 'error') return reject(new Error('engine failed to load'));
      if (Date.now() - t0 > timeoutMs) return reject(new Error('engine timed out'));
      setTimeout(poll, 250);
    })();
  });
}

/* ---------------- helpers ---------------- */

const $ = (id) => document.getElementById(id);
const DAYS = 86400000;

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), 2600);
}

function coach(text, cls = 'info') {
  const el = $('coach-msg');
  el.textContent = text;
  el.className = 'coach-msg ' + cls;
}

function coachActions(buttons) {
  const box = $('coach-actions');
  box.innerHTML = '';
  for (const b of buttons || []) {
    const btn = document.createElement('button');
    btn.className = 'btn small' + (b.primary ? ' primary' : '');
    btn.textContent = b.label;
    btn.onclick = b.onClick;
    box.appendChild(btn);
  }
}

function checkSquare(game) {
  if (!game.inCheck()) return null;
  const me = game.turn();
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === me) return cell.square;
    }
  }
  return null;
}

function uci(mv) { return mv.from + mv.to + (mv.promotion || ''); }

/* ---------------- tabs ---------------- */

document.querySelectorAll('#tabs .tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('#tabs .tab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab.dataset.tab));
    if (tab.dataset.tab === 'stats') renderStats();
    if (tab.dataset.tab === 'repertoire') renderRepertoire();
  };
});
const showTab = (name) => document.querySelector(`#tabs .tab[data-tab="${name}"]`).click();

/* ---------------- practice ---------------- */

const practice = {
  line: null, game: null, ply: 0, phase: 'idle',
  misses: 0, usedHint: false, usedShow: false, rendered: [], deviation: null
};

const boardPr = new Board($('board-practice'), {
  canPick: () => practice.phase === 'user',
  legalTargets: (from) => {
    if (!practice.game) return [];
    return practice.game.moves({ square: from, verbose: true }).map(m => ({ to: m.to, promotion: m.promotion }));
  },
  onMove: (from, to, promo) => practiceUserMove(from, to, promo),
  onPremoveTouch: () => { boardPr.stopPulse(); }
});

function isBotPly(line, ply) {
  // whose move is at index `ply`?  even plies are White's
  const mover = ply % 2 === 0 ? 'white' : 'black';
  return mover !== line.side;
}

function startLine(line) {
  practice.line = line;
  practice.game = new Chess();
  practice.ply = 0;
  practice.phase = 'user';
  practice.misses = 0;
  practice.usedHint = false;
  practice.usedShow = false;
  practice.rendered = [];
  practice.deviation = null;
  boardPr.stopPulse();
  boardPr.setOrientation(line.side);
  renderPractice();
  coach(`Training as ${line.side}. You play ${line.side === 'white' ? 'the white pieces' : 'the black pieces'} \u2014 find your repertoire move.`);
  coachActions([]);
  if (isBotPly(line, 0)) botMove();
}

function renderPractice() {
  const { line, game, ply, rendered } = practice;
  const last = rendered.length ? rendered[rendered.length - 1] : null;
  boardPr.setPosition(game, { lastMove: last && last.mv, checkSquare: checkSquare(game) });

  const list = $('pr-moves');
  list.innerHTML = '';
  for (let i = 0; i < rendered.length; i += 2) {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = (i / 2 + 1) + '.';
    li.appendChild(num);
    for (let j = i; j < Math.min(i + 2, rendered.length); j++) {
      const m = rendered[j];
      const span = document.createElement('span');
      span.className = 'mv' + (m.byUser ? ' user' : '') + (m.bad ? ' bad' : '');
      span.textContent = m.san;
      li.appendChild(span);
    }
    list.appendChild(li);
  }

  if (line) {
    $('pr-line-name').textContent = line.name;
    $('pr-line-eco').textContent = line.eco || '';
    const chip = $('pr-line-side');
    chip.textContent = line.side;
    chip.className = 'chip' + (line.side === 'black' ? ' black-side' : '');
    $('pr-progress').querySelector('.progress-fill').style.width = (100 * ply / line.moves.length) + '%';
    const remaining = line.moves.length - ply;
    $('pr-movecount').textContent = practice.phase === 'done' ? 'Line complete.'
      : practice.phase === 'idle' ? 'Pick a line from the Repertoire tab.'
      : `Move ${Math.min(ply + 1, line.moves.length)} of ${line.moves.length} \u2014 ${practice.phase === 'bot' ? 'opponent thinking\u2026' : 'your move'}.`;
  }

  const tipEl = $('pr-tip');
  const lastPly = rendered.length - 1;
  const tip = lastPly >= 0 && line && line.tips && line.tips[lastPly] && !rendered[lastPly].bad;
  if (tip) { tipEl.textContent = line.tips[lastPly]; tipEl.classList.remove('hidden'); }
  else tipEl.classList.add('hidden');
}

function practiceUserMove(from, to, promo) {
  const { line, game, ply } = practice;
  if (practice.phase !== 'user' || !line) return;
  boardPr.stopPulse();

  let mv, fenBefore;
  try {
    fenBefore = game.fen();
    mv = game.move({ from, to, promotion: promo || 'q' });
  } catch { return; }
  if (!mv) return;
  sfx[mv.captured ? 'capture' : 'move']();

  const expected = line.moves[ply];
  if (mv.san === expected) {
    practice.rendered.push({ san: mv.san, byUser: true, mv });
    practice.ply++;
    renderPractice();
    if (practice.ply >= line.moves.length) return completeLine(false);
    return botMove();
  }

  // wrong move — take it back and coach
  const attempted = { san: mv.san, u: uci(mv), from, to };
  game.undo();
  sfx.wrong();
  boardPr.shake(from);

  const entry = getStats(line.id);
  const knownAlt = entry.alts && entry.alts[ply] === mv.san;
  if (knownAlt) {
    practice.rendered.push({ san: mv.san, byUser: true, mv });
    practice.ply = line.moves.length; // line can't continue past an alternative
    renderPractice();
    return completeLine(true);
  }

  practice.phase = 'deviation';
  practice.deviation = { attempted, fenBefore, ply };
  coach(`\u201C${mv.san}\u201D isn\u2019t in your repertoire here. The book move is \u201C${expected}\u201D.`, 'err');
  renderPractice();
  coachActions([
    { label: 'Ask engine', primary: true, onClick: () => checkDeviation() },
    { label: 'Show me the move', onClick: () => showBookMove() },
    { label: 'Try again', onClick: () => retryAfterDeviation() }
  ]);
}

function retryAfterDeviation() {
  practice.phase = 'user';
  practice.deviation = null;
  renderPractice();
  coach('Your move again \u2014 look for the plan, not just the square.', 'info');
  coachActions([]);
}

function showBookMove() {
  const { line, game, ply } = practice;
  practice.deviation = null;
  practice.misses++;
  practice.usedShow = true;
  const mv = game.move(line.moves[ply]);
  practice.rendered.push({ san: mv.san, byUser: true, mv });
  practice.ply++;
  practice.phase = 'user';
  renderPractice();
  coach(`The book move (${line.moves[ply - 1]}) played for you. Watch how the pieces cooperate.`, 'info');
  coachActions([]);
  if (practice.ply >= line.moves.length) completeLine(false);
  else botMove();
}

async function checkDeviation() {
  const { line, deviation } = practice;
  if (!deviation) return;
  coach('Asking Stockfish\u2026', 'info');
  coachActions([]);
  try {
    await waitEngineReady();
    const book = new Chess(deviation.fenBefore);
    const bookMv = book.moves({ verbose: true }).find(m => m.san === line.moves[deviation.ply]);
    if (!bookMv) { retryAfterDeviation(); return; }
    const scores = await engine.compareMoves(deviation.fenBefore, [deviation.attempted.u, uci(bookMv)], settings.depth);
    const sUser = scoreOf(scores[deviation.attempted.u]);
    const sBook = scoreOf(scores[uci(bookMv)]);
    if (sUser == null || sBook == null) { retryAfterDeviation(); return; }
    const loss = Math.max(0, sBook - sUser);

    if (loss <= 40) {
      acceptAlternative(deviation, `Engine approves! ${deviation.attempted.san} and the book move are practically equal. It\u2019s saved as an accepted alternative.`);
    } else if (loss <= 150) {
      practice.deviation.verdict = { loss };
      coach(`${deviation.attempted.san} is playable but drops about ${(loss / 100).toFixed(1)} pawns vs ${line.moves[deviation.ply]}. Your call.`, 'err');
      coachActions([
        { label: 'Keep it anyway', onClick: () => acceptAlternative(practice.deviation, 'Kept \u2014 noted as an alternative (not recommended).') },
        { label: 'Play the book move', primary: true, onClick: () => showBookMove() }
      ]);
    } else {
      practice.deviation.verdict = { loss };
      coach(`${deviation.attempted.san} loses about ${(loss / 100).toFixed(1)} pawns \u2014 the book move (${line.moves[deviation.ply]}) is clearly better.`, 'err');
      coachActions([
        { label: 'Show me', primary: true, onClick: () => showBookMove() },
        { label: 'Try again', onClick: () => retryAfterDeviation() }
      ]);
    }
  } catch (e) {
    coach('Engine unavailable (' + e.message + '). Try again or show the move.', 'err');
    coachActions([
      { label: 'Show me the move', onClick: () => showBookMove() },
      { label: 'Try again', onClick: () => retryAfterDeviation() }
    ]);
  }
}

function scoreOf(score) {
  if (!score) return null;
  // mover-POV centipawns (mate normalized); both candidates share the same mover
  return score.type === 'mate' ? (score.value > 0 ? 10000 - score.value : -10000 - score.value) : score.value;
}

function acceptAlternative(deviation, msg) {
  const entry = getStats(practice.line.id);
  entry.alts[deviation.ply] = deviation.attempted.san;
  persist();
  const game = practice.game;
  const mv = game.move({ from: deviation.attempted.from, to: deviation.attempted.to, promotion: 'q' });
  practice.rendered.push({ san: deviation.attempted.san, byUser: true, mv: mv || { from: deviation.attempted.from, to: deviation.attempted.to } });
  practice.deviation = null;
  renderPractice();
  coach(msg, 'good');
  completeLine(true);
}

function botMove() {
  const { line, game, ply } = practice;
  practice.phase = 'bot';
  renderPractice();
  setTimeout(() => {
    if (!practice.line || practice.game !== game) return;
    const mv = game.move(line.moves[ply]);
    if (!mv) { completeLine(false); return; }
    sfx.engineMove();
    practice.rendered.push({ san: mv.san, byUser: false, mv });
    practice.ply++;
    if (practice.ply >= line.moves.length) {
      renderPractice();
      completeLine(false);
    } else {
      practice.phase = 'user';
      renderPractice();
    }
  }, 380 + Math.random() * 320);
}

function completeLine(variant) {
  practice.phase = 'done';
  const entry = getStats(practice.line.id);
  entry.runs++;
  entry.last = Date.now();
  const isClean = !practice.usedHint && !practice.usedShow && practice.misses === 0;
  if (isClean) {
    entry.streak++;
    entry.clean++;
    entry.due = Date.now() + Math.min(3 * Math.pow(2, entry.streak - 1), 30) * DAYS;
  } else {
    entry.streak = 0;
    entry.due = Date.now() + DAYS;
  }
  persist();

  const assists = practice.misses + (practice.usedHint ? 1 : 0) + (practice.usedShow ? 1 : 0);
  sfx.success();
  coach(
    variant ? 'Line complete (via an engine-approved alternative). '
      : isClean ? `Perfect run \u2014 all ${Math.ceil(practice.line.moves.length / 2)} moves found first time! `
      : `Line complete, with ${assists} assist${assists === 1 ? '' : 's'}. The shaky spots come back tomorrow.`,
    isClean || variant ? 'good' : 'info'
  );
  coachActions([
    { label: 'Practice again', onClick: () => startLine(practice.line) },
    { label: 'Next due line', primary: true, onClick: nextDueLine }
  ]);
  renderPractice();
}

function nextDueLine() {
  const now = Date.now();
  const lines = allLines();
  if (!lines.length) { toast('Import or pick a line first.'); return; }
  const due = lines.filter(l => (getStats(l.id).due || 0) <= now);
  const pool = due.length ? due : lines;
  // prefer shortest due / least practiced
  pool.sort((a, b) => (getStats(a.id).due || 0) - (getStats(b.id).due || 0) || (getStats(a.id).runs - getStats(b.id).runs));
  startLine(pool[0]);
}

$('btn-hint').onclick = () => {
  const { line, game, ply } = practice;
  if (practice.phase !== 'user' || !line) return;
  practice.usedHint = true;
  const mv = game.moves({ verbose: true }).find(m => m.san === line.moves[ply]);
  if (mv) {
    boardPr.pulse(mv.from);
    coach(`Hint: look at the piece on ${mv.from}.`, 'info');
    sfx.select();
  }
};
$('btn-show').onclick = () => {
  if (practice.phase === 'deviation') { practice.deviation = null; showBookMove(); }
  else if (practice.phase === 'user') showBookMove();
};
$('btn-retry').onclick = () => practice.line && startLine(practice.line);
$('btn-nextdue').onclick = nextDueLine;

/* ---------------- repertoire ---------------- */

let repFilter = 'all';

function renderRepertoire() {
  const now = Date.now();
  const box = $('rep-table');
  box.innerHTML = '';
  const lines = allLines().filter(l => {
    if (repFilter === 'white') return l.side === 'white';
    if (repFilter === 'black') return l.side === 'black';
    if (repFilter === 'due') return (getStats(l.id).due || 0) <= now;
    return true;
  });
  if (!lines.length) { box.innerHTML = '<p class="muted">No lines here yet \u2014 import a PGN on the right.</p>'; return; }
  for (const l of lines) {
    const st = getStats(l.id);
    const item = document.createElement('div');
    item.className = 'rep-item' + (l.custom ? ' custom' : '');
    const dueTxt = !st.last ? 'never practiced'
      : st.due <= now ? 'due now' : 'due ' + new Date(st.due).toLocaleDateString();
    item.innerHTML = `
      <span class="chip${l.side === 'black' ? ' black-side' : ''}">${l.side}</span>
      <div class="nm"><b>${l.name}</b><span>${l.eco || ''} \u00B7 ${l.moves.length} plies \u00B7 ${st.runs} run${st.runs === 1 ? '' : 's'} \u00B7 streak ${st.streak}</span></div>
      <span class="due${st.due <= now && st.last ? ' overdue' : ''}">${dueTxt}</span>`;
    const play = document.createElement('button');
    play.className = 'btn small primary';
    play.textContent = 'Practice';
    play.onclick = () => { startLine(l); showTab('practice'); };
    item.appendChild(play);
    if (l.custom) {
      const del = document.createElement('button');
      del.className = 'btn small danger';
      del.textContent = '\u2715';
      del.title = 'Delete line';
      del.onclick = () => {
        if (!confirm('Delete "' + l.name + '"?')) return;
        customLines = customLines.filter(c => c.id !== l.id);
        persist();
        renderRepertoire();
      };
      item.appendChild(del);
    }
    box.appendChild(item);
  }
}

document.querySelectorAll('#rep-filter .btn').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('#rep-filter .btn').forEach(x => x.classList.toggle('active', x === b));
    repFilter = b.dataset.filter;
    renderRepertoire();
  };
});

function splitGames(pgn) {
  const parts = pgn.split(/\n(?=\[Event\s)/g).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1 || /\[Event\s/.test(pgn)) return parts;
  // no headers — try splitting on blank lines between numbered moves
  return pgn.split(/\n\s*\n(?=\d)/g).map(s => s.trim()).filter(Boolean);
}

$('btn-import').onclick = () => {
  const text = $('pgn-input').value.trim();
  const msg = $('import-msg');
  if (!text) { msg.textContent = 'Paste a PGN first.'; msg.className = 'small err'; return; }
  const sideChoice = $('pgn-side').value;
  let imported = 0, skipped = 0;
  for (const chunk of splitGames(text).slice(0, 60)) {
    try {
      const g = new Chess();
      g.loadPgn(chunk, { sloppy: true });
      const hist = g.history();
      if (hist.length < 4) { skipped++; continue; }
      const moves = hist.slice(0, 60);
      const tag = (name) => (chunk.match(new RegExp('\\[' + name + '\\s+"([^"]*)"')) || [])[1] || '';
      const eco = tag('ECO');
      let name = tag('Opening') || tag('Event') || '';
      if (!name && (tag('White') || tag('Black'))) name = `${tag('White') || '?'} \u2013 ${tag('Black') || '?'}`;
      if (!name) name = 'Imported ' + moves.slice(0, 6).join(' ');
      const side = sideChoice === 'auto' ? 'white' : sideChoice;
      customLines.push({
        id: 'c' + Date.now().toString(36) + imported,
        name: name.slice(0, 80),
        side, eco, moves,
        tips: {},
        custom: true
      });
      imported++;
    } catch { skipped++; }
  }
  persist();
  renderRepertoire();
  msg.textContent = imported ? `Imported ${imported} line${imported === 1 ? '' : 's'}${skipped ? `, skipped ${skipped}` : ''}.` : 'No valid games found (4+ moves each).';
  msg.className = 'small ' + (imported ? 'ok' : 'err');
  if (imported) $('pgn-input').value = '';
};

$('btn-export').onclick = () => {
  const blob = new Blob([JSON.stringify(customLines, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'my-opening-lines.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

$('file-import').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error('not an array');
      let n = 0;
      for (const l of data) {
        if (l && Array.isArray(l.moves) && typeof l.side === 'string') {
          customLines.push({
            id: 'c' + Date.now().toString(36) + n + Math.floor(Math.random() * 999),
            name: String(l.name || 'Imported line').slice(0, 80),
            side: l.side === 'black' ? 'black' : 'white',
            eco: String(l.eco || ''),
            moves: l.moves.map(String),
            tips: l.tips || {},
            custom: true
          });
          n++;
        }
      }
      persist();
      renderRepertoire();
      toast(`Imported ${n} line${n === 1 ? '' : 's'} from JSON.`);
    } catch (err) {
      toast('Could not read that JSON file.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
};

/* ---------------- stats ---------------- */

function renderStats() {
  const lines = allLines();
  const now = Date.now();
  let runs = 0, clean = 0, due = 0;
  for (const l of lines) {
    const st = getStats(l.id);
    runs += st.runs;
    clean += st.clean;
    if (st.due <= now) due++;
  }
  $('st-lines').textContent = lines.length;
  $('st-due').textContent = due;
  $('st-runs').textContent = runs;
  $('st-acc').textContent = runs ? Math.round(100 * clean / runs) + '%' : '\u2013';

  const box = $('stats-table');
  box.innerHTML = lines.length
    ? '<table class="stats"><tr><th>Line</th><th>Side</th><th>Runs</th><th>Clean</th><th>Streak</th><th>Due</th><th></th></tr></table>'
    : '<p class="muted">Practice a few lines and your history appears here.</p>';
  const table = box.querySelector('table');
  for (const l of lines) {
    const st = getStats(l.id);
    const pct = st.runs ? Math.round(100 * st.clean / st.runs) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${l.name}${l.custom ? ' <span class="muted">\u00B7</span>' : ''}</td>
      <td>${l.side === 'white' ? '\u2654' : '\u265A'}</td>
      <td>${st.runs}</td>
      <td><div class="bar"><i style="width:${pct}%"></i></div></td>
      <td>${st.streak > 0 ? '\u{1F525}' + st.streak : '0'}</td>
      <td>${!st.last ? '\u2013' : st.due <= now ? '<b>now</b>' : new Date(st.due).toLocaleDateString()}</td>`;
    const td = document.createElement('td');
    const play = document.createElement('button');
    play.className = 'btn small';
    play.textContent = 'Go';
    play.onclick = () => { startLine(l); showTab('practice'); };
    td.appendChild(play);
    tr.appendChild(td);
    table.appendChild(tr);
  }
}

$('btn-reset-stats').onclick = () => {
  if (!confirm('Reset all practice history? Your lines are kept.')) return;
  stats = {};
  persist();
  renderStats();
};

/* ---------------- free play ---------------- */

const fp = { game: null, userColor: 'white', over: false, elo: 1900, rendered: [] };

const boardFp = new Board($('board-free'), {
  orientation: 'white',
  canPick: () => !fp.over && fp.game && fp.game.turn() === (fp.userColor === 'white' ? 'w' : 'b'),
  legalTargets: (from) => fp.game ? fp.game.moves({ square: from, verbose: true }).map(m => ({ to: m.to, promotion: m.promotion })) : [],
  onMove: (from, to, promo) => fpUserMove(from, to, promo)
});

function fpNewGame() {
  fp.game = new Chess();
  fp.userColor = $('fp-color').value;
  fp.over = false;
  fp.rendered = [];
  boardFp.setOrientation(fp.userColor);
  $('fp-result').textContent = '';
  const elo = $('fp-strength').value;
  fp.elo = elo === 'max' ? 'max' : Number(elo);
  engine.send('ucinewgame');
  renderFree();
  if (fp.userColor === 'black') fpEngineTurn();
  else coachFree('Your move.');
}

function coachFree(text) { $('fp-result').textContent = text; }

function renderFree() {
  const last = fp.rendered.length ? fp.rendered[fp.rendered.length - 1] : null;
  boardFp.setPosition(fp.game, { lastMove: last && last.mv, checkSquare: checkSquare(fp.game) });
  const list = $('fp-moves');
  list.innerHTML = '';
  for (let i = 0; i < fp.rendered.length; i += 2) {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = (i / 2 + 1) + '.';
    li.appendChild(num);
    for (let j = i; j < Math.min(i + 2, fp.rendered.length); j++) {
      const span = document.createElement('span');
      span.className = 'mv';
      span.textContent = fp.rendered[j].san;
      li.appendChild(span);
    }
    list.appendChild(li);
  }
}

function fpEndText() {
  if (fp.game.isCheckmate()) {
    const loser = fp.game.turn() === 'w' ? 'White' : 'Black';
    return `${loser} is checkmate.`;
  }
  if (fp.game.isStalemate()) return 'Stalemate \u2014 draw.';
  if (fp.game.isInsufficientMaterial()) return 'Draw \u2014 insufficient material.';
  if (fp.game.isThreefoldRepetition()) return 'Draw \u2014 threefold repetition.';
  if (fp.game.isDraw()) return 'Draw.';
  return null;
}

function fpUserMove(from, to, promo) {
  if (fp.over) return;
  let mv;
  try { mv = fp.game.move({ from, to, promotion: promo || 'q' }); } catch { return; }
  if (!mv) return;
  sfx[mv.captured ? 'capture' : 'move']();
  fp.rendered.push({ san: mv.san, mv });
  renderFree();
  const end = fpEndText();
  if (end) { fp.over = true; coachFree(end); sfx.success(); renderFree(); return; }
  fpEngineTurn();
}

async function fpEngineTurn() {
  try {
    await waitEngineReady();
    const res = await engine.bestMove(fp.game.fen(), fp.elo, 600);
    if (fp.over) return;
    if (!res.bestmove || res.bestmove === '(none)') { fp.over = true; coachFree('Engine has no move \u2014 game over.'); return; }
    const mv = fp.game.move({ from: res.bestmove.slice(0, 2), to: res.bestmove.slice(2, 4), promotion: res.bestmove[4] });
    sfx.engineMove();
    fp.rendered.push({ san: mv.san, mv });
    const whiteCp = scoreToWhiteCp(res.score, mv.color); // the engine searched for its own side
    $('fp-eval').textContent = whiteCp != null ? 'eval ' + formatScore(whiteCp) : '';
    renderFree();
    const end = fpEndText();
    if (end) { fp.over = true; coachFree(end); sfx.success(); }
    else coachFree('Your move.');
  } catch (e) {
    coachFree('Engine unavailable: ' + e.message);
  }
}

$('fp-new').onclick = fpNewGame;
$('fp-resign').onclick = () => {
  if (!fp.game || fp.over) return;
  fp.over = true;
  coachFree(`You resigned. ${fp.userColor === 'white' ? 'Black' : 'White'} wins.`);
};

/* ---------------- settings ---------------- */

function applySettings() {
  setSound(settings.sound);
  document.body.classList.toggle('nocoords', !settings.coords);
  document.body.dataset.theme = settings.theme;
  $('set-sound').checked = settings.sound;
  $('set-coords').checked = settings.coords;
  $('set-depth').value = String(settings.depth);
  $('set-theme').value = settings.theme;
}
applySettings();

$('btn-settings').onclick = () => $('modal-settings').classList.remove('hidden');
$('set-close').onclick = () => { $('modal-settings').classList.add('hidden'); persist(); };
$('set-sound').onchange = (e) => { settings.sound = e.target.checked; setSound(settings.sound); persist(); };
$('set-coords').onchange = (e) => { settings.coords = e.target.checked; document.body.classList.toggle('nocoords', !settings.coords); persist(); };
$('set-depth').onchange = (e) => { settings.depth = Number(e.target.value); persist(); };
$('set-theme').onchange = (e) => { settings.theme = e.target.value; document.body.dataset.theme = settings.theme; persist(); };

/* ---------------- keyboard ---------------- */

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { $('modal-settings').classList.add('hidden'); return; }
  if (!$('modal-settings').classList.contains('hidden')) return; // modal open: no game shortcuts
  if (k === 'h') $('btn-hint').click();
  if (k === 's') $('btn-show').click();
  if (k === 'r') $('btn-retry').click();
  if (k === 'n') nextDueLine();
  if (k === 'f') { boardPr.flip(); boardFp.flip(); }
});

/* ---------------- boot ---------------- */

renderRepertoire();
renderStats();
if (allLines().length) nextDueLine();
