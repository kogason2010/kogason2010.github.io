/*
 * HPLC Tools — calculation core.
 * Pure functions only (no DOM). Loaded by the page as window.HPLC and by
 * tests/calc.test.js through Node's require().
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HPLC = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const LN10 = Math.LN10;

  // =====================================================================
  // Method transfer / geometric scaling
  // =====================================================================
  /**
   * Scale a method from column 1 to column 2.
   * Lengths in mm, particle size in µm, flow in mL/min, volume in µL.
   */
  function transfer(o) {
    const { L1, d1, p1, F1, V1, L2, d2, p2 } = o;
    const useDp = o.useDp !== false;
    const extraPct = Number.isFinite(o.extraPct) ? o.extraPct : 0;
    const volRatio = (L2 * d2 * d2) / (L1 * d1 * d1);
    const Fgeo = F1 * (d2 * d2) / (d1 * d1) * (useDp ? p1 / p2 : 1);
    const F2 = Fgeo * (1 + extraPct / 100);
    const V2 = Number.isFinite(V1) ? V1 * volRatio : NaN;
    const timeFactor = (F1 / F2) * volRatio; // keeps gradient volume / column volume
    const lp1 = (L1 * 1000) / p1;
    const lp2 = (L2 * 1000) / p2;
    const lpChange = lp2 / lp1 - 1;
    const eps = 1e-9;
    const lpOK = lpChange >= -0.25 - eps && lpChange <= 0.5 + eps;
    const flowAdjOK = Math.abs(extraPct) <= 50 + eps;
    const pressureRatio = (F2 / F1) * (L2 / L1) * Math.pow(d1 / d2, 2) * Math.pow(p1 / p2, 2);
    const velocityRatio = (F2 / (d2 * d2)) / (F1 / (d1 * d1));
    return { volRatio, Fgeo, F2, V2, timeFactor, lp1, lp2, lpChange, lpOK, flowAdjOK, pressureRatio, velocityRatio };
  }

  /**
   * Dwell-volume compensation. D1, D2 in mL. Returns the original dwell
   * volume scaled to the new column, and either an initial isocratic hold
   * (new system dwell is smaller) or an injection delay (new dwell larger).
   */
  function dwellCompensation(D1, D2, volRatio, F2) {
    const target = D1 * volRatio;
    const diff = target - D2;
    const tol = 1e-6;
    if (Math.abs(diff) < tol) return { target, diff: 0, hold: 0, delay: 0 };
    return diff > 0
      ? { target, diff, hold: diff / F2, delay: 0 }
      : { target, diff, hold: 0, delay: -diff / F2 };
  }

  /**
   * Scale a gradient table [[t, %B], ...]. Rows with non-finite values are
   * dropped, the rest sorted by time. If hold > 0 it is inserted as an
   * initial isocratic segment at the starting composition.
   */
  function scaleGradient(rows, timeFactor, hold) {
    const clean = rows.filter((r) => Number.isFinite(r[0]) && Number.isFinite(r[1])).slice().sort((a, b) => a[0] - b[0]);
    const h = hold > 0 ? hold : 0;
    const out = [];
    clean.forEach((r, i) => {
      if (h > 0 && i === 0 && r[0] === 0) {
        out.push([0, r[1]]);
        out.push([h, r[1]]);
        return;
      }
      out.push([r[0] * timeFactor + h, r[1]]);
    });
    return out;
  }

  // =====================================================================
  // System suitability
  // =====================================================================
  const retentionFactor = (tR, t0) => (tR - t0) / t0;

  /** Plate number. basis "half" (5.54, width at half height) or "base" (16, tangent width). */
  function plates(tR, w, basis) {
    return (basis === "base" ? 16 : 5.54) * Math.pow(tR / w, 2);
  }

  /** Resolution from two peaks. */
  function resolution(tR1, tR2, w1, w2, basis) {
    return (basis === "base" ? 2 : 1.18) * Math.abs(tR2 - tR1) / (w1 + w2);
  }

  /** USP/Ph. Eur. symmetry (tailing) factor As = W0.05 / 2f. */
  const symmetry = (W005, f) => W005 / (2 * f);

  /** Signal-to-noise, S/N = 2H/h (USP <621>, Ph. Eur. 2.2.46). */
  const signalToNoise = (H, h) => (2 * H) / h;

  /** Reduced plate height h = (L/N)/dp; L mm, dp µm. */
  const reducedPlateHeight = (Lmm, N, dpum) => ((Lmm * 1000) / N) / dpum;

  /** Purnell equation. */
  const purnell = (N, a, k) => (Math.sqrt(N) / 4) * ((a - 1) / a) * (k / (1 + k));
  const purnellPlatesNeeded = (Rs, a, k) => 16 * Rs * Rs * Math.pow(a / (a - 1), 2) * Math.pow((1 + k) / k, 2);
  function purnellAlphaNeeded(Rs, N, k) {
    const q = (4 * Rs) / (Math.sqrt(N) * (k / (1 + k)));
    return q < 1 ? 1 / (1 - q) : NaN;
  }

  /** Mean, sample SD, %RSD. */
  function stats(values) {
    const v = values.filter(Number.isFinite);
    const n = v.length;
    if (n === 0) return { n: 0, mean: NaN, sd: NaN, rsd: NaN, min: NaN, max: NaN };
    const mean = v.reduce((s, x) => s + x, 0) / n;
    const sd = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - mean) * (x - mean), 0) / (n - 1)) : NaN;
    return { n, mean, sd, rsd: (100 * sd) / Math.abs(mean), min: Math.min(...v), max: Math.max(...v) };
  }

  /** Parse numbers from free text (commas, spaces, tabs, newlines, semicolons). */
  function parseNumbers(text) {
    return String(text)
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map(Number)
      .filter(Number.isFinite);
  }

  // =====================================================================
  // Gradient (linear-solvent-strength model)
  // =====================================================================
  /** Gradient retention factor k* = tG·F / (1.15·Vm·Δφ·S). Δφ as a fraction. */
  const gradientK = (tG, F, Vm, dPhi, S) => (tG * F) / (1.15 * Vm * dPhi * S);
  /** Gradient time giving a target k*. */
  const gradientTimeForK = (k, F, Vm, dPhi, S) => (1.15 * k * Vm * dPhi * S) / F;
  /** Gradient peak capacity, n = 1 + tG / w (w = average 4σ baseline width). */
  const peakCapacity = (tG, w) => 1 + tG / w;

  // =====================================================================
  // Column geometry
  // =====================================================================
  /** Empty column volume, mL (L, dc in mm). */
  const columnVolume = (Lmm, dcmm) => (Math.PI * Math.pow(dcmm / 2, 2) * Lmm) / 1000;
  /** Mobile-phase (void) volume, mL. */
  const voidVolume = (Lmm, dcmm, epsT) => epsT * columnVolume(Lmm, dcmm);
  /** Chromatographic linear velocity u0 = L/t0, mm/s. */
  function linearVelocity(FmLmin, dcmm, epsT) {
    const area = Math.PI * Math.pow(dcmm / 2, 2); // mm²
    return (FmLmin * 1000 / 60) / (epsT * area);
  }

  // =====================================================================
  // Viscosity & pressure
  // =====================================================================
  // Chen & Horváth (1993) correlation, as widely used in HPLC:
  // ln(η/cP) = φ(a1 + b1/T) + (1−φ)(a2 + b2/T) + φ(1−φ)(a3 + b3/T)
  // φ = volume fraction of organic modifier, T in kelvin.
  const VISCOSITY = {
    acn: { name: "Acetonitrile", org: [-3.476, 726], water: [-5.414, 1566], mix: [-1.762, 929] },
    meoh: { name: "Methanol", org: [-4.597, 1211], water: [-5.961, 1736], mix: [-6.215, 2809] },
  };
  function viscosity(org, pct, tC) {
    const p = VISCOSITY[org];
    const phi = Math.min(Math.max(pct / 100, 0), 1);
    const T = tC + 273.15;
    return Math.exp(
      phi * (p.org[0] + p.org[1] / T) +
      (1 - phi) * (p.water[0] + p.water[1] / T) +
      phi * (1 - phi) * (p.mix[0] + p.mix[1] / T)
    );
  }

  /**
   * Column pressure drop (bar) from Darcy's law, ΔP = φ·η·L·u0/dp²,
   * with u0 the chromatographic linear velocity (L/t0).
   * η cP, L mm, dc mm, dp µm, F mL/min, epsT total porosity.
   */
  function columnPressure(phi, etaCP, Lmm, dcmm, dpum, FmLmin, epsT) {
    const u0 = linearVelocity(FmLmin, dcmm, epsT) * 1e-3; // m/s
    const dp = dpum * 1e-6;
    return (phi * etaCP * 1e-3 * Lmm * 1e-3 * u0) / (dp * dp) / 1e5;
  }
  /** Back-calculate φ from a measured pressure (bar). */
  function flowResistance(Pbar, etaCP, Lmm, dcmm, dpum, FmLmin, epsT) {
    return Pbar / columnPressure(1, etaCP, Lmm, dcmm, dpum, FmLmin, epsT);
  }

  // =====================================================================
  // Buffers
  // =====================================================================
  // Each system: thermodynamic pKa at 25 °C, charge of the acid form (za),
  // and the counter-ions each reagent brings ([charge, count per formula unit]).
  // liquid reagents carry mol per mL of commercial reagent.
  const BUFFERS = [
    { id: "phos1", name: "Phosphate, pKa₁ 2.15 — H₃PO₄ (85%) / KH₂PO₄", pKa: 2.15, za: 0,
      acid: { name: "Phosphoric acid, 85% w/w", mw: 97.995, liquid: (1.685 * 0.85) / 97.995, liqNote: "85% w/w, d 1.685 g/mL ≈ 14.6 M", ions: [] },
      base: { name: "Potassium dihydrogen phosphate (KH₂PO₄)", mw: 136.09, ions: [[1, 1]] } },
    { id: "phos2k", name: "Phosphate, pKa₂ 7.20 — KH₂PO₄ / K₂HPO₄", pKa: 7.20, za: -1,
      acid: { name: "Potassium dihydrogen phosphate (KH₂PO₄)", mw: 136.09, ions: [[1, 1]] },
      base: { name: "Dipotassium hydrogen phosphate (K₂HPO₄)", mw: 174.18, ions: [[1, 2]] } },
    { id: "phos2na", name: "Phosphate, pKa₂ 7.20 — NaH₂PO₄ / Na₂HPO₄ (anhydrous)", pKa: 7.20, za: -1,
      acid: { name: "Sodium dihydrogen phosphate, anhydrous", mw: 119.98, ions: [[1, 1]] },
      base: { name: "Disodium hydrogen phosphate, anhydrous", mw: 141.96, ions: [[1, 2]] } },
    { id: "formate", name: "Formate, pKa 3.75 — formic acid / ammonium formate", pKa: 3.75, za: 0, ms: true,
      acid: { name: "Formic acid, ≥98%", mw: 46.03, liquid: (1.22 * 0.98) / 46.03, liqNote: "≈98%, d 1.22 g/mL ≈ 26 M", ions: [] },
      base: { name: "Ammonium formate", mw: 63.06, ions: [[1, 1]] } },
    { id: "acetNa", name: "Acetate, pKa 4.76 — acetic acid / sodium acetate", pKa: 4.76, za: 0,
      acid: { name: "Acetic acid, glacial", mw: 60.05, liquid: 1.049 / 60.05, liqNote: "glacial, d 1.049 g/mL ≈ 17.5 M", ions: [] },
      base: { name: "Sodium acetate, anhydrous", mw: 82.03, ions: [[1, 1]] } },
    { id: "acetNH4", name: "Acetate, pKa 4.76 — acetic acid / ammonium acetate", pKa: 4.76, za: 0, ms: true,
      acid: { name: "Acetic acid, glacial", mw: 60.05, liquid: 1.049 / 60.05, liqNote: "glacial, d 1.049 g/mL ≈ 17.5 M", ions: [] },
      base: { name: "Ammonium acetate", mw: 77.08, ions: [[1, 1]] } },
    { id: "tris", name: "Tris, pKa 8.07 (25 °C) — Tris·HCl / Tris base", pKa: 8.07, za: 1,
      acid: { name: "Tris hydrochloride", mw: 157.60, ions: [[-1, 1]] },
      base: { name: "Tris base", mw: 121.14, ions: [] },
      note: "Tris pKa falls by about 0.028 per °C; set pH at the temperature of use." },
    { id: "ammonia", name: "Ammonium, pKa 9.25 — ammonium acetate / ammonia (25%)", pKa: 9.25, za: 1, ms: true,
      acid: { name: "Ammonium acetate (NH₄⁺ source)", mw: 77.08, ions: [[-1, 1]] },
      base: { name: "Ammonia solution, 25% w/w", mw: 17.03, liquid: (0.91 * 0.25) / 17.03, liqNote: "25% w/w, d 0.91 g/mL ≈ 13.4 M", ions: [] },
      note: "Concentration here is total ammonia (NH₄⁺ + NH₃); acetate is present as counter-ion. Ammonia is volatile — prepare fresh." },
  ];

  const DAVIES_A = 0.509; // 25 °C
  const KW = 1e-14;
  /** Davies term f(I) = √I/(1+√I) − 0.3·I; log γ = −A·z²·f(I). */
  const daviesF = (I) => Math.sqrt(I) / (1 + Math.sqrt(I)) - 0.3 * I;

  /**
   * Amounts of acid-form and base-form reagent for a buffer of total
   * concentration C (mM) at target pH (as read by a pH meter, i.e. activity),
   * in volume V (mL). Uses the full charge balance (includes free H⁺/OH⁻)
   * and Davies activity coefficients, iterated on ionic strength.
   *   n_base = C·α − [H⁺] + [OH⁻],  n_acid = C − n_base
   * which holds for every reagent pair here (the two forms differ by one H⁺).
   */
  function bufferPrep(sys, pH, CmM, VmL, opts = {}) {
    const C = CmM / 1000;
    const activity = opts.activity !== false;
    const aH = Math.pow(10, -pH);
    let I = 0.5 * C; // starting guess
    let r;
    for (let iter = 0; iter < 200; iter++) {
      const f = activity ? daviesF(I) : 0;
      const g1 = Math.pow(10, -DAVIES_A * f);
      const pKaEff = sys.pKa + (activity ? DAVIES_A * f * (2 * sys.za - 1) : 0);
      const ratio = Math.pow(10, pH - pKaEff);
      const alpha = ratio / (1 + ratio);
      const H = aH / g1;
      const OH = KW / aH / g1;
      const nB = C * alpha - H + OH;
      const nA = C - nB;
      const ions = [
        [sys.za, C * (1 - alpha)],
        [sys.za - 1, C * alpha],
        [1, H],
        [-1, OH],
      ];
      sys.acid.ions.forEach(([z, n]) => ions.push([z, Math.max(nA, 0) * n]));
      sys.base.ions.forEach(([z, n]) => ions.push([z, Math.max(nB, 0) * n]));
      const Inew = 0.5 * ions.reduce((s, [z, c]) => s + z * z * c, 0);
      r = { pKaEff, alpha, H, OH, nA, nB, I: Inew };
      if (!activity || Math.abs(Inew - I) < 1e-12) break;
      I = 0.5 * (I + Inew);
    }
    const VL = VmL / 1000;
    const beta = LN10 * (r.H + r.OH + C * r.alpha * (1 - r.alpha)); // mol/L per pH
    const hh = Math.pow(10, pH - sys.pKa);
    const hhBase = C * hh / (1 + hh);
    return {
      pKaEff: r.pKaEff,
      ionicStrength: r.I,
      alpha: r.alpha,
      molAcid: r.nA * VL,
      molBase: r.nB * VL,
      feasible: r.nA >= 0 && r.nB >= 0,
      needs: r.nB < 0 ? "acid" : r.nA < 0 ? "base" : null,
      bufferCapacity: beta, // mol/L/pH
      hhMolBase: hhBase * VL,
      hhMolAcid: (C - hhBase) * VL,
    };
  }

  /** Common acidic mobile-phase additives (for pH of x% v/v in water). */
  const ADDITIVES = [
    { id: "formic", name: "Formic acid (≥98%)", pKa: 3.75, mw: 46.03, density: 1.22, purity: 0.98 },
    { id: "acetic", name: "Acetic acid (glacial)", pKa: 4.76, mw: 60.05, density: 1.049, purity: 1.0 },
    { id: "tfa", name: "Trifluoroacetic acid (TFA)", pKa: 0.23, mw: 114.02, density: 1.489, purity: 1.0 },
    { id: "phosphoric", name: "Phosphoric acid (85%)", pKa: 2.15, mw: 97.995, density: 1.685, purity: 0.85 },
  ];

  /** pH of a monoprotic weak acid at concentration C (M), Davies-corrected. */
  function weakAcidPH(pKa, C) {
    const Ka = Math.pow(10, -pKa);
    let I = 0;
    let H = 0;
    for (let i = 0; i < 100; i++) {
      const g1 = Math.pow(10, -DAVIES_A * daviesF(I));
      const Kc = Ka / (g1 * g1); // concentration-based constant (neutral HA)
      H = (-Kc + Math.sqrt(Kc * Kc + 4 * Kc * C)) / 2;
      const Inew = H;
      if (Math.abs(Inew - I) < 1e-14) { I = Inew; break; }
      I = Inew;
    }
    const g1 = Math.pow(10, -DAVIES_A * daviesF(I));
    return -Math.log10(H * g1);
  }
  /** Molarity (M) of an additive at pct % v/v. */
  const additiveMolarity = (add, pctV) => (pctV / 100) * add.density * add.purity * 1000 / add.mw;

  // =====================================================================
  // Units
  // =====================================================================
  const PRESSURE_PER_BAR = { bar: 1, psi: 14.503774, mpa: 0.1, kpa: 100, atm: 0.98692327, kgf: 1.0197162 };

  return {
    transfer, dwellCompensation, scaleGradient,
    retentionFactor, plates, resolution, symmetry, signalToNoise, reducedPlateHeight,
    purnell, purnellPlatesNeeded, purnellAlphaNeeded, stats, parseNumbers,
    gradientK, gradientTimeForK, peakCapacity,
    columnVolume, voidVolume, linearVelocity,
    VISCOSITY, viscosity, columnPressure, flowResistance,
    BUFFERS, bufferPrep, ADDITIVES, weakAcidPH, additiveMolarity,
    PRESSURE_PER_BAR,
  };
});
