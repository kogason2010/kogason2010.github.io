/* js/ui/freshness.js — This site changes often, and browsers keep GitHub Pages files for up to 10 minutes, so a visitor can
   be shown an older copy (or a mix of old and new files) right after an update. This checks when the newest change went
   live on GitHub; if the copy on screen may be older, a small card offers to load the latest, which fetches every file
   fresh and reloads. It also catches updates published while the page is open.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const FRESH = { repo: "kogason2010/kogason2010.github.io", openedAt: Date.now(), checkedAt: 0, fromCache: false, done: false };
const freshEl = document.getElementById("fresh");

// when the newest change went live: its commit time, plus a minute for GitHub Pages to publish it (0 if unknown)
async function latestLive() {
  const r = await fetch(`https://api.github.com/repos/${FRESH.repo}/commits?sha=main&per_page=1`, { cache: "no-store", headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) return 0;
  const list = await r.json(), c = list && list[0];
  return c ? Date.parse(c.commit.committer.date) + 60000 : 0;
}
// did any of the site's own files come straight from the browser's cache, without asking GitHub whether they'd changed?
function servedFromCache() {
  return performance.getEntriesByType("navigation").concat(performance.getEntriesByType("resource"))
    .some(e => e.name.startsWith(location.origin) && e.transferSize === 0 && e.decodedBodySize > 0);
}
async function checkFresh() {
  const now = Date.now();
  if (FRESH.done || !navigator.onLine || now - FRESH.checkedAt < 4 * 60000) return;
  FRESH.checkedAt = now;
  let live = 0; try { live = await latestLive(); } catch (e) { return; }
  if (!live || live > now) return;   // unknown, or still publishing (a later check will see it)
  // newer than this page, or newer than cached files it may have used (kept at most 10 minutes)
  if (live > FRESH.openedAt || (FRESH.fromCache && live > FRESH.openedAt - 10 * 60000)) showFresh();
}
function showFresh() { FRESH.done = true; freshEl.hidden = false; requestAnimationFrame(() => freshEl.classList.add("on")); }
function hideFresh() { freshEl.classList.remove("on"); setTimeout(() => { freshEl.hidden = true; }, 300); }
// fetch every file this page uses straight from GitHub (which refreshes the browser's copies), then reload
async function loadLatest() {
  const go = document.getElementById("freshGo"); go.disabled = true; go.textContent = "Loading…";
  const urls = new Set([location.href.split("#")[0]]);
  document.querySelectorAll("script[src], link[rel=stylesheet][href], link[rel=icon][href]").forEach(el => urls.add(new URL(el.src || el.href, location.href).href));
  performance.getEntriesByType("resource").forEach(e => urls.add(e.name));
  const own = [...urls].filter(u => u.startsWith(location.origin));
  await Promise.race([Promise.allSettled(own.map(u => fetch(u, { cache: "reload" }))), new Promise(r => setTimeout(r, 8000))]);
  location.reload();
}
document.getElementById("freshGo").addEventListener("click", loadLatest);
document.getElementById("freshX").addEventListener("click", hideFresh);
// check once the page has finished loading, and again whenever the visitor comes back to the tab
window.addEventListener("load", () => { FRESH.fromCache = servedFromCache(); setTimeout(checkFresh, 1500); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkFresh(); });
setInterval(() => { if (document.visibilityState === "visible") checkFresh(); }, 10 * 60000);
