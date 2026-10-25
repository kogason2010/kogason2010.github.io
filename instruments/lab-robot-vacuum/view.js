/* instruments/lab-robot-vacuum/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// park the robot on its dock, as placeDocked() in js/lab/robot.js does
bot.position.set(DOCK.x, 0.003, DOCK.z); bot.rotation.set(0, DOCK.h, 0);
