/* js/ui/studio.js — Instrument studio: open the site with ?studio on the end of the address (for example
   http://127.0.0.1:5500/index.html?studio) to see every instrument on its own, on a turntable, with its size, its
   triangle count and the file that builds it. Edit that file, save, and the page reloads straight back to the same
   instrument (?studio=hplc and so on), so you can shape the models without walking through the rooms.
   Nothing here runs unless the address asks for it.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const STUDIO_ON = new URLSearchParams(location.search).has("studio");
// everything you can look at, grouped by room, with the file to edit for each (listed when the studio opens)
let STUDIO_ITEMS = [];
const studioItems = () => [
  { room: "Kogason Lab", key: "hplc", file: "js/lab/hplc.js" },
  { room: "Kogason Lab", key: "ic", file: "js/lab/ic.js" },
  { room: "Kogason Lab", key: "icpc", file: "js/lab/ic.js (near the end)" },
  { room: "Kogason Lab", key: "toc", file: "js/lab/island-toc.js" },
  { room: "Kogason Lab", key: "desktop", file: "js/lab/workstation.js" },
  { room: "Kogason Lab", key: "about", file: "js/lab/wall-items.js" },
  { room: "Kogason Lab", key: "contact", file: "js/lab/wall-items.js" },
  { room: "Kogason Lab", key: "vacuum", label: "Robot vacuum", file: "js/lab/robot.js", get: () => bot },
  { room: "Basement", key: "sfc", file: "js/basement/basement.js" },
  { room: "Basement", key: "sfcpc", file: "js/basement/basement.js" },
  { room: "Basement", key: "co2", file: "js/basement/basement.js" },
  { room: "NCA", key: "uhplc", file: "js/chemistry/instruments.js" },
  { room: "NCA", key: "lcpc", file: "js/chemistry/instruments.js" },
  { room: "NCA", key: "ilc", file: "js/chemistry/instruments.js" },
  { room: "NCA", key: "lcms", file: "js/chemistry/instruments.js" },
  { room: "NCA", key: "prep", file: "js/chemistry/instruments.js" },
  { room: "NCA", key: "solvents", file: "js/chemistry/instruments.js" },
  { room: "NCA", key: "columns", file: "js/chemistry/instruments.js" },
  { room: "NCA", key: "sampleprep", file: "js/chemistry/instruments.js" },
  { room: "NCA assembly line", key: "stack", label: "Assembled HPLC", file: "js/chemistry/assembly.js (makeModule)", make: () => studioStack() },
  ...["sampler", "detector", "pumpA", "controller", "tray", "oven"].map(k => ({ room: "NCA assembly line", key: "mod-" + k, label: MOD_KINDS[k].name, file: "js/chemistry/assembly.js (makeModule)", make: () => makeModule(k) })),
  { room: "NCA assembly line", key: "arm", label: "Robot arm", file: "js/chemistry/assembly.js (buildArmRobot)", make: () => studioArm() },
];
const STUDIO = { root: null, item: null, turn: true, wire: false, grid: true, dark: false, ground: null, gridHelper: null, last: 0 };

function studioStack() {
  const g = new THREE.Group(); let y = 0;
  STACK.forEach(k => { const m = makeModule(k); m.position.set(-0.13, y, 0); g.add(m); y += m.userData.h; });
  const ov = makeModule("oven"); ov.position.set(0.24, 0, 0); g.add(ov); return g;
}
function studioArm() {
  const r = ASM.robots[0], g = new THREE.Group();
  r.tip.copy(r.home); r.grip = 0; solveArm(r);                  // a relaxed pose, not whatever it was doing
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.56, ARM.PED, 0.56), mat(0x2b3238, { roughness: 0.5 })); ped.position.y = ARM.PED / 2; ped.castShadow = true; g.add(ped);
  const t = r.turret.clone(true); t.position.set(0, ARM.PED + 0.03, 0); t.rotation.y = r.turret.rotation.y; g.add(t); return g;
}
function studioLabel(it) { if (it.label) return it.label; const h = hotspots.find(x => x.key === it.key); return h ? h.label : it.key; }

function startStudio() {
  document.body.classList.add("studio");
  buildChem();
  STUDIO_ITEMS = studioItems();                                                  // NCA builds on demand; the studio needs it now
  [lab, basement, chem, bgGroup].forEach(o => { o.visible = false; });
  if (typeof world !== "undefined") world.visible = false;
  labelsEl.hidden = true; controls.enabled = true; if (osFrame) osFrame.style.visibility = "hidden";
  cv.addEventListener("pointerdown", () => { STUDIO.held = true; }); window.addEventListener("pointerup", () => { STUDIO.held = false; });
  Object.assign(controls, { minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, minPolarAngle: 0.05, maxPolarAngle: 1.56 });
  camera.fov = 30; camera.near = 0.02; camera.far = 200; camera.updateProjectionMatrix();
  STUDIO.root = new THREE.Group(); scene.add(STUDIO.root);
  // a soft floor that catches shadows, with a faint 10 cm grid
  STUDIO.ground = new THREE.Mesh(new THREE.CircleGeometry(6, 64).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.22 })); STUDIO.ground.receiveShadow = true; scene.add(STUDIO.ground);
  STUDIO.gridHelper = new THREE.GridHelper(4, 40, 0x9aa7b0, 0xc9d1d6); STUDIO.gridHelper.material.transparent = true; STUDIO.gridHelper.material.opacity = 0.5; STUDIO.gridHelper.position.y = 0.001; scene.add(STUDIO.gridHelper);
  // the panel: list, info and toggles
  const panel = document.createElement("aside"); panel.className = "studio-panel"; panel.setAttribute("aria-label", "Instrument studio");
  const rooms = [...new Set(STUDIO_ITEMS.map(i => i.room))];
  panel.innerHTML = `<header><b>Instrument studio</b><span>Edit the file shown, save, and this page reloads to the same model.</span></header>
    <div class="studio-list">${rooms.map(r => `<h3>${r}</h3>${STUDIO_ITEMS.filter(i => i.room === r).map(i => `<button type="button" data-studio="${i.key}">${studioLabel(i)}</button>`).join("")}`).join("")}</div>
    <div class="studio-info" id="studioInfo"></div>
    <div class="studio-tools">
      <label><input type="checkbox" id="stTurn" checked> Turntable</label><label><input type="checkbox" id="stGrid" checked> Grid</label>
      <label><input type="checkbox" id="stWire"> Wireframe</label><label><input type="checkbox" id="stDark"> Dark</label>
      <a href="./" class="studio-back">Back to the site</a>
    </div>`;
  document.body.appendChild(panel);
  panel.addEventListener("click", e => { const b = e.target.closest("[data-studio]"); if (b) studioShow(b.dataset.studio); });
  panel.querySelector("#stTurn").addEventListener("change", e => { STUDIO.turn = e.target.checked; });
  panel.querySelector("#stGrid").addEventListener("change", e => { STUDIO.grid = e.target.checked; STUDIO.gridHelper.visible = STUDIO.grid; });
  panel.querySelector("#stWire").addEventListener("change", e => { STUDIO.wire = e.target.checked; studioWire(); });
  panel.querySelector("#stDark").addEventListener("change", e => { STUDIO.dark = e.target.checked; document.body.classList.toggle("studio-dark", STUDIO.dark); });
  window.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = STUDIO_ITEMS.findIndex(x => x.key === (STUDIO.item && STUDIO.item.key)), n = STUDIO_ITEMS.length;
    studioShow(STUDIO_ITEMS[(i + (e.key === "ArrowRight" ? 1 : n - 1)) % n].key);
  });
  const want = new URLSearchParams(location.search).get("studio");
  studioShow(STUDIO_ITEMS.some(i => i.key === want) ? want : "hplc");
  window.addEventListener("resize", studioOffset);
  requestAnimationFrame(studioTick);
}
// keep the model centred in the space beside the panel, not behind it
function studioOffset() {
  const p = document.querySelector(".studio-panel"), W = stage.clientWidth, H = stage.clientHeight;
  if (!p || W <= 640) { camera.clearViewOffset(); return; }
  camera.setViewOffset(W, H, -(p.offsetWidth + 12) / 2, 0, W, H);
}
function studioWire() { STUDIO.root.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material)) o.material.wireframe = STUDIO.wire; }); }
function studioShow(key) {
  const it = STUDIO_ITEMS.find(i => i.key === key); if (!it) return;
  STUDIO.item = it;
  STUDIO.root.clear(); STUDIO.root.rotation.y = 0;
  let model;
  if (it.make) model = it.make();
  else {
    const src = it.get ? it.get() : (hotspots.find(h => h.key === it.key) || {}).group; if (!src) return;
    src.updateMatrixWorld(true); model = src.clone(true);
    src.matrixWorld.decompose(model.position, model.quaternion, model.scale);   // keep it as it stands in its room
  }
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const holder = new THREE.Group(); holder.add(model); STUDIO.root.add(holder); STUDIO.root.updateMatrixWorld(true);   // the turntable is back at zero before measuring
  // stand it on the floor, centred
  const b = new THREE.Box3().setFromObject(holder), c = new THREE.Vector3(), s = new THREE.Vector3(); b.getCenter(c); b.getSize(s);
  holder.position.set(-c.x, -b.min.y, -c.z);
  const R = Math.max(0.25, s.length() / 2), tgt = new THREE.Vector3(0, s.y / 2, 0);
  const dist = R / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.08;
  controls.target.copy(tgt); camera.position.copy(tgt).add(new THREE.Vector3(0.75, 0.42, 1).normalize().multiplyScalar(dist)); camera.lookAt(tgt);
  controls.minDistance = R * 0.5; controls.maxDistance = R * 8;
  // light it from the front left, with shadows sized to the model
  sun.position.set(-R * 2, R * 4 + 2, R * 3); sun.target.position.set(0, 0, 0);
  const e = R * 1.6; Object.assign(sun.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 0.1, far: R * 12 + 10 }); sun.shadow.camera.updateProjectionMatrix();
  hemi.intensity = 0.6; sun.intensity = 1.1; fill.intensity = 0.3;
  STUDIO.ground.scale.setScalar(Math.max(0.5, R * 1.4)); STUDIO.gridHelper.scale.setScalar(Math.max(0.5, Math.ceil(R * 2) / 4 * 1.5));
  studioWire(); studioOffset();
  // the facts you need while editing
  let meshes = 0, tris = 0; const mats = new Set();
  holder.traverse(o => { if (!o.isMesh) return; meshes++; const g = o.geometry, n = g.index ? g.index.count / 3 : g.attributes.position.count / 3; tris += o.isInstancedMesh ? n * o.count : n; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); });
  document.getElementById("studioInfo").innerHTML = `<h2>${studioLabel(it)}</h2>
    <div class="row"><span>Edit</span><code>${it.file}</code></div>
    <div class="row"><span>Size (m)</span><b>${s.x.toFixed(2)} × ${s.y.toFixed(2)} × ${s.z.toFixed(2)}</b></div>
    <div class="row"><span>Meshes</span><b>${meshes}</b></div><div class="row"><span>Triangles</span><b>${Math.round(tris).toLocaleString()}</b></div><div class="row"><span>Materials</span><b>${mats.size}</b></div>
    <p>← → to step through · drag to turn · scroll to zoom</p>`;
  document.querySelectorAll(".studio-panel [data-studio]").forEach(b => b.setAttribute("aria-current", String(b.dataset.studio === key)));
  try { history.replaceState(null, "", "?studio=" + key); } catch (err) { /* address bar is cosmetic */ }
}
function studioTick(now) {
  const dt = Math.min(0.05, (now - (STUDIO.last || now)) / 1000); STUDIO.last = now;
  if (STUDIO.turn && !STUDIO.held) STUDIO.root.rotation.y += dt * 0.35;   // pauses while you drag
  requestAnimationFrame(studioTick);
}
if (STUDIO_ON) setTimeout(startStudio, 50);
