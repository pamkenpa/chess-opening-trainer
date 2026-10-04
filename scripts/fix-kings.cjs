// One-off: give the two king SVGs explicit intrinsic dimensions like the other pieces.
const fs = require('fs');
for (const f of ['public/pieces/wK.svg', 'public/pieces/bK.svg']) {
  let s = fs.readFileSync(f, 'utf8');
  const from = '<svg xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" viewBox';
  const to = '<svg xmlns="http://www.w3.org/2000/svg" style="color-scheme:light only" width="45" height="45" viewBox';
  if (!s.includes(from)) { console.log(f, 'PATTERN NOT FOUND — head:', s.slice(0, 90)); continue; }
  fs.writeFileSync(f, s.replace(from, to));
  console.log(f, 'OK ->', fs.readFileSync(f, 'utf8').slice(0, 110));
}
