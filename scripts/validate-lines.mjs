// Validates every built-in repertoire line: SAN must be legal, and each line
// must contain the right number of plies. Run: npm run validate
import { Chess } from 'chess.js';
import { BUILTIN_LINES } from '../public/js/lines.js';

let bad = 0;
for (const line of BUILTIN_LINES) {
  if (!Array.isArray(line.tips) || line.tips.length !== line.moves.length) {
    bad++;
    console.log(`BAD ${line.id}: tips length ${line.tips ? line.tips.length : 'none'} != moves length ${line.moves.length}`);
    continue;
  }
  const empty = line.tips.filter(t => !t || !t.trim()).length;
  if (empty) { bad++; console.log(`BAD ${line.id}: ${empty} empty tips`); continue; }
  const game = new Chess();
  try {
    for (let i = 0; i < line.moves.length; i++) game.move(line.moves[i]);
    const canon = game.history();
    console.log(`OK  ${line.id.padEnd(20)} ${canon.length} plies, ${line.tips.length} explanations`);
  } catch (e) {
    bad++;
    console.log(`BAD ${line.id}: ${e.message}`);
  }
}
process.exit(bad ? 1 : 0);
