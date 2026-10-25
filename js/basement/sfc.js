/* js/basement/sfc.js — SFC chemistry and the SFC workstation app: vials, conditions, injection, live chromatogram, and the
   live run on the instrument itself (it uses SFC_PARTS from instruments/basement-sfc/model.js).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- SFC: pick a vial, set the conditions, inject, watch the bands separate ---------- */
// CO₂ properties: Span–Wagner vapour pressure; density from Peng–Robinson with a small volume shift (within a few % of NIST here)
const CO2_TC = 304.1282, CO2_PC = 73.773, CO2_W = 0.22394, RGAS = 8.314462618;
function co2Psat(tc) {            // bar
  const T = tc + 273.15; if (T >= CO2_TC) return CO2_PC; const t = 1 - T / CO2_TC;
  return CO2_PC * Math.exp((CO2_TC / T) * (-7.0602087 * t + 1.9391218 * Math.pow(t, 1.5) - 1.6463597 * t * t - 3.2995634 * Math.pow(t, 4)));
}
function co2Density(pbar, tc) {   // kg/m³
  const T = tc + 273.15, P = pbar * 1e5, Pc = CO2_PC * 1e5, kap = 0.37464 + 1.54226 * CO2_W - 0.26992 * CO2_W * CO2_W;
  const a = 0.45724 * RGAS * RGAS * CO2_TC * CO2_TC / Pc * Math.pow(1 + kap * (1 - Math.sqrt(T / CO2_TC)), 2), b = 0.0778 * RGAS * CO2_TC / Pc;
  const A = a * P / (RGAS * RGAS * T * T), B = b * P / (RGAS * T), c2 = B - 1, c1 = A - 3 * B * B - 2 * B, c0 = -(A * B - B * B - B * B * B);
  const f = z => ((z + c2) * z + c1) * z + c0, roots = [];
  for (let z = B + 1e-6, s = 0.002; z < 1.6; z += s) if (f(z) * f(z + s) <= 0) { let lo = z, hi = z + s; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m) * f(lo) <= 0) hi = m; else lo = m; } roots.push((lo + hi) / 2); }
  let Z = roots[0] || 1;
  if (roots.length > 1) Z = (T < CO2_TC ? pbar > co2Psat(tc) : pbar > CO2_PC) ? roots[0] : roots[roots.length - 1];
  return 0.0440098 / (Z * RGAS * T / P - 2.0e-6);
}
function co2Phase(pbar, tc) {
  if (tc >= 31.0 && pbar >= CO2_PC) return "sc";
  if (tc < 31.0 && pbar >= co2Psat(tc)) return "liquid";
  return "gas";
}
const EPSA_FIT = { m: 53.991, b: 25.177 };                     // PDA calibration line from the app note
const rtEPSA = e => (e - EPSA_FIT.b) / EPSA_FIT.m;
const SAMPLES = {
  epsa: {
    name: "EPSA standards", short: "EPSA", cap: "#2bb3a3",
    about: "Five EPSA reference compounds, with ritonavir as the unknown. Retention times at the method settings match the app note behind the Nexera UC EPSA project.",
    column: "Chirex (S)-Val/(R)-NEA · PDA 254 nm", t0: 0.25, N: 4000, window: 4.5, ref: { mod: 20, P: 204, T: 40 },
    comps: [
      { name: "Lidocaine", epsa: 47, h: 0.18, color: "#3fa7d6" }, { name: "Chlorpromazine", epsa: 68, h: 0.95, color: "#59c3a6" },
      { name: "Ritonavir", epsa: 75, tR: 0.932, h: 0.5, color: "#f0b429", unknown: true }, { name: "Pindolol", epsa: 103, h: 0.28, color: "#9b7bff" },
      { name: "Diclofenac", epsa: 135, h: 0.25, color: "#ef6f6c" }, { name: "Furosemide", epsa: 230, h: 0.07, color: "#c56ad8" },
    ],
  },
  chiral: {
    name: "Chiral pair", short: "Chiral", cap: "#8a63d2",
    about: "Racemic trans-stilbene oxide, a classic SFC test compound: two mirror-image forms that only a chiral column can tell apart.",
    column: "Amylose-based chiral column · UV 230 nm", t0: 0.5, N: 3000, window: 2.5, ref: { mod: 10, P: 150, T: 35 },
    comps: [
      { name: "Enantiomer 1", k: 1.8, S: 1.3, H: 1800, h: 0.75, color: "#4cc2d9" },
      { name: "Enantiomer 2", k: 2.25, S: 1.38, H: 2600, h: 0.62, color: "#d96fbf" },
    ],
  },
  dyes: {
    name: "Dye mix", short: "Dyes", cap: "#e8892c",
    about: "Four coloured dyes, so you can watch the bands with your own eyes. An illustrative mix: the retention values are made up for the demo.",
    column: "2-Ethylpyridine column · visible, 450 nm", t0: 0.4, N: 5000, window: 3.2, ref: { mod: 15, P: 150, T: 40 },
    comps: [
      { name: "Yellow", k: 0.8, S: 1.0, h: 0.8, color: "#f2c230" }, { name: "Orange", k: 1.9, S: 1.2, h: 0.65, color: "#f08a24" },
      { name: "Red", k: 3.2, S: 1.4, h: 0.55, color: "#e0413a" }, { name: "Violet", k: 5.0, S: 1.6, h: 0.45, color: "#7d4cd6" },
    ],
  },
};
Object.values(SAMPLES).forEach(s => {
  s.rhoRef = co2Density(s.ref.P, s.ref.T);
  s.comps.forEach(c => {
    if (c.epsa != null) { if (c.tR == null) c.tR = rtEPSA(c.epsa); c.k = c.tR / s.t0 - 1; c.S = 1.2 + 0.004 * (c.epsa - 47); }
    c.D = c.D || 1.0; c.H = c.H == null ? 1500 : c.H;
    c.sigRef = (s.t0 * (1 + c.k)) / Math.sqrt(s.N) + 0.004; c.area = c.h * c.sigRef * Math.sqrt(2 * Math.PI);
  });
});
const sfc = { sample: "epsa", mod: 20, P: 204, T: 40, run: null, last: null, inject: null, dirty: false };
function predict(st) {
  const s = SAMPLES[st.sample], rho = co2Density(st.P, st.T), TK = st.T + 273.15, TR = s.ref.T + 273.15;
  const peaks = s.comps.map(c => {
    const k = c.k * Math.pow(st.mod / s.ref.mod, -c.S) * Math.pow(rho / s.rhoRef, -c.D) * Math.exp(c.H * (1 / TK - 1 / TR));
    const tR = s.t0 * (1 + k), sig = tR / Math.sqrt(s.N) + 0.004;
    return { ...c, tR, sig, height: c.area / (sig * Math.sqrt(2 * Math.PI)) };
  });
  const latest = Math.max(...peaks.map(p => p.tR));
  const W = Math.min(12, Math.max(s.window, latest * 1.12));
  return { s, rho, peaks, W };
}
function signal(peaks, t) { let y = 0; peaks.forEach(p => { if (Math.abs(t - p.tR) < 6 * p.sig) y += p.height * Math.exp(-((t - p.tR) ** 2) / (2 * p.sig * p.sig)); }); return y; }

