/* js/core/levels.js — Switching floors: ground-floor lab and basement.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Levels: the ground-floor lab and the basement SFC suite ---------- */
let level = "up", lvl = null;
const LIFT = 11;
const levelBtn = document.getElementById("levelBtn");
const HINT_UP = hint.textContent, HINT_DOWN = "Drag to look around · scroll or pinch to zoom · tap the SFC workstation to run a sample";
scene.add(sun.target);
function goLevel(to) {
  if (lvl || to === level || deskOpen || pMode) return;
  sheet.classList.add("closed"); sheet.setAttribute("aria-hidden", "true"); document.body.classList.remove("sheet-open");
  if (to === "up") sfcAbort();
  const base = focusHome || { pos: camera.position.clone(), tgt: controls.target.clone() };
  focusHome = null; tween = null; setHover(null); botHover = false;
  const dy = to === "down" ? BY : -BY;
  labelsEl.hidden = true; hint.hidden = true; controls.enabled = false;
  basement.visible = true; lab.visible = true;
  if (osFrame) osFrame.style.visibility = "hidden";
  lvl = { to, t: 0, dur: reduce ? 0.001 : 2.3 };
  levelBtn.disabled = true; particleBtn.disabled = true;
  animateCamera(base.pos.clone().add(new THREE.Vector3(0, dy, 0)), base.tgt.clone().add(new THREE.Vector3(0, dy, 0)), lvl.dur, null);
}
function updateLevel(dt) {
  if (!lvl) return;
  lvl.t = Math.min(1, lvl.t + dt / lvl.dur);
  const k = lvl.to === "down" ? lvl.t : 1 - lvl.t, e = k * k * (3 - 2 * k);
  // the ground floor lifts away like the top of a dollhouse while the camera drops a storey
  lab.position.y = Math.pow(e, 1.4) * LIFT;
  const off = e * BY;
  sun.position.set(6, 11 + off, 7); sun.target.position.set(0, off, 0); bgGroup.position.y = off;
  if (lvl.t < 1) return;
  level = lvl.to; lvl = null;
  lab.visible = level === "up"; basement.visible = level === "down";
  controls.enabled = true; controls.minDistance = 8;
  labelsEl.hidden = false; hint.hidden = false; hint.textContent = level === "up" ? HINT_UP : HINT_DOWN;
  levelBtn.disabled = false; particleBtn.disabled = level === "down";
  levelBtn.textContent = level === "up" ? "Go downstairs" : "Go upstairs";
  document.getElementById("eyebrow").textContent = level === "up" ? "Portfolio · lab 01" : "Portfolio · basement · SFC suite";
  levelBtn.setAttribute("aria-label", level === "up" ? "Go downstairs to the SFC suite" : "Go back upstairs to the lab");
  if (osFrame && level === "up") { osFrame.style.visibility = ""; placeOsFrame(); }
}
levelBtn.addEventListener("click", () => goLevel(level === "up" ? "down" : "up"));
