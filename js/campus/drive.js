/* js/campus/drive.js — Driving the robot, collisions, chase camera, HUD, minimap, touch controls, per-frame update, and going in and out of the lab.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* driving */
const DRV = { x: SPAWN.x, z: SPAWN.z, h: SPAWN.h, v: 0, w: 0, acc: 0, bumpT: 0, msgT: 0 };
const keys = {}, joy = { active: false, x: 0, y: 0 };
let boostHeld = false;
window.addEventListener("keydown", e => {
  if (!worldOn) return;
  if (/^(Arrow|Space)/.test(e.code)) e.preventDefault();
  keys[e.code] = true;
});
window.addEventListener("keyup", e => { keys[e.code] = false; });
window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
function collide(x, z, r) {
  let hit = null;
  for (let it = 0; it < 2; it++) {
    for (const c of CAMPUS.circles) { const dx = x - c[0], dz = z - c[1], d = Math.hypot(dx, dz), m = c[2] + r; if (d < m && d > 1e-6) { x = c[0] + dx / d * m; z = c[1] + dz / d * m; hit = c[3]; } }
    for (const b of CAMPUS.boxes) {
      const cx = Math.max(b[0], Math.min(b[2], x)), cz = Math.max(b[1], Math.min(b[3], z)), dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
      if (d < r) {
        if (d > 1e-6) { x = cx + dx / d * r; z = cz + dz / d * r; }
        else { const o = [x - b[0], b[2] - x, z - b[1], b[3] - z], k = o.indexOf(Math.min(...o)); if (k === 0) x = b[0] - r; else if (k === 1) x = b[2] + r; else if (k === 2) z = b[1] - r; else z = b[3] + r; }
        hit = b[4];
      }
    }
    const lim = WB - 0.75 - r; if (Math.abs(x) > lim || Math.abs(z) > lim) { x = Math.max(-lim, Math.min(lim, x)); z = Math.max(-lim, Math.min(lim, z)); hit = "hedge"; }
  }
  return { x, z, hit };
}
const BUMP_LINES = { pond: "Too wet for me", hedge: "That's the edge of campus", car: "Sorry, car!", building: "Bonk!", tree: "Oof, tree", fountain: "Not a swimmer", bed: "Mind the flowers", shrub: "Into the bushes", bench: "Bonk!", lamp: "Bonk!", table: "Bonk!", column: "Bonk!", sculpture: "Careful, that's art" };
function driveCampus(dt) {
  let thr = 0, str = 0;
  if (keys.KeyW || keys.ArrowUp) thr += 1; if (keys.KeyS || keys.ArrowDown) thr -= 1;
  if (keys.KeyA || keys.ArrowLeft) str += 1; if (keys.KeyD || keys.ArrowRight) str -= 1;
  if (joy.active) { thr = -joy.y; str = -joy.x; }
  const boost = keys.ShiftLeft || keys.ShiftRight || boostHeld;
  const vmax = boost ? 4.4 : 2.5, vT = thr >= 0 ? thr * vmax : thr * 1.3;
  const dv = Math.max(-6 * dt, Math.min((boost ? 4 : 3) * dt, vT - DRV.v)); DRV.v += dv; DRV.acc = dv / Math.max(dt, 1e-4);
  const wT = str * (2.9 - Math.min(1.3, Math.abs(DRV.v) * 0.3)); DRV.w += (wT - DRV.w) * Math.min(1, dt * 9); DRV.h += DRV.w * dt;
  const nx = DRV.x + Math.cos(DRV.h) * DRV.v * dt, nz = DRV.z - Math.sin(DRV.h) * DRV.v * dt, res = collide(nx, nz, BOT_R);
  DRV.x = res.x; DRV.z = res.z; DRV.bumpT -= dt; DRV.msgT -= dt;
  // into NCA's LC lab or the Library: steering at the doors while driving forward (checked on the intended move, so no bump first)
  const fwd = thr > 0 || DRV.v > 0.15;
  if (fwd && nx > CHEM_DOOR.x - 0.4 && Math.abs(nz - CHEM_DOOR.z) < 1.3 && Math.cos(DRV.h) > 0.4) { DRV.v = 0; enterPlace("chem"); return; }
  if (fwd && nz > LIB_DOOR.z - 0.4 && Math.abs(nx - LIB_DOOR.x) < 0.9 && Math.sin(DRV.h) < -0.4) { DRV.v = 0; enterPlace("library"); return; }
  if (res.hit) {
    if (Math.abs(DRV.v) > 1.4 && DRV.bumpT <= 0) { DRV.v *= -0.3; DRV.bumpT = 0.6; R.flash = 0.6; camShake = 0.25; if (DRV.msgT <= 0) { toast(BUMP_LINES[res.hit] || "Bonk!"); DRV.msgT = 2.5; } }
    else DRV.v *= 0.92;
  }
  // drive back in through the lab's door
  if (DRV.z < LAB_DOOR.z + 0.55 && Math.abs(DRV.x - LAB_DOOR.x) < 1.25 && DRV.v > 0.15 && Math.sin(DRV.h) > 0.4) exitWorld();
  const dChem = Math.hypot(DRV.x - CHEM_DOOR.x, DRV.z - CHEM_DOOR.z);
  if (dChem < 6 && !CHEM_DOOR.hinted) { CHEM_DOOR.hinted = true; toast("NCA · drive through the doors to visit the LC lab"); } else if (dChem > 12) CHEM_DOOR.hinted = false;
  const dLib = Math.hypot(DRV.x - LIB_DOOR.x, DRV.z - LIB_DOOR.z);
  if (dLib < 7 && !LIB_DOOR.hinted) { LIB_DOOR.hinted = true; toast("Library · drive between the columns and through the doors to browse the app notes"); } else if (dLib > 13) LIB_DOOR.hinted = false;
  return boost;
}

