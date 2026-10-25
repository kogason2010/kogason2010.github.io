/* js/ui/places-menu.js — The Places menu in the toolbar: every room in one list, so visitors find the campus and the
   buildings without hunting for doors. Picking a place takes the shortest way there (upstairs, out through the lab's
   door, into a building), one step at a time. Space appears only once someone has found it the hard way.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const PLACE_LIST = [
  { id: "lab", name: "Kogason Lab", note: "Instruments, the robot, your projects" },
  { id: "basement", name: "Basement SFC suite", note: "Supercritical fluid chromatography" },
  { id: "campus", name: "Campus", note: "Drive the robot outside" },
  { id: "chem", name: "NCA", note: "The LC lab, with a live LC run" },
  { id: "library", name: "Library", note: "App notes, shelved by technique" },
  { id: "math", name: "Mathematics", note: "Yang–Mills and the mass gap" },
  { id: "space", name: "Low Earth orbit", note: "You found it", secret: true },
];
const placesBtn = document.getElementById("placesBtn"), placesMenu = document.getElementById("placesMenu");
const herePlace = () => spaceOn ? "space" : worldOn ? "campus" : level === "up" ? "lab" : level === "down" ? "basement" : level;
function renderPlaces() {
  const here = herePlace();
  placesMenu.innerHTML = PLACE_LIST.filter(p => !p.secret || spaceUnlocked).map(p =>
    `<button type="button" role="menuitem" data-place="${p.id}"${p.id === here ? ' aria-current="true"' : ""}><b>${p.name}</b><span>${p.id === here ? "You're here" : p.note}</span></button>`).join("");
}
function setPlacesOpen(open) {
  if (open) renderPlaces();
  placesMenu.hidden = !open; placesBtn.setAttribute("aria-expanded", String(open));
  if (open) { const f = placesMenu.querySelector("button:not([aria-current])"); if (f) f.focus({ preventScroll: true }); }
}
placesBtn.addEventListener("click", e => { e.stopPropagation(); setPlacesOpen(placesMenu.hidden); });
document.addEventListener("click", e => { if (!placesMenu.hidden && !placesMenu.contains(e.target)) setPlacesOpen(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !placesMenu.hidden) { setPlacesOpen(false); placesBtn.focus(); } });
placesMenu.addEventListener("click", e => { const b = e.target.closest("[data-place]"); if (!b) return; setPlacesOpen(false); travelTo(b.dataset.place); });

// one step toward the destination each time nothing else is moving, until we arrive (or give up if 20 s pass with no step)
let travel = null;
function travelTo(dest) {
  if (herePlace() === dest) return;
  if (deskOpen) closeDesktop();
  if (pMode) setParticleMode(false);
  if (wsOpen) closeWorkstation(); if (sfcAppOpen) closeSfcApp(); if (lcAppOpen) closeLcApp(); if (readerOpen) closeReader();
  closeSheet(true);
  clearInterval(travel && travel.id);
  travel = { dest, t0: performance.now(), id: setInterval(travelStep, 150) };
}
function travelStep() {
  const T = travel; if (!T) return;
  if (worldBusy || lvl || deskOpen || pMode || camTween) { T.t0 = performance.now(); return; }      // still moving: wait for it to finish
  if (performance.now() - T.t0 > 20000) { clearInterval(T.id); travel = null; return; }
  const here = herePlace(), d = T.dest;
  if (here === d) { clearInterval(T.id); travel = null; return; }
  if (here === "basement") goLevel("up");
  else if (here === "lab") { if (d === "basement") goLevel("down"); else enterWorld(); }
  else if (here === "space") { if (d === "lab" || d === "basement") exitWorld(); else if (d === "campus") leaveSpace(); else enterPlace(d); }
  else if (here === "campus") { if (d === "lab" || d === "basement") exitWorld(); else if (d === "space") enterSpace(); else enterPlace(d); }
  else if (PLACES[here]) leavePlace();
  T.t0 = performance.now();
}