// chromatogram, drawn both in the panel and on the instrument PC's screen
function drawChrom(g, W, H, run, tNow, dark) {
  const cs = getComputedStyle(document.documentElement);
  const ink = dark ? "#e3ecf1" : cs.getPropertyValue("--ink").trim(), soft = dark ? "#8fa1ab" : cs.getPropertyValue("--ink-soft").trim(), line = dark ? "#26343c" : cs.getPropertyValue("--line").trim(), acc = dark ? "#6aa6f0" : cs.getPropertyValue("--accent").trim();
  g.fillStyle = dark ? "#0f171c" : "rgba(0,0,0,0)"; g.clearRect(0, 0, W, H); if (dark) g.fillRect(0, 0, W, H);
  const top = dark ? 30 : 12, pl = 34, pr = 12, pb = 26, cw = W - pl - pr, ch = H - top - pb;
  if (dark) { g.fillStyle = "#18242c"; g.fillRect(0, 0, W, 22); g.fillStyle = "#cfe3ee"; g.font = "bold 12px sans-serif"; g.fillText(run ? (run.done ? "Run complete" : "Acquiring") + " · " + run.s.short : "SFC · idle", 10, 15); }
  const Wm = run ? run.W : SAMPLES[sfc.sample].window;
  g.strokeStyle = line; g.lineWidth = 1; g.font = "10px " + (cs.getPropertyValue("--mono") || "monospace"); g.fillStyle = soft; g.textAlign = "center";
  const step = Wm > 8 ? 2 : Wm > 3.5 ? 1 : 0.5;
  for (let m = 0; m <= Wm + 1e-6; m += step) { const x = pl + (m / Wm) * cw; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + ch); g.stroke(); g.fillText(String(+m.toFixed(1)), x, H - 10); }
  g.textAlign = "left"; g.fillText("min", W - pr - 20, H - 1); g.fillText("AU", 4, top + 8);
  if (!run) {
    g.textAlign = "center"; g.fillStyle = soft; g.font = "12px " + (cs.getPropertyValue("--mono") || "monospace");
    g.fillText(sfc.inject ? "Injecting…" : "Press Inject to start a run", pl + cw / 2, top + ch / 2);
    return;
  }
  const ymax = Math.max(0.3, ...run.peaks.filter(p => p.tR <= run.W).map(p => p.height)) * 1.12;
  g.strokeStyle = acc; g.lineWidth = dark ? 2 : 1.75; g.beginPath();
  const n = Math.max(2, Math.round(cw * Math.min(1, tNow / Wm)));
  for (let i = 0; i <= n; i++) {
    const t = (i / cw) * Wm, y = signal(run.peaks, t) + 0.006 * Math.sin(t * 37) + 0.004 * Math.sin(t * 91 + 1);
    const py = top + ch - Math.max(0, Math.min(1.04, y / ymax)) * ch; i ? g.lineTo(pl + i, py) : g.moveTo(pl + i, py);
  }
  g.stroke();
  g.font = "bold 10px " + (cs.getPropertyValue("--mono") || "monospace"); g.textAlign = "center";
  run.peaks.forEach((p, i) => {
    if (tNow < p.tR + 2 * p.sig || p.tR > Wm) return;
    const x = pl + (p.tR / Wm) * cw, y = top + ch - Math.min(1.04, p.height / ymax) * ch - 6;
    g.fillStyle = p.color; g.beginPath(); g.arc(x, y - 4, 7, 0, 7); g.fill(); g.fillStyle = "#0f171c"; g.fillText(String(i + 1), x, y - 0.5);
  });
  if (!run.done) { const x = pl + Math.min(1, tNow / Wm) * cw; g.strokeStyle = soft; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + ch); g.stroke(); g.setLineDash([]); }
}
// CO₂ phase diagram with the current operating point
function drawPhase(g, W, H) {
  const cs = getComputedStyle(document.documentElement);
  const ink = cs.getPropertyValue("--ink").trim(), soft = cs.getPropertyValue("--ink-soft").trim(), line = cs.getPropertyValue("--line").trim(), acc = cs.getPropertyValue("--accent").trim();
  const mono = cs.getPropertyValue("--mono") || "monospace";
  const pl = 36, pr = 10, pt = 10, pb = 24, cw = W - pl - pr, ch = H - pt - pb, T0 = 0, T1 = 60, P1 = 260;
  const X = t => pl + (t - T0) / (T1 - T0) * cw, Y = p => pt + ch - p / P1 * ch;
  g.clearRect(0, 0, W, H);
  g.globalAlpha = 0.13; g.fillStyle = acc; g.fillRect(X(31), Y(P1), X(T1) - X(31), Y(CO2_PC) - Y(P1)); g.globalAlpha = 1;
  g.strokeStyle = line; g.lineWidth = 1; g.font = "10px " + mono; g.fillStyle = soft; g.textAlign = "center";
  for (let t = 0; t <= 60; t += 10) { g.beginPath(); g.moveTo(X(t), pt); g.lineTo(X(t), pt + ch); g.stroke(); g.fillText(t + "", X(t), H - 9); }
  g.textAlign = "right"; for (let p = 0; p <= 250; p += 50) { g.beginPath(); g.moveTo(pl, Y(p)); g.lineTo(pl + cw, Y(p)); g.stroke(); g.fillText(p + "", pl - 4, Y(p) + 3); }
  g.textAlign = "left"; g.fillText("°C", W - pr - 16, H - 1); g.save(); g.translate(9, pt + ch / 2); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.fillText("bar", 0, 0); g.restore();
  g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); for (let t = 0; t <= 31.0; t += 0.5) { const x = X(t), y = Y(co2Psat(t)); t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.setLineDash([4, 4]); g.strokeStyle = soft; g.lineWidth = 1; g.beginPath(); g.moveTo(X(31.0), Y(CO2_PC)); g.lineTo(X(31.0), Y(P1)); g.moveTo(X(31.0), Y(CO2_PC)); g.lineTo(X(T1), Y(CO2_PC)); g.stroke(); g.setLineDash([]);
  g.fillStyle = ink; g.beginPath(); g.arc(X(31.0), Y(CO2_PC), 3.5, 0, 7); g.fill();
  g.font = "600 11px " + mono; g.fillStyle = soft; g.textAlign = "left";
  g.fillText("liquid", X(3), Y(200)); g.fillText("gas", X(4), Y(12)); g.fillText("gas", X(44), Y(30)); g.fillStyle = acc; g.fillText("supercritical", X(36), Y(240));
  g.fillStyle = soft; g.font = "10px " + mono; g.fillText("critical point", X(31.0) + 6, Y(CO2_PC) + 13);
  const s = SAMPLES[sfc.sample];
  g.strokeStyle = soft; g.lineWidth = 1.2; g.beginPath(); g.arc(X(s.ref.T), Y(s.ref.P), 6, 0, 7); g.stroke();
  g.fillStyle = acc; g.strokeStyle = "#fff"; g.lineWidth = 2; g.beginPath(); g.arc(X(sfc.T), Y(Math.min(P1, sfc.P)), 6, 0, 7); g.fill(); g.stroke();
}
function fitCanvas(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return null;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); return [g, W, H];
}

