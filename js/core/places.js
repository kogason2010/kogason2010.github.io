/* js/core/places.js — Indoor places you reach from the campus (the NCA LC lab, the library). Each registers in PLACES
   with how to build it, set up its view, and leave it; enterPlace() and leavePlace() handle the fades and the UI.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const PLACES = {};
function setPlaceUI(name) {
  const P = PLACES[name], inside = !!P;
  levelBtn.hidden = inside; particleBtn.hidden = inside;
  hint.textContent = inside ? P.hint : HINT_UP;
  document.getElementById("eyebrow").textContent = inside ? P.eyebrow : "Portfolio · lab 01";
  if (osFrame) osFrame.style.visibility = inside ? "hidden" : "";
}
// from the campus, through a building's doors
function enterPlace(name) {
  const P = PLACES[name];
  if (!P || !worldOn || worldBusy) return;
  worldBusy = true; treeTextures();
  fade(true, 420, () => {
    P.build();
    teardownWorld();
    lab.visible = false; basement.visible = false; P.group.visible = true; level = name;
    focusHome = null; tween = null; controls.enabled = true;
    P.enter();
    setPlaceUI(name); labelsEl.hidden = false; hint.hidden = false;
    fade(false, 600, () => { worldBusy = false; });
  });
}
// back out onto the campus beside the building
function leavePlace() {
  const P = PLACES[level];
  if (!P || worldBusy || deskOpen) return;
  worldBusy = true; focusHome = null; tween = null; closeSheet(true); setHover(null);
  labelsEl.hidden = true; hint.hidden = true; controls.enabled = false;
  P.leave(() => fade(true, 420, () => {
    P.group.visible = false; P.exit && P.exit(); level = "up"; setPlaceUI(null);
    if (P.door) P.door.hinted = true;
    setupWorld(P.spawn);
    fade(false, 600, () => { worldBusy = false; });
  }));
}
