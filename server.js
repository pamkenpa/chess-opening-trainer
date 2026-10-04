// Tiny static file server for the opening trainer.
// - Serves /public at /
// - Sends COOP/COEP headers so a multithreaded Stockfish build also works if swapped in later
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.argv[2] || process.env.PORT || 8787);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.nnue': 'application/octet-stream',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const file = path.normalize(path.join(ROOT, urlPath.replace(/^\/+/, '')));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found: ' + urlPath); }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Chess Opening Trainer running.');
  console.log('  Open  http://localhost:' + PORT + '  in your browser.');
  console.log('');
  console.log('  (Keep this window open. Close it or press Ctrl+C to stop.)');
});
