/* js/chemistry/lc.js — The live UHPLC: a teaching model of reversed-phase gradient LC, the LC workstation app
   (sample, gradient, flow, temperature, pH, inject, live chromatogram, pressure and efficiency), and the 3D animation
   on the bench (solvent in the lines, bands moving down the column, detector cell, LCDs, autosampler needle).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- the model ----------
   Retention: linear solvent strength, log k = log kw − S·φ (φ = acetonitrile fraction), with acids losing retention
   as they ionise (pH vs pKa) and a van 't Hoff temperature term. Bands are migrated numerically through the gradient,
   including the pump's dwell volume. Plate count from a reduced van Deemter curve; pressure from Darcy's law with
   acetonitrile–water viscosity. Rules of thumb, tuned to look like a 2.1 × 100 mm, 1.9 µm C18 column. */
const LCCOL = { L: 100, id: 2.1, dp: 1.9, eps: 0.62, VD: 0.35, phiR: 900, Pmax: 1300 };
const LC_VM = Math.PI * (LCCOL.id / 20) ** 2 * (LCCOL.L / 10) * LCCOL.eps;           // column void volume, mL
function lcEta(phi, Tc) {                                                               // mPa·s, acetonitrile–water
  const tab = [0.89, 0.98, 1.0, 0.96, 0.89, 0.79, 0.68, 0.58, 0.48, 0.4, 0.34], x = Math.max(0, Math.min(1, phi)) * 10, i = Math.min(9, Math.floor(x)), f = x - i;
  return (tab[i] * (1 - f) + tab[i + 1] * f) * Math.exp((1950 * (1 - phi) + 900 * phi) * (1 / (Tc + 273.15) - 1 / 298.15));
}
function lcPlates(F, Tc, phi) {
  const u = (LCCOL.L / 1000) / (LC_VM / F * 60), Dm = 1.0e-9 * ((Tc + 273.15) / 298.15) * (0.89 / lcEta(phi, Tc));
  const nu = u * LCCOL.dp * 1e-6 / Dm, h = 1.0 + 2.0 / nu + 0.08 * nu;
  return { N: (LCCOL.L / 1000) / (h * LCCOL.dp * 1e-6), H: h * LCCOL.dp };          // plates, plate height in µm
}
function lcPressure(F, Tc, phi) {                                                       // bar: column (Darcy) + system
  const u0 = (LCCOL.L / 1000) / (LC_VM / F * 60) * LCCOL.eps;
  return LCCOL.phiR * lcEta(phi, Tc) * 1e-3 * (LCCOL.L / 1000) * u0 / (LCCOL.dp * 1e-6) ** 2 / 1e5 + 15 + 25 * F;
}
function lcK(c, phi, Tc, pH) {
  let k = Math.pow(10, c.lkw - c.S * phi);
  if (c.pKa != null) { const fn = 1 / (1 + Math.pow(10, pH - c.pKa)); k *= fn + (1 - fn) / 40; }   // the ionised acid barely sticks
  return k * Math.exp((c.H || 1800) * (1 / (Tc + 273.15) - 1 / 313.15));
}
const lcProg = (m, t) => t <= 0 ? m.b0 / 100 : t >= m.tG ? m.b1 / 100 : (m.b0 + (m.b1 - m.b0) * t / m.tG) / 100;   // φ leaving the pump at time t

const LC_SAMPLES = {
  pain: {
    name: "Pain reliever", short: "Analgesics", cap: "#e3632d", nm: 254,
    about: "An over-the-counter combination: acetaminophen, caffeine and aspirin, plus salicylic acid, the breakdown product aspirin forms as it ages. Two of the four are acids, so pH matters.",
    ref: { b0: 5, b1: 60, tG: 4, F: 0.5, T: 40, pH: 2.7 },
    comps: [
      { name: "Acetaminophen", lkw: 0.75, S: 3.2, h: 0.9, color: "#3fa7d6" }, { name: "Caffeine", lkw: 1.15, S: 3.5, h: 0.75, color: "#59c3a6" },
      { name: "Aspirin", lkw: 2.0, S: 3.7, pKa: 3.5, h: 0.6, color: "#f0b429" }, { name: "Salicylic acid", lkw: 2.35, S: 3.9, pKa: 3.0, h: 0.32, color: "#ef6f6c" },
    ],
  },
  parabens: {
    name: "Parabens", short: "Parabens", cap: "#3fa7d6", nm: 254,
    about: "Four preservatives from cosmetics. Each differs from the next by one CH₂ group, so they come off as an evenly spaced family: a homologous series.",
    ref: { b0: 25, b1: 80, tG: 4, F: 0.5, T: 40, pH: 2.7 },
    comps: [
      { name: "Methylparaben", lkw: 2.3, S: 3.9, h: 0.8, color: "#3fa7d6" }, { name: "Ethylparaben", lkw: 2.75, S: 4.2, h: 0.72, color: "#59c3a6" },
      { name: "Propylparaben", lkw: 3.2, S: 4.5, h: 0.66, color: "#f0b429" }, { name: "Butylparaben", lkw: 3.65, S: 4.8, h: 0.6, color: "#c56ad8" },
    ],
  },
  drink: {
    name: "Diet soda", short: "Soda", cap: "#9b7bff", nm: 220,
    about: "Sweeteners, a preservative and caffeine from a diet soft drink. Aspartame and benzoic acid crowd each other: try the temperature or the pH to pull them apart.",
    ref: { b0: 2, b1: 50, tG: 5, F: 0.5, T: 40, pH: 2.7 },
    comps: [
      { name: "Acesulfame K", lkw: 0.95, S: 3.0, pKa: 2.0, h: 0.55, color: "#3fa7d6" }, { name: "Saccharin", lkw: 1.4, S: 3.2, pKa: 1.6, h: 0.45, color: "#59c3a6" },
      { name: "Caffeine", lkw: 1.15, S: 3.5, h: 0.7, color: "#9b7bff" }, { name: "Aspartame", lkw: 2.2, S: 4.0, H: 2700, h: 0.4, color: "#f0b429" },
      { name: "Benzoic acid", lkw: 2.08, S: 3.6, pKa: 4.2, H: 1300, h: 0.62, color: "#ef6f6c" },
    ],
  },
};
const LC_IDS = Object.keys(LC_SAMPLES);
const lc = { sample: "pain", ...LC_SAMPLES.pain.ref, run: null, last: null, inject: null, dirty: false };

