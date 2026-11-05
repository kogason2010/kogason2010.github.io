/* js/lab/merge.js — Fewer draw calls in the lab: once the robot has mapped the room, the lab's static meshes are merged by
   material (inside each clickable group, then the rest of the room), the way the campus and other buildings already are.
   Everything that moves, blinks, fades or gets measured later is left alone. This takes the lab, the first thing everyone
   sees, from about 620 draw calls a frame to a fraction of that. The basement is merged at the same time.
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
  // the TOC's carousel turns as a whole, so its vials and racks can be merged within it
  if (typeof rotor !== "undefined") mergeStatic(rotor, new Set());
  // the IC is left whole only because clicking it frames the instrument by its own bounds: merging inside it keeps those
  // bounds and turns its 70-odd separate parts into a handful
  keep.delete(icUnit); mergeStatic(icUnit, keep);
  mergeBasement();
}
// the basement SFC suite is built with the lab, so it's merged at the same time (it was drawing about 350 separate meshes).
// Its live run moves the injector knob, fills the fraction bottles and lights the flow cell (marked userData.keep in
// instruments/basement-sfc/model.js), and the room's light fittings and alarm strobe change colour, so those stay as they are.
function mergeBasement() {
  const keep = new Set([SFC_PARTS.injKnob, strobe, ...clocks.flatMap(c => [c.s, c.m, c.h])]);
  hotspots.forEach(h => { if (h.focusObj) keep.add(h.focusObj); });
  basement.traverse(o => { if ((o.isMesh && (o.material.transparent || Array.isArray(o.material) || o.material === fixMat || o.material === SFC_PARTS.cell)) || o.isPoints || o.isLine || o.isSprite || o.isLight) keep.add(o); });
  const hot = hotspots.filter(h => { for (let p = h.group; p; p = p.parent) if (p === basement) return true; return false; });
  hot.forEach(h => mergeStatic(h.group, keep));
  mergeStatic(basement, new Set([...keep, ...hot.map(h => h.group)]));
}
