/* js/main.js — Camera focus and easing, window resize, the main animation loop, and start-up.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Focus camera: clicked item becomes the centre of the view ---------- */
let focusHome = null;
const viewMinDist = () => level === "library" ? LIB_VIEW.minD : 8;
const FRONT = { about: [1, 0, 0], ic: [1, 0, 0], hplc: [0, 0, 1], contact: [0, 0, 1], toc: [0, 0, 1], desktop: [0, 0, 1], sfc: [0, 0, 1], co2: [1, 0, 0] };
const fBox = new THREE.Box3(), fC = new THREE.Vector3(), fS = new THREE.Vector3();
function focusOn(h) {
  if (!focusHome) focusHome = { pos: camera.position.clone(), tgt: controls.target.clone() };
  tween = null;
  if (h.focus) { fC.copy(h.focus.center); fS.copy(h.focus.size); }
  else { fBox.setFromObject(h.focusObj || h.group); fBox.getCenter(fC); fBox.getSize(fS); }
  const f = h.front || FRONT[h.key] || [0.7, 0, 0.7];
  const dir = h.front ? new THREE.Vector3(f[0], 0.45, f[2]).normalize() : new THREE.Vector3(f[0] + (f[2] ? 0.4 : 0), 0.45, f[2] + (f[0] ? 0.4 : 0)).normalize();
  const W = stage.clientWidth, H = stage.clientHeight, narrow = W <= 640;
  const sheetW = narrow ? 0 : sheet.offsetWidth + 16, sheetH = narrow ? sheet.offsetHeight + 12 : 0;
  const freeW = Math.max(160, W - sheetW), freeH = Math.max(160, H - sheetH);
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const across = h.front ? fS.x : f[0] ? fS.z : fS.x, depth = h.front ? fS.z : f[0] ? fS.x : fS.z;
  const dH = (fS.y / 2) / (tanV * (freeH / H));
  const dW = (across / 2) / (tanV * camera.aspect * (freeW / W));
  const d = Math.max(dH, dW) * 1.5 + depth / 2;
  const fwd = dir.clone().negate(), right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
  const visW = 2 * d * tanV * camera.aspect, visH = 2 * d * tanV;
  const tgt = fC.clone().addScaledVector(right, (sheetW / 2) / W * visW).addScaledVector(up, -(sheetH / 2) / H * visH);
  controls.minDistance = 1;
  labelsEl.hidden = true;
  animateCamera(tgt.clone().addScaledVector(dir, d), tgt, 0.9);
}
function unfocus() {
  if (!focusHome) return;
  const fh = focusHome; focusHome = null;
  animateCamera(fh.pos, fh.tgt, 0.8, () => { controls.minDistance = viewMinDist(); });
  if (!pMode && !deskOpen && !lvl) labelsEl.hidden = false;
}

/* ---------- Camera easing ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let tween = null;
function focusTo(point) {
  const t = point === TARGET ? TARGET.clone() : new THREE.Vector3(point.x * 0.45, Math.max(1.4, point.y * 0.55), point.z * 0.45);
  tween = { from: controls.target.clone(), to: t, t: 0 };
  if (reduce) { controls.target.copy(t); tween = null; }
}
document.getElementById("resetBtn").addEventListener("click", () => {
  if (worldOn) { CAM.yaw = 0; CAM.pitch = 0.36; CAM.dist = 3.8; return; }
  if (lvl || worldBusy) return;
  if (level === "library") { closeSheet(); camTween = null; focusHome = null; labelsEl.hidden = false; libHomeView(); return; }
  closeSheet();
  camTween = null; focusHome = null; controls.minDistance = 8; if (!pMode) labelsEl.hidden = false;
  const dy = level === "down" ? BY : 0;
  camera.position.copy(HOME).y += dy; controls.target.copy(TARGET).y += dy; fitDistance(); tween = null;
});

/* ---------- Resize ---------- */
function fitDistance() {
  const aspect = stage.clientWidth / stage.clientHeight;
  const dir = camera.position.clone().sub(controls.target).normalize();
  const dist = aspect < 0.8 ? 23 : aspect < 1.2 ? 19.8 : 18.2;
  camera.position.copy(controls.target).add(dir.multiplyScalar(dist));
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (cssRenderer) {
    cssRenderer.setSize(w, h);
    if (osFull) { osFrame.style.width = w + "px"; osFrame.style.height = h + "px"; } else placeOsFrame();
  }
}
window.addEventListener("resize", resize);
resize(); fitDistance();