function lcPredict(m) {
  const s = LC_SAMPLES[m.sample], t0 = LC_VM / m.F, tD = LCCOL.VD / m.F, dt = t0 / 300, N = lcPlates(m.F, m.T, (m.b0 + m.b1) / 200).N;
  const peaks = s.comps.map(c => {
    let x = 0, t = 0, k = 0; const traj = [0];                                     // traj: fraction of the column covered, every dt
    while (x < 1 && t < 40) { k = lcK(c, lcProg(m, t - tD - x * t0), m.T, m.pH); x += dt / (t0 * (1 + k)); t += dt; traj.push(Math.min(1, x)); }
    const sig = Math.hypot(t0 * (1 + k) / Math.sqrt(N), 0.004);                    // column + a little extra-column spreading
    return { ...c, tR: t, k, sig, traj, area: c.h * 0.03, height: c.h * 0.03 / (sig * Math.sqrt(2 * Math.PI)) };
  });
  const latest = Math.max(...peaks.map(p => p.tR));
  const W = Math.min(20, Math.max(m.tG + tD + t0 * 0.5, latest * 1.08 + 0.15));
  let Pmax = 0; for (let t = 0; t <= W; t += W / 120) Pmax = Math.max(Pmax, lcPressure(m.F, m.T, lcProg(m, t - tD - t0 / 2)));
  return { s, m: { ...m }, t0, tD, dt, N, peaks, W, Pmax };
}
const lcSignal = (run, t) => { let y = 0; run.peaks.forEach(p => { if (Math.abs(t - p.tR) < 6 * p.sig) y += p.height * Math.exp(-((t - p.tR) ** 2) / (2 * p.sig * p.sig)); }); return y + (run.s.nm < 240 ? 0.05 : 0.015) * lcProg(run.m, t - run.tD - run.t0); };
const lcBandPos = (p, run, t) => { const i = t / run.dt; if (i <= 0) return 0; const a = Math.floor(i); return a + 1 >= p.traj.length ? 1.2 : p.traj[a] + (p.traj[a + 1] - p.traj[a]) * (i - a); };

