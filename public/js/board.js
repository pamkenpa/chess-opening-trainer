// Chessboard component: renders positions from a chess.js instance and handles
// click-to-move + drag-and-drop. The board is dumb — all rules live in the app;
// it asks the app which pieces may be picked and which targets are legal.

// cburnett SVG piece set (CC BY-SA 3.0, via lichess) — files in pieces/
const FILES = 'abcdefgh'.split('');

function pieceImg(color, type) {
  const img = document.createElement('img');
  img.src = `pieces/${color}${type.toUpperCase()}.svg`;
  img.draggable = false;
  img.alt = '';
  return img;
}

export class Board {
  constructor(container, opts = {}) {
    this.el = container;
    this.orientation = opts.orientation || 'white';
    this.canPick = opts.canPick || (() => false);          // (square) => bool
    this.legalTargets = opts.legalTargets || (() => []);   // (from) => [{to, promotion}]
    this.onMove = opts.onMove || (() => {});               // (from, to, promotion)
    this.onPremoveTouch = opts.onPremoveTouch || (() => {}); // any attempt to pick a piece

    this.selected = null;
    this.boardEl = document.createElement('div');
    this.boardEl.className = 'board-grid';
    this.el.appendChild(this.boardEl);
    this.ghost = document.createElement('div');
    this.ghost.id = 'drag-ghost';
    this.el.appendChild(this.ghost);

    this._build();
    this.setPosition(null);
  }

  _squareName(row, col) {
    // row/col are display grid coords (0..7), adjusted for orientation
    const f = this.orientation === 'white' ? col : 7 - col;
    const r = this.orientation === 'white' ? 7 - row : row;
    return FILES[f] + (r + 1);
  }

