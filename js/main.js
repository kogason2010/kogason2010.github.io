/* js/main.js — Camera focus and easing, window resize, the main animation loop, and start-up.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Focus camera: clicked item becomes the centre of the view ---------- */
let focusHome = null;
const viewMinDist = () => (PLACES[level] && PLACES[level].minD) || 8;
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
  if (PLACES[level] && PLACES[level].home) { closeSheet(); camTween = null; focusHome = null; labelsEl.hidden = false; PLACES[level].home(); return; }
  closeSheet();
  camTween = null; focusHome = null; controls.minDistance = 8; if (!pMode) labelsEl.hidden = false;
  const dy = level === "down" ? BY : 0;
  camera.position.copy(HOME).y += dy; controls.target.copy(TARGET).y += dy; fitDistance(); tween = null;
});

/* ---------- Resize ---------- */
function fitDistance() {
  const aspect = stage.clientWidth / stage.clientHeight;
  const dir = camera.position.clone().sub(controls.target).normalize();
  const dist = aspect < 0.6 ? 27 : aspect < 0.8 ? 24 : aspect < 1.2 ? 19.8 : 18.2;   // tall phones step back so the room fits across
  camera.position.copy(controls.target).add(dir.multiplyScalar(dist));
}
// where to aim and how far back to stand so a room's box sits whole in the view from direction dir, clear of the toolbar
// and the intro panel at the top and the hint at the bottom (pad: free pixels to keep on each side)
function fitBoxView(box, dir, pad) {
  const W = stage.clientWidth, H = stage.clientHeight, cam = camera.clone();
  cam.aspect = W / H; cam.updateProjectionMatrix();
  const P = Object.assign({ top: 84, bottom: 64, side: 20 }, pad);
  const lo = [-1 + 2 * P.side / W, -1 + 2 * P.bottom / H], hi = [1 - 2 * P.side / W, 1 - 2 * P.top / H];
  const tgt = box.getCenter(new THREE.Vector3()), q = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  let dist = box.getSize(q).length() * 1.6;
  for (let it = 0; it < 6; it++) {
    cam.position.copy(tgt).addScaledVector(dir, dist); cam.lookAt(tgt); cam.updateMatrixWorld();
    const e = [9, 9, -9, -9];
    for (let i = 0; i < 8; i++) {
      q.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
      e[0] = Math.min(e[0], q.x); e[1] = Math.min(e[1], q.y); e[2] = Math.max(e[2], q.x); e[3] = Math.max(e[3], q.y);
    }
    // re-centre in the free area, then step in or out until the wider of the two spans just fits
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), visH = 2 * dist * tanV, visW = visH * cam.aspect;
    right.setFromMatrixColumn(cam.matrixWorld, 0); up.setFromMatrixColumn(cam.matrixWorld, 1);
    tgt.addScaledVector(right, ((e[0] + e[2]) - (lo[0] + hi[0])) / 4 * visW).addScaledVector(up, ((e[1] + e[3]) - (lo[1] + hi[1])) / 4 * visH);
    dist *= Math.max((e[2] - e[0]) / (hi[0] - lo[0]), (e[3] - e[1]) / (hi[1] - lo[1]));
  }
  return { tgt, dist };
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
let darkScene = false;
// the browser's own bar (on phones) takes the colour of the page behind the room: pale by day, night blue in dark scenes
const themeMeta = document.querySelector('meta[name="theme-color"]');
function paintThemeColor() { if (themeMeta) themeMeta.content = darkScene ? "#0c1320" : getComputedStyle(document.body).getPropertyValue("--bg").trim() || "#e9eef2"; }
paintThemeColor();
const v = new THREE.Vector3();
// tags that never shrink to a dot when the room is crowded: the workstations the hints tell you to tap, and the projects monitor
const TAG_FIRST = new Set(["desktop", "icpc", "sfcpc", "lcpc"]);
const clock = new THREE.Clock();
let rotorAngle = 0, rotorTarget = 0, rotorTimer = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  watchPerformance();
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
  if (chem.visible) { updateLc(dt, time); updateAssembly(dt, time); }
  if (library.visible) updateLibrary(dt, time);
  if (mathRoom.visible) updateMath(dt, time);
  if (lab.visible) {
    if (!labMerged && nav) mergeLab();
    if (!reduce) {
      leds.forEach((l, i) => { l.visible = i % 3 !== 1 || Math.sin(time * 3 + i) > -0.3; });
      updateDistill(dt, time);
      updateBot(dt, time);
      // the TOC's autosampler carousel steps one vial (of 24) at a time
      rotorTimer += dt;
      if (rotorTimer > 4) { rotorTimer = 0; rotorTarget -= Math.PI * 2 / 24; }
      rotorAngle += (rotorTarget - rotorAngle) * Math.min(1, dt * 4);
      rotor.rotation.y = rotorAngle;
      // a furnace window, if the TOC model has one (furnaceMat), glows and pulses
      if (typeof furnaceMat !== "undefined") { const pulse = 0.75 + 0.25 * Math.sin(time * 2.2); furnaceMat.color.setRGB(1, 0.42 * pulse + 0.1, 0.12 * pulse); }
    }
    furnaceGlow.intensity = night && typeof furnaceMat !== "undefined" ? 0.8 : 0.0;
  }

  // dark scenes (lights off anywhere, the mathematics hall, orbit) get the night backdrop and dark panels (css/style.css)
  const dk = night || level === "math" || spaceOn;
  if (dk !== darkScene) { darkScene = dk; document.body.classList.toggle("dark-scene", dk); paintThemeColor(); }
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
    if (!pMode && u.uMix.value <= 0 && P.points.visible) { P.points.visible = false; lab.visible = true; if (osFrame && level === "up") osFrame.style.visibility = ""; }
  }

  if (liveCam && sfcAppOpen && !camTween) updateLiveCam(dt);
  if (lcLive && lcAppOpen && !camTween) updateLcLiveCam(dt);
  // indoors, keep the near clipping plane as far out as the view allows: depth is far more precise that way, so parts a
  // millimetre apart don't flicker when you orbit from across the room (close-ups, like a monitor, bring it back in)
  if (!worldOn && !spaceOn) {
    const want = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * 0.04, 0.05, 0.6);
    if (Math.abs(want - camera.near) > 0.005) { camera.near = want; camera.updateProjectionMatrix(); }
  }
  if (!osFull) { renderer.render(scene, camera); if (cssRenderer && lab.visible && !worldOn) cssRenderer.render(cssScene, camera); }   // (the live desktop is only on screen in the lab)

  if (!pMode && !labelsEl.hidden && !worldOn) {   // (nothing to lay out while the tags are hidden: outside, zoomed in, moving)
    const w = stage.clientWidth, h = stage.clientHeight;
    // tags that slide under the intro panel or the toolbar fade out instead of overlapping them
    const cover = [tagEl, toolsEl].filter(el => getComputedStyle(el).opacity > 0.5).map(el => el.getBoundingClientRect());
    const placed = [];
    hotspots.forEach(hs => {
      v.copy(hs.anchor).project(camera);
      const off = v.z > 1 || hs.level !== level;
      if (off !== hs._off) { hs._off = off; hs.el.hidden = off; }
      if (off) return;
      // keep the whole tag on screen (narrow phones clipped the ones near the edges)
      if (!hs._w && !labelsEl.hidden) { const ow = hs.el.offsetWidth; if (ow) { hs._w = ow / 2; hs._h = hs.el.offsetHeight || 26; } }   // measured once, the first time it shows
      const hw = hs._w || 0;
      const ax = (v.x * 0.5 + 0.5) * w;
      placed.push({ hs, hw, hh: hs._h || 26, ax, lx: Math.min(w - hw - 6, Math.max(hw + 6, ax)), ly: (-v.y * 0.5 + 0.5) * h });
    });
    // tags that would land on top of each other slide down out of the way, top to bottom; one that would have to slide
    // far from its thing (a crowded bench) shrinks to its glowing dot right where the thing is instead. The name shows
    // again on hover or focus, or once you zoom in and there's room (a dot needs a little more room to grow back, so tags
    // don't flicker as the camera moves)
    placed.sort((a, b) => (TAG_FIRST.has(b.hs.key) - TAG_FIRST.has(a.hs.key)) || a.ly - b.ly);   // the ones the hints point to always keep their names
    const kept = [], clash = p => kept.find(q => Math.abs(q.lx - p.lx) < q.hw + p.hw + 4 && Math.abs(q.ly - p.ly) < (q.hh + p.hh) / 2 + 3);
    placed.forEach(p => {
      const y0 = p.ly, room = p.hs._dot ? 18 : 34;
      let hit;
      for (let pass = 0; pass < 3 && (hit = clash(p)); pass++) p.ly = hit.ly + (hit.hh + p.hh) / 2 + 4;
      const dot = !!hit || p.ly - y0 > room;
      if (dot !== !!p.hs._dot) { p.hs._dot = dot; p.hs.el.classList.toggle("dot", dot); }
      let under = false;
      if (dot) {
        p.ly = y0; p.hw = 10; p.hh = 20; p.lx = Math.min(w - 16, Math.max(16, p.ax));
        // a dot that lands on a name steps to the nearest free spot just beside it; with no room anywhere, it waits out of sight
        const q = clash(p);
        if (q) {
          const x0 = p.lx, spots = [[x0, q.ly - q.hh / 2 - 12], [x0, q.ly + q.hh / 2 + 12], [q.lx - q.hw - 16, q.ly], [q.lx + q.hw + 16, q.ly]]
            .filter(s => s[0] > 12 && s[0] < w - 12).sort((a, b) => Math.hypot(a[0] - x0, a[1] - y0) - Math.hypot(b[0] - x0, b[1] - y0));
          const free = spots.find(s => { p.lx = s[0]; p.ly = s[1]; return !clash(p); });
          if (!free) { p.lx = x0; p.ly = y0; under = true; }
        }
      }
      if (!under) kept.push(p);
      // (only touch the page when something changed: restyling every tag every frame costs the browser time)
      const tf = `translate(${Math.round(p.lx)}px, ${Math.round(p.ly)}px) translate(-50%, -50%)`;
      if (tf !== p.hs._tf) { p.hs._tf = tf; p.hs.el.style.transform = tf; }
      const tuck = under || cover.some(r => p.lx > r.left - 50 && p.lx < r.right + 50 && p.ly > r.top - 14 && p.ly < r.bottom + 14);
      if (tuck !== p.hs._tuck) { p.hs._tuck = tuck; p.hs.el.classList.toggle("tucked", tuck); }
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