/* ---------- drawing: chromatogram with the %B program, and the van Deemter / pressure panel ---------- */
function lcDrawChrom(g, W, H, run, tNow, dark) {
  const cs = getComputedStyle(document.documentElement), mono = cs.getPropertyValue("--mono") || "monospace";
  const soft = dark ? "#8fa1ab" : cs.getPropertyValue("--ink-soft").trim(), line = dark ? "#26343c" : cs.getPropertyValue("--line").trim(), acc = dark ? "#6aa6f0" : cs.getPropertyValue("--accent").trim();
  g.clearRect(0, 0, W, H); if (dark) { g.fillStyle = "#0f171c"; g.fillRect(0, 0, W, H); }
  const top = dark ? 30 : 12, pl = 34, pr = 34, pb = 26, cw = W - pl - pr, ch = H - top - pb;
  if (dark) { g.fillStyle = "#18242c"; g.fillRect(0, 0, W, 22); g.fillStyle = "#cfe3ee"; g.font = "bold 12px sans-serif"; g.fillText(run ? (run.done ? "Run complete" : "Acquiring") + " · " + run.s.short + " · " + run.s.nm + " nm" : "UHPLC · idle", 10, 15); }
  const m = run ? run.m : lc, Wm = run ? run.W : lcPredict(lc).W;
  g.strokeStyle = line; g.lineWidth = 1; g.font = "10px " + mono; g.fillStyle = soft; g.textAlign = "center";
  const step = Wm > 10 ? 2 : Wm > 4 ? 1 : 0.5;
  for (let t = 0; t <= Wm + 1e-6; t += step) { const x = pl + t / Wm * cw; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + ch); g.stroke(); g.fillText(String(+t.toFixed(1)), x, H - 10); }
  g.textAlign = "left"; g.fillText("min", W - pr - 20, H - 1); g.fillText("mAU", 2, top + 8);
  // the gradient as it reaches the column
  const tD = LCCOL.VD / m.F, t0 = LC_VM / m.F;
  g.setLineDash([4, 4]); g.strokeStyle = soft; g.lineWidth = 1; g.beginPath();
  for (let i = 0; i <= cw; i += 2) { const t = i / cw * Wm, y = top + ch - lcProg(m, t - tD) * ch; i ? g.lineTo(pl + i, y) : g.moveTo(pl + i, y); }
  g.stroke(); g.setLineDash([]);
  g.textAlign = "left"; [0, 50, 100].forEach(b => g.fillText(b + "%B", W - pr + 3, top + ch - b / 100 * ch + 3));
  if (!run) { g.textAlign = "center"; g.font = "12px " + mono; g.fillText(lc.inject ? "Injecting…" : "Press Inject to start a run", pl + cw / 2, top + ch / 2); return; }
  const ymax = Math.max(0.3, ...run.peaks.filter(p => p.tR <= run.W).map(p => p.height)) * 1.15;
  g.strokeStyle = acc; g.lineWidth = dark ? 2 : 1.75; g.beginPath();
  const n = Math.max(2, Math.round(cw * Math.min(1, tNow / Wm)));
  for (let i = 0; i <= n; i++) {
    const t = i / cw * Wm, y = lcSignal(run, t) + 0.004 * Math.sin(t * 41) + 0.003 * Math.sin(t * 97 + 1);
    const py = top + ch - Math.max(0, Math.min(1.04, y / ymax)) * ch; i ? g.lineTo(pl + i, py) : g.moveTo(pl + i, py);
  }
  g.stroke();
  g.font = "bold 10px " + mono; g.textAlign = "center";
  run.peaks.forEach((p, i) => {
    if (tNow < p.tR + 2 * p.sig || p.tR > Wm) return;
    const x = pl + p.tR / Wm * cw, y = top + ch - Math.min(1.04, (p.height + 0.03 * lcProg(m, p.tR - tD - t0)) / ymax) * ch - 6;
    g.fillStyle = p.color; g.beginPath(); g.arc(x, y - 4, 7, 0, 7); g.fill(); g.fillStyle = "#0f171c"; g.fillText(String(i + 1), x, y - 0.5);
  });
  if (!run.done) { const x = pl + Math.min(1, tNow / Wm) * cw; g.strokeStyle = soft; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + ch); g.stroke(); g.setLineDash([]); }
}
function lcDrawVanDeemter(g, W, H) {
  const cs = getComputedStyle(document.documentElement), mono = cs.getPropertyValue("--mono") || "monospace";
  const ink = cs.getPropertyValue("--ink").trim(), soft = cs.getPropertyValue("--ink-soft").trim(), line = cs.getPropertyValue("--line").trim(), acc = cs.getPropertyValue("--accent").trim();
  const pl = 36, pr = 10, pt = 10, pb = 24, cw = W - pl - pr, ch = H - pt - pb, F1 = 1.2, H1 = 8;
  const X = f => pl + f / F1 * cw, Y = h => pt + ch - Math.min(1, h / H1) * ch, phi = (lc.b0 + lc.b1) / 200;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = line; g.lineWidth = 1; g.font = "10px " + mono; g.fillStyle = soft; g.textAlign = "center";
  for (let f = 0; f <= F1 + 1e-6; f += 0.2) { g.beginPath(); g.moveTo(X(f), pt); g.lineTo(X(f), pt + ch); g.stroke(); g.fillText(f.toFixed(1), X(f), H - 9); }
  g.textAlign = "right"; for (let h = 0; h <= H1; h += 2) { g.beginPath(); g.moveTo(pl, Y(h)); g.lineTo(pl + cw, Y(h)); g.stroke(); g.fillText(String(h), pl - 4, Y(h) + 3); }
  g.textAlign = "left"; g.fillText("mL/min", W - pr - 38, H - 1); g.save(); g.translate(9, pt + ch / 2); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.fillText("plate height, µm", 0, 0); g.restore();
  // shade where the pump would exceed its pressure limit
  let fLim = F1; for (let f = 0.05; f <= F1; f += 0.01) if (lcPressure(f, lc.T, Math.min(0.25, phi)) > LCCOL.Pmax) { fLim = f; break; }
  if (fLim < F1) { g.globalAlpha = 0.12; g.fillStyle = "#c8262b"; g.fillRect(X(fLim), pt, X(F1) - X(fLim), ch); g.globalAlpha = 1; g.fillStyle = "#c8262b"; g.fillText("over 1,300 bar", X(fLim) + 4, pt + 12); }
  g.strokeStyle = ink; g.lineWidth = 2; g.beginPath();
  for (let f = 0.04; f <= F1; f += 0.01) { const y = Y(lcPlates(f, lc.T, phi).H); f > 0.045 ? g.lineTo(X(f), y) : g.moveTo(X(f), y); }
  g.stroke();
  const cur = lcPlates(lc.F, lc.T, phi).H;
  g.fillStyle = acc; g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.arc(X(lc.F), Y(cur), 6, 0, 7); g.fill(); g.stroke();
}