  _build() {
    this.squares = {};
    this.boardEl.innerHTML = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const sq = document.createElement('div');
        const name = this._squareName(row, col);
        const isLight = (FILES.indexOf(name[0]) + Number(name[1])) % 2 === 1;
        sq.className = `sq ${isLight ? 'light' : 'dark'}`;
        sq.dataset.square = name;

        if (col === 0) sq.appendChild(this._coord('rank', name[1]));
        if (row === 7) sq.appendChild(this._coord('file', name[0]));

        sq.addEventListener('pointerdown', (e) => this._pointerDown(e, name));
        sq.addEventListener('pointerenter', () => {
          if (this._dragging) sq.classList.add('hover');
        });
        sq.addEventListener('pointerleave', () => sq.classList.remove('hover'));
        this.boardEl.appendChild(sq);
        this.squares[name] = sq;
      }
    }
  }

  _coord(kind, text) {
    const c = document.createElement('span');
    c.className = `coord ${kind}`;
    c.textContent = text;
    return c;
  }

  setOrientation(o) {
    this.orientation = o;
    this.selected = null;
    this._build();
  }

  flip() { this.setOrientation(this.orientation === 'white' ? 'black' : 'white'); }

  // game: chess.js instance (or null for empty board)
  setPosition(game, { lastMove = null, checkSquare = null } = {}) {
    this.lastMove = lastMove;
    this.checkSquare = checkSquare;
    const map = {};
    if (game) {
      for (const row of game.board()) {
        for (const cell of row) {
          if (cell) map[cell.square] = { type: cell.type, color: cell.color };
        }
      }
    }
    this._pieceMap = map;
    for (const name of Object.keys(this.squares)) {
      const sq = this.squares[name];
      for (const el of [...sq.querySelectorAll('.piece')]) el.remove();
      sq.classList.remove('last', 'sel', 'check');
      const p = map[name];
      if (p) {
        const span = document.createElement('span');
        span.className = 'piece';
        span.appendChild(pieceImg(p.color, p.type));
        span.dataset.square = name;
        sq.appendChild(span);
      }
      if (lastMove && (lastMove.from === name || lastMove.to === name)) sq.classList.add('last');
      if (checkSquare === name) sq.classList.add('check');
    }
    this._clearDots();
    this.selected = null;
  }

  _clearDots() {
    for (const sq of Object.values(this.squares)) {
      sq.classList.remove('cap');
      for (const d of [...sq.querySelectorAll('.dot')]) d.remove();
    }
  }

  _showDots(from) {
    this._clearDots();
    for (const m of this.legalTargets(from)) {
      const sq = this.squares[m.to];
      if (!sq) continue;
      if (this._pieceMap[m.to]) sq.classList.add('cap');
      const d = document.createElement('span');
      d.className = 'dot';
      sq.appendChild(d);
    }
  }

  _select(name) {
    this.selected = name;
    for (const sq of Object.values(this.squares)) sq.classList.remove('sel');
    this.squares[name].classList.add('sel');
    this._showDots(name);
  }

  _deselect() {
    this.selected = null;
    for (const sq of Object.values(this.squares)) sq.classList.remove('sel');
    this._clearDots();
  }

  _pointerDown(e, name) {
    if (e.button !== undefined && e.button !== 0) return;
    const piece = this._pieceMap && this._pieceMap[name];
    if (piece && this.canPick(name)) {
      this.onPremoveTouch();
      const targets = this.legalTargets(name);
      if (this.selected === name) { this._deselect(); return; }
      this._select(name);
      this._startDrag(e, name, piece, targets);
    } else if (this.selected) {
      const targets = this.legalTargets(this.selected).filter(m => m.to === name);
      if (targets.length) {
        const from = this.selected;
        this._deselect();
        this._maybePromote(from, name, targets);
      } else {
        this._deselect();
      }
    }
  }

  _startDrag(e, from, piece, targets) {
    this._dragging = { from, targets, moved: false, pointerId: e.pointerId };
    const boardRect = this.boardEl.getBoundingClientRect();
    this._dragging.rect = boardRect;
    const move = (ev) => {
      this._dragging.moved = true;
      if (!this.ghost.firstChild) this.ghost.appendChild(pieceImg(piece.color, piece.type));
      this.ghost.style.display = 'block';
      this.ghost.style.left = ev.clientX + 'px';
      this.ghost.style.top = ev.clientY + 'px';
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      for (const sq of Object.values(this.squares)) sq.classList.remove('hover');
      if (el) {
        const sqEl = el.closest('.sq');
        if (sqEl && this._dragging.targets.some(t => t.to === sqEl.dataset.square)) sqEl.classList.add('hover');
      }
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this.ghost.style.display = 'none';
      this.ghost.innerHTML = '';
      const drag = this._dragging;
      this._dragging = null;
      for (const sq of Object.values(this.squares)) sq.classList.remove('hover');

      let dest = null;
      if (drag.moved) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const sqEl = el && el.closest('.sq');
        if (sqEl && drag.targets.some(t => t.to === sqEl.dataset.square)) dest = sqEl.dataset.square;
      } else {
        dest = null; // simple click: keep selection (click-to-move mode)
      }

      if (dest && dest !== drag.from) {
        const from2 = drag.from;
        this._deselect();
        this._maybePromote(from2, dest, drag.targets);
      }
      // if no dest: selection stays for click-click play
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  _maybePromote(from, to, targets) {
    const promo = targets.find(t => t.to === to && t.promotion);
    if (!promo) { this.onMove(from, to); return; }
    const rect = this.squares[to].getBoundingClientRect();
    const openUp = this.orientation !== 'white'; // black pawns promote at the bottom of the screen
    const picker = document.createElement('div');
    picker.className = 'promo';
    for (const t of ['q', 'r', 'n', 'b']) {
      const b = document.createElement('button');
      const color = this._pieceMap[from].color;
      b.appendChild(pieceImg(color, t));
      b.onclick = (ev) => {
        ev.stopPropagation();
        picker.remove();
        this.onMove(from, to, t);
      };
      picker.appendChild(b);
    }
    picker.style.visibility = 'hidden';
    document.body.appendChild(picker);
    const ph = picker.offsetHeight;
    let top = openUp ? rect.bottom - ph : rect.top;
    top = Math.max(8, Math.min(top, window.innerHeight - ph - 8));
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - picker.offsetWidth - 8));
    picker.style.left = left + 'px';
    picker.style.top = top + 'px';
    picker.style.visibility = 'visible';
    const close = (ev) => { if (!picker.contains(ev.target)) { picker.remove(); document.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => document.addEventListener('pointerdown', close, true), 0);
  }

  // Small visual helpers used by the app
  animateFrom(from, to) {
    const el = this.squares[to] && this.squares[to].querySelector('.piece');
    if (el) el.classList.add('drop');
  }

  pulse(square) {
    const el = this.squares[square] && this.squares[square].querySelector('.piece');
    if (el) {
      el.classList.remove('pulse');
      void el.offsetWidth; // restart animation
      el.classList.add('pulse');
    }
  }

  stopPulse() {
    for (const sq of Object.values(this.squares)) {
      const el = sq.querySelector('.piece');
      if (el) el.classList.remove('pulse');
    }
  }

  shake(square) {
    const sq = this.squares[square];
    if (sq) {
      sq.classList.remove('shake');
      void sq.offsetWidth;
      sq.classList.add('shake');
    }
  }
}
