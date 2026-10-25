/* instruments/lab-toc/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// the carousel steps one vial (of 24) at a time, as js/main.js does on the site; the clear cover stays put
let rotorAngle = 0, rotorTarget = 0, rotorTimer = 0;
workshop.animate(dt => {
  rotorTimer += dt;
  if (rotorTimer > 4) { rotorTimer = 0; rotorTarget -= Math.PI * 2 / 24; }
  rotorAngle += (rotorTarget - rotorAngle) * Math.min(1, dt * 4);
  rotor.rotation.y = rotorAngle;
});