/* ---------- the workstation app ---------- */
const $l = id => document.getElementById(id);
let lcAppOpen = false, lcHome = null, lcPose = null, lcLive = false, lcLiveCapTxt = "", lcClosing = false;
function lcAppHTML() {
  const vial = id => { const s = LC_SAMPLES[id]; return `<button type="button" class="sfc-vial" role="radio" data-lcsample="${id}" aria-checked="${lc.sample === id}" style="--cap:${s.cap}"><i aria-hidden="true"></i>${s.name}</button>`; };
  const ph = (v, t) => `<button type="button" class="sfc-vial lc-ph" role="radio" data-ph="${v}" aria-checked="${lc.pH === v}">${t}</button>`;
  return `
    <div class="sfcw-live" id="lcLiveBox" aria-label="Live view of the column oven"><span class="live-tag">LIVE · column oven</span><span class="live-cap" id="lcLiveCap">Mobile phase flowing</span></div>
    <section class="sfcw-panel sfcw-method" aria-labelledby="lcMethodH">
      <h3 id="lcMethodH">Sample and method</h3>
      <div class="sfc-vials" role="radiogroup" aria-label="Sample vial">${LC_IDS.map(vial).join("")}</div>
      <p class="sfc-about" id="lcAbout"></p>
      <div class="sfc-ctl" id="lcCtl">
        <label for="lcB0">Gradient start, %B <output id="lcB0O"></output><input id="lcB0" type="range" min="0" max="90" step="1"></label>
        <label for="lcB1">Gradient end, %B <output id="lcB1O"></output><input id="lcB1" type="range" min="5" max="100" step="1"></label>
        <label for="lcTG">Gradient time <output id="lcTGO"></output><input id="lcTG" type="range" min="1" max="15" step="0.5"></label>
        <label for="lcF">Flow rate <output id="lcFO"></output><input id="lcF" type="range" min="0.1" max="1.2" step="0.05"></label>
        <label for="lcT">Column temperature <output id="lcTO"></output><input id="lcT" type="range" min="25" max="70" step="1"></label>
        <div class="lc-phrow" role="radiogroup" aria-label="Aqueous mobile phase pH">${ph(2.7, "0.1% formic acid · pH 2.7")}${ph(6.8, "Ammonium acetate · pH 6.8")}</div>
      </div>
      <div class="sfc-go"><button class="btn primary" type="button" id="lcInject">Inject</button><button class="btn" type="button" id="lcReset">Method settings</button></div>
      <span class="sfc-clock" id="lcClock" aria-live="polite"></span>
    </section>
    <section class="sfcw-panel sfcw-chrom" aria-labelledby="lcChromH"><h3 id="lcChromH">Chromatogram</h3><canvas class="sfc-chart" id="lcChart" role="img" aria-label="Live chromatogram with the gradient overlaid"></canvas></section>
    <section class="sfcw-panel sfcw-res" aria-labelledby="lcResH"><h3 id="lcResH">Results</h3><div class="sfc-res" id="lcRes" aria-live="polite"><p class="sfc-note">Inject a sample to see its peaks here.</p></div></section>
    <section class="sfcw-panel sfcw-phase" aria-labelledby="lcVdH"><h3 id="lcVdH">Pressure and efficiency</h3><div class="sfc-phase"><canvas id="lcVd" role="img" aria-label="Van Deemter curve with the current flow rate"></canvas><div class="sfc-state" id="lcState"></div></div>
      <p class="sfc-note">A teaching model, not instrument software. Retention follows linear-solvent-strength rules of thumb with pH and temperature terms; efficiency and pressure come from a van Deemter curve and Darcy's law for a 2.1 × 100 mm, 1.9 µm C18 column.</p></section>`;
}
function lcStatus() {
  const run = lc.run, live = run && !run.done;
  const phiNow = live ? lcProg(run.m, run.t - run.tD - run.t0 / 2) : lc.b0 / 100;
  const P = lcPressure(lc.F, lc.T, phiNow);
  const st = lc.inject ? "Injecting" : live ? `Run ${run.t.toFixed(2)} min` : lc.last ? "Run complete" : "Idle";
  const el = $l("lcStat"); if (el) el.innerHTML = [`Flow ${lc.F.toFixed(2)} mL/min`, `%B ${(phiNow * 100).toFixed(0)}`, `${Math.round(P)} bar`, `Oven ${lc.T.toFixed(0)} °C`, `pH ${lc.pH}`, st].map(x => `<span>${x}</span>`).join("");
}
function lcSync() {
  lcStatus();
  if (!lcAppOpen) return;
  const s = LC_SAMPLES[lc.sample], busy = !!(lc.inject || (lc.run && !lc.run.done)), pred = lcPredict(lc);
  document.querySelectorAll("[data-lcsample]").forEach(b => { b.setAttribute("aria-checked", String(b.dataset.lcsample === lc.sample)); b.disabled = busy; });
  document.querySelectorAll("[data-ph]").forEach(b => { b.setAttribute("aria-checked", String(+b.dataset.ph === lc.pH)); b.disabled = busy; });
  $l("lcAbout").innerHTML = `${s.about}<span>C18 · 2.1 × 100 mm · 1.9 µm · A: water, B: acetonitrile · PDA ${s.nm} nm</span>`;
  [["lcB0", lc.b0, "%"], ["lcB1", lc.b1, "%"], ["lcTG", lc.tG, " min"], ["lcF", lc.F, " mL/min"], ["lcT", lc.T, " °C"]].forEach(([id, v, u]) => { const el = $l(id); el.value = v; el.disabled = busy; $l(id + "O").textContent = (id === "lcF" ? v.toFixed(2) : v) + u; });
  const over = pred.Pmax > LCCOL.Pmax;
  $l("lcInject").disabled = busy || over; $l("lcReset").disabled = busy;
  $l("lcInject").textContent = lc.last ? "Inject again" : "Inject";
  const pl = lcPlates(lc.F, lc.T, (lc.b0 + lc.b1) / 200);
  $l("lcState").innerHTML = `<b>${over ? "Over the pump's limit" : "Peak pressure ≈ " + Math.round(pred.Pmax).toLocaleString() + " bar"} · ${Math.round(pl.N / 1000)}k plates</b>
    <span>${over ? `This run would need about ${Math.round(pred.Pmax).toLocaleString()} bar; the pump stops at 1,300. Lower the flow or warm the column (warmer solvent is thinner).` : "Pressure peaks where the water–acetonitrile mix is most viscous, around 20% B. The dot marks your flow on the column's van Deemter curve: plate height is lowest near the optimum."}</span>
    <small>Void time t₀ ${(pred.t0 * 60).toFixed(0)} s · gradient delay (dwell) ${(pred.tD * 60).toFixed(0)} s</small>`;
  const c = fitCanvas($l("lcVd")); if (c) lcDrawVanDeemter(...c);
  lcDrawChart(); lcResults();
}
function lcDrawChart() {
  if (!lcAppOpen) return;
  const c = fitCanvas($l("lcChart")); if (!c) return;
  const run = lc.run || lc.last; lcDrawChrom(c[0], c[1], c[2], run, run ? (run.done ? run.W : run.t) : 0, false); lcStatus();
  $l("lcClock").textContent = lc.inject ? "Injecting…" : lc.run && !lc.run.done ? `Running · ${lc.run.t.toFixed(2)} / ${lc.run.W.toFixed(2)} min` : lc.last ? (lc.dirty ? "Settings changed · inject again" : "Run complete") : "Ready";
}
function lcResults() {
  if (!lcAppOpen) return;
  const el = $l("lcRes"), run = lc.last;
  if (!run) { el.innerHTML = '<p class="sfc-note">Inject a sample to see its peaks here.</p>'; return; }
  const order = run.peaks.map((p, i) => ({ p, i })).sort((a, b) => a.p.tR - b.p.tR);
  let worst = null;
  const rows = order.map(({ p, i }, j) => {
    const prev = j ? order[j - 1].p : null, rs = prev ? (p.tR - prev.tR) / (2 * (p.sig + prev.sig)) : null;
    if (rs != null && (!worst || rs < worst.rs)) worst = { rs, a: prev, b: p };
    return `<li style="--c:${p.color}"><i>${i + 1}</i><span>${p.name}${rs != null ? ` <small>Rs ${rs.toFixed(1)}</small>` : ""}</span><b>${p.tR > run.W ? "not eluted" : p.tR.toFixed(2) + " min"}</b></li>`;
  }).join("");
  const s = run.s, m = run.m, last = order[order.length - 1].p;
  let msg = "";
  if (s === LC_SAMPLES.pain) msg = m.pH > 5 ? "At pH 6.8 aspirin and salicylic acid (pKa about 3.5 and 3.0) are ionised. Charged, they barely stick to C18, so they now come off first, ahead of acetaminophen." : "At pH 2.7 the two acids are mostly un-ionised, so they hold on to the C18 longest. Switch to pH 6.8 and watch them jump to the front.";
  else if (s === LC_SAMPLES.parabens) msg = "Each extra CH₂ adds about the same amount of retention, so the four come off evenly spaced. A steeper gradient (shorter time or higher end %B) squeezes them closer together and shortens the run.";
  else msg = m.pH > 5 ? "At pH 6.8 benzoic acid (pKa 4.2) is ionised and moves up front, leaving aspartame on its own." : "Aspartame and benzoic acid respond differently to temperature, so warming or cooling the column changes their spacing. Raising the pH moves benzoic acid instead.";
  const rsTxt = worst ? `<div class="sfc-kv"><span>Closest pair: ${worst.a.name} / ${worst.b.name}</span><b>Rs ${worst.rs.toFixed(2)}</b></div>` : "";
  const verdict = !worst ? "" : worst.rs >= 1.5 ? "All peaks baseline-resolved" : worst.rs >= 1 ? "Nearly resolved" : "Peaks overlapping";
  el.innerHTML = `<ol class="sfc-peaks">${rows}</ol><div class="sfc-callout"><b>${verdict}${last.tR <= run.W ? ` · last peak at ${last.tR.toFixed(2)} min` : ""}</b>${rsTxt}
    <div class="sfc-kv"><span>Peak pressure</span><b>${Math.round(run.Pmax).toLocaleString()} bar</b></div><p>${msg}</p></div>`;
}
function lcSetSample(id) { lc.sample = id; Object.assign(lc, LC_SAMPLES[id].ref); lc.last = null; lc.run = null; lc.dirty = false; lcLcds(); lcSync(); }
function mountLc() {
  const body = $l("lcAppBody"); body.innerHTML = lcAppHTML();
  body.querySelector(".sfc-vials").addEventListener("click", e => { const b = e.target.closest("[data-lcsample]"); if (b && !b.disabled) lcSetSample(b.dataset.lcsample); });
  body.querySelector(".lc-phrow").addEventListener("click", e => { const b = e.target.closest("[data-ph]"); if (!b || b.disabled) return; lc.pH = +b.dataset.ph; if (lc.last) lc.dirty = true; lcLcds(); lcSync(); });
  $l("lcCtl").addEventListener("input", e => {
    const v = +e.target.value, id = e.target.id;
    if (id === "lcB0") { lc.b0 = v; if (lc.b1 < v) lc.b1 = v; } else if (id === "lcB1") { lc.b1 = v; if (lc.b0 > v) lc.b0 = v; }
    else if (id === "lcTG") lc.tG = v; else if (id === "lcF") lc.F = v; else if (id === "lcT") lc.T = v; else return;
    if (lc.last) lc.dirty = true; lcLcds(); lcSync();
  });
  $l("lcInject").addEventListener("click", lcInject);
  $l("lcReset").addEventListener("click", () => { Object.assign(lc, LC_SAMPLES[lc.sample].ref); if (lc.last) lc.dirty = true; lcLcds(); lcSync(); });
}
window.addEventListener("resize", () => { if (lcAppOpen) lcSync(); });
function lcLcds() {
  if (!FX_CHEM.pump) return;
  const run = lc.run, live = run && !run.done, phi = live ? lcProg(run.m, run.t - run.tD - run.t0 / 2) : lc.b0 / 100, phiPump = live ? lcProg(run.m, run.t) : lc.b0 / 100;
  FX_CHEM.pump.lcd.draw(["P " + String(Math.round(lcPressure(lc.F, lc.T, phi))).padStart(5) + " bar", "B " + (phiPump * 100).toFixed(1).padStart(5) + " %"]);
  FX_CHEM.ovenLcd.draw(["OVEN " + lc.T.toFixed(1) + "C", "C18 2.1x100"]);
  FX_CHEM.sampler.lcd.draw([lc.inject ? "VIAL " + (LC_IDS.indexOf(lc.sample) + 1) : "VIAL --", lc.inject ? "INJECT" : live ? "RUN" : "READY"]);
}
function lcInject() {
  if (lc.inject || (lc.run && !lc.run.done) || lcPredict(lc).Pmax > LCCOL.Pmax) return;
  lc.inject = { t: 0, vial: LC_IDS.indexOf(lc.sample) }; lc.dirty = false; lcLcds(); lcSync();
  const body = $l("lcAppBody"); if (body && body.scrollTop > 0 && window.innerWidth <= 860) body.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  if (reduce) { lc.inject = null; lcStart(); }
}
function lcStart() {
  const p = lcPredict(lc);
  lc.run = { ...p, t: 0, done: false, wall: Math.max(8, Math.min(18, 5 + p.W * 1.4)), seen: new Set() };
  lcLcds(); lcSync();
  if (reduce) { lc.run.t = lc.run.W; lcFinish(); }
}
function lcFinish() { lc.run.done = true; lc.last = lc.run; lc.run = null; lcLcds(); lcSync(); paintLcScreen(); }
function lcAbort() { lc.inject = null; if (lc.run && !lc.run.done) lc.run = null; lcLcds(); }
function paintLcScreen() { if (!FX_CHEM.lcScreen) return; const run = lc.run || lc.last; lcDrawChrom(FX_CHEM.lcScreen.c.getContext("2d"), 512, 304, run, run ? (run.done ? run.W : run.t) : 0, true); FX_CHEM.lcScreen.t.needsUpdate = true; }

