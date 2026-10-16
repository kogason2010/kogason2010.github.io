#!/usr/bin/env node
/*
  Copies the built site of every app marked `bundle: true` in js/config.js
  from its GitHub repo into apps/<id>/, so it runs as a standalone app.
  Also writes apps/manifest.json (size and file count of each bundle),
  which File Explorer and the Properties dialog read.

  Usage:
    node tools/sync-apps.mjs              # every bundled app
    node tools/sync-apps.mjs solvane      # just one (by id)
    node tools/sync-apps.mjs --manifest   # only rebuild apps/manifest.json

  Two kinds of repo work:
  - The built site is committed at the repo root (source code in source/ is skipped).
  - Only source is committed: give the app a `build` command and the output
    folder, e.g.  build: { run: "npm ci && npm run build", dir: "dist" }
*/
import { execSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/config.js'), 'utf8'), sandbox);
const config = sandbox.window.PORTFOLIO;

const SKIP = new Set(['.git', '.github', 'source', 'node_modules', 'tests', 'test', 'README.md', 'readme.md', 'LICENSE', '.nojekyll', '.gitignore']);
const args = process.argv.slice(2);
const manifestOnly = args.includes('--manifest');
const only = args.filter((a) => !a.startsWith('--'));
const idOf = (app) => app.id || app.repo.split('/')[1];
let count = 0;

function copySite(from, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    if (SKIP.has(name)) continue;
    fs.cpSync(path.join(from, name), path.join(dest, name), { recursive: true });
  }
}

if (!manifestOnly) {
  for (const app of config.apps) {
    if (!app.bundle || !app.repo) continue;
    const id = idOf(app);
    if (only.length && !only.includes(id)) continue;
    if (typeof app.bundle === 'string' && !app.bundle.startsWith(`apps/${id}/`)) {
      console.log(`- ${id}: custom bundle path, skipped`);
      continue;
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kos-'));
    try {
      execFileSync('git', ['clone', '--depth', '1', '--quiet', `https://github.com/${app.repo}.git`, tmp], { stdio: 'inherit' });
      let from = tmp;
      if (app.build) {
        console.log(`  building ${app.repo}: ${app.build.run}`);
        execSync(app.build.run, { cwd: tmp, stdio: 'inherit' });
        from = path.join(tmp, app.build.dir || 'dist');
      }
      if (!fs.existsSync(path.join(from, 'index.html'))) {
        console.log(`- ${id}: no index.html in ${app.build ? app.build.dir || 'dist' : 'the repo root'}, skipped`);
        continue;
      }
      copySite(from, path.join(root, 'apps', id));
      count++;
      console.log(`✓ ${app.repo} → apps/${id}/`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
}

/* apps/manifest.json: { "<id>": { "bytes": 123, "files": 4 } } */
function measure(dir) {
  let bytes = 0, files = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const m = measure(p); bytes += m.bytes; files += m.files; }
    else if (e.isFile()) { bytes += fs.statSync(p).size; files++; }
  }
  return { bytes, files };
}
const manifest = {};
const appsDir = path.join(root, 'apps');
if (fs.existsSync(appsDir)) {
  for (const e of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (e.isDirectory()) manifest[e.name] = measure(path.join(appsDir, e.name));
  }
  fs.writeFileSync(path.join(appsDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}

console.log(manifestOnly ? 'Rebuilt apps/manifest.json.' : count ? `Synced ${count} app${count === 1 ? '' : 's'}.` : 'Nothing to sync.');
