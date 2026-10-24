/* js/ui/labels.js — Floating tags, hover, clicking things in the scene, and the info sheet.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Labels, hover, picking ---------- */
const labelsEl = document.getElementById("labels"), tagEl = document.querySelector(".tag"), toolsEl = document.querySelector(".tools");
// one floating tag per clickable group; rooms built later (the Chemistry lab) add theirs with addHotButton
function addHotButton(h) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "hot"; b.textContent = h.label;
  b.addEventListener("click", () => openSection(h.key));
  b.addEventListener("pointerenter", () => setHover(h.key));
  b.addEventListener("pointerleave", () => setHover(null));
  labelsEl.appendChild(b); h.el = b;
  h.group.traverse(o => { if (o.isMesh && o.material.emissive && o.material !== glass && o.material !== smoked) o.userData.baseEmissive = o.material.emissive.clone(); });
}
hotspots.forEach(addHotButton);

let hovered = null;
function setHover(key) {
  if (hovered === key) return;
  hovered = key;
  hotspots.forEach(h => {
    const on = h.key === key;
    h.el.classList.toggle("on", on);
    h.group.traverse(o => { if (o.isMesh && o.userData.baseEmissive) o.material.emissive.set(on ? 0x1d3358 : o.userData.baseEmissive); });
  });
  renderer.domElement.style.cursor = key ? "pointer" : "grab";
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickables = hotspots.map(h => h.group);
function toNDC(ev, out) {
  const r = renderer.domElement.getBoundingClientRect();
  out.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
}
function botHit(ev) {
  if (pMode || deskOpen || !lab.visible || level !== "up" || lvl) return false;
  toNDC(ev, ndc); ray.setFromCamera(ndc, camera);
  return ray.intersectObject(bot, true).length > 0;
}
// tapping open floor drops a mess for the robot to find
function floorHit(ev) {
  if (pMode || deskOpen || !lab.visible || reduce || level !== "up" || lvl) return;
  toNDC(ev, ndc); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(lab, true).find(h => h.object.isMesh && h.object.visible && !(h.object.material && h.object.material.transparent && h.object.material.opacity < 0.2 && h.object.parent !== spotLayer));
  if (hit && hit.point.y < 0.03) tapFloor(hit.point.x, hit.point.z);
}
function pick(ev) {
  if (pMode) return null;
  toNDC(ev, ndc);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(hotspots.filter(h => h.level === level).map(h => h.group), true)[0];
  if (!hit) return null;
  let o = hit.object; while (o && !o.userData.key) o = o.parent;
  return o ? o.userData.key : null;
}
let downAt = null;
const cv = renderer.domElement;
cv.addEventListener("pointermove", ev => {
  if (worldOn || worldBusy) return;
  toNDC(ev, pointerNDC); pointerIn = true;
  if (ev.pointerType === "mouse" && !downAt) { const k = pick(ev); setHover(k); botHover = !k && botHit(ev); cv.style.cursor = k || botHover ? "pointer" : "grab"; }
});
cv.addEventListener("pointerleave", () => { pointerIn = false; botHover = false; });
cv.addEventListener("pointerdown", ev => { downAt = { x: ev.clientX, y: ev.clientY }; toNDC(ev, pointerNDC); pointerIn = true; });
cv.addEventListener("pointerup", ev => {
  if (worldOn || worldBusy) { downAt = null; return; }
  if (downAt && Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y) < 6) { if (botHit(ev)) pokeBot(); else { const k = pick(ev); if (k) openSection(k); else floorHit(ev); } }
  downAt = null;
  if (ev.pointerType !== "mouse") pointerIn = false;
});

/* ---------- Sheet ---------- */
const sheet = document.getElementById("sheet");
const hint = document.getElementById("hint");
const sheetBody = document.getElementById("sheetBody");
function openSection(key) {
  if (key === "desktop") { openDesktop(); return; }
  if (key === "icpc") { openWorkstation(); return; }
  if (key === "stairs") { goLevel("down"); return; }
  if (key === "exit") { enterWorld(); return; }
  if (key === "sfcpc") { openSfcApp(); return; }
  if (key === "upstairs") { goLevel("up"); return; }
  if (key === "lcpc") { openLcApp(); return; }
  if (key === "chemExit" || key === "libExit" || key === "mathExit") { leavePlace(); return; }
  if (lvl) return;
  const s = SECTIONS[key]; if (!s) return;
  document.getElementById("sheetKicker").textContent = s.kicker;
  document.getElementById("sheetTitle").textContent = s.title;
  sheetBody.innerHTML = s.html;
  sheet.classList.remove("closed"); sheet.setAttribute("aria-hidden", "false"); document.body.classList.add("sheet-open");
  hint.hidden = true;
  focusOn(hotspots.find(x => x.key === key));
  document.getElementById("closeBtn").focus({ preventScroll: true });
}
function closeSheet(keepHint) {
  sheet.classList.add("closed"); sheet.setAttribute("aria-hidden", "true"); document.body.classList.remove("sheet-open");
  if (!keepHint && !pMode) hint.hidden = false;
  unfocus();
}
sheetBody.addEventListener("click", e => { if (e.target.closest("[data-particles]")) setParticleMode(true); if (e.target.closest("[data-sfcapp]")) openSfcApp(); if (e.target.closest("[data-lcapp]")) openLcApp(); });
document.getElementById("closeBtn").addEventListener("click", () => closeSheet());
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (worldOn) exitWorld(); else if (readerOpen) closeReader(); else if (lcAppOpen) closeLcApp(); else if (sfcAppOpen) closeSfcApp(); else if (wsOpen) closeWorkstation(); else if (deskOpen) closeDesktop(); else if (pMode) setParticleMode(false); else closeSheet();
});