/* chase camera: behind and above, drag to look round, scroll to zoom */
const CAM = { yaw: 0, pitch: 0.36, dist: 3.8, drag: null, idle: 9, look: new THREE.Vector3() };
let camShake = 0;
function chase(dt, snap) {
  const yaw = DRV.h + CAM.yaw, cp = Math.cos(CAM.pitch), back = V(-Math.cos(yaw) * cp, 0, Math.sin(yaw) * cp);
  const want = V(DRV.x, 0.2, DRV.z).addScaledVector(back, CAM.dist).add(V(0, Math.sin(CAM.pitch) * CAM.dist, 0));
  const look = V(DRV.x + Math.cos(DRV.h) * 0.9, 0.25, DRV.z - Math.sin(DRV.h) * 0.9);
  // keep the camera out of buildings: slide it in toward the robot until it's clear
  const rp = V(DRV.x, 0.3, DRV.z);
  for (let t = 1; t > 0.15; t -= 0.05) {
    const px = rp.x + (want.x - rp.x) * t, pz = rp.z + (want.z - rp.z) * t;
    if (!CAMPUS.boxes.some(b => b[4] === "building" && px > b[0] - 0.4 && px < b[2] + 0.4 && pz > b[1] - 0.4 && pz < b[3] + 0.4)) { want.x = px; want.z = pz; want.y = rp.y + (want.y - rp.y) * Math.max(t, 0.6); break; }
  }
  const k = snap ? 1 : 1 - Math.exp(-dt * 6);
  camera.position.lerp(want, k); CAM.look.lerp(look, snap ? 1 : 1 - Math.exp(-dt * 8));
  if (camShake > 0) { camShake -= dt; camera.position.x += (Math.random() - 0.5) * camShake * 0.25; camera.position.y += (Math.random() - 0.5) * camShake * 0.25; }
  camera.lookAt(CAM.look);
  if (!CAM.drag) { CAM.idle += dt; if (CAM.idle > 1.4) CAM.yaw *= Math.exp(-dt * 1.6); }
}
cv.addEventListener("pointerdown", ev => { if (!worldOn) return; CAM.drag = { x: ev.clientX, y: ev.clientY, id: ev.pointerId }; CAM.idle = 0; });
cv.addEventListener("pointermove", ev => {
  if (!worldOn || !CAM.drag || CAM.drag.id !== ev.pointerId) return;
  CAM.yaw -= (ev.clientX - CAM.drag.x) * 0.006; CAM.pitch = Math.max(0.1, Math.min(1.2, CAM.pitch + (ev.clientY - CAM.drag.y) * 0.004));
  CAM.drag.x = ev.clientX; CAM.drag.y = ev.clientY;
});
const endDrag = ev => { if (CAM.drag && CAM.drag.id === ev.pointerId) { CAM.drag = null; CAM.idle = 0; } };
cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
cv.addEventListener("wheel", ev => { if (!worldOn) return; ev.preventDefault(); CAM.dist = Math.max(2.2, Math.min(11, CAM.dist * (1 + Math.sign(ev.deltaY) * 0.1))); }, { passive: false });

