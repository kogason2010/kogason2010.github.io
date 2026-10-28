/* js/core/lights.js — Lights and the Lights on/off (night) switch.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Lights ---------- */
const hemi = new THREE.HemisphereLight(0xfff4e8, 0x5f6f7a, 0.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe7cc, 1.05);
const fill = new THREE.DirectionalLight(0xbfd8ff, 0.35); fill.intensity = 0.25; fill.position.set(-2, 6, 10); scene.add(fill);
sun.position.set(6, 11, 7); sun.castShadow = true;
sun.shadow.mapSize.set(LIGHT ? 1024 : 2048, LIGHT ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
sun.shadow.bias = -0.0008; sun.shadow.radius = 4;
scene.add(sun);
const screenGlow = new THREE.PointLight(0x6aa6f0, 0.0, 3, 2); screenGlow.position.set(1.3, 1.75, -3.5); scene.add(screenGlow);
const furnaceGlow = new THREE.PointLight(0xff7a2a, 0.0, 1.2, 2); furnaceGlow.position.set(TX + 0.17, ITOP + 0.36, TZ + 0.55); scene.add(furnaceGlow);

let night = false;
const lightsBtn = document.getElementById("lightsBtn");
function setNight(on) {
  night = on;
  hemi.intensity = on ? 0.14 : 0.5; fill.intensity = on ? 0.05 : 0.25; paintWindow(on); winGlow.intensity = on ? 0.05 : 0.35;
  sun.intensity = on ? 0.1 : 1.05;
  sun.color.set(on ? 0x5d74b8 : 0xffe7cc);
  hoodLight.intensity = on ? 1.6 : 0.55; mantleMat.emissiveIntensity = on ? 1.5 : 0.6;
  benchLight.intensity = on ? 1.2 : 0.6;
  screenGlow.intensity = on ? 0.9 : 0;
  lightsBtn.textContent = on ? "Lights on" : "Lights off";
  lightsBtn.setAttribute("aria-pressed", String(on));
}
lightsBtn.addEventListener("click", () => setNight(!night));
