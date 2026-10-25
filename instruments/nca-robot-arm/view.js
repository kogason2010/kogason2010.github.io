/* instruments/nca-robot-arm/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// one arm, with a module waiting on its feeder lift, reaching between the feeder and the conveyor
// (on the site js/chemistry/assembly.js builds four and drives them; the module comes from ../nca-hplc-modules)
const moving = new THREE.Group(); lab.add(moving);
const arm = buildArmRobot(0, 0, ["sampler"], moving);
modTextures();
const part = makeModule("sampler"); part.position.copy(arm.feeder); part.position.y += 0.02; moving.add(part);
solveArm(arm);
const F = arm.feeder, P = new THREE.Vector3(0, 0.95, 1.0);
const reach = [arm.home.clone(), new THREE.Vector3(F.x, 2.0, F.z), new THREE.Vector3(F.x, F.y + MOD_KINDS.sampler.h, F.z), new THREE.Vector3(F.x, 2.0, F.z),
  new THREE.Vector3(P.x, 2.1, P.z), new THREE.Vector3(P.x, P.y + 0.45, P.z), new THREE.Vector3(P.x, 2.1, P.z)];
workshop.animate((dt, time) => {
  const u = (time * 0.7) % reach.length, i = Math.floor(u), f = u - i, e = f * f * (3 - 2 * f);
  arm.tip.lerpVectors(reach[i], reach[(i + 1) % reach.length], e);
  arm.grip = i === 2 || i === 3 || i === 4 ? 1 : 0;
  solveArm(arm);
});