/* HUD, minimap, toast, touch controls */
const hudEl = document.getElementById("hud"), mmEl = document.getElementById("minimap"), toastEl = document.getElementById("toast");
const joyEl = document.getElementById("joy"), knobEl = joyEl.querySelector(".joy-knob"), boostEl = document.getElementById("boostBtn"), fadeEl = document.getElementById("fade");
const COARSE = window.matchMedia("(pointer: coarse)").matches;
let toastT = null;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2600); }
function hudSync() {
  document.getElementById("hudMess").textContent = `${wMessDone} / ${wMessTotal}`;
  document.getElementById("hudFind").textContent = `${wFound} / ${finds.length}`;
  document.getElementById("hudFinds").innerHTML = finds.map(f => `<span class="${f.found ? "got" : ""}">${f.found ? f.name : "?"}</span>`).join("");
  const near = finds.some(f => !f.found && Math.hypot(f.x - DRV.x, f.z - DRV.z) < 11);
  document.getElementById("hudNear").hidden = !near;
}
document.getElementById("hudBack").addEventListener("click", () => exitWorld());
joyEl.addEventListener("pointerdown", ev => { joy.active = true; joy.id = ev.pointerId; joyEl.setPointerCapture(ev.pointerId); joyMove(ev); });
joyEl.addEventListener("pointermove", ev => { if (joy.active && ev.pointerId === joy.id) joyMove(ev); });
const joyEnd = ev => { if (ev.pointerId !== joy.id) return; joy.active = false; joy.x = joy.y = 0; knobEl.style.transform = ""; };
joyEl.addEventListener("pointerup", joyEnd); joyEl.addEventListener("pointercancel", joyEnd);
function joyMove(ev) {
  const r = joyEl.getBoundingClientRect(), R0 = r.width / 2 - 18, dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy), k = d > R0 ? R0 / d : 1;
  joy.x = dx * k / R0; joy.y = dy * k / R0; if (Math.abs(joy.x) < 0.12) joy.x = 0; if (Math.abs(joy.y) < 0.12) joy.y = 0;
  knobEl.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
}
boostEl.addEventListener("pointerdown", ev => { boostHeld = true; boostEl.setPointerCapture(ev.pointerId); boostEl.classList.add("on"); });
const boostEnd = () => { boostHeld = false; boostEl.classList.remove("on"); };
boostEl.addEventListener("pointerup", boostEnd); boostEl.addEventListener("pointercancel", boostEnd);
let mmClock = 0;
function drawMinimap(time) {
  const c = fitCanvas(mmEl); if (!c) return; const [g, Wc, Hc] = c, span = WB * 2 + 6, s = Math.min(Wc, Hc) / span;
  const X = x => (x + span / 2) * s, Y = z => (z + span / 2) * s;
  g.clearRect(0, 0, Wc, Hc); g.fillStyle = "#93bd73"; g.fillRect(0, 0, Wc, Hc);
  g.fillStyle = "#c9c2b6"; CAMPUS.plazas.forEach(p => { g.beginPath(); g.arc(X(p[0]), Y(p[1]), p[2] * s, 0, 7); g.fill(); });
  g.strokeStyle = "#ece7dd"; g.lineCap = "round"; CAMPUS.paths.forEach(p => { g.lineWidth = Math.max(2, p[4] * s); g.beginPath(); g.moveTo(X(p[0]), Y(p[1])); g.lineTo(X(p[2]), Y(p[3])); g.stroke(); });
  g.fillStyle = "#5b6266"; CAMPUS.lots.forEach(l => g.fillRect(X(l[0]), Y(l[1]), (l[2] - l[0]) * s, (l[3] - l[1]) * s));
  g.fillStyle = "#4f95c8"; CAMPUS.ponds.forEach(p => { g.beginPath(); g.arc(X(p[0]), Y(p[1]), p[2] * s, 0, 7); g.fill(); });
  g.beginPath(); g.arc(X(0), Y(0), 3.6 * s, 0, 7); g.fill();
  CAMPUS.bldg.forEach(b => { g.fillStyle = b.name === "Kogason Lab" ? "#0a5fb4" : "#d9dde0"; g.fillRect(X(b.x - b.w / 2), Y(b.z - b.d / 2), b.w * s, b.d * s); });
  g.fillStyle = "#c8692b"; wSpots.forEach(sp => { if (sp.fade < 0) { g.beginPath(); g.arc(X(sp.x), Y(sp.z), 2.2, 0, 7); g.fill(); } });
  finds.forEach(f => { if (!f.found && Math.hypot(f.x - DRV.x, f.z - DRV.z) < 11) { g.strokeStyle = `rgba(255,211,107,${0.5 + 0.4 * Math.sin(time * 4)})`; g.lineWidth = 2; g.beginPath(); g.arc(X(f.hint[0]), Y(f.hint[1]), 7 * s, 0, 7); g.stroke(); } });
  g.save(); g.translate(X(DRV.x), Y(DRV.z)); g.rotate(-DRV.h); g.fillStyle = "#ffffff"; g.strokeStyle = "#0a5fb4"; g.lineWidth = 2; g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, 4.5); g.lineTo(-2.5, 0); g.lineTo(-5, -4.5); g.closePath(); g.fill(); g.stroke(); g.restore();
}

