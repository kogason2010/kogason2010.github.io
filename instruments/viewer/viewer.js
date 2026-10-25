/* instruments/viewer/viewer.js — The offline viewer: shows what an instrument's model.js built, with an orbit camera, the
   lab's lighting, a floor grid, the model's size and triangle count, view buttons, and click-a-part to see its size,
   colour, position and the line of model.js that makes it. Only the viewer pages load this; the site never does.
   An instrument's index.html can set, on <body>: data-build (a builder function to run, for NCA's instruments),
   data-front ("x" when the instrument faces +x) and data-focus (the part to frame, e.g. "icUnit"). */
"use strict";
(function () {
  const info = document.body.dataset;
  if (info.build) workshop.run(() => { if (typeof window[info.build] !== "function") throw new Error(info.build + " isn't defined in model.js"); window[info.build](); });
  workshop.built = true;                                    // stop recording where parts were added
  if (info.front === "x") workshop.front(1, 0, 0);
  if (info.focus && !workshop.focusObj) { try { workshop.focus(Function("return " + info.focus)()); } catch (e) { /* frame the whole model */ } }
  const LIST = window.WORKSHOP_LIST || [];
  const here = LIST.findIndex(i => i.id === info.id);
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem("workshop.prefs") || "{}"); } catch (e) { prefs = {}; }
  const savePrefs = () => { try { localStorage.setItem("workshop.prefs", JSON.stringify(prefs)); } catch (e) { /* private window */ } };
  const thumb = /[?&]thumb\b/.test(location.search);
  if (prefs.dark && !thumb) document.documentElement.dataset.theme = "dark";
  if (thumb) document.documentElement.classList.add("thumb");

  /* ---------- renderer, camera, controls (same colour handling as the site) ---------- */
  const stage = document.createElement("div"); stage.id = "stage"; document.body.appendChild(stage);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  stage.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 400);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotateSpeed = 1.2; controls.screenSpacePanning = true;

  /* ---------- what to frame: workshop.focus(...), else the first tagged group, else everything ---------- */
  const focus = workshop.focusObj || (hotspots[0] && hotspots[0].group) || lab;
  lab.updateMatrixWorld(true);
  function boundsOf(root) {
    const b = new THREE.Box3(), gb = new THREE.Box3();
    root.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      for (let p = o; p; p = p.parent) if (!p.visible) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      gb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); b.union(gb);
    });
    if (b.isEmpty()) b.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    return b;
  }
  const bnd = boundsOf(focus), size = bnd.getSize(new THREE.Vector3()), center = bnd.getCenter(new THREE.Vector3());
  const radius = Math.max(0.15, size.length() / 2);

  /* ---------- lights: the lab's hemisphere, sun and fill, placed around the model ---------- */
  const hemi = new THREE.HemisphereLight(0xfff4e8, 0x5f6f7a, 0.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe7cc, 1.05); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0008; sun.shadow.radius = 4;
  const sunDir = new THREE.Vector3(6, 11, 7).normalize(), S = radius * 1.6;
  sun.position.copy(center).addScaledVector(sunDir, radius * 6); sun.target.position.copy(center);
  Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: radius * 2, far: radius * 12 }); sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbfd8ff, 0.25); fill.position.copy(center).add(new THREE.Vector3(-2, 6, 10)); fill.target.position.copy(center); scene.add(fill, fill.target);

  /* ---------- floor: a 10 cm grid and a shadow catcher under the model ---------- */
  // (it sits under everything in the file, so a bench stands on it and a bench-top instrument on its own floats at its height)
  const all = boundsOf(lab), allC = all.getCenter(new THREE.Vector3()), allS = all.getSize(new THREE.Vector3());
  const floorY = all.min.y - 0.002, gsz = Math.min(40, Math.max(1, Math.ceil(Math.max(allS.x, allS.z) * 1.5 + 0.4)));
  const grid = new THREE.GridHelper(gsz, Math.round(gsz * 10), 0x7c8994, 0xb6c0c7);
  grid.material.transparent = true; grid.material.opacity = 0.35; grid.position.set(allC.x, floorY, allC.z); scene.add(grid);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(gsz * 2, gsz * 2), new THREE.ShadowMaterial({ opacity: 0.16 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.set(allC.x, floorY - 0.001, allC.z); catcher.receiveShadow = true; scene.add(catcher);

  /* ---------- views ---------- */
  const up = new THREE.Vector3(0, 1, 0), front = workshop.frontDir.clone();
  const right = new THREE.Vector3().crossVectors(up, front).normalize();
  // fit the model's bounding sphere into the part of the window the panel leaves free
  let freeH = 1, freeV = 1;                                  // share of the view's half-angles left free of the panel
  const fitDist = () => {
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), t = tv * Math.min(freeV, freeH);
    return radius / Math.sin(Math.atan(t)) * (thumb ? 0.9 : 1.2);
  };
  function view(name) {
    const d = new THREE.Vector3();
    if (name === "front") d.copy(front).addScaledVector(up, 0.12);
    else if (name === "side") d.copy(right).addScaledVector(up, 0.12);
    else if (name === "top") d.copy(up).addScaledVector(front, 0.02);
    else d.copy(front).addScaledVector(right, 0.75).addScaledVector(up, 0.55);
    camera.position.copy(center).addScaledVector(d.normalize(), fitDist());
    controls.target.copy(center); camera.near = radius / 50; camera.far = radius * 60; camera.updateProjectionMatrix(); controls.update();
  }

  /* ---------- counts ---------- */
  function stats(root) {
    let meshes = 0, tris = 0; const mats = new Set();
    root.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      for (let p = o; p; p = p.parent) if (!p.visible) return;
      const g = o.geometry, n = g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
      meshes++; tris += n * (o.isInstancedMesh ? o.count : 1);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m));
    });
    return { meshes, tris: Math.round(tris), mats: mats.size };
  }
  const st = stats(focus);
  const big = Math.max(size.x, size.y, size.z) >= 3;
  const fmt = v => big ? v.toFixed(2) : (v * 100 >= 100 ? (v * 100).toFixed(0) : (v * 100).toFixed(1));
  const unit = big ? "m" : "cm";

  /* ---------- page: info panel, toggles, part inspector, errors ---------- */
  const prev = here > 0 ? LIST[here - 1] : null, next = here >= 0 && here < LIST.length - 1 ? LIST[here + 1] : null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const panel = document.createElement("aside"); panel.className = "ws-panel";
  panel.innerHTML = `
    <div class="ws-nav"><a href="../index.html">← All instruments</a><span class="sp"></span>
      <button type="button" data-go="prev" title="${prev ? esc(prev.name) : ""} (←)" ${prev ? "" : "disabled"}>‹</button>
      <button type="button" data-go="next" title="${next ? esc(next.name) : ""} (→)" ${next ? "" : "disabled"}>›</button></div>
    <div class="ws-room">${esc(info.room || "")}</div>
    <div class="ws-title">${esc(info.name || document.title)}</div>
    <div class="ws-from">Edit <code>model.js</code> in this folder, save, then refresh this page. It's the site's own file: upload it to <code>instruments/${esc(info.id || "")}</code> on GitHub to change the site.</div>
    <dl class="ws-stats">
      <dt>Size (w × h × d)</dt><dd>${fmt(size.x)} × ${fmt(size.y)} × ${fmt(size.z)} ${unit}</dd>
      <dt>Parts</dt><dd>${st.meshes.toLocaleString()}</dd>
      <dt>Triangles</dt><dd>${st.tris.toLocaleString()}</dd>
      <dt>Materials</dt><dd>${st.mats.toLocaleString()}</dd>
    </dl>
    <div class="ws-toggles">
      <label><input type="checkbox" data-t="grid"> Grid</label>
      <label><input type="checkbox" data-t="turn"> Turntable</label>
      <label><input type="checkbox" data-t="wire"> Wireframe</label>
      <label><input type="checkbox" data-t="dark"> Dark</label>
      ${focus !== lab ? `<label title="Hide everything that isn't part of this instrument (benches, shelves)"><input type="checkbox" data-t="only"> This only</label>` : ""}
      ${workshop.anims.length ? `<label><input type="checkbox" data-t="anim"> Animate</label>` : ""}
    </div>
    <div class="ws-views"><button type="button" data-v="three">¾</button><button type="button" data-v="front">Front</button><button type="button" data-v="side">Side</button><button type="button" data-v="top">Top</button></div>
    <div class="ws-keys">Click a part to inspect it · drag to turn · right-drag to pan · scroll to zoom</div>`;
  document.body.appendChild(panel);
  const pick = document.createElement("aside"); pick.className = "ws-pick"; pick.hidden = true; document.body.appendChild(pick);
  const errBox = document.createElement("div"); errBox.className = "ws-errors"; errBox.hidden = true; errBox.setAttribute("role", "alert"); document.body.appendChild(errBox);

  window.workshopShowErrors = function () {
    if (!workshopErrors.length) { errBox.hidden = true; return; }
    errBox.hidden = false;
    errBox.innerHTML = `<b>Something in the code stopped the model from building</b>` + workshopErrors.slice(0, 4).map(e =>
      e.line ? `<div><code>${esc(e.file)}</code> line <b style="display:inline">${e.line}</b>: ${esc(e.message)}</div>`
        : `<div>${e.message && e.message !== "Script error." ? esc(e.message) + " — " : ""}Press F12 and open the Console tab to see the message and its line number. (Opened through VS Code's Live Server, the line shows here too.)</div>`).join("") +
      `<div style="opacity:.8">Whatever was built before the error is still shown.</div>`;
  };
  window.workshopShowErrors();

  /* toggles */
  const state = { grid: thumb ? false : prefs.grid !== false, turn: thumb ? false : !!prefs.turn, wire: false, dark: !!prefs.dark, only: thumb, anim: prefs.anim !== false };
  const hidden = [], wired = [];
  function apply(k) {
    if (k === "grid") grid.visible = state.grid;
    if (k === "turn") controls.autoRotate = state.turn;
    if (k === "dark") document.documentElement.dataset.theme = state.dark ? "dark" : "light";
    if (k === "wire") {
      if (state.wire) lab.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m.wireframe) { m.wireframe = true; wired.push(m); } }); });
      else { wired.forEach(m => { m.wireframe = false; }); wired.length = 0; }
    }
    if (k === "only") {
      if (state.only && focus !== lab) {
        const keep = new Set(); for (let p = focus; p; p = p.parent) keep.add(p);
        (function walk(o) { o.children.forEach(c => { if (c === focus) return; if (keep.has(c)) walk(c); else if (c.visible) { c.visible = false; hidden.push(c); } }); })(lab);
      } else { hidden.forEach(o => { o.visible = true; }); hidden.length = 0; }
    }
    if (k === "grid" || k === "turn" || k === "dark" || k === "anim") { prefs[k] = state[k]; savePrefs(); }
  }
  panel.querySelectorAll("[data-t]").forEach(inp => {
    const k = inp.dataset.t; inp.checked = !!state[k]; apply(k);
    inp.addEventListener("change", () => { state[k] = inp.checked; apply(k); });
  });
  const setT = k => { const inp = panel.querySelector(`[data-t="${k}"]`); if (!inp) return; inp.checked = !inp.checked; inp.dispatchEvent(new Event("change")); };
  panel.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => view(b.dataset.v)));
  const go = it => { if (it) location.href = "../" + it.id + "/index.html"; };
  panel.querySelector('[data-go="prev"]').addEventListener("click", () => go(prev));
  panel.querySelector('[data-go="next"]').addEventListener("click", () => go(next));
  window.addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    const k = e.key.toLowerCase();
    if (e.key === "ArrowLeft") go(prev); else if (e.key === "ArrowRight") go(next);
    else if (k === "g") setT("grid"); else if (k === "t") setT("turn"); else if (k === "w") setT("wire"); else if (k === "o") setT("only");
    else if (k === "f" || k === "1") view("three"); else if (k === "2") view("front"); else if (k === "3") view("side"); else if (k === "4") view("top");
    else if (e.key === "Escape") clearPick();
  });

  /* ---------- click a part: its shape, size, colour, position (the numbers in the code) and the line that makes it ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const outline = new THREE.BoxHelper(undefined, 0xf2b01e); outline.material.depthTest = false; outline.material.transparent = true; outline.renderOrder = 10; outline.visible = false; scene.add(outline);
  let picked = null, downAt = null;
  function clearPick() { picked = null; outline.visible = false; pick.hidden = true; }
  const n3 = v => (Math.round(v * 1000) / 1000).toString();
  function describe(o) {
    const g = o.geometry, p = g.parameters || {}, t = g.type.replace("BufferGeometry", "").replace("Geometry", "") || "Mesh";
    let shape = t, dims = "";
    if (g.type === "BoxGeometry") { shape = "box"; dims = `${n3(p.width)} × ${n3(p.height)} × ${n3(p.depth)}`; }
    else if (g.type === "CylinderGeometry") { shape = "cyl"; dims = `r ${n3(p.radiusTop)} / ${n3(p.radiusBottom)}, h ${n3(p.height)}`; }
    else if (g.type === "PlaneGeometry") { shape = "plane"; dims = `${n3(p.width)} × ${n3(p.height)}`; }
    else if (g.type === "SphereGeometry") { shape = "sphere"; dims = `r ${n3(p.radius)}`; }
    else if (g.type === "TorusGeometry") { shape = "torus"; dims = `r ${n3(p.radius)}, tube ${n3(p.tube)}`; }
    else { if (!g.boundingBox) g.computeBoundingBox(); const s = g.boundingBox.getSize(new THREE.Vector3()); dims = `${n3(s.x)} × ${n3(s.y)} × ${n3(s.z)} (bounds)`; }
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const col = m && m.color ? "0x" + m.color.getHexString() : "—";
    const kind = m ? m.type.replace("Material", "").replace("MeshStandard", "standard").replace("MeshBasic", "basic (unlit)") : "";
    let extra = [];
    if (m && m.map) extra.push("has a drawn texture");
    if (m && m.transparent) extra.push("opacity " + n3(m.opacity));
    if (m && m.metalness !== undefined) extra.push("rough " + n3(m.roughness) + " · metal " + n3(m.metalness));
    let at = o.userData.madeAt; for (let q = o; !at && q; q = q.parent) at = q.userData.madeAt;
    let lineHtml = "—";
    if (at && at.length) {
      const inner = at[0], outer = at[at.length - 1];
      const fileOf = u => decodeURIComponent(u).split("/").slice(-2).join("/");
      lineHtml = `<b>${inner.line}</b>` + (outer.line !== inner.line ? ` <span style="opacity:.7">(from line ${outer.line})</span>` : "")
        + (fileOf(inner.url) !== info.id + "/model.js" ? `<br>in ${esc(fileOf(inner.url))}` : "");
      if (location.protocol === "file:") {
        let path = decodeURIComponent(inner.url.replace(/^file:\/\//, ""));
        path = path.replace(/^\//, "");
        lineHtml += `<br><a class="open" href="vscode://file/${encodeURI(path)}:${inner.line}">Open this line in VS Code</a>`;
      }
    }
    const scaled = (() => { const s = new THREE.Vector3(); o.getWorldScale(s); return Math.abs(s.x - 1) > 1e-3 ? `<br>its group is scaled ${n3(s.x)}×` : ""; })();
    pick.innerHTML = `<h3><span class="sw" style="background:#${m && m.color ? m.color.getHexString() : "ccc"}"></span>${esc(shape)}
        <button class="x" type="button" title="Close (Esc)">×</button></h3>
      <dl><dt>Size</dt><dd>${dims}${scaled}</dd><dt>Position</dt><dd>x ${n3(o.position.x)}, y ${n3(o.position.y)}, z ${n3(o.position.z)}</dd>
      <dt>Colour</dt><dd>${col}</dd><dt>Material</dt><dd>${esc(kind)}${extra.length ? "<br>" + extra.join("<br>") : ""}</dd>
      <dt>model.js</dt><dd>line ${lineHtml}</dd></dl>
      <div class="note">Size and position are the numbers you'd see in the code (metres, in the part's own group).</div>`;
    pick.querySelector(".x").addEventListener("click", clearPick);
    pick.hidden = false;
  }
  renderer.domElement.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4 || e.button !== 0) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(lab, true).find(h => {
      if (!h.object.isMesh) return false;
      for (let p = h.object; p; p = p.parent) if (!p.visible) return false;
      return true;
    });
    if (!hit) { clearPick(); return; }
    picked = hit.object; outline.setFromObject(picked); outline.visible = true; describe(picked);
  });

  /* ---------- run ---------- */
  // on a wide window the model is centred in the space to the right of the panel
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    // (on a narrow window the panel sits on top, so the model moves down instead)
    const narrow = w < 760, s = thumb || narrow ? 0 : panel.offsetWidth + 24, v = !thumb && narrow ? Math.min(h * 0.5, panel.offsetHeight + 24) : 0;
    renderer.setSize(w, h, false);
    camera.aspect = (w + s) / (h + v); freeH = (w - s) / (h + v); freeV = (h - v) / (h + v);
    if (s || v) camera.setViewOffset(w + s, h + v, 0, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", () => { resize(); }); resize(); view("three");
  const clock = new THREE.Clock(); let time = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (state.anim && workshop.anims.length) { time += dt; workshop.anims.forEach(fn => { try { fn(dt, time); } catch (err) { workshopErrors.push({ message: String(err && err.message || err), file: "model.js", line: 0 }); workshop.anims.length = 0; window.workshopShowErrors(); } }); }
    if (picked) outline.setFromObject(picked);
    controls.update(); renderer.render(scene, camera);
  });
  window.workshopView = { renderer, camera, controls, view, stats: st, size, focus };
})();
