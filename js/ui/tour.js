/* js/ui/tour.js — The guided tour: like a museum audio guide, it takes the camera round the highlights of every room (the
   lab's instruments, the basement SFC suite, the campus, the NCA hall, the library and the mathematics building), with a
   short caption at each stop. It moves on by itself; Back, Pause, Next and End are on the caption card (and the arrow
   keys, the space bar and Escape). Dragging the view pauses it. Getting from room to room uses the Places menu's
   travelTo(). The words are drawn from the rooms' own panels (js/content.js and the buildings' content files).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const TOUR_STOPS = [
  { place: "lab", shot: "home", title: "Welcome to the Kogason lab",
    text: "Everything here is drawn in code with Three.js, with no model files. Each glowing tag opens a short explainer. This tour visits the highlights, from the benches to the campus." },
  { place: "lab", key: "hplc", title: "HPLC",
    text: "High-performance liquid chromatography pumps a sample through a packed column at high pressure. Compounds move at different speeds, so they reach the detector one after another." },
  { place: "lab", key: "ic", title: "Nexera IC",
    text: "Shimadzu's ion chromatograph, announced in February 2026. Ion chromatography separates charged species, such as the anions in drinking water. The computer beside it compares columns and scales a method." },
  { place: "lab", key: "toc", title: "TOC analyzer",
    text: "It measures the organic carbon in water. A common method oxidizes the sample over a heated catalyst and measures the CO₂ by infrared. The orange window is the furnace; the turntable brings each vial to the needle." },
  { place: "lab", key: "desktop", title: "Projects",
    text: "The monitor opens KogasonOS, a desktop where every project runs as an app, from companions to Shimadzu application notes to browser calculators for everyday HPLC work." },
  { place: "basement", key: "sfc", title: "Downstairs: SFC",
    text: "Supercritical fluid chromatography uses CO₂ as the main mobile phase, usually with some methanol. It is dense enough to dissolve compounds but flows almost like a gas, so runs are fast and use far less organic solvent." },
  { place: "campus", shot: "campus", title: "The campus",
    text: "Out through the lab's door, the robot vacuum is yours to drive. Clean up the messes, find what went missing, and drive into the NCA, the library or the mathematics building." },
  { place: "chem", shot: "home", title: "NCA, the LC lab",
    text: "UHPLC, an integrated LC, LC-MS/MS and preparative LC line the benches. At the LC workstation you can run a sample and watch the chromatogram build." },
  { place: "chem", key: "assembly", title: "Robots building an HPLC",
    text: "Four robot arms put together a modular HPLC, one module per stop, and a QC arch scans each finished system before it ships." },
  { place: "library", shot: "home", title: "The library",
    text: "Each project has a place on the shelves here, sorted by technique. Tap an alcove to browse, and read a project's site without leaving the room." },
  { place: "math", key: "mathLattice", title: "Mathematics",
    text: "The Yang–Mills existence and mass gap problem, one of the seven Millennium Prize Problems, still open. The glowing lattice is a real SU(2) lattice gauge simulation, running in your browser." },
];
const TOUR_PLACE = { lab: "Kogason lab", basement: "Basement SFC suite", campus: "Campus", chem: "NCA", library: "Library", math: "Mathematics" };
const TOUR = { on: false, i: 0, phase: "", t: 0, dwell: 8, paused: false, tries: 0, waitT: 0, drift: 1 };

const tourEl = document.createElement("div");
tourEl.className = "tour"; tourEl.id = "tour"; tourEl.hidden = true;
tourEl.setAttribute("role", "region"); tourEl.setAttribute("aria-label", "Guided tour");
tourEl.innerHTML = `
  <div class="tour-top"><span class="tour-step" id="tourStep"></span><span class="tour-place" id="tourPlace"></span><button class="tour-x" id="tourEnd" type="button" aria-label="End the tour">×</button></div>
  <div class="tour-copy" aria-live="polite"><b class="tour-title" id="tourTitle"></b><p class="tour-text" id="tourText"></p></div>
  <div class="tour-bar" aria-hidden="true"><i id="tourBar"></i></div>
  <div class="tour-ctl">
    <button class="btn" type="button" id="tourPrev">Back</button>
    <button class="btn" type="button" id="tourPlay" aria-pressed="false">Pause</button>
    <button class="btn primary" type="button" id="tourNext">Next</button>
  </div>
  <div class="tour-ctl tour-done" hidden>
    <button class="btn" type="button" id="tourAgain">Start again</button>
    <button class="btn" type="button" id="tourLab">Back to the lab</button>
    <button class="btn primary" type="button" id="tourFree">Keep exploring</button>
  </div>`;
const letterbox = document.createElement("div"); letterbox.className = "letterbox"; letterbox.setAttribute("aria-hidden", "true");
document.body.append(letterbox, tourEl);
const tq = id => document.getElementById(id);

function tourStart() {
  if (TOUR.on) return;
  setPlacesOpen(false); foldIntro();
  // whatever was open closes first (the first stop waits for it)
  if (deskOpen) closeDesktop(); if (pMode) setParticleMode(false);
  if (wsOpen) closeWorkstation(); if (sfcAppOpen) closeSfcApp(); if (lcAppOpen) closeLcApp(); if (readerOpen) closeReader();
  closeSheet(true);
  TOUR.on = true; document.body.classList.add("touring"); tourEl.hidden = false;
  requestAnimationFrame(() => tourEl.classList.add("on"));
  tourGo(0);
  tq("tourNext").focus({ preventScroll: true });
}
function tourEnd() {
  if (!TOUR.on) return;
  TOUR.on = false; TOUR.phase = ""; document.body.classList.remove("touring"); tourEl.classList.remove("on");
  setTimeout(() => { if (!TOUR.on) tourEl.hidden = true; }, reduce ? 0 : 300);
  CAM.dist = 3.8; CAM.pitch = 0.36; CAM.idle = 0;   // the campus camera back to its usual distance, wherever the tour ended
  if (!lvl && !worldBusy) controls.minDistance = Math.min(viewMinDist(), camera.position.distanceTo(controls.target));   // (from a close-up, zooming out still works)
}
function tourGo(i) {
  TOUR.i = Math.max(0, Math.min(i, TOUR_STOPS.length));
  tourEl.querySelector(".tour-done").hidden = TOUR.i < TOUR_STOPS.length;
  tourEl.querySelector(".tour-ctl:not(.tour-done)").hidden = TOUR.i >= TOUR_STOPS.length;
  if (TOUR.i >= TOUR_STOPS.length) {   // the end: stay put and offer the way on
    TOUR.phase = "done";
    tq("tourStep").textContent = "The end"; tq("tourPlace").textContent = TOUR_PLACE[herePlace()] || "";
    tq("tourTitle").textContent = "That's the tour";
    tq("tourText").textContent = "Every tag has more to read, the workstations run samples, and there's more to find out on the campus.";
    tq("tourBar").style.width = "100%"; tq("tourFree").focus({ preventScroll: true });
    return;
  }
  const s = TOUR_STOPS[TOUR.i];
  tq("tourStep").textContent = `${TOUR.i + 1} / ${TOUR_STOPS.length}`; tq("tourPlace").textContent = TOUR_PLACE[s.place];
  tq("tourPrev").disabled = TOUR.i === 0; tq("tourBar").style.width = "0%";
  TOUR.t = 0; TOUR.tries = 0; TOUR.waitT = 0; TOUR.drift = TOUR.i % 2 ? -1 : 1;
  if (TOUR.paused) tourPause(false);   // (only Back, Next or Start again get here while paused: each carries on playing)
  TOUR.dwell = Math.min(14, Math.max(7.5, 3.5 + s.text.length * 0.045));   // long enough to read the caption
  TOUR.phase = "travel";   // (even when already here: it waits for anything still closing or moving)
  if (herePlace() !== s.place) {
    tq("tourTitle").textContent = "On the way";
    tq("tourText").textContent = `Heading to ${s.place === "basement" ? "the basement" : s.place === "campus" ? "the campus" : TOUR_PLACE[s.place]}…`;
    travelTo(s.place);
  }
}
// arrived: say what's here and move the camera to it
function tourFrame() {
  const s = TOUR_STOPS[TOUR.i];
  tq("tourTitle").textContent = s.title; tq("tourText").textContent = s.text;
  TOUR.phase = "frame";
  if (s.place === "campus") { CAM.dist = 7.5; CAM.pitch = 0.3; CAM.yaw = 0.6; CAM.idle = 0; return; }   // stand back from the robot
  CAM.dist = 3.8; CAM.pitch = 0.36;
  closeSheet(true);
  const pose = s.key ? tourFocusPose(s.key) : tourHomePose();
  controls.minDistance = s.key ? 1 : viewMinDist();   // (close-ups come nearer than the room's usual zoom limit)
  if (pose) animateCamera(pose.pos, pose.tgt, 1.6);
}
// a hotspot framed above the caption card (and the letterbox bars)
function tourFocusPose(key) {
  const h = hotspots.find(x => x.key === key); if (!h) return null;
  const card = tourEl.getBoundingClientRect(), H = stage.clientHeight;
  return focusPose(h, 0, Math.max(0, H - card.top) + 12, Math.min(70, Math.max(26, H * 0.07)) + 8);
}
// the room's own starting view, without jumping there, and moved up clear of the caption card: the lab, the basement and
// the NCA hall are refitted whole into the space above it; inside the library and the mathematics building (where the
// camera stands in the room) the view just tilts the picture up by half the card's height
function tourHomePose() {
  const pos = camera.position.clone(), tgt = controls.target.clone();
  if (PLACES[level] && PLACES[level].home) PLACES[level].home();
  else { const dy = level === "down" ? BY : 0; camera.position.copy(HOME).y += dy; controls.target.copy(TARGET).y += dy; fitDistance(); }
  const out = { pos: camera.position.clone(), tgt: controls.target.clone() };
  camera.position.copy(pos); controls.target.copy(tgt); camera.lookAt(tgt);
  const H = stage.clientHeight, cardTop = tourEl.getBoundingClientRect().top, below = Math.max(0, H - cardTop) + 10, bar = Math.min(70, Math.max(26, H * 0.07)) + 10;
  const dir = out.pos.clone().sub(out.tgt).normalize(), box = level === "up" || level === "down" ? new THREE.Box3(new THREE.Vector3(ROOM0 - 0.3, -0.3, ROOM0 - 0.3), new THREE.Vector3(ROOM1, 4.9, ROOM1)).translate(new THREE.Vector3(0, level === "down" ? BY : 0, 0)) : level === "chem" && stage.clientWidth / H >= 0.8 ? CHEM_BOX : null;
  if (box) { const f = fitBoxView(box, dir, { top: bar, bottom: below, side: 12 }); return { pos: f.tgt.clone().addScaledVector(dir, Math.min(f.dist, controls.maxDistance)), tgt: f.tgt }; }
  const d = out.pos.distanceTo(out.tgt), visH = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const up = new THREE.Vector3().setFromMatrixColumn(new THREE.Matrix4().lookAt(out.pos, out.tgt, camera.up), 1);
  const shift = up.multiplyScalar(-(below - bar) / 2 / H * visH);
  return { pos: out.pos.add(shift), tgt: out.tgt.add(shift) };
}
const tourAxis = new THREE.Vector3(0, 1, 0), tourOff = new THREE.Vector3();
function updateTour(dt) {
  if (!TOUR.on) return;
  const s = TOUR_STOPS[TOUR.i];
  if (TOUR.phase === "travel") {
    const still = !travel && !worldBusy && !lvl && !camTween && !deskOpen && !pMode;
    if (still && herePlace() === s.place) tourFrame();
    else if (still) {   // the journey stopped short (something got in the way): try again, then skip
      TOUR.waitT += dt;
      if (TOUR.waitT > 2) { TOUR.waitT = 0; if (++TOUR.tries <= 2) travelTo(s.place); else tourGo(TOUR.i + 1); }
    }
    return;
  }
  if (TOUR.phase === "frame") { if (!camTween) { TOUR.phase = "dwell"; TOUR.t = 0; } return; }
  if (TOUR.phase !== "dwell") return;
  // a slow drift round the subject while the caption is read
  if (!TOUR.paused && !reduce) {
    if (worldOn) { CAM.yaw += 0.07 * dt * TOUR.drift; CAM.idle = 0; }
    else { tourOff.subVectors(camera.position, controls.target).applyAxisAngle(tourAxis, 0.022 * dt * TOUR.drift); camera.position.copy(controls.target).add(tourOff); }
  }
  if (TOUR.paused) return;
  TOUR.t += dt; tq("tourBar").style.width = Math.min(100, TOUR.t / TOUR.dwell * 100) + "%";
  if (TOUR.t >= TOUR.dwell) tourGo(TOUR.i + 1);
}
function tourPause(p) { TOUR.paused = p; tq("tourPlay").textContent = p ? "Play" : "Pause"; tq("tourPlay").setAttribute("aria-pressed", String(p)); tourEl.classList.toggle("paused", p); }

tq("tourEnd").addEventListener("click", tourEnd);
tq("tourFree").addEventListener("click", tourEnd);
tq("tourAgain").addEventListener("click", () => tourGo(0));
tq("tourLab").addEventListener("click", () => { tourEnd(); travelTo("lab"); });
tq("tourNext").addEventListener("click", () => tourGo(TOUR.i + 1));
tq("tourPrev").addEventListener("click", () => tourGo(TOUR.i - 1));
tq("tourPlay").addEventListener("click", () => tourPause(!TOUR.paused));
// looking around yourself pauses it (press Play to carry on)
renderer.domElement.addEventListener("pointerdown", () => { if (TOUR.on && TOUR.phase === "dwell" && !TOUR.paused) tourPause(true); });
// keys: ← → for back and next, space to pause, Escape to end. Nothing else reaches the lab while touring (on the campus
// the arrow keys would drive the robot away)
window.addEventListener("keydown", e => {
  if (!TOUR.on) return;
  const onButton = e.target.closest && e.target.closest("button, a");
  if (e.key === "Escape") tourEnd();
  else if (e.key === "ArrowRight" && TOUR.phase !== "done") tourGo(TOUR.i + 1);
  else if (e.key === "ArrowLeft" && TOUR.phase !== "done") tourGo(TOUR.i - 1);
  else if (e.key === " " && !onButton && TOUR.phase !== "done") tourPause(!TOUR.paused);
  else if (e.key === "Tab" || e.key === "Enter" || (e.key === " " && onButton)) return;
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
window.addEventListener("keyup", e => { if (TOUR.on && e.key !== "Tab") e.stopImmediatePropagation(); }, true);
document.addEventListener("click", e => { if (e.target.closest("[data-tour]")) { e.preventDefault(); tourStart(); } });
