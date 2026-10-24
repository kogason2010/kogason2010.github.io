/* js/campus/buildings.js — Campus buildings (facades, entrances, signs) and the café kiosk.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// Kogason Lab, NCA (the chemistry building with the LC lab), Mathematics and the Library
function buildBuildings() {
  /* ---- buildings: PBR facades whose glass reflects the sky ---- */
  function facade(style) {
    const W2 = 256, H2 = 290, c = canvasOf(W2, H2), hgt = canvasOf(W2, H2), ro = canvasOf(W2, H2), me = canvasOf(W2, H2), em = canvasOf(W2, H2);
    const g = c.getContext("2d"), hg = hgt.getContext("2d"), rg = ro.getContext("2d"), mg = me.getContext("2d"), eg = em.getContext("2d");
    const fill = (ctx, col, x, y, w, h) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
    fill(mg, "#000", 0, 0, W2, H2); fill(eg, "#000", 0, 0, W2, H2);
    const S = { brick: { win: [44, 70, 168, 150] }, concrete: { win: [16, 92, 224, 118] }, stone: { win: [78, 44, 100, 200] }, lab: { win: [10, 70, 236, 150] } }[style];
    if (style === "brick") {
      fill(g, "#b8ab9b", 0, 0, W2, H2); fill(hg, "#606060", 0, 0, W2, H2); fill(rg, "#f0f0f0", 0, 0, W2, H2);
      for (let row = 0, y = 0; y < H2; row++, y += 12) for (let x = -(row % 2) * 16; x < W2; x += 32) { const v = (Math.random() * 30) | 0; fill(g, `rgb(${150 + v},${82 + v / 2},${60 + v / 3})`, x + 1, y + 1, 30, 10); fill(hg, "#b0b0b0", x + 1, y + 1, 30, 10); fill(rg, "#e0e0e0", x + 1, y + 1, 30, 10); }
    } else if (style === "concrete") {
      fill(g, "#a9afb3", 0, 0, W2, H2); fill(hg, "#a0a0a0", 0, 0, W2, H2); fill(rg, "#e6e6e6", 0, 0, W2, H2);
      for (let i = 0; i < 1500; i++) fill(g, Math.random() < 0.5 ? "rgba(255,255,255,0.15)" : "rgba(60,64,66,0.15)", Math.random() * W2, Math.random() * H2, 1.5, 1.5);
      [[0, 0, W2, 2], [0, 0, 2, H2], [W2 / 2, 0, 2, 92]].forEach(r => { fill(g, "#7d8488", ...r); fill(hg, "#404040", ...r); });
      for (let x = 32; x < W2; x += 64) for (const y of [30, 60, 246, 274]) { fill(g, "#848a8e", x, y, 4, 4); fill(hg, "#606060", x, y, 4, 4); }
    } else if (style === "stone") {
      fill(g, "#d6cab0", 0, 0, W2, H2); fill(hg, "#606060", 0, 0, W2, H2); fill(rg, "#e8e8e8", 0, 0, W2, H2);
      for (let row = 0, y = 0; y < H2; row++, y += 29) for (let x = -(row % 2) * 32; x < W2; x += 64) { const v = (Math.random() * 18) | 0; fill(g, `rgb(${206 + v},${194 + v},${166 + v})`, x + 1, y + 1, 62, 27); fill(hg, "#b8b8b8", x + 1, y + 1, 62, 27); }
    } else {
      fill(g, "#eef1f2", 0, 0, W2, H2); fill(hg, "#a0a0a0", 0, 0, W2, H2); fill(rg, "#9a9a9a", 0, 0, W2, H2);
      fill(g, "#0b5fa8", 0, 228, W2, 30); fill(hg, "#b0b0b0", 0, 228, W2, 30); fill(rg, "#707070", 0, 228, W2, 30);
      [[0, 0, W2, 2], [0, 0, 2, H2]].forEach(r => { fill(g, "#c9d0d4", ...r); fill(hg, "#505050", ...r); });
    }
    const [wx, wy, ww, wh] = S.win, arch = style === "stone";
    const winPath = (ctx, inset) => { ctx.beginPath(); if (arch) { ctx.moveTo(wx + inset, wy + wh - inset); ctx.lineTo(wx + inset, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2 - inset, Math.PI, 0); ctx.lineTo(wx + ww - inset, wy + wh - inset); ctx.closePath(); } else ctx.rect(wx + inset, wy + inset, ww - inset * 2, wh - inset * 2); };
    g.fillStyle = style === "lab" ? "#3c4a52" : "#eceeed"; winPath(g, 0); g.fill(); hg.fillStyle = "#c8c8c8"; winPath(hg, 0); hg.fill(); rg.fillStyle = "#606060"; winPath(rg, 0); rg.fill();
    const gl = g.createLinearGradient(0, wy, 0, wy + wh); gl.addColorStop(0, "#1c2a33"); gl.addColorStop(1, "#33505e");
    g.fillStyle = gl; winPath(g, 7); g.fill(); hg.fillStyle = "#202020"; winPath(hg, 7); hg.fill(); rg.fillStyle = "#0c0c0c"; winPath(rg, 7); rg.fill(); mg.fillStyle = "#d8d8d8"; winPath(mg, 7); mg.fill();
    eg.fillStyle = "#ffcf8a"; winPath(eg, 7); eg.fill();
    const mull = style === "lab" ? [[wx + ww / 3, wy, 5, wh], [wx + 2 * ww / 3, wy, 5, wh]] : [[wx + ww / 2 - 2, wy, 4, wh], [wx, wy + wh * 0.42, ww, 4]];
    mull.forEach(r => { fill(g, style === "lab" ? "#3c4a52" : "#eceeed", ...r); fill(hg, "#c8c8c8", ...r); fill(rg, "#606060", ...r); fill(mg, "#000", ...r); fill(eg, "#000", ...r); });
    if (style !== "lab") { fill(g, "#e2dbcb", wx - 8, wy + wh, ww + 16, 9); fill(hg, "#f0f0f0", wx - 8, wy + wh, ww + 16, 9); fill(rg, "#c0c0c0", wx - 8, wy + wh, ww + 16, 9); }
    const T = t => { const x = new THREE.CanvasTexture(t); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 8; return x; };
    const map = T(c); map.encoding = THREE.sRGBEncoding; const emissiveMap = T(em); emissiveMap.encoding = THREE.sRGBEncoding;
    return { map, normalMap: normalFrom(hgt, 5), roughnessMap: T(ro), metalnessMap: T(me), emissiveMap };
  }
  const FAC = { brick: facade("brick"), concrete: facade("concrete"), stone: facade("stone"), lab: facade("lab") };
  // doorX / doorZ slide the entrance along its face so it lines up with the path that leads to it
  function building(o) {
    const { x, z, w, d, h, style, name, door, wall, trim } = o, floors = Math.max(1, Math.round((h - 1.6) / 3.4));
    wbox(w, h, d, wall, x, h / 2, z, { roughness: 0.85 });
    wbox(w + 0.24, 0.8, d + 0.24, 0x8a8478, x, 0.4, z, { roughness: 0.9 });
    wbox(w + 0.5, 0.32, d + 0.5, trim, x, h - 0.1, z, { roughness: 0.6 });
    wbox(w + 0.2, 0.7, d + 0.2, trim, x, h + 0.35, z, { roughness: 0.7 });
    wbox(w - 0.4, 0.04, d - 0.4, 0x7c7f7e, x, h + 0.72, z, { roughness: 1 });   // roof membrane inside the parapet
    wbox(2.4, 1.2, 1.8, 0xaab3b8, x - w * 0.2, h + 1.1, z + d * 0.1, { metalness: 0.5, roughness: 0.4 }); wbox(1.5, 0.9, 1.5, 0xaab3b8, x + w * 0.22, h + 0.95, z - d * 0.15, { metalness: 0.5, roughness: 0.4 });
    const fh = h - 1.15, fy = 0.8 + fh / 2;
    [[w, 0, d / 2 + 0.03, 0], [w, 0, -d / 2 - 0.03, Math.PI], [d, w / 2 + 0.03, 0, Math.PI / 2], [d, -w / 2 - 0.03, 0, -Math.PI / 2]].forEach(([len, ox, oz, ry]) => {
      const set = setRepeat(FAC[style], Math.max(1, Math.round(len / 3)), floors);
      const m = new THREE.MeshStandardMaterial({ ...set, roughness: 1, metalness: 1, emissive: 0x000000, envMapIntensity: 1.1 }); FX.windowMats.push(m);
      const p = plane(len, fh, m, x + ox, fy, z + oz, ry, world); p.receiveShadow = true;
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
    for (let i = -4; i <= 4; i++) { if (Math.abs(i) < 2) continue; shrub(ex + Math.cos(ry) * i * 1.4 + fx * 0.9, ez - Math.sin(ry) * i * 1.4 + fz * 0.9, 0.55); }
    CAMPUS.boxes.push([x - w / 2 - 0.2, z - d / 2 - 0.2, x + w / 2 + 0.2, z + d / 2 + 0.2, "building", h + 0.74]);   // last: roof height
    CAMPUS.bldg.push({ x, z, w, d, name, door: [ex + fx * 0.6, ez + fz * 0.6] });
  }
  function shrub(x, z, s) { if (CAMPUS.paths.some(p => segDist(x, z, p) < p[4] / 2 + 0.7)) return; shrubs.push([x, z, s]); CAMPUS.circles.push([x, z, s * 0.75, "shrub"]); }
  building({ x: 0, z: -24, w: 16, d: 12, h: 7.4, style: "lab", name: "Kogason Lab", door: "s", wall: 0xe6e9ea, trim: 0xf4f6f6 });
  building({ x: 40, z: -2, w: 16, d: 20, h: 10.6, style: "brick", name: "NCA", door: "w", doorZ: 0, wall: 0xa86a52, trim: 0xe4ddd0 });
  building({ x: -40, z: -4, w: 16, d: 18, h: 9.4, style: "concrete", name: "Mathematics", door: "e", doorZ: 0, wall: 0xa9afb3, trim: 0xc8cdd0 });
  building({ x: 0, z: 42, w: 32, d: 12, h: 9.4, style: "stone", name: "Library", door: "n", wall: 0xd6cab0, trim: 0xece4d2 });
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