/* ---------- Loop ---------- */
const v = new THREE.Vector3();
const clock = new THREE.Clock();
let rotorAngle = 0, rotorTarget = 0, rotorTimer = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  if (camTween) {
    const ct = camTween;
    ct.t = Math.min(1, ct.t + dt / ct.dur);
    const e = ct.t < 0.5 ? 4 * ct.t * ct.t * ct.t : 1 - Math.pow(-2 * ct.t + 2, 3) / 2;
    camera.position.lerpVectors(ct.fromPos, ct.toPos, e);
    controls.target.lerpVectors(ct.fromTgt, ct.toTgt, e);
    camera.lookAt(controls.target);
    if (ct.t >= 1) { camTween = null; ct.done && ct.done(); }
  } else if (!deskOpen && !worldOn) {
    if (tween) {
      tween.t = Math.min(1, tween.t + dt * 1.6);
      const e = 1 - Math.pow(1 - tween.t, 3);
      controls.target.lerpVectors(tween.from, tween.to, e);
      if (tween.t >= 1) tween = null;
    }
    controls.update();
  }

  updateLevel(dt);
  updateClocks();
  updateDoor(dt);
  if (worldOn) updateWorld(dt, time);
  if (basement.visible && !reduce) updateSfc(dt, time);
  if (chem.visible) updateLc(dt, time);
  if (library.visible) updateLibrary(dt, time);
  if (lab.visible) {
    if (!reduce) {
      leds.forEach((l, i) => { l.visible = i % 3 !== 1 || Math.sin(time * 3 + i) > -0.3; });
      updateDistill(dt, time);
      updateBot(dt, time);
      rotorTimer += dt;
      if (rotorTimer > 1.6) { rotorTimer = 0; rotorTarget -= Math.PI * 2 / 16; }
      rotorAngle += (rotorTarget - rotorAngle) * Math.min(1, dt * 6);
      rotor.rotation.y = rotorAngle;
      const pulse = 0.75 + 0.25 * Math.sin(time * 2.2);
      furnaceMat.color.setRGB(1, 0.42 * pulse + 0.1, 0.12 * pulse);
    }
    furnaceGlow.intensity = night ? 0.8 : 0.0;
  }

  if (!lab.visible || reduce) botTip.classList.remove("on");
  if (!reduce && !osFull && !worldOn) updateBg(time);
  if (P) {
    const u = P.uniforms;
    const cur = u.uMix.value;
    const step = reduce ? 1 : dt / 2.4;
    u.uMix.value = pTarget > cur ? Math.min(pTarget, cur + step) : Math.max(pTarget, cur - step);
    u.uTime.value = time;
    ray.setFromCamera(pointerNDC, camera);
    u.uRayO.value.copy(ray.ray.origin); u.uRayD.value.copy(ray.ray.direction);
    u.uRepel.value += ((pointerIn && pMode ? 1 : 0) - u.uRepel.value) * Math.min(1, dt * 5);
    if (!pMode && u.uMix.value <= 0 && P.points.visible) { P.points.visible = false; lab.visible = true; }
  }

  if (liveCam && sfcAppOpen && !camTween) updateLiveCam(dt);
  if (lcLive && lcAppOpen && !camTween) updateLcLiveCam(dt);
  if (!osFull) { renderer.render(scene, camera); if (cssRenderer) cssRenderer.render(cssScene, camera); }

  if (!pMode) {
    const w = stage.clientWidth, h = stage.clientHeight;
    // tags that slide under the intro panel or the toolbar fade out instead of overlapping them
    const cover = [tagEl, toolsEl].filter(el => getComputedStyle(el).opacity > 0.5).map(el => el.getBoundingClientRect());
    hotspots.forEach(hs => {
      v.copy(hs.anchor).project(camera);
      const lx = (v.x * 0.5 + 0.5) * w, ly = (-v.y * 0.5 + 0.5) * h;
      hs.el.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -50%)`;
      hs.el.classList.toggle("tucked", cover.some(r => lx > r.left - 50 && lx < r.right + 50 && ly > r.top - 14 && ly < r.bottom + 14));
      hs.el.hidden = v.z > 1 || hs.level !== level;
    });
  }
  requestAnimationFrame(frame);
}
if (location.hash === "#desktop") {
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  const homePos = camera.position.clone(), homeTgt = controls.target.clone();
  const sb = new THREE.Box3().setFromObject(screenMesh), sc = new THREE.Vector3(), ss = new THREE.Vector3();
  sb.getCenter(sc); sb.getSize(ss);
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(sc.x, sc.y, sc.z + Math.max((ss.y / 2) / tv, (ss.x / 2) / tv / camera.aspect) * 1.02);
  controls.target.copy(sc); camera.lookAt(sc);
  controls.enabled = false; labelsEl.hidden = true; hint.hidden = true;
  setTimeout(() => animateCamera(homePos, homeTgt, 1.5, () => { controls.enabled = true; labelsEl.hidden = false; hint.hidden = false; }), reduce ? 0 : 450);
}
frame();
