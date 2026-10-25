/* instruments/lab-toc/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// the carousel steps round and the furnace window pulses, as js/main.js does on the site
let rotorAngle = 0, rotorTarget = 0, rotorTimer = 0;
workshop.animate((dt, time) => {
  rotorTimer += dt;
  if (rotorTimer > 1.6) { rotorTimer = 0; rotorTarget -= Math.PI * 2 / 16; }
  rotorAngle += (rotorTarget - rotorAngle) * Math.min(1, dt * 6);
  rotor.rotation.y = rotorAngle;
  const pulse = 0.75 + 0.25 * Math.sin(time * 2.2);
  furnaceMat.color.setRGB(1, 0.42 * pulse + 0.1, 0.12 * pulse);
});
