/* js/campus/buildings.js — Campus buildings (walls with real window openings, rooftops, entrances, signs) and the café kiosk.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// Kogason Lab, NCA (the chemistry building with the LC lab), Mathematics and the Library
function buildBuildings() {
  /* ---- buildings: walls with real window openings (reveals, frames, sills), each building in its own style ---- */
  // How each style is laid out. bay: target width of a window bay, depth: how far the glass sits back, sill / wh: where a
  // window starts and how tall it is (fractions of a storey), ww: window width for a bay width, tile: the wall texture's
  // size in metres, reveal / frame: colours of the opening's sides and the window frames.
  const STYLE = {
    lab: { bay: 3.2, depth: 0.14, sill: 0.3, wh: 0.52, ww: bw => bw - 0.42, tile: [1.5, 0.75], reveal: 0xaeb6bb, frame: 0x39424a, tint: 0xffffff },
    brick: { bay: 2.9, depth: 0.2, sill: 0.3, wh: 0.5, ww: bw => Math.min(1.5, bw * 0.5), tile: [1.8, 0.9], reveal: 0x94574a, frame: 0xf2f0ea, tint: 0xffffff },
    concrete: { bay: 3.0, depth: 0.32, sill: 0.28, wh: 0.5, ww: bw => bw - 0.95, tile: [2.4, 1.2], reveal: 0x9aa0a4, frame: 0x2f363b, tint: 0xffffff },
    stone: { bay: 2.9, depth: 0.22, sill: 0.2, wh: 0.64, ww: bw => Math.min(1.25, bw * 0.42), tile: [1.2, 0.6], reveal: 0xcbbfa4, frame: 0x3b3a36, tint: 0xffffff },
  };
  // wall textures (no windows: those are real openings now) and their bumps, one tile each
  function wallSet(style) {
    const W = 512, H = 256, c = canvasOf(W, H), hc = canvasOf(W, H), g = c.getContext("2d"), hg = hc.getContext("2d"), R = seeded(style.length * 97 + 5);
    const fill = (ctx, col, x, y, w, h) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
    const speck = (n, cols, s) => { for (let i = 0; i < n; i++) fill(g, cols[(R() * cols.length) | 0], R() * W, R() * H, s, s); };
    if (style === "brick") {   // 8 bricks by 12 courses, running bond, a few darker headers
      fill(g, "#b5a998", 0, 0, W, H); fill(hg, "#383838", 0, 0, W, H);
      const bh = H / 12, bw = W / 8;
      for (let r = 0; r < 12; r++) for (let i = -1; i < 9; i++) {
        const x = i * bw + (r % 2) * bw / 2, v = R(), dark = R() < 0.1 ? 34 : 0;
        fill(g, `rgb(${(152 + v * 38 - dark) | 0},${(72 + v * 20 - dark / 2) | 0},${(54 + v * 14 - dark / 3) | 0})`, x + 3, r * bh + 3, bw - 5, bh - 5);
        fill(hg, `rgb(${170 + v * 50 | 0},${170 + v * 50 | 0},${170 + v * 50 | 0})`, x + 3, r * bh + 3, bw - 5, bh - 5);
      }
      speck(5000, ["rgba(40,20,14,0.25)", "rgba(255,220,190,0.15)"], 1.5);
    } else if (style === "concrete") {   // board-formed: plank lines, panel joints, tie holes
      fill(g, "#9da3a6", 0, 0, W, H); fill(hg, "#808080", 0, 0, W, H);
      for (let y = 0; y < H; y += H / 8) { fill(g, `rgba(${R() < 0.5 ? "70,76,80" : "230,232,232"},0.08)`, 0, y, W, H / 8); fill(g, "rgba(60,64,66,0.16)", 0, y, W, 1.5); fill(hg, "#6a6a6a", 0, y, W, 1.5); }
      speck(9000, ["rgba(255,255,255,0.12)", "rgba(50,54,56,0.14)"], 1.5);
      fill(g, "#7a8185", 0, 0, W, 3); fill(g, "#7a8185", 0, 0, 3, H); fill(hg, "#303030", 0, 0, W, 3); fill(hg, "#303030", 0, 0, 3, H);
      [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(([u, v]) => { g.fillStyle = "#5d6468"; g.beginPath(); g.arc(u * W, v * H, 5, 0, 7); g.fill(); hg.fillStyle = "#202020"; hg.beginPath(); hg.arc(u * W, v * H, 5, 0, 7); hg.fill(); });
    } else if (style === "stone") {   // ashlar: two courses of blocks, chamfered joints, a little tooling
      fill(g, "#bcae93", 0, 0, W, H); fill(hg, "#303030", 0, 0, W, H);
      for (let r = 0; r < 2; r++) for (let i = -1; i < 3; i++) {
        const x = i * W / 2 + (r % 2) * W / 4, y = r * H / 2, v = R() * 16;
        fill(g, `rgb(${214 + v | 0},${202 + v | 0},${176 + v | 0})`, x + 4, y + 4, W / 2 - 8, H / 2 - 8); fill(hg, "#c8c8c8", x + 4, y + 4, W / 2 - 8, H / 2 - 8);
        fill(g, "rgba(255,250,235,0.35)", x + 4, y + 4, W / 2 - 8, 3); fill(g, "rgba(90,80,60,0.25)", x + 4, y + H / 2 - 7, W / 2 - 8, 3);
      }
      speck(7000, ["rgba(120,105,80,0.18)", "rgba(255,250,235,0.2)"], 1.5);
    } else {   // white composite panels with fine joints
      fill(g, "#eef1f2", 0, 0, W, H); fill(hg, "#a0a0a0", 0, 0, W, H);
      speck(3000, ["rgba(0,0,0,0.03)", "rgba(255,255,255,0.4)"], 2);
      fill(g, "#c3cbd0", 0, 0, W, 3); fill(g, "#c3cbd0", 0, 0, 3, H); fill(hg, "#404040", 0, 0, W, 3); fill(hg, "#404040", 0, 0, 3, H);
    }
    const map = new THREE.CanvasTexture(c); map.encoding = THREE.sRGBEncoding; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
    const t = STYLE[style].tile, set = { map, normalMap: normalFrom(hc, style === "brick" ? 4 : 2.5) };
    Object.values(set).forEach(x => x.repeat.set(1 / t[0], 1 / t[1]));
    return set;
  }
  const WALL = { brick: wallSet("brick"), concrete: wallSet("concrete"), stone: wallSet("stone"), lab: wallSet("lab") };
  FX.walls = WALL;   // the café borrows the brick
  // glass: by day a dim room, some with blinds; at night some windows lit (FX.windowMats switches their glow on)
  const roomTex = lit => ctex(512, 512, (g, W) => {
    const Q = W / 2;
    for (let q = 0; q < 4; q++) {
      const ox = (q % 2) * Q, oy = Math.floor(q / 2) * Q, gr = g.createLinearGradient(0, oy, 0, oy + Q);
      if (lit) { const warm = q !== 1; gr.addColorStop(0, warm ? "#ffe2ad" : "#eef4ff"); gr.addColorStop(0.5, warm ? "#a8733c" : "#8f9cb0"); gr.addColorStop(1, warm ? "#5a3e22" : "#4a5466"); }
      else { gr.addColorStop(0, "#33434d"); gr.addColorStop(0.6, "#1d2930"); gr.addColorStop(1, "#141c21"); }
      g.fillStyle = gr; g.fillRect(ox, oy, Q, Q);
      g.fillStyle = lit ? "rgba(40,26,14,0.55)" : "rgba(8,12,14,0.5)";   // shelves, a desk
      g.fillRect(ox + Q * 0.08, oy + Q * 0.45, Q * 0.18, Q * 0.55); g.fillRect(ox + Q * 0.55, oy + Q * 0.68, Q * 0.38, Q * 0.06);
      if (q >= 2) {   // blinds, half down or all the way
        const end = oy + Q * (q === 2 ? 0.45 : 1);
        for (let y = oy; y < end; y += 9) { g.fillStyle = lit ? "rgba(255,230,190,0.9)" : "#737c81"; g.fillRect(ox, y, Q, 6); g.fillStyle = lit ? "rgba(120,80,40,0.6)" : "#454d51"; g.fillRect(ox, y + 6, Q, 1.5); }
      }
    }
  });
  const dayRooms = roomTex(false), nightRooms = roomTex(true);
  const glassDark = new THREE.MeshStandardMaterial({ map: dayRooms, roughness: 0.06, metalness: 0.35, envMapIntensity: 1.1 }); glassDark.userData.env = 1.1;
  const glassLit = new THREE.MeshStandardMaterial({ map: dayRooms, emissiveMap: nightRooms, emissive: 0x000000, roughness: 0.06, metalness: 0.35, envMapIntensity: 1.1 }); FX.windowMats.push(glassLit);
  // the sides of an opening: one quad per edge of its outline, from the wall face back to the glass
  function reveal(G, pts, depth) {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
      let nx = -dy / l, ny = dx / l; if (nx * (cx - p[0]) + ny * (cy - p[1]) < 0) { nx = -nx; ny = -ny; }
      const i0 = G.position.length / 3;
      [[p, 0], [q, 0], [q, -depth], [p, -depth]].forEach(([v, zz], k) => { G.position.push(v[0], v[1], zz); G.normal.push(nx, ny, 0); G.uv.push(k === 1 || k === 2 ? l : 0, zz); });
      G.index.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    });
  }
  // One face of a building: the wall with its openings and everything set into or onto it, built in the face's own frame
  // (x along the face, y up, z out of it) and joined into one mesh per material. door: the entrance's x on this face, if any.
  function facadeFace(g, len, top, style, floors, trim, door, skipX) {
    const ST = STYLE[style], rd = ST.depth, bays = Math.max(1, Math.round(len / ST.bay)), bw = len / bays, fh = (top - 0.8) / floors, R = seeded(Math.round(len * 13 + top * 7) + style.length);
    const shape = new THREE.Shape([V(-len / 2, 0.8, 0), V(len / 2, 0.8, 0), V(len / 2, top, 0), V(-len / 2, top, 0)].map(p => new THREE.Vector2(p.x, p.y)));
    const parts = {}, add = (k, geo) => (parts[k] = parts[k] || []).push(geo), RV = { position: [], normal: [], uv: [], index: [] };
    const boxAt = (k, sx, sy, sz, px, py, pz) => add(k, new THREE.BoxGeometry(sx, sy, sz).translate(px, py, pz));
    const glassQ = (geo, x0, y0, ww, wh) => {   // map a window's glass onto one room of the atlas
      const P = geo.attributes.position, U = geo.attributes.uv, rq = R(), q = rq < 0.62 ? (rq < 0.34 ? 0 : 1) : rq < 0.9 ? 2 : 3, ou = (q % 2) * 0.5, ov = q < 2 ? 0.5 : 0;
      for (let i = 0; i < P.count; i++) U.setXY(i, ou + 0.02 + (P.getX(i) - x0) / ww * 0.46, ov + 0.02 + (P.getY(i) - y0) / wh * 0.46);
      add(R() < 0.55 ? "glassLit" : "glassDark", geo);
    };
    for (let f = 0; f < floors; f++) for (let b = 0; b < bays; b++) {
      const cx = -len / 2 + bw * (b + 0.5), ww = ST.ww(bw), wh = fh * ST.wh, y0 = 0.8 + f * fh + fh * ST.sill, x0 = cx - ww / 2, x1 = cx + ww / 2;
      if (skipX && Math.abs(cx) < skipX) continue;
      if (door != null && f === 0 && Math.abs(cx - door) < ww / 2 + 2.05) continue;   // the entrance is here
      const arch = style === "stone", r = ww / 2, ys = y0 + wh - (arch ? r : 0);
      const outline = arch ? [[x0, y0], [x1, y0], [x1, ys], ...Array.from({ length: 11 }, (_, i) => [cx + Math.cos(i / 12 * Math.PI + Math.PI / 12) * r, ys + Math.sin(i / 12 * Math.PI + Math.PI / 12) * r]), [x0, ys]] : [[x0, y0], [x1, y0], [x1, y0 + wh], [x0, y0 + wh]];
      const hole = new THREE.Path(); hole.moveTo(...outline[0]); outline.slice(1).forEach(p => hole.lineTo(...p)); hole.closePath(); shape.holes.push(hole);
      reveal(RV, outline, rd + 0.01);
      if (arch) { const s2 = new THREE.Shape(); s2.moveTo(...outline[0]); outline.slice(1).forEach(p => s2.lineTo(...p)); s2.closePath(); glassQ(new THREE.ShapeGeometry(s2, 2).translate(0, 0, -rd), x0, y0, ww, wh); }
      else glassQ(new THREE.PlaneGeometry(ww, wh).translate(cx, y0 + wh / 2, -rd), x0, y0, ww, wh);
      // frames: a perimeter, then the style's mullions
      const fz = -rd + 0.04, t = 0.06;
      boxAt("frame", ww, t, 0.07, cx, y0 + t / 2, fz); [x0 + t / 2, x1 - t / 2].forEach(xx => boxAt("frame", t, arch ? ys - y0 : wh, 0.07, xx, y0 + (arch ? ys - y0 : wh) / 2, fz));
      if (!arch) boxAt("frame", ww, t, 0.07, cx, y0 + wh - t / 2, fz);
      if (style === "lab") { const n = Math.max(1, Math.round(ww / 1.4)); for (let i = 1; i < n; i++) boxAt("frame", 0.045, wh, 0.07, x0 + ww * i / n, y0 + wh / 2, fz); boxAt("frame", ww, 0.045, 0.07, cx, y0 + wh * 0.78, fz); }
      else if (style === "brick") { boxAt("frame", 0.05, wh, 0.07, cx, y0 + wh / 2, fz); boxAt("frame", ww, 0.05, 0.07, cx, y0 + wh * 0.64, fz); }
      else if (style === "concrete") { boxAt("frame", 0.05, wh, 0.07, cx, y0 + wh / 2, fz); }
      else { boxAt("frame", 0.05, ys - y0, 0.07, cx, (y0 + ys) / 2, fz); boxAt("frame", ww, 0.05, 0.07, cx, ys, fz); }
      // sills, lintels, arch surrounds
      if (style === "brick") { boxAt("stone", ww + 0.18, 0.08, 0.14, cx, y0 - 0.04, 0.05); boxAt("stone", ww + 0.3, 0.22, 0.05, cx, y0 + wh + 0.11, 0.02); }
      else if (style === "stone") {
        boxAt("stone", ww + 0.32, 0.1, 0.16, cx, y0 - 0.05, 0.06); boxAt("stone", 0.2, 0.32, 0.07, cx, ys + r + 0.1, 0.03);
        add("stone", new THREE.RingGeometry(r, r + 0.15, 18, 1, 0, Math.PI).translate(cx, ys, 0.012));
        [x0 - 0.075, x1 + 0.075].forEach(xx => add("stone", new THREE.PlaneGeometry(0.15, ys - y0).translate(xx, (y0 + ys) / 2, 0.012)));
      } else if (style === "lab") boxAt("sill", ww, 0.05, 0.1, cx, y0 - 0.025, 0.03);
      else boxAt("sill", ww + 0.1, 0.06, rd + 0.04, cx, y0 - 0.03, -rd / 2 + 0.02);
    }
    // what runs across or up the whole face
    const mid = (0.8 + top) / 2, H = top - 0.8, near = xx => door != null && Math.abs(xx - door) < 2.3;
    // a band across the face; low ones stop either side of the entrance
    const band = (k, y, hh, dep, zc, ext) => {
      const L0 = -len / 2 - ext / 2, L1 = len / 2 + ext / 2;
      if (door == null || y - hh / 2 > 5.6) { boxAt(k, L1 - L0, hh, dep, 0, y, zc); return; }
      [[L0, door - 2.35], [door + 2.35, L1]].forEach(([a, b]) => { if (b - a > 0.05) boxAt(k, b - a, hh, dep, (a + b) / 2, y, zc); });
    };
    if (style === "lab") {
      for (let f = 0; f < floors; f++) band("blue", 0.8 + f * fh + fh * ST.sill - 0.3, 0.3, 0.035, 0.018, 0);
      for (let b = 1; b < bays; b++) { const xb = -len / 2 + bw * b; if (!near(xb) && !(skipX && Math.abs(xb) < skipX)) boxAt("fin", 0.08, H, 0.42, xb, mid, 0.21); }
    } else if (style === "brick") {
      for (let f = 1; f < floors; f++) band("stone", 0.8 + f * fh, 0.14, 0.07, 0.035, 0);
      boxAt("stone", len + 0.12, 0.22, 0.22, 0, top - 0.11, 0.1); boxAt("stone", len + 0.04, 0.1, 0.1, 0, top - 0.27, 0.05);
    } else if (style === "concrete") {
      for (let b = 1; b < bays; b++) { const xb = -len / 2 + bw * b; if (!near(xb)) boxAt("pier", 0.5, H, 0.3, xb, mid, 0.15); }
      for (let f = 1; f < floors; f++) band("pier", 0.8 + f * fh, 0.42, 0.22, 0.11, 0);
      boxAt("pier", len, 0.5, 0.26, 0, top - 0.25, 0.13);
    } else {
      for (let b = 1; b < bays; b++) { const xb = -len / 2 + bw * b; if (skipX && Math.abs(xb) < skipX) continue; boxAt("stone", 0.42, H - 0.5, 0.1, xb, 0.8 + (H - 0.5) / 2, 0.05); boxAt("stone", 0.56, 0.18, 0.16, xb, top - 0.59, 0.08); }
      for (let f = 1; f < floors; f++) band("stone", 0.8 + f * fh - 0.1, 0.16, 0.08, 0.04, 0);
      boxAt("stone", len + 0.2, 0.3, 0.3, 0, top - 0.15, 0.14);
      for (let xd = -len / 2 + 0.15; xd < len / 2 - 0.1; xd += 0.3) boxAt("stone", 0.13, 0.14, 0.12, xd, top - 0.37, 0.06);
    }
    // join and add: the wall, its reveals, then one mesh per material
    const wallM = new THREE.MeshStandardMaterial({ ...WALL[style], color: ST.tint, roughness: style === "lab" ? 0.55 : 0.9 });
    const wm = new THREE.Mesh(new THREE.ShapeGeometry(shape, 4), wallM); wm.receiveShadow = true; g.add(wm);
    const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(RV.position, 3)); rg.setAttribute("normal", new THREE.Float32BufferAttribute(RV.normal, 3)); rg.setAttribute("uv", new THREE.Float32BufferAttribute(RV.uv, 2)); rg.setIndex(RV.index);
    const rm = new THREE.Mesh(rg, mat(ST.reveal, { roughness: 0.85 })); rm.receiveShadow = true; g.add(rm);
    const M = { frame: mat(ST.frame, { roughness: 0.45, metalness: style === "lab" || style === "concrete" ? 0.6 : 0.1 }), stone: mat(trim, { roughness: 0.75 }), sill: mat(style === "lab" ? 0xc9d0d4 : 0x8f969a, { roughness: 0.6, metalness: style === "lab" ? 0.5 : 0 }),
      blue: mat(0x0b5fa8, { roughness: 0.4, metalness: 0.3 }), fin: mat(0xf4f6f6, { roughness: 0.5 }), pier: new THREE.MeshStandardMaterial({ ...WALL.concrete, roughness: 0.9 }), glassLit, glassDark };
    Object.keys(parts).forEach(k => { const m = new THREE.Mesh(joinGeos(parts[k]), M[k]); m.castShadow = !k.startsWith("glass"); m.receiveShadow = true; g.add(m); });
  }
  // things on the roofs: solar panels on the lab, fume-hood exhaust stacks on NCA (it's the chemistry building),
  // a glass skylight on Mathematics, and a copper dome over the library's rotunda
  function rooftop(o) {
    const { x, z, w, d, h, style } = o, top = h + 0.74;
    if (style === "lab") {
      const cells = ctex(256, 128, (g, W, H) => { g.fillStyle = "#c9d2da"; g.fillRect(0, 0, W, H); for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { g.fillStyle = (i + j) % 3 ? "#16264a" : "#1b2d57"; g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28); } });
      const panelM = new THREE.MeshStandardMaterial({ map: cells, roughness: 0.25, metalness: 0.5 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.2), panelM); p.position.set(x - w / 2 + 2.2 + c * 2.9, top + 0.42, z - d / 2 + 1.6 + r * 1.9); p.rotation.x = -0.4; p.castShadow = true; world.add(p);
        wbox(0.06, 0.35, 0.06, 0x9aa3a8, p.position.x, top + 0.17, p.position.z + 0.35); wbox(0.06, 0.6, 0.06, 0x9aa3a8, p.position.x, top + 0.3, p.position.z - 0.35);
      }
    } else if (style === "brick") {
      wbox(3.2, 1.0, 1.6, 0x9aa3a8, x + 3.5, top + 0.5, z - 6, { metalness: 0.5, roughness: 0.4 });
      [-1, 0, 1].forEach(i => { wcyl(0.24, 0.28, 3.4, 0xb8bfc3, x + 3.5 + i * 1.0, top + 1.0 + 1.7, z - 6, 18, { metalness: 0.7, roughness: 0.3 }); wcyl(0.33, 0.33, 0.12, 0x6f777b, x + 3.5 + i * 1.0, top + 4.45, z - 6, 18, { metalness: 0.6, roughness: 0.4 }); });
    } else if (style === "concrete") {
      wbox(4.4, 0.4, 3.4, 0x9aa0a4, x - 1, top + 0.2, z - 6, { roughness: 0.9 });
      const sky = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4, 1), new THREE.MeshStandardMaterial({ color: 0x8fb4c6, roughness: 0.05, metalness: 0.7 })); sky.rotation.y = Math.PI / 4; sky.position.set(x - 1, top + 1.1, z - 6); sky.scale.set(1, 1, 0.78); sky.castShadow = true; world.add(sky);
    } else {
      const copper = new THREE.MeshStandardMaterial({ color: 0x5f9c87, roughness: 0.55, metalness: 0.35 }), stoneM = mat(o.trim, { roughness: 0.75 });
      wcyl(3.7, 3.8, 1.8, stoneM, x, top + 0.9, z, 48); wcyl(3.95, 3.95, 0.22, stoneM, x, top + 1.9, z, 48);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; wbox(0.2, 1.2, 0.2, o.trim, x + Math.cos(a) * 3.78, top + 0.95, z + Math.sin(a) * 3.78); }
      const dome = new THREE.Mesh(new THREE.SphereGeometry(3.6, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), copper); dome.position.set(x, top + 2.0, z); dome.scale.y = 0.85; dome.castShadow = dome.receiveShadow = true; world.add(dome);
      for (let i = 0; i < 12; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(3.62, 0.05, 6, 24, Math.PI / 2), copper); rib.position.set(x, top + 2.0, z); rib.rotation.set(0, i / 12 * Math.PI * 2, Math.PI / 2); rib.scale.set(0.85, 1, 1); world.add(rib); }
      wcyl(0.7, 0.8, 1.0, stoneM, x, top + 2.0 + 3.06 + 0.5, z, 24); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), copper); cap.position.set(x, top + 6.06, z); world.add(cap);
      wcyl(0.04, 0.06, 0.9, 0xc9a14a, x, top + 6.86 + 0.45, z, 8, { metalness: 0.9, roughness: 0.3 });
    }
  }
  // doorX / doorZ slide the entrance along its face so it lines up with the path that leads to it
  function building(o) {
    const { x, z, w, d, h, style, name, door, wall, trim } = o, floors = Math.max(1, Math.round((h - 1.6) / 3.4)), rd = STYLE[style].depth;
    wbox(w - 2 * rd - 0.04, h, d - 2 * rd - 0.04, 0x262e33, x, h / 2, z, { roughness: 0.9 });   // the core, behind the walls' openings
    wbox(w + 0.24, 0.8, d + 0.24, style === "brick" ? 0x8f8679 : 0x8a8478, x, 0.4, z, { roughness: 0.9 });
    wbox(w + 0.5, 0.32, d + 0.5, trim, x, h - 0.1, z, { roughness: 0.6 });
    wbox(w + 0.2, 0.7, d + 0.2, trim, x, h + 0.35, z, { roughness: 0.7 });
    wbox(w - 0.4, 0.04, d - 0.4, 0x7c7f7e, x, h + 0.72, z, { roughness: 1 });   // roof membrane inside the parapet
    wbox(2.4, 1.2, 1.8, 0xaab3b8, x - w * 0.2, h + 1.1, z + d * 0.1, { metalness: 0.5, roughness: 0.4 }); wbox(1.5, 0.9, 1.5, 0xaab3b8, x + w * 0.22, h + 0.95, z - d * 0.15, { metalness: 0.5, roughness: 0.4 });
    rooftop(o);
    // the four faces; the one with the entrance leaves room for it (and the library's portico, o.portico metres either side)
    const dRy = { n: Math.PI, s: 0, e: Math.PI / 2, w: -Math.PI / 2 }[door], dEx = o.doorX != null ? o.doorX : x + { n: 0, s: 0, e: w / 2, w: -w / 2 }[door], dEz = o.doorZ != null ? o.doorZ : z + { n: -d / 2, s: d / 2, e: 0, w: 0 }[door];
    [[w, 0, d / 2 + 0.03, 0], [w, 0, -d / 2 - 0.03, Math.PI], [d, w / 2 + 0.03, 0, Math.PI / 2], [d, -w / 2 - 0.03, 0, -Math.PI / 2]].forEach(([len, ox, oz, fr]) => {
      const g = new THREE.Group(); g.position.set(x + ox, 0, z + oz); g.rotation.y = fr; world.add(g);
      const mine = Math.abs(Math.atan2(Math.sin(fr - dRy), Math.cos(fr - dRy))) < 0.01, dl = mine ? (dEx - g.position.x) * Math.cos(fr) - (dEz - g.position.z) * Math.sin(fr) : null;
      facadeFace(g, len, h - 0.2, style, floors, trim, dl, mine ? o.portico : 0);
    });
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => wbox(0.36, h - 0.6, 0.36, trim, x + sx * w / 2, (h - 0.6) / 2 + 0.3, z + sz * d / 2, { roughness: 0.7 }));
    const s = { n: [0, -d / 2, Math.PI], s: [0, d / 2, 0], e: [w / 2, 0, Math.PI / 2], w: [-w / 2, 0, -Math.PI / 2] }[door];
    const ex = o.doorX != null ? o.doorX : x + s[0], ez = o.doorZ != null ? o.doorZ : z + s[1], ry = s[2], fx = Math.sin(ry), fz = Math.cos(ry);
    const ent = new THREE.Group(); ent.position.set(ex, 0, ez); ent.rotation.y = ry; world.add(ent);
    // glass shows a dim lobby at night (the facade windows' emissive switch lights it), reflects the sky by day
    const lobby = ctex(256, 256, (g, cw, ch) => {
      const gr = g.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, "#8a6a40"); gr.addColorStop(0.55, "#3a2c1c"); gr.addColorStop(1, "#5a4630"); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
      [[0.3, 0.12], [0.7, 0.12]].forEach(([x, y]) => { const r = g.createRadialGradient(x * cw, y * ch, 0, x * cw, y * ch, cw * 0.35); r.addColorStop(0, "rgba(255,226,170,0.9)"); r.addColorStop(1, "rgba(255,226,170,0)"); g.fillStyle = r; g.fillRect(0, 0, cw, ch); });
      g.fillStyle = "rgba(20,14,8,0.6)"; g.fillRect(cw * 0.12, ch * 0.5, cw * 0.18, ch * 0.5); g.fillRect(cw * 0.72, ch * 0.42, cw * 0.14, ch * 0.58);
    });
    const glassM = new THREE.MeshStandardMaterial({ color: 0x1d2a33, roughness: 0.05, metalness: 0.85, emissive: 0x000000, emissiveMap: lobby }); FX.windowMats.push(glassM);
    const bronze = mat(0x3b4045, { metalness: 0.75, roughness: 0.35 }), stoneM = mat(trim, { roughness: 0.7 }), stepM = mat(0xc7c1b6, { roughness: 0.85 });
    // a landing at door height and two steps down to the path; the door sits on the landing
    const LH = 0.42;
    box(4.2, LH, 1.1, stepM, 0, LH / 2, 0.67, ent); box(4.2, LH * 2 / 3, 0.38, stepM, 0, LH / 3, 1.41, ent); box(4.2, LH / 3, 0.38, stepM, 0, LH / 6, 1.79, ent);
    [-2.16, 2.16].forEach(dx => box(0.14, LH + 0.08, 1.88, stoneM, dx, (LH + 0.08) / 2, 1.06, ent));                  // cheek walls either side of the steps
    // portal: stone jambs and lintel stand proud of the wall and frame the doors
    const DW2 = 2.6, DH2 = 2.75, DY = LH;
    [-1, 1].forEach(sd => box(0.34, DH2 + 0.75, 0.32, stoneM, sd * (DW2 / 2 + 0.17), DY + (DH2 + 0.75) / 2, 0.16, ent));
    box(DW2 + 0.68, 0.36, 0.34, stoneM, 0, DY + DH2 + 0.57, 0.17, ent);
    // transom over the doors, then two leaves with deep bronze frames, glass, pull handles and kick plates
    box(DW2, 0.5, 0.05, glassM, 0, DY + DH2 + 0.18, 0.06, ent); box(DW2, 0.06, 0.09, bronze, 0, DY + DH2 - 0.04, 0.07, ent);
    [-1, 1].forEach(sd => {
      const cx = sd * DW2 / 4;
      box(DW2 / 2 - 0.02, DH2 - 0.08, 0.04, bronze, cx, DY + (DH2 - 0.08) / 2, 0.05, ent);
      box(DW2 / 2 - 0.22, DH2 - 0.62, 0.05, glassM, cx, DY + 0.38 + (DH2 - 0.62) / 2, 0.06, ent);
      box(DW2 / 2 - 0.16, 0.26, 0.012, mat(0xb9c0c4, { metalness: 0.8, roughness: 0.3 }), cx, DY + 0.17, 0.08, ent);
      box(0.035, 0.9, 0.035, mat(0xd9dfe2, { metalness: 0.9, roughness: 0.2 }), sd * 0.1, DY + 1.1, 0.13, ent);
      [DY + 0.75, DY + 1.45].forEach(y => box(0.03, 0.03, 0.08, mat(0xd9dfe2, { metalness: 0.9, roughness: 0.2 }), sd * 0.1, y, 0.1, ent));
    });
    if (style !== "stone") box(4.6, 0.2, 2.0, 0xf0f2f1, 0, DY + DH2 + 0.95, 1.0, ent, { roughness: 0.5 });
    const signTex = ctex(1024, 128, (g, cw, ch) => { g.fillStyle = "#1c252b"; g.fillRect(0, 0, cw, ch); g.fillStyle = "#ffffff"; g.font = "600 70px 'Bricolage Grotesque', 'Segoe UI', sans-serif"; g.textAlign = "center"; g.fillText(name, cw / 2, ch * 0.7); });
    plane(4.3, 0.54, new THREE.MeshBasicMaterial({ map: signTex }), 0, DY + DH2 + (style !== "stone" ? 1.45 : 1.15), 0.2, 0, ent);
    [-2.0, 2.0].forEach(dx => { box(0.14, 0.32, 0.12, 0x2a3034, dx, DY + 2.1, 0.08, ent); const l = box(0.1, 0.22, 0.02, new THREE.MeshBasicMaterial({ color: 0x8a8f8f }), dx, DY + 2.1, 0.15, ent); FX.carLights.push(l.material); });
    // planted beds either side of the steps, from o.beds metres beside the door (past the library's portico) to near each corner
    const along = (px, pz) => (px - ex) * Math.cos(ry) - (pz - ez) * Math.sin(ry);
    const ends = door === "s" || door === "n" ? [along(x - w / 2, ez), along(x + w / 2, ez)] : [along(ex, z - d / 2), along(ex, z + d / 2)];
    entranceBeds(ex, ez, ry, o.beds || 2.5, -Math.min(...ends) - 0.6, Math.max(...ends) - 0.6);
    CAMPUS.boxes.push([x - w / 2 - 0.2, z - d / 2 - 0.2, x + w / 2 + 0.2, z + d / 2 + 0.2, "building", h + 0.74]);   // last: roof height
    CAMPUS.bldg.push({ x, z, w, d, name, door: [ex + fx * 0.6, ez + fz * 0.6] });
  }
  building({ x: 0, z: -24, w: 16, d: 12, h: 7.4, style: "lab", name: "Kogason Lab", door: "s", wall: 0xe6e9ea, trim: 0xf4f6f6 });
  building({ x: 40, z: -2, w: 16, d: 20, h: 10.6, style: "brick", name: "NCA", door: "w", doorZ: 0, wall: 0xa86a52, trim: 0xe4ddd0 });
  building({ x: -40, z: -4, w: 16, d: 18, h: 9.4, style: "concrete", name: "Mathematics", door: "e", doorZ: 0, wall: 0xa9afb3, trim: 0xc8cdd0 });
  building({ x: 0, z: 42, w: 32, d: 12, h: 9.4, style: "stone", name: "Library", door: "n", beds: 7.4, portico: 7.6, wall: 0xd6cab0, trim: 0xece4d2 });
  for (let i = 0; i < 6; i++) { const cx = -5 + i * 2, col = new THREE.Mesh(new THREE.LatheGeometry([[0.48, 0], [0.48, 0.25], [0.36, 0.35], [0.33, 5.8], [0.44, 5.95], [0.44, 6.2]].map(p => new THREE.Vector2(p[0], p[1])), 24), mat(0xf1ece2, { roughness: 0.6 })); col.position.set(cx, 0, 34.7); col.castShadow = col.receiveShadow = true; world.add(col); CAMPUS.circles.push([cx, 34.7, 0.45, "column"]); }
  const ped2 = new THREE.Shape([V(-7, 0, 0), V(7, 0, 0), V(0, 1.6, 0)].map(p => new THREE.Vector2(p.x, p.y)));
  const pedi = new THREE.Mesh(new THREE.ExtrudeGeometry(ped2, { depth: 2.6, bevelEnabled: false }), mat(0xf1ece2, { roughness: 0.6 })); pedi.position.set(0, 6.55, 33.9); pedi.castShadow = true; world.add(pedi);
  wbox(14.4, 0.4, 2.8, 0xece4d2, 0, 6.4, 35.2, { roughness: 0.6 });
}

