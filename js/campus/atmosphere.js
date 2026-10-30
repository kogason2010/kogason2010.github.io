/* js/campus/atmosphere.js — Day/night lighting outside, per-frame effects (wind, water, fountain, wildlife), tree culling and adaptive resolution.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// light the campus for day or night
const LAB_HEMI = { sky: hemi.color.clone(), ground: hemi.groundColor.clone() };
function applyWorldNight(nightOn) {
  FX.night = nightOn;
  const su = FX.sky.material.uniforms;
  su.sunPosition.value.setFromSphericalCoords(1, THREE.MathUtils.degToRad(nightOn ? 95 : 56), THREE.MathUtils.degToRad(118));
  su.rayleigh.value = nightOn ? 0.6 : 1.35; su.turbidity.value = nightOn ? 2 : 5.5;
  scene.environment = nightOn ? FX.envNight : FX.envDay;
  scene.fog.color.setHex(nightOn ? 0x18264a : 0xc9dbe8); scene.fog.density = nightOn ? 0.0075 : 0.0052;
  renderer.toneMappingExposure = nightOn ? 0.9 : 0.56;
  hemi.color.setHex(nightOn ? 0x34456e : 0xd6e6ff); hemi.groundColor.setHex(nightOn ? 0x141a22 : 0x5b6a3c); hemi.intensity = nightOn ? 0.3 : 0.42;
  sun.color.setHex(nightOn ? 0x7d93c9 : 0xfff0da); sun.intensity = nightOn ? 0.25 : 2.0; fill.intensity = 0;
  FX.stars.visible = FX.nightDome.visible = FX.moon.visible = nightOn; FX.sky.visible = !nightOn; FX.fireflies.visible = nightOn; FX.motes.visible = !nightOn; FX.lampGlow.visible = nightOn; FX.lampPools.visible = nightOn;
  FX.lampLens.emissive.setHex(nightOn ? 0xffd9a0 : 0x000000);
  FX.clouds.forEach(c => { c.material.color.setHex(nightOn ? 0x34426a : 0xffffff); c.material.opacity = nightOn ? 0.4 : 0.85; });
  FX.windowMats.forEach(m => { if (m.emissiveMap) { m.emissive.setHex(nightOn ? 0xffffff : 0x000000); m.emissiveIntensity = nightOn ? 0.9 : 0; } else m.emissive.setHex(nightOn ? 0x6b5434 : 0x000000); });
  FX.carLights.forEach(m => m.color.setHex(nightOn ? 0xfff2cc : 0x8a8f8f));
  FX.carLamps[0].emissive.setHex(nightOn ? 0x888070 : 0x000000);
  headlight.intensity = nightOn ? 2.4 : 0;
  mmEl.style.filter = nightOn ? "brightness(0.62) saturate(0.85)" : "";   // the minimap dims with the campus at night
  if (FX.pond) FX.pond.material.uniforms.sunDirection.value.copy(nightOn ? MOON_DIR : SUN_DIR);
  fountainNight(nightOn); horizonNight(nightOn);
}
function restoreLabLighting() {
  hemi.color.copy(LAB_HEMI.sky); hemi.groundColor.copy(LAB_HEMI.ground); scene.environment = null; renderer.toneMappingExposure = 0.95; setNight(night);
}
// per-frame campus effects
const _frustum = new THREE.Frustum(), _pv = new THREE.Matrix4();
const SHADOW_R = 20;
function cullTrees() {
  camera.updateMatrixWorld(); _pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _frustum.setFromProjectionMatrix(_pv);
  FX.chunks.forEach(ch => {
    const inView = _frustum.intersectsSphere(ch.sphere), caster = !ch.far && Math.hypot(ch.sphere.center.x - DRV.x, ch.sphere.center.z - DRV.z) < SHADOW_R + ch.sphere.radius;
    ch.meshes.forEach(m => { m.visible = inView || caster; m.castShadow = caster; });
  });
}
// keep the frame rate up: lower the render resolution when frames run long, raise it again when there's headroom
const DPR_MAX = Math.min(window.devicePixelRatio || 1, LIGHT ? 1 : 1.5), PERF = { t: 0, n: 0, sum: 0, good: 0, last: 0 };
function adaptResolution() {
  const now = performance.now(), ms = PERF.last ? now - PERF.last : 16; PERF.last = now;
  if (ms > 250) return;   // tab was hidden or paused
  PERF.sum += ms; PERF.n++;
  if (PERF.n < 45) return;
  const avg = PERF.sum / PERF.n, pr = renderer.getPixelRatio(); PERF.sum = PERF.n = 0;
  if (avg > 24 && pr > 0.7) { renderer.setPixelRatio(Math.max(0.7, pr - 0.2)); PERF.good = 0; }
  else if (avg < 17.5 && pr < DPR_MAX) { if (++PERF.good >= 3) { renderer.setPixelRatio(Math.min(DPR_MAX, pr + 0.1)); PERF.good = 0; } }
  else PERF.good = 0;
}
function updateWorldFx(dt, time) {
  cullTrees(); adaptResolution();
  FX.wind.value = time;
  FX.sunV.value.copy(FX.night ? MOON_DIR : SUN_DIR).transformDirection(camera.matrixWorldInverse); FX.sunCol.value.setRGB(...(FX.night ? [0.03, 0.04, 0.07] : [0.95, 0.85, 0.55]));
  FX.grassU.uCenter.value.set(DRV.x, DRV.z); FX.grassU.uPush.value.set(DRV.x, DRV.z, (0.42 + 0.9 * Math.min(DRV.y, 1)) * Math.max(0, 1 - DRV.y / 3.5));   // hovering low flattens a wider patch (downwash)
  if (FX.pond) FX.pond.material.uniforms.time.value += dt * 0.45;
  updateFountain(dt, time); updateCampusBots(dt);
  FX.dna.rotation.y += dt * 0.25;
  FX.clouds.forEach((c, i) => { c.position.x += dt * (1.2 + (i % 3) * 0.4); if (c.position.x > 480) c.position.x = -480; });
  FX.birds.forEach(g => { const u = g.userData, a = time * u.sp + u.ph; g.position.set(u.cx + Math.cos(a) * u.r, u.y + Math.sin(a * 2.3) * 1.5, u.cz + Math.sin(a) * u.r); g.rotation.y = -a; const f = Math.sin(time * 9 + u.ph) * 0.6; u.l.rotation.z = f; u.rw.rotation.z = -f; });
  FX.butterflies.forEach(g => { const u = g.userData, t = time * u.sp + u.ph; g.position.set(u.cx + Math.sin(t * 1.3) * 1.6, 0.75 + Math.sin(t * 3.1) * 0.25, u.cz + Math.cos(t * 0.9) * 1.6); g.rotation.y = t * 1.3; const f = Math.sin(time * 18 + u.ph) * 1.0; u.a.rotation.y = f; u.b.rotation.y = -f; });
  if (FX.motes.visible) { const mp = FX.motes.geometry.attributes.position, b = FX.motes.userData.base; for (let i = 0; i < mp.count; i++) { const bx = b[i * 3], by = b[i * 3 + 1], bz = b[i * 3 + 2]; mp.setXYZ(i, DRV.x - 15 + ((bx + time * 0.25 - DRV.x + 15) % 30 + 30) % 30, 0.3 + (by + Math.sin(time * 0.5 + i) * 0.3), DRV.z - 15 + ((bz - DRV.z + 15) % 30 + 30) % 30); } mp.needsUpdate = true; }
  if (FX.fireflies.visible) { const fp = FX.fireflies.geometry.attributes.position, fc = FX.fireflies.geometry.attributes.color; FX.flySeeds.forEach(([x, y, z, ph], i) => { fp.setXYZ(i, x + Math.sin(time * 0.4 + ph) * 1.2, y + Math.sin(time * 0.7 + ph * 2) * 0.3, z + Math.cos(time * 0.35 + ph) * 1.2); const b = Math.max(0, Math.sin(time * 1.6 + ph * 3)) ** 3; fc.setXYZ(i, 0.9 * b, 1.0 * b, 0.45 * b); }); fp.needsUpdate = fc.needsUpdate = true; }
}
