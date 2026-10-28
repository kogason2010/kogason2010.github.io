/* js/ui/links.js — Links straight to a place: kogason2010.github.io/?go=library opens the lab and heads for the library
   (also ?go=nca, ?go=math, ?go=campus, ?go=basement). The address bar follows you as you move about, so copying it
   shares wherever you are.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const GO_ALIAS = { nca: "chem", chemistry: "chem", maths: "math", mathematics: "math", outside: "campus", sfc: "basement", downstairs: "basement" };
// the address of a place (the lab is the plain address)
function placeLink(p) {
  const u = new URL(location.href); u.hash = "";
  if (p === "lab") u.searchParams.delete("go"); else u.searchParams.set("go", p === "chem" ? "nca" : p);
  return u.href;
}
(function () {
  const asked = (new URLSearchParams(location.search).get("go") || "").toLowerCase(), dest = GO_ALIAS[asked] || asked;
  if (dest && dest !== "lab" && PLACE_LIST.some(p => p.id === dest && (!p.secret || spaceUnlocked))) {
    const go = () => setTimeout(() => travelTo(dest), 700);   // once the lab has settled
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
  }
  // keep the address in step with where you are (not mid-journey)
  let shown = dest || "lab";
  setInterval(() => {
    const here = herePlace(); if (here === shown || travel || worldBusy) return;
    shown = here; try { history.replaceState(null, "", placeLink(here)); } catch (e) { /* some embeds forbid it: fine */ }
  }, 700);
})();