// open: zoom to the PC screen, then show the app; its live pane looks through to the column oven
const LCLIVE = {}, lcLiveF = { c: new THREE.Vector3(), w: 0.9, h: 0.4 }, lcLiveDir = new THREE.Vector3(0.2, 0.3, 1).normalize();
function updateLcLiveCam(dt) {
  const el = $l("lcLiveBox"); if (!el) return;
  const r = el.getBoundingClientRect(), cr = renderer.domElement.getBoundingClientRect(), W = cr.width, H = cr.height;
  if (r.width < 10 || r.height < 10 || !W || !H) return;
  const goal = lc.inject ? LCLIVE.inj : LCLIVE.col, k = reduce ? 1 : Math.min(1, dt * 3);
  lcLiveF.c.lerp(goal.c, k); lcLiveF.w += (goal.w - lcLiveF.w) * k; lcLiveF.h += (goal.h - lcLiveF.h) * k;
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const d = Math.max(lcLiveF.w / ((r.width / W) * 2 * tv * camera.aspect), lcLiveF.h / ((r.height / H) * 2 * tv));
  camera.position.copy(lcLiveF.c).addScaledVector(lcLiveDir, d); camera.lookAt(lcLiveF.c);
  camera.setViewOffset(W, H, W / 2 - (r.left - cr.left + r.width / 2), H / 2 - (r.top - cr.top + r.height / 2), W, H);
}
function openLcApp() {
  if (lcAppOpen || deskOpen || level !== "chem" || !chemBuilt) return;
  const home = focusHome ? { pos: focusHome.pos.clone(), tgt: focusHome.tgt.clone() } : { pos: camera.position.clone(), tgt: controls.target.clone() };
  focusHome = null; lcHome = home; lcAppOpen = true; deskOpen = true;
  document.body.classList.add("os-mode"); closeSheet(true); setHover(null);
  labelsEl.hidden = true; hint.hidden = true; tween = null; controls.enabled = false;
  const sb = new THREE.Box3().setFromObject(FX_CHEM.lcScreenMesh), c = new THREE.Vector3(), sz = new THREE.Vector3(); sb.getCenter(c); sb.getSize(sz);
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = Math.max((sz.y / 2) / tv, (sz.x / 2) / tv / camera.aspect) * 1.04;
  lcPose = { pos: new THREE.Vector3(c.x, c.y, c.z + d), tgt: c.clone() };
  animateCamera(lcPose.pos.clone(), lcPose.tgt.clone(), 1.0, () => {
    $l("lcApp").hidden = false; lcLive = true; lcLiveF.c.copy(LCLIVE.col.c); lcLiveF.w = LCLIVE.col.w; lcLiveF.h = LCLIVE.col.h;
    requestAnimationFrame(() => { $l("lcApp").classList.add("show"); lcSync(); });
    $l("lcClose").focus({ preventScroll: true });
  });
}
function closeLcApp() {
  if (!lcAppOpen || !lcPose || lcClosing) return;
  lcClosing = true; $l("lcApp").classList.remove("show");
  setTimeout(() => {
    $l("lcApp").hidden = true; lcLive = false; camera.clearViewOffset();
    camera.position.copy(lcPose.pos); controls.target.copy(lcPose.tgt); camera.lookAt(lcPose.tgt);
    animateCamera(lcHome.pos, lcHome.tgt, 0.9, () => {
      lcAppOpen = false; lcClosing = false; deskOpen = false; controls.enabled = true; controls.minDistance = 8;
      document.body.classList.remove("os-mode"); labelsEl.hidden = false; hint.hidden = false;
    });
  }, reduce ? 0 : 250);
}
$l("lcClose").addEventListener("click", closeLcApp);
mountLc();

