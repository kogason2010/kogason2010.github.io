/* js/lab/desktop.js — Full-screen desktop portfolio that opens from the monitor.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Desktop portfolio (opens when the monitor is clicked) ---------- */
const ICONS = {
  folder: '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M4 8a4 4 0 0 1 4-4h10l5 5h17a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#e8ad2c"/><path d="M4 14h40v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#f8d36e"/></svg>',
  doc: '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M13 2h16l8 8v26a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#fff"/><path d="M29 2v8h8" fill="#cfdbe5"/><path d="M16 17h16M16 22h16M16 27h11" stroke="#7d93a6" stroke-width="2"/></svg>',
  mail: '<svg viewBox="0 0 48 40" aria-hidden="true"><rect x="4" y="7" width="40" height="27" rx="3" fill="#fff"/><path d="M6 10l18 13 18-13" fill="none" stroke="#0a5fb4" stroke-width="2.5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#0a5fb4"><circle cx="5" cy="5" r="2.2"/><circle cx="12" cy="5" r="2.2"/><circle cx="19" cy="5" r="2.2"/><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="12" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/></g></svg>'
};
const PORTFOLIO_URL = "https://kogason2010.github.io/os/";
const DESK_APPS = [
  { id: "about", name: "About", icon: "folder" },
  { id: "notes", name: "App notes", icon: "folder" },
  { id: "build", name: "This lab", icon: "doc" },
  { id: "contact", name: "Contact", icon: "mail" }
];
const desk = document.getElementById("desk"), winsEl = document.getElementById("wins");
const diconsEl = document.getElementById("dicons"), tbApps = document.getElementById("tbApps"), tbClock = document.getElementById("tbClock");
const openWins = {};
let zTop = 10, deskOpen = false, savedView = null, camTween = null;

const showDeskBtn = document.createElement("button");
showDeskBtn.className = "tb-app"; showDeskBtn.type = "button"; showDeskBtn.title = "Show desktop"; showDeskBtn.setAttribute("aria-label", "Show desktop");
showDeskBtn.innerHTML = ICONS.grid;
showDeskBtn.addEventListener("click", () => Object.keys(openWins).forEach(closeWin));
tbApps.appendChild(showDeskBtn);
DESK_APPS.forEach(app => {
  const d = document.createElement("button");
  d.className = "dicon"; d.type = "button";
  d.innerHTML = ICONS[app.icon] + "<span>" + app.name + "</span>";
  d.addEventListener("dblclick", () => openWin(app.id));
  d.addEventListener("click", e => { if (e.detail === 0 || window.matchMedia("(pointer: coarse)").matches) openWin(app.id); else d.focus(); });
  d.addEventListener("keydown", e => { if (e.key === "Enter") openWin(app.id); });
  diconsEl.appendChild(d);
  const t = document.createElement("button");
  t.className = "tb-app"; t.type = "button"; t.title = app.name; t.setAttribute("aria-label", app.name);
  t.innerHTML = ICONS[app.icon];
  t.addEventListener("click", () => openWins[app.id] ? focusWin(app.id) : openWin(app.id));
  tbApps.appendChild(t); app.tb = t;
});

