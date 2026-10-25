/* instruments/lab-projects-pc/model.js — The Projects monitor on the back bench (it opens the desktop portfolio).
   Monitor and stand showing a drawing of the KogasonOS desktop, keyboard, mouse and mouse mat.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     screenMesh (js/lab/merge.js, js/lab/os-monitor.js, js/lab/desktop.js, js/main.js) */
"use strict";

// Monitor showing a desktop (click opens the desktop portfolio)
const gScreen = hotGroup("desktop", "Projects", new THREE.Vector3(1.3, 3.6, -3.85));
const deskCanvas = document.createElement("canvas"); deskCanvas.width = 768; deskCanvas.height = 445;
const deskTex = new THREE.CanvasTexture(deskCanvas); deskTex.encoding = THREE.sRGBEncoding; deskTex.anisotropy = 4;
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawDesktop() {
  // KogasonOS home screen, drawn to match https://kogason2010.github.io/ (same palette, wallpaper trace, icon grid, taskbar)
  const g = deskCanvas.getContext("2d"), W = deskCanvas.width, H = deskCanvas.height;
  const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const P = dark
    ? { a: "#0e2c44", b: "#04070c", c: "#2b1c52", d: "#0a1a28", t1: "#63d3ff", t2: "#c39bff", tf: "rgba(99,211,255,0.05)", mica: "rgba(28,31,36,0.86)", fg: "#f1f3f5", fg3: "#7d8690", accent: "#63d3ff", stroke: "rgba(255,255,255,0.08)", pill: "rgba(255,255,255,0.06)" }
    : { a: "#8cc4ea", b: "#2f66ad", c: "#b9a4ee", d: "#7fb0dd", t1: "rgba(255,255,255,0.92)", t2: "rgba(255,255,255,0.5)", tf: "rgba(255,255,255,0.10)", mica: "rgba(236,242,247,0.88)", fg: "#15191e", fg3: "#828c97", accent: "#0b6f9a", stroke: "rgba(16,30,44,0.10)", pill: "rgba(255,255,255,0.7)" };
  // wallpaper: linear 200deg d→b, plus two radial glows
  const ang = (200 - 90) * Math.PI / 180, len = Math.abs(W * Math.cos(ang)) + Math.abs(H * Math.sin(ang));
  const cx = W / 2, cy = H / 2, dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
  const lg = g.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  lg.addColorStop(0, P.d); lg.addColorStop(0.7, P.b); lg.addColorStop(1, P.b);
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  function glow(px, py, rx, ry, col, stop) {
    g.save(); g.translate(px * W, py * H); g.scale(rx * W, ry * H);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 1); r.addColorStop(0, col); r.addColorStop(stop, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(-3, -3, 6, 6); g.restore();
  }
  glow(0.80, -0.10, 0.90, 0.80, P.a, 0.62);
  glow(0.88, 1.08, 1.10, 0.85, P.c, 0.55);
  // chromatogram trace (same peaks as the site), viewBox 1600x900, xMidYMax slice
  const s = Math.max(W / 1600, H / 900), ox = (W - 1600 * s) / 2, oy = H - 900 * s;
  function trace(base, peaks, drift) {
    const pts = [];
    for (let x = -60; x <= 1660; x += 5) {
      let y = base + Math.sin(x / 230) * drift;
      for (const [c, h, sg] of peaks) y -= h * Math.exp(-((x - c) ** 2) / (2 * sg * sg));
      pts.push([ox + x * s, oy + y * s]);
    }
    return pts;
  }
  const p1 = [[190, 70, 15], [300, 210, 12], [395, 110, 17], [585, 380, 14], [672, 150, 19], [860, 290, 13], [990, 80, 21], [1135, 470, 15], [1228, 190, 13], [1385, 130, 22], [1495, 280, 14]];
  const p2 = p1.map(([c, h, sg]) => [c + 34, h * 0.42, sg * 1.3]);
  const d1 = trace(770, p1, 6), d2 = trace(812, p2, 4);
  function line(pts) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); }
  line(d1); g.lineTo(ox + 1660 * s, H); g.lineTo(ox - 60 * s, H); g.closePath(); g.fillStyle = P.tf; g.fill();
  line(d2); g.strokeStyle = P.t2; g.lineWidth = 1.4 * s * 1.6; g.stroke();
  line(d1); g.strokeStyle = P.t1; g.globalAlpha = 0.16; g.lineWidth = 7 * s * 1.4; g.stroke(); g.globalAlpha = 1;
  line(d1); g.lineWidth = 1.8 * s * 1.6; g.stroke();
  g.strokeStyle = P.t2; g.globalAlpha = 0.55; g.lineWidth = 1;
  g.beginPath(); g.moveTo(ox, oy + 836 * s); g.lineTo(ox + 1600 * s, oy + 836 * s);
  for (let x = 40; x < 1600; x += 80) { g.moveTo(ox + x * s, oy + 836 * s); g.lineTo(ox + x * s, oy + (836 + (x % 400 === 40 ? 10 : 5)) * s); }
  g.stroke(); g.globalAlpha = 1;
  // desktop icons: medium size, column-first grid (88 x 100 cells), same order as the site
  const u = H / 900, font = "'Segoe UI', 'Noto Sans', system-ui, sans-serif";
  const items = [["Recycle Bin", "bin"], ["Lab", "lab"], ["Showcase", "show"], ["File Explorer", "folder"], ["Application Notes", "folder"], ["Instrument Explainers", "folder"], ["HPLC Tools", "app", "#2fb3c9", "#1f63c9"], ["Solvane", "app", "#5fe39a", "#1f9a8a"], ["Resolve", "app", "#63d3ff", "#9b7bff"], ["Photos", "photos"], ["About me.txt", "txt"], ["Terminal", "term"], ["Restore Desktop", "app", "#8aa0ab", "#4f5965"]];
  const rows = Math.max(1, Math.floor((900 - 48 - 6) / 100));
  function labIcon(x0, y0, sz) {
    const gr = g.createLinearGradient(x0, y0, x0 + sz, y0 + sz); gr.addColorStop(0, "#63D3FF"); gr.addColorStop(1, "#1F8A84");
    g.fillStyle = gr; rr(x0, y0, sz, sz, sz * 0.25); g.fill();
    const k = sz / 28; g.strokeStyle = "#fff"; g.lineWidth = Math.max(1, 1.9 * k); g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.moveTo(x0 + 11 * k, y0 + 5 * k); g.lineTo(x0 + 17 * k, y0 + 5 * k);
    g.moveTo(x0 + 12 * k, y0 + 5 * k); g.lineTo(x0 + 12 * k, y0 + 11.2 * k); g.lineTo(x0 + 6.6 * k, y0 + 20.4 * k); g.lineTo(x0 + 8.2 * k, y0 + 23 * k);
    g.lineTo(x0 + 19.8 * k, y0 + 23 * k); g.lineTo(x0 + 21.4 * k, y0 + 20.4 * k); g.lineTo(x0 + 16 * k, y0 + 11.2 * k); g.lineTo(x0 + 16 * k, y0 + 5 * k); g.stroke();
  }
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  items.forEach((it, i) => {
    const c = Math.floor(i / rows), r = i % rows;
    const left = (4 + c * 88) * u, top = (6 + r * 100) * u, ic = 44 * u, ix = left + (84 * u - ic) / 2, iy = top + 6 * u;
    g.save(); g.shadowColor = "rgba(0,0,0,0.25)"; g.shadowBlur = 2; g.shadowOffsetY = 1;
    if (it[1] === "folder") { g.fillStyle = "#e8ad2c"; rr(ix + ic * 0.06, iy + ic * 0.16, ic * 0.88, ic * 0.7, ic * 0.08); g.fill(); g.fillStyle = "#f8d36e"; rr(ix + ic * 0.06, iy + ic * 0.3, ic * 0.88, ic * 0.56, ic * 0.08); g.fill(); }
    else if (it[1] === "lab") { labIcon(ix + ic * 0.06, iy + ic * 0.06, ic * 0.88); }
    else if (it[1] === "bin") { g.fillStyle = "rgba(220,232,240,0.9)"; rr(ix + ic * 0.22, iy + ic * 0.22, ic * 0.56, ic * 0.68, ic * 0.06); g.fill(); g.fillStyle = "rgba(160,176,188,0.9)"; g.fillRect(ix + ic * 0.16, iy + ic * 0.14, ic * 0.68, ic * 0.08); }
    else if (it[1] === "txt") { g.fillStyle = "#fff"; rr(ix + ic * 0.2, iy + ic * 0.08, ic * 0.6, ic * 0.84, ic * 0.05); g.fill(); g.fillStyle = "#9fb3c4"; for (let l = 0; l < 4; l++) g.fillRect(ix + ic * 0.3, iy + ic * (0.3 + l * 0.14), ic * 0.4, ic * 0.04); }
    else if (it[1] === "term") { g.fillStyle = "#0c0f13"; rr(ix + ic * 0.08, iy + ic * 0.14, ic * 0.84, ic * 0.72, ic * 0.1); g.fill(); g.fillStyle = "#63d3ff"; g.font = `bold ${ic * 0.32}px monospace`; g.fillText(">_", ix + ic * 0.2, iy + ic * 0.62); }
    else if (it[1] === "photos") { const gr = g.createLinearGradient(ix, iy, ix + ic, iy + ic); gr.addColorStop(0, "#4fc3f7"); gr.addColorStop(1, "#1f63c9"); g.fillStyle = gr; rr(ix + ic * 0.08, iy + ic * 0.14, ic * 0.84, ic * 0.72, ic * 0.12); g.fill(); g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.moveTo(ix + ic * 0.18, iy + ic * 0.76); g.lineTo(ix + ic * 0.42, iy + ic * 0.46); g.lineTo(ix + ic * 0.6, iy + ic * 0.66); g.lineTo(ix + ic * 0.7, iy + ic * 0.56); g.lineTo(ix + ic * 0.84, iy + ic * 0.76); g.fill(); }
    else if (it[1] === "show") { const gr = g.createLinearGradient(ix, iy, ix + ic, iy + ic); gr.addColorStop(0, "#4FC3F7"); gr.addColorStop(1, "#9B7BFF"); g.fillStyle = gr; rr(ix + ic * 0.06, iy + ic * 0.06, ic * 0.88, ic * 0.88, ic * 0.22); g.fill(); g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.moveTo(ix + ic * 0.4, iy + ic * 0.32); g.lineTo(ix + ic * 0.68, iy + ic * 0.5); g.lineTo(ix + ic * 0.4, iy + ic * 0.68); g.fill(); }
    else { const gr = g.createLinearGradient(ix, iy, ix + ic, iy + ic); gr.addColorStop(0, it[2]); gr.addColorStop(1, it[3]); g.fillStyle = gr; rr(ix + ic * 0.06, iy + ic * 0.06, ic * 0.88, ic * 0.88, ic * 0.22); g.fill(); g.fillStyle = "rgba(255,255,255,0.92)"; g.font = `600 ${ic * 0.42}px ${font}`; g.textAlign = "center"; g.fillText(it[0][0], ix + ic / 2, iy + ic * 0.64); g.textAlign = "left"; }
    g.restore();
    g.save(); g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,0.85)"; g.shadowBlur = 3; g.font = `${12 * u}px ${font}`; g.textAlign = "center";
    const words = it[0].split(" "), maxW = 80 * u; let l1 = "", l2 = "";
    words.forEach(w => { if (!l2 && g.measureText((l1 ? l1 + " " : "") + w).width <= maxW) l1 = (l1 ? l1 + " " : "") + w; else l2 = (l2 ? l2 + " " : "") + w; });
    g.fillText(l1, left + 42 * u, iy + ic + 15 * u); if (l2) g.fillText(l2, left + 42 * u, iy + ic + 30 * u);
    g.restore();
  });
  // taskbar: mica bar, centered start + search pill + task view + pinned apps, clock on the right
  const th = 48 * u, ty = H - th;
  g.fillStyle = P.mica; g.fillRect(0, ty, W, th);
  g.fillStyle = P.stroke; g.fillRect(0, ty, W, 1);
  // "Back to lab" pill in the taskbar's left corner (matches KogasonOS)
  { const ph = 36 * u, px = 8 * u, py = ty + (th - ph) / 2;
    g.font = `500 ${13 * u}px ${font}`; const pw = 8 * u + 20 * u + 8 * u + g.measureText("Back to lab").width + 14 * u;
    g.fillStyle = dark ? "rgba(255,255,255,0.06)" : "rgba(16,30,44,0.055)"; rr(px, py, pw, ph, ph / 2); g.fill();
    g.strokeStyle = P.stroke; g.lineWidth = 1; rr(px, py, pw, ph, ph / 2); g.stroke();
    labIcon(px + 8 * u, py + (ph - 20 * u) / 2, 20 * u);
    g.fillStyle = P.fg; g.textBaseline = "middle"; g.fillText("Back to lab", px + 36 * u, py + ph / 2 + 0.5); g.textBaseline = "alphabetic"; }
  const bw = 40 * u, gap = 4 * u, pillW = 128 * u, n = 6;
  const total = bw + gap + pillW + gap + bw + gap + n * bw + (n - 1) * gap;
  let x = (W - total) / 2; const by = ty + (th - bw) / 2;
  // start (the site's own start icon: gradient tile with a peak trace)
  { const ic = 24 * u, sx = x + (bw - ic) / 2, sy = by + (bw - ic) / 2, gr = g.createLinearGradient(sx, sy, sx + ic, sy + ic);
    gr.addColorStop(0, "#4FC3F7"); gr.addColorStop(1, "#9B7BFF"); g.fillStyle = gr; rr(sx + ic * 0.06, sy + ic * 0.06, ic * 0.88, ic * 0.88, ic * 0.22); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = Math.max(1, 2 * u * 0.8); g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    const k = ic / 32; g.moveTo(sx + 6.5 * k, sy + 21.5 * k); g.lineTo(sx + 10.5 * k, sy + 21.5 * k); g.lineTo(sx + 12.8 * k, sy + 18.9 * k); g.lineTo(sx + 16 * k, sy + 9.5 * k); g.lineTo(sx + 19.2 * k, sy + 18.9 * k); g.lineTo(sx + 21.5 * k, sy + 21.5 * k); g.lineTo(sx + 25.5 * k, sy + 21.5 * k); g.stroke(); }
  x += bw + gap;
  g.fillStyle = P.pill; rr(x, by + 4 * u, pillW, bw - 8 * u, (bw - 8 * u) / 2); g.fill();
  g.strokeStyle = P.fg3; g.lineWidth = Math.max(1, 1.4 * u); g.beginPath(); g.arc(x + 16 * u, by + bw / 2 - 1 * u, 5 * u, 0, 7); g.stroke();
  g.fillStyle = P.fg3; g.font = `${12 * u}px ${font}`; g.fillText("Search", x + 28 * u, by + bw / 2 + 4 * u);
  x += pillW + gap;
  g.strokeStyle = P.fg; g.lineWidth = Math.max(1, 1.2 * u); g.strokeRect(x + 12 * u, by + 13 * u, 9 * u, 14 * u); g.strokeRect(x + 23 * u, by + 13 * u, 6 * u, 14 * u);
  x += bw + gap;
  ["lab", "folder", "show", "app", "photos", "term"].forEach((k, i) => {
    const ic = 24 * u, ax = x + (bw - ic) / 2, ay = by + (bw - ic) / 2;
    if (k === "lab") { labIcon(ax + ic * 0.06, ay + ic * 0.06, ic * 0.88); }
    else if (k === "folder") { g.fillStyle = "#e8ad2c"; rr(ax + ic * 0.04, ay + ic * 0.2, ic * 0.92, ic * 0.64, ic * 0.08); g.fill(); g.fillStyle = "#f8d36e"; rr(ax + ic * 0.04, ay + ic * 0.34, ic * 0.92, ic * 0.5, ic * 0.08); g.fill(); }
    else if (k === "term") { g.fillStyle = "#0c0f13"; rr(ax + ic * 0.06, ay + ic * 0.14, ic * 0.88, ic * 0.72, ic * 0.12); g.fill(); g.fillStyle = "#63d3ff"; g.fillRect(ax + ic * 0.24, ay + ic * 0.56, ic * 0.24, ic * 0.07); }
    else { const gr = g.createLinearGradient(ax, ay, ax + ic, ay + ic); const cs = k === "show" ? ["#4FC3F7", "#9B7BFF"] : k === "photos" ? ["#4fc3f7", "#1f63c9"] : ["#2fb3c9", "#1f63c9"];
      gr.addColorStop(0, cs[0]); gr.addColorStop(1, cs[1]); g.fillStyle = gr; rr(ax + ic * 0.06, ay + ic * 0.06, ic * 0.88, ic * 0.88, ic * 0.22); g.fill(); }
    if (k === "show") { g.fillStyle = P.accent; rr(x + bw / 2 - 8 * u, by + bw - 5 * u, 16 * u, 3 * u, 1.5 * u); g.fill(); }
    x += bw + gap;
  });
  const now = new Date();
  g.fillStyle = P.fg; g.font = `${12 * u}px ${font}`; g.textAlign = "right";
  g.fillText(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), W - 18 * u, ty + 21 * u);
  g.fillText(now.toLocaleDateString(), W - 18 * u, ty + 37 * u); g.textAlign = "left";
  deskTex.needsUpdate = true;
}
drawDesktop();
setInterval(drawDesktop, 20000);
try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawDesktop); } catch (e) {}
box(1.5, 0.92, 0.06, C.metal, 1.3, 2.0, -4.0, gScreen);
const screenMesh = plane(1.38, 0.8, new THREE.MeshBasicMaterial({ map: deskTex }), 1.3, 2.0, -3.965, 0, gScreen);
box(0.1, 0.4, 0.1, C.metal, 1.3, 1.5, -4.05, gScreen); box(0.46, 0.04, 0.28, C.metal, 1.3, 1.33, -4.02, gScreen);
scaleAbout(gScreen, 0.66, 1.3, 1.31, -4.05);
box(0.66, 0.03, 0.22, 0x3a4047, 1.3, 1.325, -3.5, lab);
box(0.09, 0.025, 0.14, 0x3a4047, 1.8, 1.322, -3.5, lab);
box(0.32, 0.03, 0.44, C.line, 2.05, 1.325, -3.4, lab).rotation.y = -0.25;
