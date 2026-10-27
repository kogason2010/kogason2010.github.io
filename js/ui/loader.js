/* js/ui/loader.js — The loading card. Going somewhere new for the first time (the campus, NCA, the library, the maths
   building, space) builds it while the screen is faded out; this card sits on the fade with where you're going, a
   progress bar that moves between the build's steps, what it's doing, and a tip. Also the keyboard shortcut for a hard
   refresh, written for the visitor's computer.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const loaderEl = document.getElementById("loader");
const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");
const NO_KEYS = window.matchMedia("(hover: none)").matches;   // phones and tablets: no keyboard shortcut to offer
// the hard-refresh shortcut as keycaps
function refreshKeys() { return `<span class="keys">${(IS_MAC ? ["⌘", "Shift", "R"] : ["Ctrl", "Shift", "R"]).map(k => `<kbd>${k}</kbd>`).join("<span>+</span>")}</span>`; }
document.querySelectorAll(".refresh-keys").forEach(el => { el.innerHTML = refreshKeys(); });

const REFRESH_TIP = NO_KEYS
  ? "This lab is updated often. If something looks out of date, reload the page to get the newest version."
  : `This lab is updated often. If something looks out of date, press ${refreshKeys()} to load the newest version.`;
const LOAD_TIPS = [
  "Use <b>Places</b> in the top corner to jump straight to any building.",
  NO_KEYS ? "Hold <b>Fly</b> to take off and see the campus from above." : "Hold <b>Space</b> to take off and see the campus from above.",
  "Things have gone missing around campus. A hint appears when you're close to one.",
  "Turn the <b>lights off</b> for night: windows glow and the fountain lights up.",
  "Every glowing tag opens something: an instrument, a project, a tool you can use.",
];
let loaderTips = 0;
const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
function setLoaderProgress(p) { loaderEl.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3)); }

// Show the card (the screen is already faded) and run steps, [label, fn], a frame apart so the bar and label can move
// between them. A step that throws is logged and skipped, so the fade never gets stuck.
async function runWithLoader(title, eyebrow, steps) {
  document.getElementById("loaderTitle").textContent = title;
  document.getElementById("loaderEyebrow").textContent = eyebrow;
  // the refresh tip first, then now and again among the others
  const tip = loaderTips === 0 || loaderTips % 3 === 2 ? REFRESH_TIP : LOAD_TIPS[(loaderTips * 2 + Math.floor(Math.random() * 2)) % LOAD_TIPS.length];
  document.getElementById("loaderTip").innerHTML = tip; loaderTips++;
  setLoaderProgress(0.04); loaderEl.hidden = false;
  await nextFrame(); await nextFrame();
  for (let i = 0; i < steps.length; i++) {
    document.getElementById("loaderStep").textContent = steps[i][0] + "…";
    setLoaderProgress(0.04 + 0.9 * i / steps.length);
    await nextFrame();
    try { steps[i][1](); } catch (err) { console.error(err); }
  }
  setLoaderProgress(1); document.getElementById("loaderStep").textContent = "Ready";
  await nextFrame();
}
// compile every shader the new view needs now, behind the card, instead of stuttering through its first frames
// (anything carrying something other than a real material is set aside for the moment, so it can't stop the rest)
function warmUp() {
  const odd = [];
  scene.traverseVisible(o => { const m = o.material; if (m && ![].concat(m).every(x => x && x.isMaterial)) odd.push(o); });
  odd.forEach(o => { o.visible = false; });
  try { renderer.compile(scene, camera); } catch (err) { console.warn(err); } finally { odd.forEach(o => { o.visible = true; }); }
}
