/* js/library/visit.js — The library as a place on the campus: drive through its doors to arrive in the reading room.
   Inside, the camera orbits the room's centre (look all the way round, zoom in toward an alcove, or out for the whole
   room); warm light comes down through the oculus and from the desk lamps. The bronze doors lead back out.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const LIB_VIEW = { pos: new THREE.Vector3(0, 8.2, -12.2), tgt: new THREE.Vector3(0, 2.6, 1.5), minD: 3.5, maxD: 21 };
// narrow screens get a wider field of view (about 80° across where it fits) and a higher, further starting view
const libAspect = () => stage.clientWidth / Math.max(1, stage.clientHeight);
const libFov = () => Math.min(78, Math.max(55, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(40)) / libAspect()))));
// the camera stays inside the room: within the ring of columns, and under the dome
const LIB_CAM_R = 12.4;
function libClampCamera(p = camera.position) {
  const r = Math.hypot(p.x, p.z);
  if (r > LIB_CAM_R) { p.x *= LIB_CAM_R / r; p.z *= LIB_CAM_R / r; }
  const Rv = LIB.R / Math.cos(Math.PI / 8), rr = Math.min(Math.hypot(p.x, p.z), Rv - 0.5);
  const top = LIB.H + 0.5 + 0.62 * Math.sqrt(Rv * Rv - rr * rr) - 1.2;
  if (p.y > top) p.y = top;
  if (p.y < 0.8) p.y = 0.8;
}
let libSaved = null;
function buildLibrary() {
  if (libraryBuilt) return;
  libraryBuilt = true;
  const before = hotspots.length;
  buildLibraryRoom();
  const libHot = hotspots.slice(before);
  const keep = new Set([LIBFX.oculus, LIBFX.clock]);
  libHot.forEach(h => mergeStatic(h.group, keep));
  mergeStatic(library, new Set([...keep, ...libHot.map(h => h.group)]));
  libHot.forEach(addHotButton);
}
function libHomeView() {
  const a = libAspect(), pos = a < 0.8 ? new THREE.Vector3(0, 15.5, -11.6) : a < 1.25 ? new THREE.Vector3(0, 11.5, -12.2) : LIB_VIEW.pos;
  camera.fov = libFov(); camera.updateProjectionMatrix();
  camera.position.copy(pos); controls.target.copy(LIB_VIEW.tgt); camera.lookAt(LIB_VIEW.tgt); controls.minDistance = LIB_VIEW.minD;
  libClampCamera();
}
PLACES.library = {
  group: library, build: buildLibrary, home: libHomeView, clampCam: libClampCamera, minD: LIB_VIEW.minD, spawn: LIB_SPAWN, door: LIB_DOOR, eyebrow: "Portfolio · library · app notes",
  hint: "Drag to look around · scroll or pinch to zoom · tap an alcove or the central desk to browse app notes",
  enter() {
    libSaved = { minA: controls.minAzimuthAngle, maxA: controls.maxAzimuthAngle, minP: controls.minPolarAngle, maxP: controls.maxPolarAngle, maxD: controls.maxDistance };
    Object.assign(controls, { minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, minPolarAngle: 0.3, maxPolarAngle: 1.52, maxDistance: LIB_VIEW.maxD });
    camera.fov = libFov(); camera.far = 200; camera.updateProjectionMatrix();
    bgGroup.visible = false;
    sun.position.set(3, 40, 5); sun.target.position.set(0, 0, 0);
    Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 10, far: 60 }); sun.shadow.camera.updateProjectionMatrix();
    hemi.color.setHex(0xfff1dc); hemi.groundColor.setHex(0x8a6a4a);
    libHomeView();
  },
  leave(done) { closeReader(); animateCamera(new THREE.Vector3(0, 3.2, -6), new THREE.Vector3(0, 2.4, -16), 1.4, done); },
  exit() {
    if (libSaved) Object.assign(controls, { minAzimuthAngle: libSaved.minA, maxAzimuthAngle: libSaved.maxA, minPolarAngle: libSaved.minP, maxPolarAngle: libSaved.maxP, maxDistance: libSaved.maxD });
    controls.minDistance = 8; bgGroup.visible = true;
  },
};
// while inside: light levels follow the Lights switch, desk lamps glow brighter at night; the view follows the window size
function updateLibrary(dt, time) {
  hemi.intensity = night ? 0.32 : 0.82; sun.intensity = night ? 0.12 : 0.95; fill.intensity = night ? 0.05 : 0.2;
  if (LIBFX.lamps) LIBFX.lamps.emissiveIntensity = night ? 1.6 : 0.4;
  const f = libFov(); if (Math.abs(camera.fov - f) > 0.1) { camera.fov = f; camera.updateProjectionMatrix(); }
  libClampCamera();
}