// panel
const fmt2 = v => v.toFixed(2);
function sfcAppHTML() {
  const vial = (id) => { const s = SAMPLES[id]; return `<button type="button" class="sfc-vial" role="radio" data-sample="${id}" aria-checked="${sfc.sample === id}" style="--cap:${s.cap}"><i aria-hidden="true"></i>${s.name}</button>`; };
  return `
    <div class="sfcw-live" id="sfcLive" aria-label="Live view of the column oven"><span class="live-tag">LIVE · column oven</span><span class="live-cap" id="sfcLiveCap">Mobile phase flowing</span></div>
    <section class="sfcw-panel sfcw-method" aria-labelledby="sfcMethodH">
      <h3 id="sfcMethodH">Sample and method</h3>
      <div class="sfc-vials" role="radiogroup" aria-label="Sample vial">${vial("epsa")}${vial("chiral")}${vial("dyes")}</div>
      <p class="sfc-about" id="sfcAbout"></p>
      <div class="sfc-ctl" id="sfcCtl">
        <label for="sfcMod">Methanol modifier <output id="sfcModO"></output><input id="sfcMod" type="range" min="2" max="40" step="1"></label>
        <label for="sfcP">Back pressure <output id="sfcPO"></output><input id="sfcP" type="range" min="60" max="250" step="2"></label>
        <label for="sfcT">Column temperature <output id="sfcTO"></output><input id="sfcT" type="range" min="20" max="60" step="1"></label>
      </div>
      <div class="sfc-go"><button class="btn primary" type="button" id="sfcInject">Inject</button><button class="btn" type="button" id="sfcReset">Method settings</button></div>
      <span class="sfc-clock" id="sfcClock" aria-live="polite"></span>
    </section>
    <section class="sfcw-panel sfcw-chrom" aria-labelledby="sfcChromH"><h3 id="sfcChromH">Chromatogram</h3><canvas class="sfc-chart" id="sfcChart" role="img" aria-label="Live chromatogram"></canvas></section>
    <section class="sfcw-panel sfcw-res" aria-labelledby="sfcResH"><h3 id="sfcResH">Results</h3><div class="sfc-res" id="sfcRes" aria-live="polite"><p class="sfc-note">Inject a sample to see its peaks here.</p></div></section>
    <section class="sfcw-panel sfcw-phase" aria-labelledby="sfcPhaseH"><h3 id="sfcPhaseH">CO₂ phase</h3><div class="sfc-phase"><canvas id="sfcPhase" role="img" aria-label="CO₂ phase diagram with the current pressure and temperature"></canvas><div class="sfc-state" id="sfcState"></div></div>
      <p class="sfc-note">A teaching model, not instrument software. The app note's EPSA method runs a methanol gradient; here the run is isocratic, tuned so the method settings reproduce its retention times.</p></section>`;
}
const $s = id => document.getElementById(id);
function sfcMounted() { return sfcAppOpen; }
function sfcStatus() {
  const f = 3.0, m = sfc.mod / 100, run = sfc.run;
  const st = sfc.inject ? "Injecting" : run && !run.done ? `Run ${fmt2(run.t)} min` : sfc.last ? "Run complete" : "Idle";
  $s("sfcStat").innerHTML = [`CO₂ ${(f * (1 - m)).toFixed(2)} mL/min`, `MeOH ${(f * m).toFixed(2)} mL/min`, `BPR ${sfc.P} bar`, `Oven ${sfc.T.toFixed(1)} °C`, st].map(x => `<span>${x}</span>`).join("");
}
function sfcSync() {
  sfcStatus();
  if (!sfcMounted()) return;
  const s = SAMPLES[sfc.sample], busy = !!(sfc.inject || (sfc.run && !sfc.run.done));
  document.querySelectorAll(".sfc-vial").forEach(b => { b.setAttribute("aria-checked", String(b.dataset.sample === sfc.sample)); b.disabled = busy; });
  $s("sfcAbout").innerHTML = `${s.about}<span>${s.column}</span>`;
  [["sfcMod", sfc.mod, "%"], ["sfcP", sfc.P, " bar"], ["sfcT", sfc.T, " °C"]].forEach(([id, v, u]) => { const el = $s(id); el.value = v; el.disabled = busy; $s(id + "O").textContent = v + u; });
  $s("sfcInject").disabled = busy; $s("sfcReset").disabled = busy;
  $s("sfcInject").textContent = sfc.last ? "Inject again" : "Inject";
  const ph = co2Phase(sfc.P, sfc.T), rho = co2Density(sfc.P, sfc.T);
  const st = {
    sc: ["Supercritical CO₂", "Above 31 °C and 74 bar the liquid–gas boundary disappears: dense like a liquid, quick like a gas."],
    liquid: ["Liquid CO₂", "Below 31 °C the CO₂ stays liquid. SFC still works here; it is sometimes called subcritical fluid chromatography."],
    gas: ["Gas-like CO₂", "Not enough pressure: the CO₂ thins out and loses its solvent strength, so peaks crawl. In a real system the CO₂–methanol mix could also split into two phases."],
  }[ph];
  $s("sfcState").innerHTML = `<b>${st[0]} · ≈${Math.round(rho / 10) * 10} kg/m³</b><span>${st[1]}</span><small>Filled dot: current settings. Ring: the method's settings.</small><small>Diagram is for pure CO₂. Adding methanol raises the mixture's critical point, so many real SFC runs are a dense single-phase fluid just below it, and separate just as well.</small>`;
  const c = fitCanvas($s("sfcPhase")); if (c) drawPhase(...c);
  sfcDrawChart(); sfcResults();
}
function sfcDrawChart() {
  if (!sfcMounted()) return;
  const c = fitCanvas($s("sfcChart")); if (!c) return;
  const run = sfc.run || sfc.last; drawChrom(c[0], c[1], c[2], run, run ? (run.done ? run.W : run.t) : 0, false); sfcStatus();
  $s("sfcClock").textContent = sfc.inject ? "Injecting…" : sfc.run && !sfc.run.done ? `Running · ${fmt2(sfc.run.t)} / ${fmt2(sfc.run.W)} min` : sfc.last ? (sfc.dirty ? "Settings changed · inject again" : "Run complete") : "Ready";
}
function sfcResults() {
  if (!sfcMounted()) return;
  const el = $s("sfcRes"), run = sfc.last;
  if (!run) { el.innerHTML = '<p class="sfc-note">Inject a sample to see its peaks here.</p>'; return; }
  const rows = run.peaks.map((p, i) => `<li style="--c:${p.color}"><i>${i + 1}</i><span>${p.name}</span><b>${p.tR > run.W ? "not eluted" : fmt2(p.tR) + " min"}</b></li>`).join("");
  let extra = "";
  if (run.s === SAMPLES.epsa) {
    const stds = run.peaks.filter(p => !p.unknown && p.tR <= run.W), unk = run.peaks.find(p => p.unknown);
    const n = stds.length, mx = stds.reduce((a, p) => a + p.tR, 0) / n, my = stds.reduce((a, p) => a + p.epsa, 0) / n;
    const sl = stds.reduce((a, p) => a + (p.tR - mx) * (p.epsa - my), 0) / stds.reduce((a, p) => a + (p.tR - mx) ** 2, 0), ic = my - sl * mx;
    const eNote = unk.tR > run.W ? null : EPSA_FIT.m * unk.tR + EPSA_FIT.b, eRun = n >= 2 && unk.tR <= run.W ? sl * unk.tR + ic : null;
    const off = eNote == null ? null : eNote - 75;
    extra = `<div class="sfc-callout"><b>Ritonavir EPSA</b>
      <div class="sfc-kv"><span>App note's calibration line</span><b>${eNote == null ? "—" : Math.round(eNote) + " Å²"}</b></div>
      <div class="sfc-kv"><span>Line from this run's standards</span><b>${eRun == null ? "—" : Math.round(eRun) + " Å²"}</b></div>
      <div class="sfc-kv"><span>Published value</span><b>75 Å²</b></div>
      <p>${off == null ? "Ritonavir hasn't come off the column yet." : Math.abs(off) < 2.5 ? "At the method settings the retention time lands right on the calibration line." : `The settings moved retention, so the fixed calibration line is off by ${Math.round(Math.abs(off))} Å². Calibrating against standards run under the same conditions pulls the answer back, which is why the method checks the system every day.`}</p>
      <a href="https://kogason2010.github.io/nexera-uc-epsa/" target="_blank" rel="noopener" data-launch="nexera-uc-epsa">Open the EPSA project</a></div>`;
  } else if (run.s === SAMPLES.chiral) {
    const [a, b] = run.peaks, rs = (b.tR - a.tR) / (2 * (a.sig + b.sig)), alpha = (b.tR - run.s.t0) / (a.tR - run.s.t0);
    const v = rs >= 1.5 ? "Baseline resolved" : rs >= 1 ? "Partly resolved" : "Co-eluting";
    extra = `<div class="sfc-callout"><b>${v}</b><div class="sfc-kv"><span>Resolution, Rs</span><b>${rs.toFixed(2)}</b></div><div class="sfc-kv"><span>Selectivity, α</span><b>${alpha.toFixed(2)}</b></div>
      <p>${rs >= 1.5 ? "Two clean peaks: the column tells the mirror images apart." : "Try less methanol or a cooler column. Both pull the pair apart, at the cost of a longer run."}</p></div>`;
  } else {
    const last = run.peaks[run.peaks.length - 1];
    extra = `<div class="sfc-callout"><b>${last.tR > run.W ? "Violet is still on the column" : "All four dyes out in " + fmt2(last.tR) + " min"}</b><p>More methanol speeds everything up. More pressure makes the CO₂ denser, which does the same more gently.</p></div>`;
  }
  el.innerHTML = `<ol class="sfc-peaks">${rows}</ol>${extra}`;
}
function sfcSetSample(id) { sfc.sample = id; const r = SAMPLES[id].ref; sfc.mod = r.mod; sfc.P = r.P; sfc.T = r.T; sfc.last = null; sfc.run = null; sfc.dirty = false; sfcLcds(); sfcSync(); }
function mountSfc() {
  const body = $s("sfcAppBody"); body.innerHTML = sfcAppHTML();
  body.querySelector(".sfc-vials").addEventListener("click", e => { const b = e.target.closest("[data-sample]"); if (b && !b.disabled) sfcSetSample(b.dataset.sample); });
  body.querySelector(".sfc-vials").addEventListener("keydown", e => {
    if (!/Arrow(Left|Right|Up|Down)/.test(e.key)) return; e.preventDefault();
    const ids = Object.keys(SAMPLES), i = ids.indexOf(sfc.sample), n = ids[(i + (/Right|Down/.test(e.key) ? 1 : ids.length - 1)) % ids.length];
    sfcSetSample(n); body.querySelector(`[data-sample="${n}"]`).focus();
  });
  $s("sfcCtl").addEventListener("input", e => {
    const v = +e.target.value; if (e.target.id === "sfcMod") sfc.mod = v; else if (e.target.id === "sfcP") sfc.P = v; else sfc.T = v;
    if (sfc.last) sfc.dirty = true; sfcLcds(); sfcSync();
  });
  $s("sfcInject").addEventListener("click", sfcInject);
  $s("sfcReset").addEventListener("click", () => { const r = SAMPLES[sfc.sample].ref; sfc.mod = r.mod; sfc.P = r.P; sfc.T = r.T; if (sfc.last) sfc.dirty = true; sfcLcds(); sfcSync(); });
}
window.addEventListener("resize", () => { if (sfcMounted()) sfcSync(); });
// the SFC's own displays (SFC_PARTS.lcd in instruments/basement-sfc/model.js): flows, pressure, valve, oven, detector
function sfcLcds() {
  const L = SFC_PARTS.lcd, f = 3.0, m = sfc.mod / 100, live = sfc.run && !sfc.run.done;
  const st = (sfc.inject ? "INJECT" : live ? "RUN" : "READY").padEnd(10) + "REMOTE";
  L.co2.draw(["CO2   " + (f * (1 - m)).toFixed(2) + " mL/min", "BPR   " + (sfc.P / 10).toFixed(1) + " MPa", st]);
  L.mod.draw(["MeOH  " + (f * m).toFixed(2) + " mL/min", "MOD   " + sfc.mod.toFixed(1) + " %", st]);
  L.inj.draw(["VALVE  " + (sfc.inject ? (sfc.inject.phase === "inject" ? "INJECT" : "LOAD") : live ? "INJECT" : "LOAD"), "SAMPLE  " + SAMPLES[sfc.sample].short.toUpperCase(), "LOOP  10 uL"]);
  L.oven.draw(["OVEN  " + sfc.T.toFixed(1) + " C", "COLUMN  1", st]);
  if (!live) L.det.draw(["PDA   254 nm", "0.000 AU", st]);
}
function sfcInject() {
  if (sfc.inject || (sfc.run && !sfc.run.done)) return;
  sfc.inject = { t: 0, vial: Object.keys(SAMPLES).indexOf(sfc.sample) };
  sfc.dirty = false; sfcLcds(); sfcSync();
  const body = $s("sfcAppBody"); if (body && body.scrollTop > 0 && window.innerWidth <= 860) body.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  if (reduce) { sfc.inject = null; sfcStart(); }
}
function sfcStart() {
  const p = predict(sfc);
  sfc.run = { ...p, t: 0, done: false, wall: Math.max(7, Math.min(16, 4 + p.W * 1.5)), seen: new Set() };
  sfcFractionsReset(sfc.run);
  sfcLcds(); sfcSync();
  if (reduce) { sfc.run.t = sfc.run.W; sfcFinish(); }
}
function sfcFinish() { sfc.run.done = true; sfc.last = sfc.run; sfc.run = null; sfcSync(); paintSfcScreen(); }
function sfcAbort() { sfc.inject = null; if (sfc.run && !sfc.run.done) { sfc.run = null; } sfcLcds(); }
function paintSfcScreen() { const run = sfc.run || sfc.last; sfcScreen.draw(); drawChrom(sfcScreen.c.getContext("2d"), 512, 304, run, run ? (run.done ? run.W : run.t) : 0, true); sfcScreen.t.needsUpdate = true; }
paintSfcScreen(); sfcLcds();
// fewer draw calls: the SFC's fixed parts merge by material (the valve knob, the bottles' liquid and the flow cell stay live)
mergeByMaterial(hotspots.find(h => h.key === "sfc").group, new Set([SFC_PARTS.injKnob]));