function focusWin(id) { const w = openWins[id]; if (w) w.style.zIndex = ++zTop; }
function openWin(id) {
  if (openWins[id]) { focusWin(id); return; }
  const s = SECTIONS[id], app = DESK_APPS.find(a => a.id === id);
  const w = document.createElement("section");
  w.className = "win"; w.setAttribute("aria-label", app.name);
  w.innerHTML = '<div class="bar"><span>' + app.name + '</span><button type="button" aria-label="Close ' + app.name + '">✕</button></div>' +
    '<div class="body"><h3>' + s.title + '</h3>' + s.html + '</div>';
  winsEl.appendChild(w);
  const n = Object.keys(openWins).length, W = desk.clientWidth;
  const narrow = W < 640;
  w.style.left = (narrow ? 16 : Math.min(W - w.offsetWidth - 16, 130 + n * 36)) + "px";
  w.style.top = (narrow ? 16 + n * 20 : 40 + n * 32) + "px";
  w.style.zIndex = ++zTop;
  openWins[id] = w; app.tb.classList.add("open");
  w.addEventListener("pointerdown", () => focusWin(id));
  w.querySelector(".bar button").addEventListener("click", () => closeWin(id));
  w.querySelector(".body").addEventListener("click", e => { if (e.target.closest("[data-particles]")) { closeDesktop(() => setParticleMode(true)); } });
  // drag by the title bar
  const bar = w.querySelector(".bar");
  bar.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    const sx = e.clientX, sy = e.clientY, ox = w.offsetLeft, oy = w.offsetTop;
    bar.setPointerCapture(e.pointerId);
    const move = ev => {
      const nx = Math.max(-w.offsetWidth + 80, Math.min(desk.clientWidth - 80, ox + ev.clientX - sx));
      const ny = Math.max(0, Math.min(desk.clientHeight - 90, oy + ev.clientY - sy));
      w.style.left = nx + "px"; w.style.top = ny + "px";
    };
    const up = () => { bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); };
    bar.addEventListener("pointermove", move); bar.addEventListener("pointerup", up);
  });
  w.querySelector(".bar button").focus({ preventScroll: true });
}
function closeWin(id) {
  const w = openWins[id]; if (!w) return;
  w.remove(); delete openWins[id];
  DESK_APPS.find(a => a.id === id).tb.classList.remove("open");
}
function tickClock() {
  const now = new Date();
  tbClock.innerHTML = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + "<br>" + now.toLocaleDateString();
}
setInterval(tickClock, 15000); tickClock();

function animateCamera(toPos, toTgt, dur, done) {
  camTween = { fromPos: camera.position.clone(), toPos, fromTgt: controls.target.clone(), toTgt, t: 0, dur, done };
  if (reduce) camTween.t = 1;
}
function openDesktop() {
  if (deskOpen) return;
  const home = focusHome ? { pos: focusHome.pos.clone(), tgt: focusHome.tgt.clone() } : { pos: camera.position.clone(), tgt: controls.target.clone() };
  focusHome = null;
  deskOpen = true;
  document.body.classList.add("os-mode");
  closeSheet(true); setHover(null);
  labelsEl.hidden = true; hint.hidden = true;
  tween = null; controls.enabled = false;
  savedView = home;
  const sb = new THREE.Box3().setFromObject(screenMesh), screenC = new THREE.Vector3(), ss = new THREE.Vector3();
  sb.getCenter(screenC); sb.getSize(ss);
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const fitH = (ss.y / 2) / tv, fitW = (ss.x / 2) / tv / camera.aspect;
  animateCamera(new THREE.Vector3(screenC.x, screenC.y, screenC.z + Math.max(fitH, fitW) * 1.02), screenC, 1.1, () => {
    if (EMBED && osLive) { enterOsFull(); return; }
    // Hosted on the same site (GitHub Pages): go straight to the desktop portfolio.
    if (/(^|\.)kogason2010\.github\.io$/.test(location.hostname)) { location.assign(PORTFOLIO_URL); return; }
    // Elsewhere (e.g. inside a viewer that blocks navigation): show a launch card with a real link.
    desk.hidden = false;
    requestAnimationFrame(() => desk.classList.add("show"));
    document.getElementById("launchLink").focus({ preventScroll: true });
  });
}
function closeDesktop(after) {
  if (!deskOpen || !savedView || wsOpen || sfcAppOpen) return;
  desk.classList.remove("show");
  setTimeout(() => {
    desk.hidden = true;
    animateCamera(savedView.pos, savedView.tgt, 1.0, () => {
      deskOpen = false; controls.enabled = true; controls.minDistance = 8;
      document.body.classList.remove("os-mode");
      labelsEl.hidden = pMode; if (!pMode) hint.hidden = false;
      if (typeof after === "function") after();
    });
  }, reduce ? 0 : 300);
}
document.getElementById("deskBack").addEventListener("click", () => closeDesktop());
