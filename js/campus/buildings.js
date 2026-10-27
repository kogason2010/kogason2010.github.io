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

// café kiosk and terrace
function buildCafe() {
  /* ---- café kiosk with umbrella tables ---- */
  wbox(7, 3.4, 5, 0xf3e9d6, -17, 1.7, -12, { roughness: 0.75 }); wbox(7.3, 0.35, 5.3, 0x5f676b, -17, 3.55, -12);
  const awnTex = ctex(256, 32, (g, cw, ch) => { for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? "#f4f1ea" : "#c8463c"; g.fillRect(i * cw / 14, 0, cw / 14, ch); } });
  const awn = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 1.7), new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.7 })); awn.position.set(-17, 2.78, -8.75); awn.rotation.x = 0.3; awn.castShadow = true; world.add(awn);
  const cafeGlass = new THREE.MeshStandardMaterial({ color: 0x1f2d36, roughness: 0.05, metalness: 0.85 }); FX.windowMats.push(cafeGlass);
  wbox(4.6, 1.3, 0.1, cafeGlass, -17, 1.75, -9.46); wbox(5.2, 1.0, 0.55, 0xb88a5a, -17, 0.5, -9.2, { roughness: 0.6 }); wbox(5.4, 0.06, 0.7, 0xe9e4da, -17, 1.03, -9.2);
  const cafeSign = ctex(512, 128, (g, cw, ch) => { g.fillStyle = "#2b211b"; g.fillRect(0, 0, cw, ch); g.fillStyle = "#f6e7c8"; g.font = "italic 700 76px Georgia, serif"; g.textAlign = "center"; g.fillText("Café", cw / 2, ch * 0.72); });
  plane(2.2, 0.55, new THREE.MeshBasicMaterial({ map: cafeSign }), -17, 3.1, -9.48, 0, world);
  flat(new THREE.PlaneGeometry(11, 6), new THREE.MeshStandardMaterial({ ...setRepeat(pathSet, 11 / 3, 2), roughness: 0.9 }), -17.5, 0.014, -6.5);
  CAMPUS.boxes.push([-20.5, -14.5, -13.5, -9.0, "building", 3.73]); CAMPUS.bldg.push({ x: -17, z: -12, w: 7, d: 5, name: "Café" });
  const umbr = new THREE.MeshStandardMaterial({ map: awnTex, side: THREE.DoubleSide, roughness: 0.7 });
  [[-14.3, -5.4], [-18.6, -5.2], [-21.4, -7.6]].forEach(([tx, tz]) => {
    wcyl(0.45, 0.45, 0.04, 0xe9eef0, tx, 0.74, tz, 24, { roughness: 0.4 }); wcyl(0.035, 0.035, 2.5, 0x6b767c, tx, 1.25, tz, 8, { metalness: 0.6, roughness: 0.3 }); wcyl(0.14, 0.32, 0.06, 0x2f3539, tx, 0.03, tz, 14);
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 14, 1, true), umbr); um.position.set(tx, 2.42, tz); um.castShadow = true; world.add(um);
    [0, 2.1, 4.2].forEach(a => { const cx = tx + Math.cos(a) * 0.75, cz = tz + Math.sin(a) * 0.75; wcyl(0.17, 0.17, 0.04, 0xc8463c, cx, 0.46, cz, 16); wcyl(0.02, 0.02, 0.44, 0x6b767c, cx, 0.22, cz, 6); });
    CAMPUS.circles.push([tx, tz, 0.45, "table"]); blobs.push([tx, tz, 2.6, 2.6, 0]);
  });
}