/* SFC workstation app: zoom to the PC, open the app. Its live pane is a hole in the window, and the camera is
   re-aimed (with a view offset) so the injection valve or the column sits exactly behind that hole. */
let sfcAppOpen = false, sfcHome = null, sfcPose = null, liveCam = false, liveCap = "";
const sfcAppEl = $s("sfcApp");
mountSfc();
const LIVE = SFC_PARTS.views;
const liveF = { c: LIVE.col.c.clone(), w: LIVE.col.w, h: LIVE.col.h }, liveDir = new THREE.Vector3(0.2, 0.3, 1).normalize();
function updateLiveCam(dt) {
  const el = $s("sfcLive"); if (!el) return;
  const r = el.getBoundingClientRect(), cr = renderer.domElement.getBoundingClientRect(), W = cr.width, H = cr.height;
  if (r.width < 10 || r.height < 10 || !W || !H) return;
  const goal = sfc.inject ? LIVE.inj : LIVE.col, k = reduce ? 1 : Math.min(1, dt * 3);
  liveF.c.lerp(goal.c, k); liveF.w += (goal.w - liveF.w) * k; liveF.h += (goal.h - liveF.h) * k;
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const d = Math.max(liveF.w / ((r.width / W) * 2 * tv * camera.aspect), liveF.h / ((r.height / H) * 2 * tv));
  camera.position.copy(liveF.c).addScaledVector(liveDir, d); camera.lookAt(liveF.c);
  camera.setViewOffset(W, H, W / 2 - (r.left - cr.left + r.width / 2), H / 2 - (r.top - cr.top + r.height / 2), W, H);
}
function openSfcApp() {
  if (sfcAppOpen || deskOpen || lvl || level !== "down") return;
  const home = focusHome ? { pos: focusHome.pos.clone(), tgt: focusHome.tgt.clone() } : { pos: camera.position.clone(), tgt: controls.target.clone() };
  focusHome = null; sfcHome = home; sfcAppOpen = true; deskOpen = true;
  document.body.classList.add("os-mode"); closeSheet(true); setHover(null);
  labelsEl.hidden = true; hint.hidden = true; tween = null; controls.enabled = false;
  const sb = new THREE.Box3().setFromObject(sfcScreenMesh), c = new THREE.Vector3(), sz = new THREE.Vector3(); sb.getCenter(c); sb.getSize(sz);
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = Math.max((sz.y / 2) / tv, (sz.x / 2) / tv / camera.aspect) * 1.04;
  sfcPose = { pos: new THREE.Vector3(c.x, c.y, c.z + d), tgt: c.clone() };
  animateCamera(sfcPose.pos.clone(), sfcPose.tgt.clone(), 1.0, () => {
    sfcAppEl.hidden = false; liveCam = true; liveF.c.copy(LIVE.col.c); liveF.w = LIVE.col.w; liveF.h = LIVE.col.h;
    requestAnimationFrame(() => { sfcAppEl.classList.add("show"); sfcSync(); });
    $s("sfcClose").focus({ preventScroll: true });
  });
}
let sfcClosing = false;
function closeSfcApp() {
  if (!sfcAppOpen || !sfcPose || sfcClosing) return;
  sfcClosing = true;
  sfcAppEl.classList.remove("show");
  setTimeout(() => {
    sfcAppEl.hidden = true; liveCam = false; camera.clearViewOffset();
    camera.position.copy(sfcPose.pos); controls.target.copy(sfcPose.tgt); camera.lookAt(sfcPose.tgt);
    animateCamera(sfcHome.pos, sfcHome.tgt, 0.9, () => {
      sfcAppOpen = false; sfcClosing = false; deskOpen = false; controls.enabled = true; controls.minDistance = 8;
      document.body.classList.remove("os-mode");
      labelsEl.hidden = pMode; if (!pMode) hint.hidden = false;
    });
  }, reduce ? 0 : 250);
}
$s("sfcClose").addEventListener("click", closeSfcApp);
function updateLiveCaption() {
  if (!sfcAppOpen) return;
  let t;
  const run = sfc.run;
  if (sfc.inject) t = sfc.inject.phase === "inject" ? "Injector · switching the sample onto the column" : "Injector · filling the sample loop";
  else if (run && !run.done) {
    const inCol = run.peaks.filter(p => run.t > 0 && run.t < p.tR - 2 * p.sig).map(p => p.name), atDet = run.peaks.find(p => Math.abs(run.t - p.tR) < 2.5 * p.sig);
    t = atDet ? `Detector: ${atDet.name}` : inCol.length ? `In the column: ${inCol.slice(0, 3).join(", ")}${inCol.length > 3 ? " +" + (inCol.length - 3) : ""}` : "Column clear";
  } else t = sfc.last && !sfc.dirty ? "Run complete" : "Mobile phase flowing · ready to inject";
  if (t !== liveCap) { liveCap = t; const el = $s("sfcLiveCap"); if (el) el.textContent = t; }
}

