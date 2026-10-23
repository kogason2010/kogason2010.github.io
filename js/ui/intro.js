/* js/ui/intro.js — The introduction panel in the top-left corner folds down to just the name a few seconds after the
   page opens (or as soon as you start looking around), so it stays out of the way. The arrow, or a click on the folded
   panel, opens it again; it folds itself away again a few seconds after the pointer leaves it.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const tagToggle = document.getElementById("tagToggle");
const INTRO_FOLD_MS = 5000;
let introTimer = 0, introHover = false;
function setIntroOpen(open) {
  tagEl.classList.toggle("collapsed", !open);
  tagToggle.setAttribute("aria-expanded", String(open));
  tagToggle.setAttribute("aria-label", open ? "Hide the introduction" : "Show the introduction");
  clearTimeout(introTimer);
}
// fold after a pause, unless the pointer or keyboard focus is in the panel
function foldIntroSoon(ms) {
  clearTimeout(introTimer);
  introTimer = setTimeout(() => { if (!introHover && !tagEl.contains(document.activeElement)) setIntroOpen(false); else foldIntroSoon(ms); }, ms);
}
tagToggle.addEventListener("click", e => {
  e.stopPropagation();
  const open = tagEl.classList.contains("collapsed");
  setIntroOpen(open);
  if (open) foldIntroSoon(INTRO_FOLD_MS * 2);
});
tagEl.addEventListener("click", e => { if (tagEl.classList.contains("collapsed") && !e.target.closest("a")) { setIntroOpen(true); foldIntroSoon(INTRO_FOLD_MS * 2); } });
tagEl.addEventListener("pointerenter", () => { introHover = true; });
tagEl.addEventListener("pointerleave", () => { introHover = false; if (!tagEl.classList.contains("collapsed")) foldIntroSoon(INTRO_FOLD_MS); });
// starting to look around folds it straight away
cv.addEventListener("pointerdown", () => { if (!tagEl.classList.contains("collapsed") && !introHover) setIntroOpen(false); });
foldIntroSoon(INTRO_FOLD_MS);
