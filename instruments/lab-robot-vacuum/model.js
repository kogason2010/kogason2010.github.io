/* instruments/lab-robot-vacuum/model.js — The robot vacuum and its charging dock.
   js/lab/robot.js drives it: floor map, route planning, messes, cleaning and docking.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     bot (js/lab/robot.js, js/lab/merge.js, js/ui/labels.js, js/campus/gameplay.js, js/space/space.js)
     BOT_R (js/lab/robot.js, js/campus/drive.js)
     botLight, brush, turret (js/lab/robot.js, js/campus/gameplay.js, js/space/space.js)
     DOCK, dockLed (js/lab/robot.js)
     dock (js/lab/merge.js) */
"use strict";

/* ---------- Robot vacuum: an original little cleaner that tours the open floor ---------- */
const bot = new THREE.Group(); lab.add(bot);
const BOT_R = 0.24;
cyl(BOT_R, BOT_R * 0.97, 0.11, 0x2b3136, 0, 0.066, 0, bot, 40, { roughness: 0.35, metalness: 0.25 });
cyl(BOT_R * 0.94, BOT_R * 0.94, 0.012, 0xe6ebee, 0, 0.127, 0, bot, 40, { roughness: 0.3 });
cyl(BOT_R * 0.38, BOT_R * 0.38, 0.006, 0xcfd6da, 0, 0.136, 0, bot, 32, { roughness: 0.25 });
const bumper = new THREE.Mesh(new THREE.TorusGeometry(BOT_R + 0.004, 0.022, 8, 28, Math.PI), mat(0x1a1f23, { roughness: 0.6 }));
bumper.rotation.set(Math.PI / 2, 0, -Math.PI / 2); bumper.position.y = 0.06; bumper.castShadow = true; bot.add(bumper);
const botLight = new THREE.MeshBasicMaterial({ color: 0x3fe0d0 });
const lightArc = new THREE.Mesh(new THREE.TorusGeometry(BOT_R * 0.7, 0.009, 6, 24, Math.PI * 0.6), botLight);
lightArc.rotation.set(Math.PI / 2, 0, -Math.PI * 0.3); lightArc.position.y = 0.135; bot.add(lightArc);
box(0.05, 0.022, 0.09, 0x1a1f23, BOT_R * 0.72, 0.138, 0, bot);
[-1, 1].forEach(s => { const wh = cyl(0.036, 0.036, 0.03, 0x111111, -0.02, 0.036, s * (BOT_R - 0.035), bot, 16); wh.rotation.x = Math.PI / 2; });
const brush = new THREE.Group(); brush.position.set(BOT_R * 0.6, 0.014, -BOT_R * 0.6); bot.add(brush);
for (let i = 0; i < 3; i++) { const b = box(0.11, 0.006, 0.012, 0x6d7a82, 0.055, 0, 0, brush); b.position.set(Math.cos(i * 2.094) * 0.055, 0, Math.sin(i * 2.094) * 0.055); b.rotation.y = -i * 2.094; }
// a small spinning range-finder turret on top, so you can see it "look around"
const turret = new THREE.Group(); turret.position.set(-0.02, 0.14, 0); bot.add(turret);
cyl(0.05, 0.05, 0.022, 0x1a1f23, 0, 0, 0, turret, 24, { roughness: 0.4 });
box(0.03, 0.008, 0.026, 0x3fe0d0, 0.042, 0.013, 0, turret);
turret.children[1].material = new THREE.MeshBasicMaterial({ color: 0x9ff3ea });

// Charging dock in the back corner past the HPLC bench: the robot noses in to charge and backs out to work
const DOCK = { x: 3.6, z: -3.8, h: Math.PI / 2 };
const dock = new THREE.Group(); dock.position.set(DOCK.x, 0, DOCK.z); dock.rotation.y = DOCK.h; dock.userData.noNav = true; lab.add(dock);
box(0.07, 0.15, 0.36, 0x2b3136, BOT_R + 0.06, 0.075, 0, dock, { roughness: 0.4, metalness: 0.2 });
box(0.05, 0.02, 0.34, 0xe6ebee, BOT_R + 0.055, 0.16, 0, dock, { roughness: 0.3 });
box(BOT_R + 0.06, 0.008, 0.3, 0x1f2428, (BOT_R + 0.06) / 2, 0.006, 0, dock, { roughness: 0.6 });
[-0.07, 0.07].forEach(s => box(0.08, 0.004, 0.025, C.steel, BOT_R - 0.05, 0.012, s, dock, { metalness: 0.8, roughness: 0.25 }));
const dockLed = new THREE.MeshBasicMaterial({ color: 0x4fe07a });
const dl = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), dockLed); dl.position.set(BOT_R + 0.024, 0.12, 0); dock.add(dl);
