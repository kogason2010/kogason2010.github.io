#!/usr/bin/env node
/*
  Takes four screenshots of a project's live site for Showcase and Photos.

  One-time setup:
    npm install --no-save playwright
    npx playwright install chromium

  Usage:
    node tools/capture-shots.mjs <app id>

  Saves media/<id>/1.jpg … 4.jpg (the top of the page, then 25%, 50% and
  75% of the way down) and prints the `shots` lines to paste into config.js.
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const id = process.argv[2];
if (!id) {
  console.error('Usage: node tools/capture-shots.mjs <app id>');
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/config.js'), 'utf8'), sandbox);
const app = sandbox.window.PORTFOLIO.apps.find((a) => (a.id || (a.repo || '').split('/')[1]) === id);
if (!app) {
  console.error(`No app with id "${id}" in js/config.js`);
  process.exit(1);
}
const [owner, name] = (app.repo || '').split('/');
const url = app.url || `https://${owner}.github.io/${name}/`;

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

const out = path.join(root, 'media', id);
fs.mkdirSync(out, { recursive: true });
const lines = [];
for (const [i, frac] of [0, 0.25, 0.5, 0.75].entries()) {
  if (frac > 0) {
    const target = await page.evaluate((f) => (document.documentElement.scrollHeight - innerHeight) * f, frac);
    await page.mouse.move(720, 450);
    for (let y = await page.evaluate(() => scrollY); y < target - 50; y = await page.evaluate(() => scrollY)) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(3000);
  }
  const file = path.join(out, `${i + 1}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
  lines.push(`        ["media/${id}/${i + 1}.jpg", "Caption ${i + 1}"],`);
}
await browser.close();
console.log(`Saved 4 screenshots to media/${id}/. Add these to the app in js/config.js:\n      shots: [\n${lines.join('\n')}\n      ],`);
