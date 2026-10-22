/* js/lab/ic-workstation.js — The usable IC workstation computer on the Nexera IC bench.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- IC Workstation: the usable computer on the Nexera IC bench ---------- */
const WS_TOPICS = [
  { id: "exchange", name: "Anion vs cation exchange", hint: "Which ions the column holds",
    lede: "The column's fixed charge decides which ions it holds on to. Opposite charges attract, so a positively charged resin retains anions and a negatively charged one retains cations.",
    cols: ["Anion-exchange", "Cation-exchange"],
    rows: [
      ["Retains", "Negative ions (anions)", "Positive ions (cations)"],
      ["Fixed groups on the resin", "Positively charged, typically quaternary ammonium", "Negatively charged, typically carboxylate or sulfonate"],
      ["Typical eluent", "Carbonate/bicarbonate, or hydroxide", "Methanesulfonic acid or another dilute acid"],
      ["Common ions, typical order", "F⁻, Cl⁻, NO₂⁻, Br⁻, NO₃⁻, PO₄³⁻, SO₄²⁻", "Li⁺, Na⁺, NH₄⁺, K⁺, Mg²⁺, Ca²⁺"],
      ["Example method", "EPA 300.1: inorganic anions in drinking water", "ASTM D6919: alkali and alkaline-earth cations and ammonium in water"],
    ],
    choose: "Pick by the ions you need. Anions and cations need different columns, run one after the other or side by side on a dual-channel system." },
  { id: "suppression", name: "Suppressed vs non-suppressed", hint: "How the background is handled",
    lede: "Conductivity detectors see the eluent too. A suppressor after the column strips most of the eluent's conductivity so the analyte peaks stand out.",
    cols: ["Suppressed", "Non-suppressed"],
    rows: [
      ["How it works", "The suppressor swaps the eluent's cations for H⁺, so a carbonate eluent becomes weakly conducting carbonic acid while the analyte becomes a more conductive acid", "No suppressor: the detector reads the analyte against the eluent's own background"],
      ["Background conductivity", "Low", "Higher"],
      ["Sensitivity", "Higher, with lower detection limits", "Lower, suited to higher concentrations"],
      ["Columns and eluents", "Higher-capacity columns, stronger eluents", "Low-capacity columns with low-conductivity eluents"],
      ["Hardware", "Needs a suppressor and its regenerant or electrolytic supply", "Simpler flow path"],
    ],
    choose: "Choose suppressed IC for trace levels in drinking and environmental water. Non-suppressed works for simpler, higher-concentration samples." },
  { id: "diameter", name: "4 mm vs 2 mm i.d.", hint: "Column internal diameter",
    lede: "A 2 mm column has a quarter of the cross-section of a 4 mm one. Run at the same linear velocity, it uses far less eluent and gives more signal for the same amount of sample.",
    cols: ["4 mm i.d.", "2 mm i.d."],
    rows: [
      ["Typical flow", "About 1.0 mL/min", "About 0.25 mL/min (flow scales with diameter²)"],
      ["Eluent use", "Baseline", "About a quarter"],
      ["Injection volume", "Larger", "About a quarter, for the same column loading"],
      ["Mass sensitivity", "Baseline", "Higher, because peaks are less diluted"],
      ["System demands", "Tolerant of extra-column volume", "Needs low-dispersion tubing and fittings"],
    ],
    choose: "Choose 2 mm to save eluent and waste, or when sample is limited. 4 mm is the robust everyday default." },
  { id: "length", name: "150 mm vs 250 mm length", hint: "Column length",
    lede: "A longer column gives ions more chances to separate, at the cost of time and pressure. Resolution grows only with the square root of length.",
    cols: ["150 mm", "250 mm"],
    rows: [
      ["Resolution", "Baseline", "About 1.3× higher (√(250 / 150))"],
      ["Run time, same flow", "Baseline", "About 1.7× longer"],
      ["Backpressure", "Baseline", "About 1.7× higher"],
      ["Best for", "Fast screening and simple samples", "Complex samples with closely eluting ions"],
    ],
    choose: "Start short when the peaks are well apart. Go longer only when a critical pair needs more resolution." },
  { id: "capacity", name: "Standard vs high capacity", hint: "Ion-exchange sites on the resin",
    lede: "Capacity is how many ion-exchange sites the column has. More sites means more room before a big peak swamps its neighbours.",
    cols: ["Standard capacity", "High capacity"],
    rows: [
      ["Sample tolerance", "Can overload with high-ionic-strength samples", "Handles salty samples and larger injections"],
      ["Close peak pairs", "Good", "Better, with more room to separate"],
      ["Eluent strength needed", "Lower", "Higher, often with longer runs"],
      ["Typical use", "Clean drinking water, routine anions", "Wastewater, brines, trace ions beside large peaks"],
    ],
    choose: "Use high capacity when a large matrix peak, like chloride in seawater, sits next to the trace ion you care about." },
  { id: "guard", name: "Guard vs analytical", hint: "Protecting the column",
    lede: "A guard column is a short, inexpensive column in front of the analytical one. It takes the damage so the analytical column doesn't.",
    cols: ["Guard column", "Analytical column"],
    rows: [
      ["Job", "Traps particles and strongly retained contaminants", "Does the separation"],
      ["Length", "Short, a few centimetres", "Typically 100 to 250 mm"],
      ["Packing", "Usually the same chemistry as its analytical column", "The resin chosen for the separation"],
      ["Replaced", "Often, when pressure rises or peaks degrade", "Rarely, when it is well protected"],
    ],
    choose: "Always run a guard with real samples. Replacing it is much cheaper than replacing the analytical column." },
];
const wsEl = document.getElementById("ws"), wsTopics = document.getElementById("wsTopics"), wsDetail = document.getElementById("wsDetail");
let wsTopic = "exchange", wsMode = "anion", wsOpen = false, wsHome = null;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function wsRenderTopics() {
  wsTopics.innerHTML = WS_TOPICS.map((t) => `<button type="button" class="ws-topic" data-topic="${t.id}" aria-pressed="${t.id === wsTopic}">${esc(t.name)}<small>${esc(t.hint)}</small></button>`).join("");
  const t = WS_TOPICS.find((x) => x.id === wsTopic);
  wsDetail.innerHTML = `<h3>${esc(t.name)}</h3><p class="lede">${esc(t.lede)}</p>
    <div class="ws-table-wrap"><table class="ws-table"><thead><tr><th scope="col"><span class="visually-hidden">Property</span></th><th scope="col">${esc(t.cols[0])}</th><th scope="col">${esc(t.cols[1])}</th></tr></thead>
    <tbody>${t.rows.map((r) => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</tbody></table></div>
    <p class="ws-choose"><b>When to choose</b>${esc(t.choose)}</p>`;
}
wsTopics.addEventListener("click", (e) => { const b = e.target.closest("[data-topic]"); if (!b) return; wsTopic = b.dataset.topic; wsRenderTopics(); wsTopics.querySelector(`[data-topic="${wsTopic}"]`).focus(); });
const num = (id, d) => { const v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : d; };
const fmt = (v, dp) => (Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
function wsScale() {
  const oid = num("sOldId", 4), nid = num("sNewId", 2), f = num("sFlow", 1), inj = num("sInj", 25), ol = num("sOldL", 250), nl = num("sNewL", 150);
  const k = Math.pow(nid / oid, 2), nf = f * k, saved = (f - nf) * 1440, lr = nl / ol;
  const res = [
    ["New flow", fmt(nf, 3) + " mL/min", "Same linear velocity"],
    ["New injection", fmt(inj * k * lr, 1) + " µL", "Same load per column volume (d² × length)"],
    [saved >= 0 ? "Eluent saved / 24 h" : "Extra eluent / 24 h", fmt(Math.abs(saved) / 1000, 2) + " L", "Running continuously"],
    ["Run time", "× " + fmt(lr, 2), "Scales with length"],
    ["Backpressure", "× " + fmt(lr, 2), "Scales with length"],
    ["Resolution", "× " + fmt(Math.sqrt(lr), 2), "Scales with √length"],
  ];
  document.getElementById("wsScaleOut").innerHTML = res.map((r) => `<div class="ws-res"><span>${esc(r[0])}</span><b>${esc(r[1])}</b><small>${esc(r[2])}</small></div>`).join("");
}
document.getElementById("wsScale").addEventListener("input", wsScale);
const RUNS = {
  anion: { unit: "µS/cm", eluent: "Carbonate/bicarbonate eluent, suppressed conductivity", ions: [["F⁻", 3.1, 0.55], ["Cl⁻", 4.6, 0.9], ["NO₂⁻", 5.6, 0.32], ["Br⁻", 6.9, 0.28], ["NO₃⁻", 7.9, 0.6], ["PO₄³⁻", 10.2, 0.3], ["SO₄²⁻", 12.1, 0.75]] },
  cation: { unit: "µS/cm", eluent: "Methanesulfonic acid eluent, suppressed conductivity", ions: [["Li⁺", 3.6, 0.3], ["Na⁺", 4.6, 0.85], ["NH₄⁺", 5.3, 0.45], ["K⁺", 6.8, 0.5], ["Mg²⁺", 9.6, 0.7], ["Ca²⁺", 11.7, 0.8]] },
};
function wsChart() {
  const cv = document.getElementById("wsChart"), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement), ink = cs.getPropertyValue("--ink").trim(), soft = cs.getPropertyValue("--ink-soft").trim(), line = cs.getPropertyValue("--line").trim(), acc = cs.getPropertyValue("--accent").trim();
  const run = RUNS[wsMode], T = 14, pl = 44, pr = 16, pt = 18, pb = 34, cw = W - pl - pr, ch = H - pt - pb;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = line; g.lineWidth = 1; g.font = "11px " + cs.getPropertyValue("--mono"); g.fillStyle = soft;
  for (let m = 0; m <= T; m += 2) { const x = pl + (m / T) * cw; g.beginPath(); g.moveTo(x, pt); g.lineTo(x, pt + ch); g.stroke(); g.textAlign = "center"; g.fillText(String(m), x, H - 14); }
  g.textAlign = "left"; g.fillText("min", W - pr - 22, H - 2); g.fillText(run.unit, 6, pt + 4);
  g.beginPath(); g.moveTo(pl, pt + ch); g.lineTo(pl + cw, pt + ch); g.strokeStyle = soft; g.stroke();
  g.strokeStyle = acc; g.lineWidth = 2; g.beginPath();
  for (let i = 0; i <= cw; i++) {
    const t = (i / cw) * T; let y = 0.02 + 0.01 * Math.sin(t * 1.7);
    run.ions.forEach(([, rt, h]) => { const s = 0.09 + rt * 0.012; y += h * Math.exp(-Math.pow(t - rt, 2) / (2 * s * s)); });
    const py = pt + ch - Math.min(1, y) * ch * 0.92; i ? g.lineTo(pl + i, py) : g.moveTo(pl + i, py);
  }
  g.stroke();
  g.fillStyle = ink; g.textAlign = "center"; g.font = "600 12px " + cs.getPropertyValue("--body");
  run.ions.forEach(([n, rt, h]) => g.fillText(n, pl + (rt / T) * cw, pt + ch - h * ch * 0.92 - 8));
  document.getElementById("wsRunMeta").innerHTML = `<span>${esc(run.eluent)}</span><span>Elution order: ${esc(run.ions.map((x) => x[0]).join(", "))}</span>`;
}
wsEl.querySelector(".ws-seg").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mode]"); if (!b) return; wsMode = b.dataset.mode;
  wsEl.querySelectorAll(".ws-seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); wsChart();
});
wsEl.querySelector(".ws-tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]"); if (!b) return;
  wsEl.querySelectorAll(".ws-tabs [data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  wsEl.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
  if (b.dataset.tab === "run") requestAnimationFrame(wsChart);
});
window.addEventListener("resize", () => { if (wsOpen) wsChart(); });
wsRenderTopics(); wsScale();
function openWorkstation() {
  if (wsOpen || deskOpen) return;
  const home = focusHome ? { pos: focusHome.pos.clone(), tgt: focusHome.tgt.clone() } : { pos: camera.position.clone(), tgt: controls.target.clone() };
  focusHome = null; wsHome = home; wsOpen = true; deskOpen = true;
  document.body.classList.add("os-mode");
  closeSheet(true); setHover(null);
  labelsEl.hidden = true; hint.hidden = true; tween = null; controls.enabled = false;
  const sb = new THREE.Box3().setFromObject(icScreen), c = new THREE.Vector3(), s = new THREE.Vector3(); sb.getCenter(c); sb.getSize(s);
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const d = Math.max((s.y / 2) / tv, (s.z / 2) / tv / camera.aspect) * 1.04;
  animateCamera(new THREE.Vector3(c.x + d, c.y, c.z), c, 1.0, () => {
    wsEl.hidden = false; requestAnimationFrame(() => { wsEl.classList.add("show"); wsChart(); });
    document.getElementById("wsClose").focus({ preventScroll: true });
  });
}
let wsClosing = false;
function closeWorkstation() {
  if (!wsOpen || wsClosing) return;
  wsClosing = true;
  wsEl.classList.remove("show");
  setTimeout(() => {
    wsEl.hidden = true;
    animateCamera(wsHome.pos, wsHome.tgt, 0.9, () => {
      wsOpen = false; wsClosing = false; deskOpen = false; controls.enabled = true; controls.minDistance = 8;
      document.body.classList.remove("os-mode");
      labelsEl.hidden = pMode; if (!pMode) hint.hidden = false;
    });
  }, reduce ? 0 : 250);
}
document.getElementById("wsClose").addEventListener("click", closeWorkstation);
wsEl.addEventListener("click", (e) => { if (e.target === wsEl) closeWorkstation(); });
