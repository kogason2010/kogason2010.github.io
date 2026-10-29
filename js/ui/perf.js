/* js/ui/perf.js — Keeps things moving on weaker computers. Indoors it lowers the resolution when frames run long and
   raises it again when there's room (outside, the campus and space do the same in atmosphere.js). Anywhere, if frames
   stay slow with the resolution already down, it moves to Light graphics: at once if the campus hasn't been built yet,
   otherwise it offers to, since Light rebuilds the campus (a reload). A visitor who picked Full or Light keeps it.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const PERF_IN = { last: 0, n: 0, sum: 0, good: 0, slow: 0, offered: false }, PIXELS_MIN = 0.75;
function watchPerformance() {
  const now = performance.now(), ms = PERF_IN.last ? now - PERF_IN.last : 16; PERF_IN.last = now;
  if (ms > 250 || document.hidden) return;   // the tab was hidden or paused
  PERF_IN.sum += ms; PERF_IN.n++;
  if (PERF_IN.n < 60) return;
  const avg = PERF_IN.sum / PERF_IN.n, outside = worldOn || spaceOn, max = Math.min(window.devicePixelRatio || 1, PIXELS_MAX); PERF_IN.sum = PERF_IN.n = 0;
  if (!outside) {
    const pr = renderer.getPixelRatio();
    if (avg > 24 && pr > PIXELS_MIN) { renderer.setPixelRatio(Math.max(PIXELS_MIN, pr - 0.25)); PERF_IN.good = 0; }
    else if (avg < 17 && pr < max) { if (++PERF_IN.good >= 3) { renderer.setPixelRatio(Math.min(max, pr + 0.1)); PERF_IN.good = 0; } }
    else PERF_IN.good = 0;
  }
  // still under 30 frames a second with the resolution as low as it goes
  const lowest = renderer.getPixelRatio() <= (outside ? 0.71 : PIXELS_MIN + 0.01);
  PERF_IN.slow = avg > 33 && lowest ? PERF_IN.slow + 1 : 0;
  if (PERF_IN.slow >= 2 && !LIGHT && !QUALITY_CHOSEN) goLight();
}
function goLight() {
  if (!worldBuilt) {   // nothing to rebuild yet: the campus will simply be built light
    QUALITY = "light"; LIGHT = true; PIXELS_MAX = 1.25;
    if (typeof toast === "function") toast("Switched to Light graphics to keep things smooth");
    return;
  }
  if (PERF_IN.offered) return; PERF_IN.offered = true;
  const card = document.createElement("div"); card.className = "fresh"; card.setAttribute("role", "status");
  card.innerHTML = '<div class="fresh-text"><b>Running slowly?</b><span>Light graphics draws less and moves more smoothly.</span></div><button class="btn primary" type="button">Switch to Light</button><button class="fresh-x" type="button" aria-label="Dismiss">×</button>';
  card.querySelector(".btn").addEventListener("click", () => setQuality("light"));
  card.querySelector(".fresh-x").addEventListener("click", () => { card.classList.remove("on"); setTimeout(() => card.remove(), 300); });
  document.body.appendChild(card); requestAnimationFrame(() => card.classList.add("on"));
}
