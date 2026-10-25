/* js/lab/merge.js — Fewer draw calls in the lab: once the robot has mapped the room, the lab's static meshes are merged by
   material (inside each clickable group, then the rest of the room), the way the campus and other buildings already are.
   Everything that moves, blinks, fades or gets measured later is left alone. This takes the lab, the first thing everyone
   sees, from about 620 draw calls a frame to a fraction of that.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

let labMerged = false;
function mergeLab() {
  if (labMerged || !nav) return;            // the robot's map reads each mesh's own bounds, so it's built first
  labMerged = true;
  const keep = new Set([bot, dock, doorPivot, spotLayer, shine, drip, rotor, screenMesh, icScreen, icUnit, ...bubbles.map(b => b.m), ...leds, ...clocks.flatMap(c => [c.s, c.m, c.h])]);
  hotspots.forEach(h => { if (h.focusObj) keep.add(h.focusObj); });
  // see-through things keep their own draw order, and anything that isn't a plain mesh stays as it is
  lab.traverse(o => { if ((o.isMesh && (o.material.transparent || Array.isArray(o.material))) || o.isPoints || o.isLine || o.isSprite || o.isLight) keep.add(o); });
  const labHot = hotspots.filter(h => { for (let p = h.group; p; p = p.parent) if (p === lab) return true; return false; });
  labHot.forEach(h => mergeStatic(h.group, keep));
  mergeStatic(lab, new Set([...keep, ...labHot.map(h => h.group)]));
}