/* ---------- 3D: built once the room exists; animated while you're in it ---------- */
let lcFlow = null;
function setupLcLive() {
  const F = FX_CHEM, Vc = (x, y, z) => new THREE.Vector3(x, y, z);
  LCLIVE.col = { c: Vc(F.COLX0 + F.COLL / 2 - 0.02, F.colY + 0.02, F.COLZ), w: 0.95, h: 0.4 };
  LCLIVE.inj = { c: Vc(F.PORTX - 0.17, F.trayY + 0.17, F.VIALZ - 0.02), w: 0.76, h: 0.42 };
  const flowN = { a: 22, b: 22, mix: 30, out: 32 }, dots = [];
  Object.entries(flowN).forEach(([k, n]) => { const len = F.FLOWLC[k].getLength(); for (let i = 0; i < n; i++) dots.push({ k, u: i / n, len }); });
  for (let i = 0; i < 24; i++) dots.push({ k: "col", u: i / 24, r: Math.random() * 0.016, a: Math.random() * 6.283 });
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(dots.length * 3), col = new Float32Array(dots.length * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.022, map: dotTex, vertexColors: true, transparent: true, depthWrite: false })); pts.frustumCulled = false; chem.add(pts);
  const band = [];
  for (let c = 0; c < 5; c++) for (let i = 0; i < 80; i++) { let n = 0; for (let k = 0; k < 4; k++) n += Math.random(); band.push({ c, n: (n - 2) * 1.2, r: Math.sqrt(Math.random()) * 0.018, a: Math.random() * 6.283 }); }
  const bGeo = new THREE.BufferGeometry(), bPos = new Float32Array(band.length * 3), bCol = new Float32Array(band.length * 3);
  bGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3)); bGeo.setAttribute("color", new THREE.BufferAttribute(bCol, 3));
  const bPts = new THREE.Points(bGeo, new THREE.PointsMaterial({ size: 0.032, map: dotTex, vertexColors: true, transparent: true, depthWrite: false })); bPts.frustumCulled = false; bPts.renderOrder = 3; chem.add(bPts);
  lcFlow = { dots, geo, pos, col, band, bGeo, bPos, bCol, screenClock: 0, fracT: 0 };
  lcLcds(); paintLcScreen();
}
const LC_A = new THREE.Color(0xa9dcff), LC_B = new THREE.Color(0xd9b3ff), lcTmpC = new THREE.Color(), lcTmpV = new THREE.Vector3(), lcCellBase = new THREE.Color(0x24313a);
function updateLc(dt, time) {
  updateChemDoor(dt);
  if (!lcFlow) return;
  const F = FX_CHEM, s = LC_SAMPLES[lc.sample], live = lc.run && !lc.run.done;
  // injection: needle goes to the vial, draws, comes back and injects
  if (lc.inject) {
    const ij = lc.inject; ij.t += dt;
    const vx = F.VIALX[ij.vial], T = ij.t; let x = F.PORTX, dip = 0;
    if (T < 0.5) x = F.PORTX + (vx - F.PORTX) * (T / 0.5);
    else if (T < 1.1) { x = vx; dip = Math.sin((T - 0.5) / 0.6 * Math.PI) * 0.075; }
    else if (T < 1.6) x = vx + (F.PORTX - vx) * ((T - 1.1) / 0.5);
    else { x = F.PORTX; dip = Math.sin(Math.min(1, (T - 1.6) / 0.5) * Math.PI) * 0.06; }
    F.carriage.position.x = x; F.carriage.position.y = F.trayY + 0.36 - dip;
    if (T >= 2.1) { lc.inject = null; F.carriage.position.set(F.PORTX, F.trayY + 0.36, F.VIALZ); lcStart(); }
  }
  if (live) { const run = lc.run; run.t = Math.min(run.W, run.t + dt * run.W / run.wall); if (run.t >= run.W) lcFinish(); }
  const run = lc.run || (lc.last && !lc.dirty ? lc.last : null), m = run ? run.m : lc;
  const t0 = LC_VM / m.F, speed = run ? run.W / run.wall : 0.35;           // run minutes per wall-clock second
  const phiCol = run && live ? lcProg(m, run.t - run.tD - t0 / 2) : m.b0 / 100;
  // solvent in the lines: A blue, B violet, the blend follows %B
  const mixC = lcTmpC.copy(LC_A).lerp(LC_B, phiCol), f = lcFlow;
  f.dots.forEach((d, i) => {
    let p;
    if (d.k === "col") { d.u = (d.u + dt * speed / t0) % 1; p = lcTmpV.set(F.COLX0 + d.u * F.COLL, F.colY + Math.sin(d.a) * d.r, F.COLZ + Math.cos(d.a) * d.r); f.col.set([mixC.r * 0.8, mixC.g * 0.8, mixC.b * 0.8], i * 3); }
    else { d.u = (d.u + dt * 0.3 / d.len) % 1; p = F.FLOWLC[d.k].getPointAt(d.u, lcTmpV); const c = d.k === "a" ? LC_A : d.k === "b" ? LC_B : mixC; f.col.set([c.r, c.g, c.b], i * 3); }
    f.pos.set([p.x, p.y, p.z], i * 3);
  });
  f.geo.attributes.position.needsUpdate = true; f.geo.attributes.color.needsUpdate = true;
  // bands travel down the column on the paths the model worked out, spreading as they go
  const peaks = run ? run.peaks : null, tNow = run ? (run.done ? run.W : run.t) : 0;
  f.band.forEach((d, i) => {
    const pk = peaks && peaks[d.c];
    if (!pk) { f.bPos[i * 3 + 1] = -99; return; }
    const xc = lcBandPos(pk, run, tNow), spread = 0.012 + 0.03 * Math.min(1, xc), x = xc + d.n * spread;
    if (x < 0 || x > 1 || xc > 1.1) { f.bPos[i * 3 + 1] = -99; return; }
    f.bPos.set([F.COLX0 + x * F.COLL, F.colY + Math.sin(d.a) * d.r, F.COLZ + Math.cos(d.a) * d.r], i * 3);
    lcTmpC.set(pk.color); f.bCol.set([lcTmpC.r, lcTmpC.g, lcTmpC.b], i * 3);
  });
  f.bGeo.attributes.position.needsUpdate = true; f.bGeo.attributes.color.needsUpdate = true;
  // detector flow cell glows in each compound's colour as it passes
  let hit = null;
  if (peaks && live) peaks.forEach(pk => { const dd = Math.abs(tNow - pk.tR) / pk.sig; if (dd < 2.2 && (!hit || dd < hit.dd)) hit = { pk, dd }; });
  if (hit) F.cellMat.color.set(hit.pk.color).lerp(lcCellBase, Math.min(1, hit.dd / 2.2)); else F.cellMat.color.copy(lcCellBase);
  f.screenClock -= dt;
  if (live && f.screenClock <= 0) {
    f.screenClock = 0.08; paintLcScreen(); lcLcds();
    F.det.lcd.draw(["PDA " + s.nm + "nm", (lcSignal(run, tNow) * 30).toFixed(1) + " mAU"]);
    if (lcAppOpen) lcDrawChart();
  }
  if (lcAppOpen) {
    let t;
    if (lc.inject) t = "Autosampler · drawing the sample";
    else if (live) {
      const inCol = peaks.filter(p => tNow > 0 && tNow < p.tR - 2 * p.sig).map(p => p.name), at = peaks.find(p => Math.abs(tNow - p.tR) < 2.5 * p.sig);
      t = at ? `Detector: ${at.name}` : inCol.length ? `In the column: ${inCol.slice(0, 3).join(", ")}${inCol.length > 3 ? " +" + (inCol.length - 3) : ""}` : "Column clear";
    } else t = lc.last && !lc.dirty ? "Run complete" : "Mobile phase flowing · ready to inject";
    if (t !== lcLiveCapTxt) { lcLiveCapTxt = t; const el = $l("lcLiveCap"); if (el) el.textContent = t; }
  }
  // the rest of the room: ion source spray, the fraction collector stepping along its rack, the sonicator
  F.plume.material.opacity = 0.3 + 0.2 * Math.sin(time * 23) * Math.sin(time * 7);
  F.plume.scale.set(1 + 0.08 * Math.sin(time * 31), 1, 1 + 0.08 * Math.cos(time * 29));
  f.fracT += dt;
  if (F.prepTubes) {      // the prep LC model lists its collection tubes as [x, z] under the arm
    const tube = F.prepTubes[Math.floor(f.fracT / 1.6) % F.prepTubes.length];
    F.fArm.position.x += (tube[0] - F.fArm.position.x) * Math.min(1, dt * 4);
    F.fHead.position.z += (tube[1] - 0.012 - F.fHead.position.z) * Math.min(1, dt * 4);
  } else {
    const slot = Math.floor(f.fracT / 1.6) % 60, col = slot % 10, row = Math.floor(slot / 10);
    F.fArm.position.x += ((-0.38 + col * 0.084) - F.fArm.position.x) * Math.min(1, dt * 4);
    F.fHead.position.z += ((-0.22 + row * 0.088) - F.fHead.position.z) * Math.min(1, dt * 4);
  }
  const rp = (time * 0.8) % 1; F.ripple.scale.setScalar(0.6 + rp * 2.2); F.ripple.material.opacity = 0.5 * (1 - rp);
  F.fix.color.set(night ? 0xffffff : 0xf4f9ff);
}