// Retention Time, the campus coffee shop: brick walls, a green timber shopfront with steel-framed glass, a room you can
// see into (espresso machine, grinders, menu boards, a pastry case, pendant lights, a window bar), an awning, and a
// terrace with bistro tables, parasols, planters, an A-board and string lights. At night the room glows (FX.windowMats).
function buildCafe() {
  const X0 = -20.5, X1 = -13.5, CX = -17, ZB = -14.5, ZF = -9.5, H = 3.6;
  const green = mat(0x1f3d33, { roughness: 0.55 }), steel = mat(0x1d2124, { roughness: 0.4, metalness: 0.6 }), brass = mat(0xc9a14a, { roughness: 0.3, metalness: 0.9 });
  const oak = mat(0x5e3b22, { roughness: 0.55 }), marble = mat(0xeeeae4, { roughness: 0.25 }), cream = mat(0xf3ede0, { roughness: 0.7 });
  const lit = (map, color) => { const m = new THREE.MeshStandardMaterial({ map, color: color || 0xffffff, emissiveMap: map, emissive: 0x000000, roughness: 0.8 }); FX.windowMats.push(m); return m; };
  // shell: brick sides and back, a roof slab with a dark cornice; the inside of the walls is exposed brick too
  const brick = (w, h) => new THREE.MeshStandardMaterial({ ...setRepeat(FX.walls.brick, w / 1.8, h / 0.9), roughness: 0.9 });
  wbox(0.22, H, 5, brick(5, H), X0 + 0.11, H / 2, (ZB + ZF) / 2); wbox(0.22, H, 5, brick(5, H), X1 - 0.11, H / 2, (ZB + ZF) / 2); wbox(7, H, 0.22, brick(7, H), CX, H / 2, ZB + 0.11);
  wbox(7.4, 0.28, 5.4, 0x2b2f31, CX, H + 0.14, (ZB + ZF) / 2, { roughness: 0.8 }); wbox(7.5, 0.12, 5.5, 0x1f3d33, CX, H + 0.32, (ZB + ZF) / 2, { roughness: 0.6 });
  wbox(0.9, 0.7, 0.9, 0xa5adb2, CX + 2.2, H + 0.63, ZB + 1.2, { metalness: 0.5, roughness: 0.4 }); wcyl(0.1, 0.1, 1.1, 0x8c9499, CX - 2.4, H + 0.83, ZB + 0.8, 12, { metalness: 0.7, roughness: 0.3 });   // a unit and the roaster's flue
  // the room: plank floor, white tiles behind the counter, dark green paint above, a ceiling (all lit from inside at night)
  const planks = ctex(512, 256, (g, w, h) => { for (let i = 0; i < 16; i++) { const v = 100 + Math.random() * 40 | 0; g.fillStyle = `rgb(${v + 40},${v},${v - 40})`; g.fillRect(0, i * h / 16, w, h / 16 - 1); g.fillStyle = "rgba(40,24,12,0.5)"; g.fillRect(Math.random() * w, i * h / 16, 2, h / 16); } });
  planks.repeat.set(2, 2);
  const tiles = ctex(256, 256, (g, w) => { g.fillStyle = "#cfd2cf"; g.fillRect(0, 0, w, w); for (let r = 0; r < 16; r++) for (let c = -1; c < 9; c++) { g.fillStyle = "#f6f6f2"; g.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } });
  tiles.repeat.set(6, 1.2);
  const paint = ctex(64, 64, g => { g.fillStyle = "#264a3d"; g.fillRect(0, 0, 64, 64); });
  box(6.56, 0.06, 4.6, lit(planks), CX, 0.03, (ZB + ZF) / 2 + 0.1, world);
  box(6.56, 1.3, 0.04, lit(tiles), CX, 0.7, ZB + 0.24, world); box(6.56, H - 1.4, 0.04, lit(paint), CX, 1.35 + (H - 1.4) / 2, ZB + 0.24, world);
  box(6.56, 0.04, 4.6, lit(ctex(64, 64, g => { g.fillStyle = "#e9e2d4"; g.fillRect(0, 0, 64, 64); })), CX, H - 0.04, (ZB + ZF) / 2 + 0.1, world);
  // the menu: three chalkboards over the back counter
  const MENU = [["ESPRESSO", [["Espresso", "3.0"], ["Cortado", "3.8"], ["Flat white", "4.2"], ["Latte", "4.5"]]], ["BREWED", [["Pour over", "4.0"], ["Cold brew", "4.5"], ["Batch", "2.8"], ["Tea", "3.0"]]], ["BAKED", [["Croissant", "3.5"], ["Pain au choc.", "3.9"], ["Banana bread", "3.2"], ["Cookie", "2.5"]]]];
  MENU.forEach(([title, rows], i) => {
    const t = ctex(256, 320, (g, w, h) => {
      g.fillStyle = "#1d2321"; g.fillRect(0, 0, w, h); g.strokeStyle = "#b08a52"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = "#f2efe6"; g.textAlign = "center"; g.font = "700 34px Georgia, serif"; g.fillText(title, w / 2, 58);
      g.font = "400 22px Georgia, serif"; rows.forEach(([n, p], k) => { g.textAlign = "left"; g.fillText(n, 24, 112 + k * 50); g.textAlign = "right"; g.fillText(p, w - 24, 112 + k * 50); });
    });
    box(1.15, 1.42, 0.05, lit(t), CX - 1.9 + i * 1.9, 2.55, ZB + 0.28, world);
  });
  // the back counter: espresso machine with three group heads, two grinders, stacked cups
  box(6.2, 0.9, 0.6, oak, CX, 0.45, ZB + 0.6, world); box(6.3, 0.05, 0.66, marble, CX, 0.925, ZB + 0.6, world);
  box(1.1, 0.5, 0.52, mat(0xbfc6ca, { metalness: 0.85, roughness: 0.25 }), CX - 0.3, 1.2, ZB + 0.6, world); box(1.12, 0.08, 0.54, steel, CX - 0.3, 1.49, ZB + 0.6, world);
  [-0.65, -0.3, 0.05].forEach(dx => { cyl(0.045, 0.045, 0.08, steel, CX + dx, 1.07, ZB + 0.9, world, 12); const h = box(0.03, 0.03, 0.2, mat(0x111111), CX + dx, 1.03, ZB + 1.02, world); h.rotation.x = 0.15; });
  for (let k = 0; k < 8; k++) cyl(0.04, 0.032, 0.06, cream, CX - 0.6 + (k % 4) * 0.12, 1.56 + Math.floor(k / 4) * 0.065, ZB + 0.55, world, 12);
  [CX + 0.9, CX + 1.35].forEach(gx => { box(0.22, 0.35, 0.28, steel, gx, 1.12, ZB + 0.62, world); const hop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.26, 16), new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.4, transparent: true, opacity: 0.85 })); hop.position.set(gx, 1.43, ZB + 0.62); world.add(hop); });
  // the front counter with a pastry case and a till
  box(3.6, 1.0, 0.6, oak, CX - 0.4, 0.5, -12.1, world); box(3.7, 0.05, 0.7, marble, CX - 0.4, 1.025, -12.1, world);
  for (let i = 0; i < 18; i++) box(0.05, 0.9, 0.02, mat(0x6e4a2e, { roughness: 0.6 }), CX - 2.1 + i * 0.2, 0.47, -11.79, world);   // slatted front
  const caseG = new THREE.MeshStandardMaterial({ color: 0xe8f4f8, roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false });
  box(1.1, 0.42, 0.55, caseG, CX - 1.55, 1.26, -12.1, world).castShadow = false;
  for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.025, 6, 10, Math.PI), mat(i % 3 ? 0xc98a3c : 0x6b3d1e, { roughness: 0.6 })); p.position.set(CX - 1.95 + (i % 5) * 0.2, 1.08 + Math.floor(i / 5) * 0.18, -12.1); p.rotation.x = -Math.PI / 2; world.add(p); }
  box(0.3, 0.06, 0.25, steel, CX + 0.9, 1.08, -12.15, world); const scr = box(0.26, 0.18, 0.02, lit(ctex(64, 48, g => { g.fillStyle = "#cfe8ff"; g.fillRect(0, 0, 64, 48); })), CX + 0.9, 1.2, -12.2, world); scr.rotation.x = -0.4;
  // pendant lights over the counter (always on: it's open)
  const bulbM = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  [-2.1, -0.9, 0.3, 1.5].forEach(dx => {
    cyl(0.006, 0.006, 0.9, mat(0x111111), CX + dx, H - 0.45, -12.6, world, 4);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f3d33, roughness: 0.5, side: THREE.DoubleSide })); shade.position.set(CX + dx, H - 0.95, -12.6); world.add(shade);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), bulbM); b.position.set(CX + dx, H - 1.06, -12.6); world.add(b);
  });
  // a bar along the window with stools, and a plant in the corner
  box(2.6, 0.05, 0.36, oak, CX - 1.9, 1.05, ZF - 0.35, world); [-2.9, -1.9, -0.9].forEach(dx => { cyl(0.16, 0.16, 0.05, oak, CX + dx, 0.72, ZF - 0.85, world, 16); cyl(0.025, 0.025, 0.7, steel, CX + dx, 0.36, ZF - 0.85, world, 8); cyl(0.17, 0.17, 0.02, steel, CX + dx, 0.01, ZF - 0.85, world, 16); });
  cyl(0.24, 0.18, 0.45, 0xb9b2a6, X1 - 0.5, 0.22, ZF - 0.6, world, 20); shrubs.push([X1 - 0.5, 0.44, ZF - 0.6, 0.55, "laurel", 0.7]);
  // shopfront: a green stall riser and fascia, steel mullions, glass, and a glazed door with a brass bar and an OPEN sign
  wbox(7, 0.45, 0.16, green, CX, 0.225, ZF); wbox(7.2, 0.72, 0.26, green, CX, H - 0.36, ZF + 0.02);
  const sign = ctex(1024, 128, (g, w, h) => { g.fillStyle = "#1f3d33"; g.fillRect(0, 0, w, h); g.fillStyle = "#e3c27a"; g.textAlign = "center"; g.font = "700 64px Georgia, serif"; g.fillText("RETENTION  TIME", w / 2, 70); g.font = "400 22px Georgia, serif"; g.fillText("COFFEE  ·  TEA  ·  PASTRIES      EST. 2010", w / 2, 108); });
  plane(6.6, 0.62, lit(sign), CX, H - 0.36, ZF + 0.155, 0, world);   // lit at night
  const glassM = new THREE.MeshStandardMaterial({ color: 0xd8e8ee, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.2, depthWrite: false }); glassM.userData.env = 1.4;
  const GY0 = 0.45, GY1 = H - 0.72, DX0 = CX + 0.75, DX1 = CX + 1.85;   // door between DX0 and DX1
  [X0 + 0.25, CX - 1.9, DX0, DX1, X1 - 0.25].forEach(x => wbox(0.07, GY1 - GY0, 0.1, steel, x, (GY0 + GY1) / 2, ZF));
  wbox(7 - 0.4, 0.07, 0.1, steel, CX, GY1 - 0.55, ZF); wbox(7 - 0.4, 0.06, 0.1, steel, CX, GY0 + 0.03, ZF);
  [[X0 + 0.25, CX - 1.9], [CX - 1.9, DX0], [DX1, X1 - 0.25]].forEach(([a, b]) => { const p = plane(b - a - 0.07, GY1 - GY0, glassM, (a + b) / 2, (GY0 + GY1) / 2, ZF, 0, world); p.castShadow = false; p.renderOrder = 2; });
  const door = plane(DX1 - DX0 - 0.16, GY1 - GY0 - 0.1, glassM, (DX0 + DX1) / 2, (GY0 + GY1) / 2 - 0.05, ZF + 0.02, 0, world); door.renderOrder = 2;
  wbox(DX1 - DX0 - 0.1, 0.1, 0.05, green, (DX0 + DX1) / 2, GY0 + 0.1, ZF + 0.03); wbox(0.05, 0.9, 0.05, brass, DX0 + 0.2, 1.15, ZF + 0.08);
  const open = ctex(128, 64, (g, w, h) => { g.fillStyle = "#1d2321"; g.fillRect(0, 0, w, h); g.fillStyle = "#ff6a4a"; g.font = "700 34px sans-serif"; g.textAlign = "center"; g.fillText("OPEN", w / 2, 44); });
  plane(0.34, 0.17, new THREE.MeshBasicMaterial({ map: open }), (DX0 + DX1) / 2, 1.7, ZF + 0.035, 0, world);
  // a hanging blade sign at the corner: a coffee cup
  wbox(0.04, 0.04, 0.7, steel, X1 - 0.12, H - 0.95, ZF + 0.35); 
  const cup = ctex(128, 128, (g, w) => { g.fillStyle = "#1f3d33"; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = "#e3c27a"; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke(); g.fillStyle = "#e3c27a"; g.fillRect(36, 52, 44, 34); g.beginPath(); g.arc(84, 66, 10, -1.6, 1.6); g.stroke(); g.fillRect(30, 88, 56, 5); [46, 58, 70].forEach(x => { g.fillRect(x, 32, 3, 14); }); });
  const blade = plane(0.55, 0.55, new THREE.MeshStandardMaterial({ map: cup, roughness: 0.5, side: THREE.DoubleSide }), X1 - 0.12, H - 1.3, ZF + 0.5, Math.PI / 2, world); blade.castShadow = true;
  // the awning: striped canvas sloping out from under the fascia, a scalloped valance, two arms
  const stripes = ctex(512, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f1ead8" : "#24493c"; g.fillRect(i * w / 16, 0, w / 16, h); } });
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.45), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.8, side: THREE.DoubleSide }));
  awn.position.set(CX, H - 0.98, ZF + 0.66); awn.rotation.x = -Math.PI / 2 + 0.38; awn.castShadow = awn.receiveShadow = true; world.add(awn);
  const val = ctex(512, 64, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f1ead8" : "#24493c"; g.fillRect(i * w / 16, 0, w / 16, h * 0.55); g.beginPath(); g.arc((i + 0.5) * w / 16, h * 0.55, w / 32, 0, Math.PI); g.fill(); } });
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 0.28), new THREE.MeshStandardMaterial({ map: val, alphaTest: 0.5, roughness: 0.8, side: THREE.DoubleSide }));
  valance.position.set(CX, H - 1.4, ZF + 1.33); valance.castShadow = true; world.add(valance);
  [X0 + 0.4, X1 - 0.4].forEach(x => { const arm = cyl(0.02, 0.02, 1.5, steel, x, H - 1.55, ZF + 0.66, world, 8); arm.rotation.x = Math.PI / 2 - 0.6; });
  // the terrace: paving, bistro tables with chairs, two parasols, planters, an A-board and string lights
  flat(new THREE.PlaneGeometry(11, 6), new THREE.MeshStandardMaterial({ ...setRepeat(pathSet, 11 / 3, 2), roughness: 0.9 }), -17.5, 0.014, -6.5);
  CAMPUS.boxes.push([X0, ZB, X1, ZF + 0.3, "building", H + 0.38]); CAMPUS.bldg.push({ x: CX, z: -12, w: 7, d: 5, name: "Café" });
  const iron = mat(0x1d2124, { roughness: 0.45, metalness: 0.5 }), cane = mat(0xa8763f, { roughness: 0.7 }), seatM = mat(0x24493c, { roughness: 0.6 });
  function chair(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.add(g);
    cyl(0.2, 0.2, 0.04, seatM, 0, 0.46, 0, g, 18);
    [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].forEach(([lx, lz]) => { const l = cyl(0.012, 0.012, 0.46, cane, lx, 0.23, lz, g, 6); l.rotation.set(lz * 0.5, 0, -lx * 0.5); });
    const back = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 6, 16, Math.PI), cane); back.position.set(0, 0.62, -0.16); g.add(back);
    [-0.17, 0.17].forEach(bx => cyl(0.014, 0.014, 0.18, cane, bx, 0.54, -0.16, g, 6));
  }
  [[-19.6, -7.6, true], [-16.8, -6.0, false], [-14.6, -7.9, false], [-21.3, -5.2, true], [-18.6, -4.6, false]].forEach(([tx, tz, shade]) => {
    cyl(0.34, 0.34, 0.03, marble, tx, 0.75, tz, world, 28); cyl(0.03, 0.03, 0.72, iron, tx, 0.37, tz, world, 10); cyl(0.22, 0.25, 0.03, iron, tx, 0.015, tz, world, 20);
    chair(tx - 0.55, tz + 0.15, Math.PI / 2 + 0.2); chair(tx + 0.55, tz - 0.1, -Math.PI / 2 + 0.15);
    if (shade) {
      wcyl(0.025, 0.025, 2.4, steel, tx, 1.2, tz, 8);
      const um = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.45, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1ead8, side: THREE.DoubleSide, roughness: 0.8 })); um.position.set(tx, 2.38, tz); um.castShadow = true; world.add(um);
      const edge = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.12, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x24493c, side: THREE.DoubleSide, roughness: 0.8 })); edge.position.set(tx, 2.1, tz); world.add(edge);
    }
    CAMPUS.circles.push([tx, tz, 0.85, "table"]); blobs.push([tx, tz, 2.2, 2.2, 0]);
  });
  [[DX0 - 0.4, ZF + 0.45], [DX1 + 0.4, ZF + 0.45], [-22.5, -4.1], [-12.6, -4.1]].forEach(([px, pz]) => { wbox(0.55, 0.5, 0.55, 0x3a3d3f, px, 0.25, pz, { roughness: 0.8 }); shrubs.push([px, 0.5, pz, 0.5, "box", px]); CAMPUS.circles.push([px, pz, 0.4, "bed"]); });
  // A-board on the paving by the door
  const chalk = ctex(128, 160, (g, w, h) => { g.fillStyle = "#1d2321"; g.fillRect(0, 0, w, h); g.fillStyle = "#f2efe6"; g.textAlign = "center"; g.font = "700 18px Georgia, serif"; g.fillText("TODAY", w / 2, 34); g.font = "400 15px Georgia, serif"; ["cold brew", "oat flat white", "~", "fresh", "croissants"].forEach((t, i) => g.fillText(t, w / 2, 64 + i * 20)); });
  const aG = new THREE.Group(); aG.position.set(DX1 + 1.1, 0, ZF + 1.7); aG.rotation.y = -0.4; world.add(aG);
  [1, -1].forEach(s => { const leaf = new THREE.Group(); leaf.rotation.x = s * 0.18; aG.add(leaf); box(0.5, 0.82, 0.03, oak, 0, 0.41, 0, leaf); plane(0.42, 0.66, new THREE.MeshStandardMaterial({ map: chalk, roughness: 0.9 }), 0, 0.44, s * 0.017, s > 0 ? 0 : Math.PI, leaf); });
  // string lights from the fascia out to two posts at the terrace's edge
  [[-22.7, -3.8], [-12.3, -3.8]].forEach(([px, pz]) => wcyl(0.05, 0.06, 3.2, steel, px, 1.6, pz, 10));
  const bulb = new THREE.MeshBasicMaterial({ color: 0xffe7b5 }), bulbG = new THREE.SphereGeometry(0.045, 8, 6), wireM = mat(0x111111);
  [[X0 + 0.3, -22.7], [CX, -17.5], [X1 - 0.3, -12.3]].forEach(([fx, px]) => {
    const a = new THREE.Vector3(fx, H - 0.05, ZF + 0.15), b = new THREE.Vector3(px, 3.15, -3.8), pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(t * Math.PI) * 0.55; pts.push(p); }
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.008, 4, false), wireM); world.add(wire);
    pts.slice(1, -1).forEach(p => { const m = new THREE.Mesh(bulbG, bulb); m.position.copy(p).y -= 0.07; world.add(m); });
  });
}
