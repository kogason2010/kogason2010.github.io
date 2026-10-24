/* js/math/visit.js — The Mathematics building as a place on the campus: drive through its doors (or use Go to) to arrive in
   the hall; the camera orbits the lattice in the middle, and the Exit door leads back outside.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const MATH_VIEW = { pos: new THREE.Vector3(5.5, 6.6, 11.0), tgt: new THREE.Vector3(0, 2.8, -2.5), minD: 3, maxD: 17 };
let mathSaved = null;
function buildMath() {
  if (mathBuilt) return;
  mathBuilt = true;
  const before = hotspots.length;
  buildMathRoom();
  const hot = hotspots.slice(before);
  const keep = new Set([MFX.lattice, MFX.fluxRig, MFX.hopf]);
  hot.forEach(h => mergeStatic(h.group, keep));
  mergeStatic(mathRoom, new Set([...keep, ...hot.map(h => h.group)]));
  hot.forEach(addHotButton);
  mathLatticeColors();
}
// the camera stays inside the hall
function mathClampCamera() {
  const p = camera.position;
  p.x = Math.max(-MR.X + 0.8, Math.min(MR.X - 0.8, p.x)); p.z = Math.max(-MR.Z + 0.8, Math.min(MR.Z - 0.8, p.z)); p.y = Math.max(0.8, Math.min(MR.H - 0.5, p.y));
}
function mathHomeView() {
  const a = libAspect(), pos = a < 0.8 ? new THREE.Vector3(3, 8.2, 11.2) : MATH_VIEW.pos;
  camera.fov = libFov(); camera.updateProjectionMatrix();
  camera.position.copy(pos); controls.target.copy(MATH_VIEW.tgt); camera.lookAt(MATH_VIEW.tgt); controls.minDistance = MATH_VIEW.minD;
  mathClampCamera();
}
// live readouts in the lattice panel, when it's open
function mathLatticeReadout() {
  const el = document.getElementById("latPlaq"); if (!el) return;
  el.textContent = LAT.plaq.toFixed(3); document.getElementById("latSweeps").textContent = LAT.sweeps;
  document.getElementById("latAcc").textContent = LAT.acc ? Math.round(LAT.acc * 100) + "%" : "–";
}
sheetBody.addEventListener("input", e => {
  if (e.target.id !== "latBeta") return;
  LAT.beta = parseFloat(e.target.value); document.getElementById("latBetaV").textContent = LAT.beta.toFixed(1);
});
sheetBody.addEventListener("click", e => { if (e.target.closest("[data-lat=hot]")) { latRandomize(); mathLatticeColors(); mathLatticeReadout(); } });

PLACES.math = {
  group: mathRoom, build: buildMath, home: mathHomeView, minD: MATH_VIEW.minD, spawn: MATH_SPAWN, door: MATH_DOOR, eyebrow: "Portfolio · mathematics · Yang–Mills",
  hint: "Drag to look around · scroll or pinch to zoom · tap the lattice, the blackboard or the exhibits",
  enter() {
    mathSaved = { minA: controls.minAzimuthAngle, maxA: controls.maxAzimuthAngle, minP: controls.minPolarAngle, maxP: controls.maxPolarAngle, maxD: controls.maxDistance };
    Object.assign(controls, { minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, minPolarAngle: 0.25, maxPolarAngle: 1.5, maxDistance: MATH_VIEW.maxD });
    camera.far = 120; bgGroup.visible = false;
    sun.position.set(2, 26, 6); sun.target.position.set(0, 0, 0);
    Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 8, far: 45 }); sun.shadow.camera.updateProjectionMatrix();
    hemi.color.setHex(0xc8d4ff); hemi.groundColor.setHex(0x3a2a20);
    mathHomeView();
  },
  leave(done) { animateCamera(new THREE.Vector3(MR.X - 4.5, 2.6, 8.0), new THREE.Vector3(MR.X + 2, 2.2, 8.0), 1.4, done); },
  exit() {
    if (mathSaved) Object.assign(controls, { minAzimuthAngle: mathSaved.minA, maxAzimuthAngle: mathSaved.maxA, minPolarAngle: mathSaved.minP, maxPolarAngle: mathSaved.maxP, maxDistance: mathSaved.maxD });
    controls.minDistance = 8; bgGroup.visible = true;
  },
};
