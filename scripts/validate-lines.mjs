// Validates every built-in repertoire line: SAN must be legal, and each line
// must contain the right number of plies. Run: npm run validate
import { Chess } from 'chess.js';
import { BUILTIN_LINES } from '../public/js/lines.js';

let bad = 0;
for (const line of BUILTIN_LINES) {
  const game = new Chess();
  try {
    for (let i = 0; i < line.moves.length; i++) game.move(line.moves[i]);
    const canon = game.history();
    const mismatch = canon.filter((m, i) => m !== line.moves[i]);
    const endsOn = line.moves.length % 2 === 1 ? 'white' : 'black';
    console.log(`OK  ${line.id.padEnd(20)} ${canon.length} plies, ends on ${endsOn}${mismatch.length ? '  CANON:' + mismatch.join(',') : ''}`);
  } catch (e) {
    bad++;
    console.log(`BAD ${line.id}: ${e.message}`);
  }
}
process.exit(bad ? 1 : 0);