// 3D: mobile phase streaming through the lines, bands in the column, fractions filling the bottles, CO₂ flashing to gas
const SFC_FLOW = SFC_PARTS.flow, COL = SFC_PARTS.column, FRACS = SFC_PARTS.fractions;
const colAxis = new THREE.Vector3().subVectors(COL.b, COL.a), colP1 = new THREE.Vector3(), colP2 = new THREE.Vector3();
{ const d = colAxis.clone().normalize(); colP1.crossVectors(d, Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize(); colP2.crossVectors(d, colP1).normalize(); }
const colPoint = (u, a, r, out) => out.copy(COL.a).addScaledVector(colAxis, u).addScaledVector(colP1, Math.cos(a) * r).addScaledVector(colP2, Math.sin(a) * r);
const FLOW_N = { co2: 46, mod: 18, mix: 34, out: 40 }, flowDots = [];
Object.entries(FLOW_N).forEach(([k, n]) => { const len = SFC_FLOW[k].getLength(); for (let i = 0; i < n; i++) flowDots.push({ k, u: i / n, len }); });
const COLN = 26;
for (let i = 0; i < COLN; i++) flowDots.push({ k: "col", u: i / COLN, r: Math.random() * COL.r, a: Math.random() * 6.283 });
const FRAC_N = 14;
for (let i = 0; i < FRAC_N; i++) flowDots.push({ k: "frac", u: i / FRAC_N });
const flowGeo = new THREE.BufferGeometry(), flowPos = new Float32Array(flowDots.length * 3), flowCol = new Float32Array(flowDots.length * 3);
flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPos, 3)); flowGeo.setAttribute("color", new THREE.BufferAttribute(flowCol, 3));
const flowPts = new THREE.Points(flowGeo, new THREE.PointsMaterial({ size: 0.017, map: dotTex, vertexColors: true, transparent: true, depthWrite: false })); flowPts.frustumCulled = false; basement.add(flowPts);
const CO2C = new THREE.Color(0x9fe3ff), MODC = new THREE.Color(0xc9a6ff), tmpC = new THREE.Color(), tmpV = new THREE.Vector3(), WHITE = new THREE.Color(0xffffff);
const BAND_N = 90, bandDots = [];
for (let c = 0; c < 6; c++) for (let i = 0; i < BAND_N; i++) { let n = 0; for (let k = 0; k < 4; k++) n += Math.random(); bandDots.push({ c, n: (n - 2) * 1.2, r: Math.sqrt(Math.random()) * COL.r, a: Math.random() * 6.283 }); }
const bandGeo = new THREE.BufferGeometry(), bandPos = new Float32Array(bandDots.length * 3), bandCol = new Float32Array(bandDots.length * 3);
bandGeo.setAttribute("position", new THREE.BufferAttribute(bandPos, 3)); bandGeo.setAttribute("color", new THREE.BufferAttribute(bandCol, 3));
const bandPts = new THREE.Points(bandGeo, new THREE.PointsMaterial({ size: 0.026, map: dotTex, vertexColors: true, transparent: true, depthWrite: false })); bandPts.frustumCulled = false; bandPts.renderOrder = 3; basement.add(bandPts);
const puffs = [];
for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xf2f8ff, transparent: true, opacity: 0, depthWrite: false })); sp.visible = false; basement.add(sp); puffs.push({ sp, life: 0 }); }
let puffNext = 0, puffI = 0, puffTint = null, puffTintT = 0, flowClock = 0, screenClock = 0;
const cellBase = new THREE.Color(0x24313a);
// fraction collection: compound i goes to bottle i as it leaves the detector, and fills it in its colour
const FRAC_MAXH = 0.3, FRAC_H0 = 0.183;                  // the fullest a bottle gets, and the liquid mesh's own height
const normCdf = x => 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));
function sfcFill(f, v) {
  const h = Math.max(0.001, v * FRAC_MAXH);
  f.liquid.visible = v > 0.003; f.liquid.scale.y = h / FRAC_H0; f.liquid.position.y = f.bottom + 0.0065 + h / 2;
}
function sfcFractionsReset(run) {
  const big = Math.max(...run.peaks.map(p => p.area));
  FRACS.forEach((f, i) => {
    const pk = run.peaks[i]; f.goal = pk ? 0.25 + 0.6 * pk.area / big : 0; f.pk = pk || null;
    if (pk) { f.liquid.material.color.set(pk.color).lerp(WHITE, 0.15).convertSRGBToLinear(); f.liquid.material.opacity = 0.72; }
    sfcFill(f, 0);
  });
}
function updateSfc(dt, time) {
  const s = SAMPLES[sfc.sample], live = sfc.run && !sfc.run.done;
  // injection: the valve turns to LOAD while the sample loop fills, then to INJECT, which puts it onto the column;
  // it stays there for the run and turns back when the run is over
  const knob = SFC_PARTS.injKnob, ease = u => u * u * (3 - 2 * u), LOAD = 0.9, INJ = -0.9;
  if (sfc.inject) {
    const ij = sfc.inject; ij.t += dt; const T = ij.t;
    knob.rotation.z = T < 0.5 ? LOAD * ease(T / 0.5) : T < 1.4 ? LOAD : LOAD + (INJ - LOAD) * ease(Math.min(1, (T - 1.4) / 0.5));
    const phase = T < 1.4 ? "load" : "inject"; if (phase !== ij.phase) { ij.phase = phase; sfcLcds(); }
    if (T >= 2.1) { sfc.inject = null; sfcStart(); }
  } else knob.rotation.z += ((sfc.run && !sfc.run.done ? INJ : 0) - knob.rotation.z) * Math.min(1, dt * 3);
  if (live) {
    const run = sfc.run; run.t = Math.min(run.W, run.t + dt * run.W / run.wall);
    if (run.t >= run.W) sfcFinish();
  }
  const run = sfc.run || (sfc.last && !sfc.dirty ? sfc.last : null), speed = run ? run.W / run.wall : s.window / Math.max(7, 4 + s.window * 1.5);   // run minutes per second
  // mobile phase in the lines; colour shifts with the methanol fraction
  flowClock += dt;
  const mixC = new THREE.Color().copy(CO2C).lerp(MODC, Math.min(1, sfc.mod / 40));
  // which compound (if any) is reaching its bottle right now
  let fracNow = null;
  if (run && !run.done) run.peaks.forEach((pk, i) => { const dd = Math.abs(run.t - pk.tR) / pk.sig; if (dd < 2.2 && i < FRACS.length && (!fracNow || dd < fracNow.dd)) fracNow = { i, pk, dd }; });
  flowDots.forEach((d, i) => {
    let p;
    if (d.k === "col") {
      d.u = (d.u + dt * speed / s.t0) % 1;
      p = colPoint(d.u, d.a, d.r, tmpV);
      flowCol.set([mixC.r * 0.8, mixC.g * 0.8, mixC.b * 0.8], i * 3);
    } else if (d.k === "frac") {
      d.u = (d.u + dt * 0.5) % 1;
      const f = fracNow && FRACS[fracNow.i];
      if (!f) { flowPos[i * 3 + 1] = -99; return; }
      p = f.line.getPointAt(d.u, tmpV); tmpC.set(fracNow.pk.color); flowCol.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    } else {
      d.u = (d.u + dt * 0.32 / d.len) % 1; p = SFC_FLOW[d.k].getPointAt(d.u, tmpV);
      const c = d.k === "co2" ? CO2C : d.k === "mod" ? MODC : mixC; flowCol.set([c.r, c.g, c.b], i * 3);
    }
    flowPos.set([p.x, p.y, p.z], i * 3);
  });
  flowGeo.attributes.position.needsUpdate = true; flowGeo.attributes.color.needsUpdate = true;
  // sample bands: each compound moves at L / tR and spreads as it goes
  const peaks = run ? run.peaks : null;
  bandDots.forEach((d, i) => {
    const pk = peaks && peaks[d.c];
    if (!pk) { bandPos[i * 3 + 1] = -99; return; }
    const f = run.t / pk.tR, spread = 0.012 + 0.034 * Math.min(1, f), x = f + d.n * spread;
    if (x < 0 || x > 1 || f > 1.15) { bandPos[i * 3 + 1] = -99; return; }
    colPoint(x, d.a, d.r, tmpV); bandPos.set([tmpV.x, tmpV.y, tmpV.z], i * 3);
    tmpC.set(pk.color); bandCol.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
  });
  bandGeo.attributes.position.needsUpdate = true; bandGeo.attributes.color.needsUpdate = true;
  // detector flow cell lights up in each compound's colour as it passes; the next puffs carry a hint of it
  let cellHit = null;
  if (peaks) peaks.forEach(pk => { const dd = Math.abs(run.t - pk.tR) / pk.sig; if (dd < 2.2 && (!cellHit || dd < cellHit.dd)) cellHit = { pk, dd }; if (run.t > pk.tR && !run.seen.has(pk.name)) { run.seen.add(pk.name); puffTint = new THREE.Color(pk.color); puffTintT = 1.2; } });
  if (cellHit) SFC_PARTS.cell.color.set(cellHit.pk.color).lerp(cellBase, Math.min(1, cellHit.dd / 2.2)); else SFC_PARTS.cell.color.copy(cellBase);
  // bottles fill as each compound comes through (to a level that follows its peak's area)
  if (run && run.seen) FRACS.forEach(f => { if (f.pk) sfcFill(f, f.goal * normCdf((run.t - f.pk.tR) / f.pk.sig)); });
  // the regulator vents the CO₂ as gas
  puffNext -= dt; puffTintT -= dt;
  if (puffNext <= 0) {
    puffNext = 0.085;
    const pf = puffs[puffI = (puffI + 1) % puffs.length]; pf.life = 1; pf.vx = (Math.random() - 0.5) * 0.05; pf.vz = (Math.random() - 0.5) * 0.05; pf.vy = 0.22 + Math.random() * 0.08;
    pf.sp.position.copy(SFC_PARTS.vent); pf.sp.visible = true; pf.sp.material.color.set(0xf2f8ff); if (puffTint && puffTintT > 0) pf.sp.material.color.lerp(puffTint, 0.55);
  }
  puffs.forEach(pf => {
    if (pf.life <= 0) return;
    pf.life -= dt / 1.15; if (pf.life <= 0) { pf.sp.visible = false; return; }
    pf.sp.position.x += pf.vx * dt; pf.sp.position.z += pf.vz * dt; pf.sp.position.y += pf.vy * dt; pf.vy *= 1 - dt * 0.6;
    const e = 1 - pf.life; pf.sp.scale.setScalar(0.03 + e * 0.13); pf.sp.material.opacity = Math.sin(Math.min(1, pf.life * 1.4) * Math.PI / 2) * 0.55;
  });
  // detector readout, PC screen, room lights, CO₂ monitor
  screenClock -= dt;
  if (live && screenClock <= 0) {
    screenClock = 0.08; paintSfcScreen();
    SFC_PARTS.lcd.det.draw(["PDA   254 nm", (signal(run.peaks, run.t) * 0.08).toFixed(3) + " AU", "RUN".padEnd(10) + "REMOTE"]);
    if (sfcAppOpen) sfcDrawChart();
  }
  if (sfcAppOpen) updateLiveCaption();
  bLight.intensity = night ? 1.25 : 0.55; fixMat.color.set(night ? 0xffffff : 0xf2f8ff);
  strobe.material.emissive.setHex(Math.sin(time * 2) > 0.92 ? 0x661010 : 0x000000);
}
