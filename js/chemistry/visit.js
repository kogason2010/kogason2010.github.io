/* js/chemistry/visit.js — The NCA building's LC lab as a place on the campus: drive the robot through NCA's doors to arrive;
   the lab's Exit door takes you back outside beside the building.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const HINT_CHEM = "Drag to look around · scroll or pinch to zoom · tap the LC workstation to run a sample";
function buildChem() {
  if (chemBuilt) return;
  chemBuilt = true;
  const before = hotspots.length;
  buildChemRoom(); buildChemInstruments(); setupLcLive();
  // fewer draw calls: merge static meshes inside each clickable group, then the rest of the room
  const keep = new Set([FX_CHEM.carriage, FX_CHEM.fArm, FX_CHEM.plume, FX_CHEM.ripple, FX_CHEM.doorPivot, FX_CHEM.lcScreenMesh, FX_CHEM.clock]);
  const chemHot = hotspots.slice(before);
  chemHot.forEach(h => mergeStatic(h.group, keep));
  mergeStatic(chem, new Set([...keep, ...chemHot.map(h => h.group)]));
  chemHot.forEach(addHotButton);
}
PLACES.chem = {
  group: chem, build: buildChem, spawn: CHEM_SPAWN, door: CHEM_DOOR, hint: HINT_CHEM, eyebrow: "Portfolio · NCA · LC lab",
  enter() { camera.position.copy(HOME); controls.target.copy(TARGET); camera.lookAt(TARGET); controls.minDistance = 8; },
  leave(done) { lcAbort(); FX_CHEM.doorGoal = 1; animateCamera(DOOR_POSE.pos.clone(), DOOR_POSE.tgt.clone(), 1.5, done); },
  exit() { FX_CHEM.doorGoal = 0; FX_CHEM.doorOpen = 0; if (FX_CHEM.doorPivot) FX_CHEM.doorPivot.rotation.y = 0; },
};
