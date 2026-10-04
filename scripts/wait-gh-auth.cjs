// Polls GitHub's OAuth token endpoint for the pending device-flow authorization.
// Writes the access token to the output path when the user authorizes.
const fs = require('fs');

const deviceCode = process.argv[2];
let interval = Number(process.argv[3] || 5) * 1000;
const out = process.argv[4];
const started = Date.now();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  while (Date.now() - started < 14 * 60 * 1000) {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: '178c6fc778ccc68e1d6a',
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    });
    const data = await res.json();
    if (data.access_token) {
      fs.writeFileSync(out, data.access_token);
      console.log('AUTHORIZED');
      process.exit(0);
    }
    if (data.error === 'authorization_pending') { await sleep(interval); continue; }
    if (data.error === 'slow_down') { interval += 5000; await sleep(interval); continue; }
    console.log('ERROR: ' + (data.error || 'unknown') + ' ' + (data.error_description || ''));
    process.exit(1);
  }
  console.log('EXPIRED');
  process.exit(1);
})();
