/* Builds the plain-HTML project index and the search-engine files from js/config.js:
     projects/index.html   a fast, script-free list of every project (linked from the lab)
     sitemap.xml           the lab, KogasonOS, the index and every project site
     robots.txt            allows everything and points at the sitemap
   Run:  node os/tools/build-index.mjs   (the sync-apps GitHub Action runs it too) */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const osDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(osDir, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(osDir, 'js/config.js'), 'utf8'), sandbox);
const CFG = sandbox.window.PORTFOLIO;
const SITE = 'https://kogason2010.github.io/';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Same rules as KogasonOS's addApp(): work out each site's URL and source link. */
const projects = CFG.apps
  .filter((a) => a.type === 'github' || a.type === 'website')
  .filter((a) => a.id !== 'lab')
  .map((a) => {
    const p = { ...a };
    if (a.type === 'github') {
      const [owner, name] = a.repo.split('/');
      p.id = a.id || name;
      p.url = a.url || (name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${owner}.github.io/` : `https://${owner}.github.io/${name}/`);
      p.source = a.source || `https://github.com/${owner}/${name}`;
    }
    const shot = (a.shots || [])[0];
    p.image = a.cover || (shot ? (Array.isArray(shot) ? shot[0] : shot.src) : null);
    return p;
  });

const groups = (CFG.groups || []).map((g) => ({ ...g, items: projects.filter((p) => p.group === g.id) }));
const loose = projects.filter((p) => !p.group || !groups.some((g) => g.id === p.group));
if (loose.length) groups.push({ id: 'tools', title: 'Tools and Design Studies', description: 'Practical calculators and a design exercise.', items: loose });

const card = (p) => `
        <li class="card">
          ${p.image ? `<a class="shot" href="${esc(p.url)}" tabindex="-1" aria-hidden="true"><img src="../os/${esc(p.image)}" alt="" loading="lazy" width="640" height="400"></a>` : ''}
          <div class="card-body">
            <h3><a href="${esc(p.url)}">${esc(p.title)}</a></h3>
            <p>${esc(p.description || '')}</p>
            ${p.stack && p.stack.length ? `<ul class="stack" aria-label="Built with">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
            <div class="links"><a class="primary" href="${esc(p.url)}">Open site</a>${p.source ? `<a href="${esc(p.source)}">Source</a>` : ''}</div>
          </div>
        </li>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Projects · kogason2010</title>
<meta name="description" content="Every project by kogason2010: interactive 3D websites and tools about analytical science.">
<link rel="canonical" href="${SITE}projects/">
<meta property="og:title" content="Projects · kogason2010">
<meta property="og:description" content="${esc(CFG.owner.tagline)}">
<meta property="og:url" content="${SITE}projects/">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE}og-lab.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  :root { --bg: #e9eef2; --bg-2: #d2dce3; --ink: #18232b; --ink-soft: #51616c; --card: #f8fafb; --line: #c4d0d8; --accent: #0a5fb4; --accent-ink: #fff;
    --display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif; --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f181e; --bg-2: #18242c; --ink: #e3ecf1; --ink-soft: #97a9b4; --card: #152028; --line: #283943; --accent: #6aa6f0; --accent-ink: #091a30; color-scheme: dark; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 var(--display); }
  a { color: var(--accent); }
  a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
  .wrap { max-width: 1120px; margin: 0 auto; padding-block: 40px 64px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  header { display: grid; gap: 10px; margin-bottom: 36px; }
  .eyebrow { font: 500 12px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); }
  h1 { margin: 0; font-size: clamp(34px, 6vw, 56px); line-height: .95; font-weight: 800; letter-spacing: -.02em; }
  header p { margin: 0; max-width: 60ch; color: var(--ink-soft); }
  .start { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .start a { text-decoration: none; font: 500 13px/1 var(--mono); padding: 11px 15px; border-radius: 999px; border: 1px solid var(--line); color: var(--ink); background: var(--card); }
  .start a.primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  section { margin-top: 40px; }
  section > h2 { margin: 0 0 4px; font-size: 26px; font-weight: 800; letter-spacing: -.015em; }
  section > p { margin: 0 0 6px; max-width: 70ch; color: var(--ink-soft); }
  section > .note { font: 400 12px/1.5 var(--mono); color: var(--ink-soft); margin-bottom: 16px; }
  .grid { list-style: none; margin: 16px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 18px; }
  .card { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
  .shot { display: block; aspect-ratio: 16 / 10; background: var(--bg-2); max-width: 100%; }
  .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-body { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px 18px; flex: 1; min-width: 0; }
  .card h3 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -.01em; text-wrap: balance; }
  .card h3 a { color: inherit; text-decoration: none; }
  .card h3 a:hover { color: var(--accent); }
  .card p { margin: 0; color: var(--ink-soft); font-size: 15px; }
  .stack { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .stack li { font: 400 11px/1 var(--mono); padding: 6px 8px; border-radius: 6px; background: var(--bg-2); }
  .links { margin-top: auto; display: flex; gap: 14px; align-items: center; font: 500 13px/1 var(--mono); }
  .links a.primary { text-decoration: none; background: var(--accent); color: var(--accent-ink); padding: 10px 14px; border-radius: 8px; }
  footer { margin-top: 56px; font: 400 12px/1.6 var(--mono); color: var(--ink-soft); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="eyebrow">kogason2010 · all projects</span>
    <h1>Projects</h1>
    <p>${esc(CFG.owner.tagline)} Every project is listed here as a plain page, so nothing has to load before you can read it.</p>
    <div class="start"><a class="primary" href="${SITE}">Enter the 3D lab</a><a href="${SITE}os/">Open KogasonOS</a><a href="${esc(CFG.owner.github)}">GitHub</a></div>
  </header>
${groups.filter((g) => g.items.length).map((g) => `  <section aria-labelledby="g-${esc(g.id)}">
    <h2 id="g-${esc(g.id)}">${esc(g.title)}</h2>
    ${g.description ? `<p>${esc(g.description)}</p>` : ''}
    ${g.note ? `<p class="note">${esc(g.note)}</p>` : ''}
    <ul class="grid">${g.items.map(card).join('')}
    </ul>
  </section>`).join('\n')}
  <footer>Generated from KogasonOS's config by os/tools/build-index.mjs.</footer>
</div>
</body>
</html>
`;
fs.mkdirSync(path.join(root, 'projects'), { recursive: true });
fs.writeFileSync(path.join(root, 'projects/index.html'), html);

const urls = [SITE, `${SITE}os/`, `${SITE}projects/`, ...projects.map((p) => p.url).filter((u) => u && u.startsWith(SITE))];
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(urls)].map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
console.log(`Wrote projects/index.html (${projects.length} projects), sitemap.xml (${new Set(urls).size} URLs) and robots.txt.`);
