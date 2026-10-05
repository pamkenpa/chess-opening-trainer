// Validates the opening classifier: every TABLE entry must be a legal move sequence.
import { Chess } from 'chess.js';
import { classify } from '../public/js/openings.js';

let bad = 0, count = 0;
// entries are internal; re-derive them by probing classify() with legal prefixes:
// simpler: import the table indirectly by validating a copy of the move lists.
const src = (await import('node:fs')).readFileSync('public/js/openings.js', 'utf8');
const re = /T\(\[([^\]]+)\],/g;
let m;
while ((m = re.exec(src)) !== null) {
  const moves = m[1].split(',').map(x => x.trim().replace(/^'|'$/g, ''));
  count++;
  const g = new Chess();
  try {
    for (const mv of moves) g.move(mv);
  } catch (e) {
    bad++;
    console.log('BAD:', moves.join(' '), '->', e.message);
  }
}
// smoke-test classify()
const t1 = classify(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6']);
const t2 = classify(['d4', 'd5', 'c4', 'e6']);
const t3 = classify(['e4', 'e5', 'f4']);
console.log(t1?.name, '|', t2?.name, '|', t3?.name);
console.log(`${count} entries checked, ${bad} bad`);
process.exit(bad ? 1 : 0);
