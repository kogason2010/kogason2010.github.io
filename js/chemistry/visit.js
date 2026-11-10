/* js/chemistry/visit.js — The NCA building's LC lab as a place on the campus: drive the robot through NCA's doors to arrive;
   the lab's Exit door takes you back outside beside the building.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const HINT_CHEM = "Drag to look around · scroll or pinch to zoom · tap the LC workstation to run a sample";
function buildChem() {
  if (chemBuilt) return;
  chemBuilt = true;
  const before = hotspots.length;
  buildChemRoom(); buildChemInstruments(); buildAssembly(); setupLcLive();
  // fewer draw calls: merge static meshes inside each clickable group, then the rest of the room
  const keep = new Set([FX_CHEM.carriage, FX_CHEM.fArm, FX_CHEM.plume, FX_CHEM.ripple, FX_CHEM.doorPivot, FX_CHEM.lcScreenMesh, FX_CHEM.clock, ASM.dyn, ASM.belt]);
  const chemHot = hotspots.slice(before);
  chemHot.forEach(h => mergeStatic(h.group, keep));
  mergeStatic(chem, new Set([...keep, ...chemHot.map(h => h.group)]));
  chemHot.forEach(addHotButton);
}
// the hall is about twice the Kogason lab's width, so the view stands further back and aims at its middle
const CHEM_TGT = new THREE.Vector3(5.2, 1.3, 1.4);
// on wider screens the whole hall is in view, centred in the space the toolbar, intro panel and hint leave free. A phone
// held upright can't fit its length at a useful size, so there the view stands well back and leans toward the robot line,
// keeping the LC benches on screen
const CHEM_BOX = new THREE.Box3(new THREE.Vector3(ROOM0 - 0.3, -0.3, ROOM0 - 0.3), new THREE.Vector3(CHR.x1, 4.9, CHR.z1));
function chemHomeView() {
  const a = stage.clientWidth / Math.max(1, stage.clientHeight), dir = HOME.clone().sub(TARGET).normalize();
  const f = a < 0.8 ? { tgt: CHEM_TGT.clone().setX(7.4), dist: a < 0.6 ? 44 : 38 } : fitBoxView(CHEM_BOX, dir);
  controls.target.copy(f.tgt); camera.position.copy(f.tgt).addScaledVector(dir, Math.min(f.dist, 46)); camera.lookAt(f.tgt); controls.minDistance = 8;
}
PLACES.chem = {
  title: "NCA", building: "Setting up the LC lab", built: () => chemBuilt,
  group: chem, build: buildChem, home: chemHomeView, minD: 8, spawn: CHEM_SPAWN, door: CHEM_DOOR, hint: HINT_CHEM, eyebrow: "Portfolio · NCA · LC lab",
  enter() {
    controls.maxDistance = 46; chemHomeView();
    // light and shadow the whole hall, not just the Kogason-sized corner
    sun.position.set(CHEM_TGT.x + 7, 14, CHEM_TGT.z + 8); sun.target.position.copy(CHEM_TGT).setY(0);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 45 }); sun.shadow.camera.updateProjectionMatrix();
  },
  leave(done) { lcAbort(); FX_CHEM.doorGoal = 1; animateCamera(DOOR_POSE.pos.clone(), DOOR_POSE.tgt.clone(), 1.5, done); },
  exit() { controls.maxDistance = 28; FX_CHEM.doorGoal = 0; FX_CHEM.doorOpen = 0; if (FX_CHEM.doorPivot) FX_CHEM.doorPivot.rotation.y = 0; },
};
