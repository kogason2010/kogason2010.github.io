/* instruments/nca-robot-arm/model.js — One of the four assembly-line robot arms, with its pedestal and feeder lift.
   buildArmRobot builds it (moving joints go in dyn); solveArm poses it with two-link inverse kinematics so the gripper
   reaches r.tip. js/chemistry/assembly.js drives four of them.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     armMesh, buildArmRobot, solveArm (js/chemistry/assembly.js) */
"use strict";

/* ---------- robot arms ---------- */
const ARM = { L1: 1.0, L2: 0.92, LG: 0.26, PED: 0.9, SH: 0.3, OFF: 0.1 };
const armWhite = 0xf1f3f2, armBlue = 0x2f6fb5, armDark = 0x2b3238;
const armMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.15 });   // the same finish as the modules
function armMesh(build) { const parts = []; build((w, h, d, x, y, z, c) => modPart(parts, w, h, d, x, y, z, c), (r, h, x, y, z, c, rx) => { const g = new THREE.CylinderGeometry(r, r, h, 20); if (rx) g.rotateX(Math.PI / 2); g.translate(x, y, z); paint(g, (a, b, d, col) => col.setHex(c)); parts.push(g); }); const m = new THREE.Mesh(mergeGeos(parts), armMat); m.castShadow = true; return m; }
function buildArmRobot(x, z, picks, dyn) {
  const r = { x, z, picks, step: 0, t: 0, busy: false, carry: null, grip: 0, tip: new THREE.Vector3(x, 2.2, z + 0.6), home: new THREE.Vector3(x - 0.15, 2.25, z + 0.35) };
  r.tip.copy(r.home);
  // pedestal and base are static; the rest is a chain of joints
  box(0.56, ARM.PED, 0.56, armDark, x, ARM.PED / 2, z, chem, { roughness: 0.5 });
  box(0.6, 0.03, 0.6, C.yellow, x, ARM.PED + 0.015, z, chem, { roughness: 0.5 });
  const turret = new THREE.Group(); turret.position.set(x, ARM.PED + 0.03, z); dyn.add(turret); r.turret = turret;
  turret.add(armMesh((b, cy) => { cy(0.22, 0.12, 0, 0.06, 0, armWhite); cy(0.17, 0.16, 0, 0.2, 0, armWhite); cy(0.18, 0.03, 0, 0.13, 0, armBlue); b(0.2, 0.16, 0.26, ARM.OFF, ARM.SH - 0.02, 0, armWhite); }));
  const shoulder = new THREE.Group(); shoulder.position.set(ARM.OFF, ARM.SH, 0); turret.add(shoulder); r.shoulder = shoulder;
  shoulder.add(armMesh((b, cy) => { cy(0.12, 0.3, 0, 0, 0, armBlue, true); b(0.15, ARM.L1, 0.16, 0, ARM.L1 / 2, 0, armWhite); b(0.16, 0.05, 0.17, 0, ARM.L1 * 0.62, 0, armBlue); }));
  const elbow = new THREE.Group(); elbow.position.set(0, ARM.L1, 0); shoulder.add(elbow); r.elbow = elbow;
  elbow.add(armMesh((b, cy) => { cy(0.1, 0.26, 0, 0, 0, armBlue, true); b(0.12, ARM.L2, 0.13, 0, ARM.L2 / 2, 0, armWhite); }));
  const wrist = new THREE.Group(); wrist.position.set(0, ARM.L2, 0); elbow.add(wrist); r.wrist = wrist;
  wrist.add(armMesh((b, cy) => { cy(0.075, 0.2, 0, 0, 0, armBlue, true); }));
  const tool = new THREE.Group(); wrist.add(tool); r.tool = tool;
  tool.add(armMesh((b, cy) => { cy(0.06, 0.1, 0, 0.06, 0, armWhite); b(0.2, 0.05, 0.08, 0, 0.13, 0, armDark); }));
  r.fingers = [-1, 1].map(s => { const f = armMesh(b => b(0.025, 0.12, 0.07, 0, 0.2, 0, armDark)); f.position.x = s * 0.07; tool.add(f); return f; });
  // a feeder lift beside each arm; the line puts the next part it needs on it
  const fx = x - 0.85, fz = z - 0.55; r.feeder = new THREE.Vector3(fx, 0.95, fz);
  box(0.58, 0.95, 0.64, 0x56636b, fx, 0.475, fz, chem, { metalness: 0.5, roughness: 0.4 });
  box(0.6, 0.02, 0.66, C.yellow, fx, 0.96, fz, chem, { roughness: 0.5 });
  return r;
}

// two-link IK in the arm's vertical plane, with the gripper kept pointing straight down
function solveArm(r) {
  const dx = r.tip.x - r.x, dz = r.tip.z - r.z, yaw = Math.atan2(-dz, dx);
  r.turret.rotation.y = yaw;
  const px = Math.hypot(dx, dz) - ARM.OFF, py = r.tip.y + ARM.LG - (ARM.PED + 0.03 + ARM.SH);
  const D = Math.min(ARM.L1 + ARM.L2 - 1e-3, Math.max(0.15, Math.hypot(px, py)));
  const phi = Math.atan2(px, py), gam = Math.acos(Math.max(-1, Math.min(1, (ARM.L1 * ARM.L1 + D * D - ARM.L2 * ARM.L2) / (2 * ARM.L1 * D))));
  const bet = Math.acos(Math.max(-1, Math.min(1, (ARM.L1 * ARM.L1 + ARM.L2 * ARM.L2 - D * D) / (2 * ARM.L1 * ARM.L2))));
  const a1 = phi - gam, a2 = Math.PI - bet, a3 = Math.PI - a1 - a2;
  r.shoulder.rotation.z = -a1; r.elbow.rotation.z = -a2; r.wrist.rotation.z = -a3;
  r.tool.rotation.y = -yaw;                                 // roll the tool so the gripper keeps facing the line
  r.fingers.forEach((f, i) => { f.position.x = (i ? 1 : -1) * (0.07 - r.grip * 0.035); });
}