/* per-frame update while outside */
function updateWorld(dt, time) {
  const boost = driveCampus(dt);
  wbot.position.set(DRV.x, 0.003, DRV.z);
  const pitch = Math.max(-0.05, Math.min(0.05, DRV.acc * 0.012));
  wbot.rotation.set(0, DRV.h + (R.flash > 0 ? Math.sin(time * 40) * 0.05 : 0), wbot.rotation.z + (pitch - wbot.rotation.z) * Math.min(1, dt * 8));
  wBrush.rotation.y += dt * (8 + Math.abs(DRV.v) * 14); wTurret.rotation.y += dt * 4;
  R.flash -= dt;
  wLightMat.color.setHex(R.flash > 0 && Math.sin(time * 22) > 0 ? 0xffffff : boost && Math.abs(DRV.v) > 0.5 ? 0x9ff3ea : 0x3fe0d0);
  chase(dt, false);
  const LD = night ? MOON_DIR : SUN_DIR; sun.position.set(DRV.x + LD.x * 50, LD.y * 50, DRV.z + LD.z * 50); sun.target.position.set(DRV.x, 0, DRV.z);
  updateWorldFx(dt, time);
  // wipe messes under the robot
  for (let i = wSpots.length - 1; i >= 0; i--) {
    const sp = wSpots[i];
    if (sp.fade < 0 && Math.hypot(DRV.x - sp.x, DRV.z - sp.z) < sp.size / 2 + 0.3) {
      wipe(sp, DRV.x, DRV.z, 1 - Math.exp(-dt * 5.5), 0.28);
      if (sp.left < 0.22) { sp.fade = 0; wMessDone++; burst(sp.x, sp.z, 0xffffff); toast(wMessDone === wMessTotal ? "Every mess on campus is spotless!" : `Cleaned up ${sp.label} · ${wMessDone}/${wMessTotal}`); hudSync(); }
    }
    if (sp.fade >= 0) { sp.fade += dt / 0.6; sp.mesh.material.opacity = Math.max(0, 1 - sp.fade); if (sp.fade >= 1) { wSpotLayer.remove(sp.mesh); sp.mesh.geometry.dispose(); sp.mesh.material.dispose(); sp.tex.dispose(); wSpots.splice(i, 1); } }
  }
  // lost things: float, spin, collect
  finds.forEach((f, i) => {
    if (f.found) { if (f.g.visible) { f.g.scale.multiplyScalar(Math.exp(-dt * 6)); f.g.position.y += dt * 1.5; if (f.g.scale.x < 0.05) { f.g.visible = false; f.ring.visible = false; } } return; }
    f.g.position.y = 0.34 + Math.sin(time * 2 + i) * 0.06; f.g.rotation.y += dt * 1.2;
    f.ring.material.opacity = 0.35 + 0.3 * Math.sin(time * 3 + i); f.ring.scale.setScalar(1 + 0.08 * Math.sin(time * 3 + i));
    if (Math.hypot(f.x - DRV.x, f.z - DRV.z) < 0.62) {
      f.found = true; wFound++; burst(f.x, f.z, 0xffd36b);
      toast(wFound === finds.length ? "Found everything that went missing. Nice driving!" : `Found the lost ${f.name} · ${wFound}/${finds.length}`); hudSync();
    }
  });
  if (burstRing.visible) { const b = burstRing.userData; b.t += dt / 0.8; burstRing.scale.setScalar(1 + b.t * 4); burstRing.material.opacity = Math.max(0, 1 - b.t) * 0.9; if (b.t >= 1) burstRing.visible = false; }
  if (updateWorld.night !== night) { updateWorld.night = night; applyWorldNight(night); }
  mmClock -= dt; if (mmClock <= 0) { mmClock = 0.07; drawMinimap(time); if (Math.random() < 0.2) hudSync(); }
}
function burst(x, z, color) { burstRing.position.set(x, 0.05, z); burstRing.material.color.setHex(color); burstRing.userData.t = 0; burstRing.visible = true; }

