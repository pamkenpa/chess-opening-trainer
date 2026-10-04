// GitHub publish pipeline. Reads the OAuth token from tools/.gh-token.
// Usage: node gh-publish.cjs whoami | create-repo <name> | push | enable-pages | wait-deploy
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TOKEN = fs.readFileSync(path.join(ROOT, 'tools', '.gh-token'), 'utf8').trim();
const API = 'https://api.github.com';

async function api(method, urlPath, body) {
  const res = await fetch(API + urlPath, {
    method,
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'chess-opening-trainer-deploy',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

function git(args) {
  const auth = Buffer.from('x-access-token:' + TOKEN).toString('base64');
  const r = spawnSync(path.join(ROOT, 'tools', 'git', 'cmd', 'git.exe'), args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1' },
    maxBuffer: 10 * 1024 * 1024
  });
  // keep the token out of captured output
  const clean = (s) => (s || '').split(auth).join('***');
  return { code: r.status, out: clean(r.stdout), err: clean(r.stderr) };
}

const [cmd, arg] = process.argv.slice(2);

(async () => {
  if (cmd === 'whoami') {
    const { status, data } = await api('GET', '/user');
    if (status !== 200) { console.log('FAILED: ' + status); process.exit(1); }
    console.log(data.login);
    process.exit(0);
  }

  if (cmd === 'create-repo') {
    const me = (await api('GET', '/user')).data.login;
    const repo = arg;
    let r = await api('POST', '/user/repos', {
      name: repo,
      description: 'Chess opening trainer with Stockfish 16 (WASM) running fully in the browser',
      homepage: `https://${me}.github.io/${repo}/`,
      private: false,
      has_issues: true
    });
    if (r.status === 201) console.log('REPO CREATED ' + r.data.full_name);
    else if (r.status === 422) console.log('REPO EXISTS ' + me + '/' + repo);
    else { console.log('CREATE FAILED ' + r.status + ' ' + JSON.stringify(r.data).slice(0, 300)); process.exit(1); }
    process.exit(0);
  }

  if (cmd === 'archive-and-switch') {
    // 1) preserve the current main under archive/old-trainer
    const me = (await api('GET', '/user')).data.login;
    const repo = arg;
    const cur = await api('GET', `/repos/${me}/${repo}/git/ref/heads/main`);
    const sha = cur.data.object.sha;
    let arch = await api('POST', `/repos/${me}/${repo}/git/refs`, {
      ref: 'refs/heads/archive/old-trainer', sha
    });
    console.log(arch.status === 201 ? 'ARCHIVE BRANCH CREATED at ' + sha.slice(0, 8)
      : arch.status === 422 ? 'ARCHIVE BRANCH ALREADY EXISTS'
      : 'ARCHIVE FAILED ' + arch.status + ' ' + JSON.stringify(arch.data).slice(0, 200));
    if (arch.status !== 201 && arch.status !== 422) process.exit(1);

    // 2) make sure Pages builds from the GitHub Actions workflow, not the branch
    const pages = await api('GET', `/repos/${me}/${repo}/pages`);
    if (pages.status === 200 && pages.data.build_type === 'workflow') {
      console.log('PAGES ALREADY WORKFLOW-MODE');
    } else {
      if (pages.status === 200) {
        const del = await api('DELETE', `/repos/${me}/${repo}/pages`);
        if (del.status !== 204) { console.log('PAGES DELETE FAILED ' + del.status); process.exit(1); }
      }
      const recreate = await api('POST', `/repos/${me}/${repo}/pages`, { build_type: 'workflow' });
      console.log(recreate.status === 201 ? 'PAGES SWITCHED TO WORKFLOW MODE'
        : 'PAGES SWITCH FAILED ' + recreate.status + ' ' + JSON.stringify(recreate.data).slice(0, 200));
      if (recreate.status !== 201) process.exit(1);
    }
    process.exit(0);
  }

  if (cmd === 'push') {
    const me = (await api('GET', '/user')).data.login;
    const url = 'https://github.com/' + me + '/' + arg + '.git';
    const r = git(['-c', 'http.extraheader=AUTHORIZATION: Basic ' + Buffer.from('x-access-token:' + TOKEN).toString('base64'), 'push', '-u', url, 'main']);
    console.log('PUSH ' + (r.code === 0 ? 'OK' : 'FAILED code ' + r.code));
    if (r.out) console.log(r.out.trim().slice(0, 800));
    if (r.code !== 0 && r.err) console.log(r.err.trim().slice(0, 800));
    process.exit(r.code === 0 ? 0 : 1);
  }

  if (cmd === 'force-push') {
    const me = (await api('GET', '/user')).data.login;
    const url = 'https://github.com/' + me + '/' + arg + '.git';
    const r = git(['-c', 'http.extraheader=AUTHORIZATION: Basic ' + Buffer.from('x-access-token:' + TOKEN).toString('base64'), 'push', '-f', '-u', url, 'main']);
    console.log('FORCE PUSH ' + (r.code === 0 ? 'OK' : 'FAILED code ' + r.code));
    if (r.out) console.log(r.out.trim().slice(0, 800));
    if (r.code !== 0 && r.err) console.log(r.err.trim().slice(0, 800));
    process.exit(r.code === 0 ? 0 : 1);
  }

  if (cmd === 'enable-pages') {
    const me = (await api('GET', '/user')).data.login;
    const r = await api('POST', `/repos/${me}/${arg}/pages`, { build_type: 'workflow' });
    if (r.status === 201 || r.status === 204) console.log('PAGES ENABLED');
    else if (r.status === 409) console.log('PAGES ALREADY ENABLED');
    else { console.log('PAGES FAILED ' + r.status + ' ' + JSON.stringify(r.data).slice(0, 300)); process.exit(1); }
    process.exit(0);
  }

  if (cmd === 'wait-deploy') {
    const me = (await api('GET', '/user')).data.login;
    const started = Date.now();
    while (Date.now() - started < 10 * 60 * 1000) {
      await new Promise((res) => setTimeout(res, 15000));
      const r = await api('GET', `/repos/${me}/${arg}/actions/runs?per_page=1`);
      const run = r.data && r.data.workflow_runs && r.data.workflow_runs[0];
      if (run && run.status === 'completed') {
        console.log('RUN ' + run.conclusion.toUpperCase() + ' (' + run.html_url + ')');
        process.exit(run.conclusion === 'success' ? 0 : 1);
      }
      console.log('deploying... (' + Math.round((Date.now() - started) / 1000) + 's)');
    }
    console.log('TIMEOUT');
    process.exit(1);
  }

  console.log('unknown command');
  process.exit(1);
})().catch((e) => { console.log('FAILED: ' + e.message); process.exit(1); });