/* stepping outside and back in */
let labView = null;
const DOOR_POSE = { pos: V(DOOR.x - 0.3, 1.55, -1.1), tgt: V(DOOR.x, 1.2, -4.3) };
function shadowRes(n) { if (sun.shadow.mapSize.x === n) return; sun.shadow.mapSize.set(n, n); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
function fade(on, ms, cb) { fadeEl.style.background = night ? "#0b1433" : "#f4fbff"; fadeEl.style.transitionDuration = (reduce ? 0 : ms) + "ms"; fadeEl.classList.toggle("on", on); setTimeout(cb, reduce ? 0 : ms + 30); }
function enterWorld() {
  if (worldOn || worldBusy || lvl || deskOpen || pMode || level !== "up") return;
  worldBusy = true; treeTextures();
  labView = focusHome ? { pos: focusHome.pos.clone(), tgt: focusHome.tgt.clone() } : { pos: camera.position.clone(), tgt: controls.target.clone() };
  focusHome = null; tween = null; closeSheet(true); setHover(null); botHover = false;
  labelsEl.hidden = true; hint.hidden = true; controls.enabled = false; doorGoal = 1;
  animateCamera(DOOR_POSE.pos.clone(), DOOR_POSE.tgt.clone(), 1.5, () => fade(true, 420, () => { setupWorld(); fade(false, 600, () => { worldBusy = false; }); }));
}
function setupWorld(spawn) {
  spawn = spawn || SPAWN;
  if (!worldBuilt) buildWorld();
  worldOn = true; lab.visible = false; chem.visible = false; library.visible = false; world.visible = true; bgGroup.visible = false; botTip.classList.remove("on");
  scene.fog = new THREE.FogExp2(0xc9dbe8, 0.0052); updateWorld.night = null;
  camera.fov = 58; camera.far = 2400; camera.updateProjectionMatrix();
  shadowRes(2048); sun.shadow.normalBias = 0.03; renderer.setPixelRatio(DPR_MAX); PERF.last = 0; PERF.sum = PERF.n = PERF.good = 0;
  Object.assign(sun.shadow.camera, { left: -SHADOW_R, right: SHADOW_R, top: SHADOW_R, bottom: -SHADOW_R, near: 1, far: 110 }); sun.shadow.camera.updateProjectionMatrix();
  applyWorldNight(night); updateWorld.night = night;
  Object.assign(DRV, { x: spawn.x, z: spawn.z, h: spawn.h, v: 0, w: 0 }); CAM.yaw = 0; CAM.idle = 9; chase(0, true);
  document.body.classList.add("world-mode"); hudEl.hidden = false; mmEl.hidden = false; joyEl.hidden = !COARSE; boostEl.hidden = !COARSE;
  hint.textContent = COARSE ? "Drag the stick to drive · hold Boost · drag elsewhere to look around" : "W A S D or arrow keys to drive · Shift to boost · drag to look · scroll to zoom";
  hint.hidden = false; levelBtn.hidden = true; particleBtn.hidden = true;
  if (osFrame) osFrame.style.visibility = "hidden";
  hudSync(); toast(spawn.msg || "Clean up the campus and find what went missing");
}
// back from the campus to an indoor diorama view: lab-style camera, lighting and shadows, no HUD
function teardownWorld() {
  worldOn = false; world.visible = false; bgGroup.visible = true; scene.fog = null;
  camera.fov = 32; camera.far = 100; camera.updateProjectionMatrix();
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); sun.shadow.camera.updateProjectionMatrix();
  sun.position.set(6, 11, 7); sun.target.position.set(0, 0, 0); shadowRes(2048); sun.shadow.normalBias = 0; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); restoreLabLighting();
  document.body.classList.remove("world-mode"); hudEl.hidden = true; mmEl.hidden = true; joyEl.hidden = true; boostEl.hidden = true; toastEl.classList.remove("on");
  for (const k in keys) keys[k] = false; joy.active = false; boostHeld = false;
}
function exitWorld() {
  if (!worldOn || worldBusy) return;
  worldBusy = true;
  fade(true, 420, () => {
    teardownWorld(); lab.visible = true;
    hint.textContent = HINT_UP; levelBtn.hidden = false; particleBtn.hidden = false;
    camera.position.copy(DOOR_POSE.pos); controls.target.copy(DOOR_POSE.tgt); camera.lookAt(DOOR_POSE.tgt); doorOpen = 1; doorGoal = 1;
    if (osFrame) { osFrame.style.visibility = ""; placeOsFrame(); }
    fade(false, 600, () => {
      doorGoal = 0;
      animateCamera(labView.pos, labView.tgt, 1.4, () => { controls.enabled = true; controls.minDistance = 8; labelsEl.hidden = false; hint.hidden = false; worldBusy = false; });
    });
  });
}
