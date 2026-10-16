/* Resolve: the chromatography behind the game.
   Retention follows the linear-solvent-strength model, log k = log kw − S·φ,
   with a small linear temperature term, and each band is migrated numerically
   through the gradient (so the dwell volume, the gradient and the final hold all
   count). Peak widths come from the plate count and the retention factor at elution.
   Compound parameters are illustrative, chosen to behave like real small molecules.
   Works in the browser (window.ResolveEngine) and in Node (module.exports). */
(function (root) {
  'use strict';

  const COLUMN = {
    name: 'C18, 100 × 2.1 mm, 1.8 µm',
    t0: 0.55,     // min: void time at 0.4 mL/min
    tD: 0.25,     // min: dwell time before the gradient reaches the column
    N: 9000,      // theoretical plates
    flow: 0.4,    // mL/min
  };

  const logk = (c, phi, T) => c.lkw + (c.h || 0) * (T - 30) - c.S * phi;

  /* %B (as a fraction) delivered to the column inlet at time t. */
  function phiAt(m, t) {
    const a = m.start / 100, b = m.end / 100;
    if (t < COLUMN.tD) return a;
    const x = (t - COLUMN.tD) / m.time;
    return x >= 1 ? b : a + (b - a) * x;
  }

  /* Migrate one band through the column. Returns retention time, k at elution and σ. */
  function elute(c, m, maxT) {
    const dt = 0.002;
    let z = 0, t = 0;
    while (t < maxT) {
      const k = Math.pow(10, logk(c, phiAt(m, t), m.temp));
      z += dt / (COLUMN.t0 * (1 + k));
      t += dt;
      if (z >= 1) {
        const ke = Math.pow(10, logk(c, phiAt(m, Math.max(0, t - COLUMN.t0)), m.temp));
        const sigma = (COLUMN.t0 * (1 + ke)) / Math.sqrt(COLUMN.N);
        return { tR: t, ke, sigma };
      }
    }
    return { tR: Infinity, ke: Infinity, sigma: 0 };
  }

  /* Run a method on a sample. */
  function run(sample, method, opts = {}) {
    const maxT = opts.maxT || 60;
    const peaks = sample.compounds.map((c, i) => ({ ...elute(c, method, maxT), i, name: c.name, area: c.area || 1 }));
    const eluted = peaks.filter((p) => isFinite(p.tR)).sort((a, b) => a.tR - b.tR);
    const pairs = [];
    for (let j = 1; j < eluted.length; j++) {
      const p = eluted[j - 1], q = eluted[j];
      pairs.push({ a: p.i, b: q.i, rs: (q.tR - p.tR) / (2 * (p.sigma + q.sigma)) });
    }
    const last = eluted.length ? eluted[eluted.length - 1] : null;
    const runTime = last ? last.tR + 3 * last.sigma : 0;
    const minRs = pairs.length ? Math.min(...pairs.map((x) => x.rs)) : Infinity;
    const allEluted = eluted.length === peaks.length;
    /* The first real peak has to be retained past the void (k ≥ 1), or it's sitting in the junk at t0. */
    const firstReal = eluted.find((p) => !sample.compounds[p.i].marker);
    const kFirst = firstReal ? firstReal.tR / COLUMN.t0 - 1 : Infinity;
    const retained = kFirst >= 1;
    const pass = allEluted && retained && minRs >= (sample.targetRs || 1.5) && runTime <= sample.limit;
    return { peaks, eluted, pairs, minRs, runTime, allEluted, retained, kFirst, pass };
  }

  /* Detector signal at time t (sum of Gaussian peaks plus a gentle gradient baseline). */
  function signal(result, method, t) {
    let y = 0;
    for (const p of result.eluted) {
      const d = (t - p.tR) / p.sigma;
      if (d > -6 && d < 6) y += (p.area / (p.sigma * 2.5066)) * Math.exp(-0.5 * d * d);
    }
    return y + 0.6 * (phiAt(method, t) - method.start / 100);
  }

  /* The samples, easiest first. Each one fails with its default method. */
  const LEVELS = [
    {
      id: 'tablet',
      title: 'Headache tablet',
      brief: 'Four ingredients of a combination tablet. The fast generic gradient squeezes two of them together. Slow it down without blowing the run time.',
      limit: 5,
      par: 3,
      injections: 6,
      start: { start: 5, end: 95, time: 1, temp: 30 },
      controls: ['start', 'end', 'time'],
      compounds: [
        { name: 'Acetaminophen', lkw: 1.55, S: 3.6, area: 1.0 },
        { name: 'Caffeine', lkw: 1.75, S: 3.3, area: 0.8 },
        { name: 'Salicylic acid', lkw: 2.62, S: 4.1, area: 0.5 },
        { name: 'Aspirin', lkw: 2.55, S: 3.8, area: 0.9 },
      ],
    },
    {
      id: 'parabens',
      title: 'Paraben preservatives',
      brief: 'A homologous series: each paraben has one more CH₂ than the last. Too steep and the late ones bunch up; too shallow and the run takes forever.',
      limit: 6,
      par: 3.5,
      injections: 6,
      start: { start: 40, end: 95, time: 1.5, temp: 30 },
      controls: ['start', 'end', 'time'],
      compounds: [
        { name: 'Methylparaben', lkw: 2.35, S: 3.6, area: 1.0 },
        { name: 'Ethylparaben', lkw: 2.80, S: 3.9, area: 0.9 },
        { name: 'Propylparaben', lkw: 3.27, S: 4.2, area: 0.8 },
        { name: 'Butylparaben', lkw: 3.74, S: 4.5, area: 0.7 },
        { name: 'Benzylparaben', lkw: 3.82, S: 4.7, area: 0.5 },
      ],
    },
    {
      id: 'crossover',
      title: 'The crossover',
      brief: 'Two impurities change places as the gradient gets steeper, because they respond to %B differently. There is a window between where both resolve. Find it.',
      limit: 8,
      par: 4.5,
      injections: 7,
      start: { start: 10, end: 90, time: 10, temp: 30 },
      controls: ['start', 'end', 'time'],
      compounds: [
        { name: 'API', lkw: 2.30, S: 3.8, area: 1.3 },
        { name: 'Impurity A', lkw: 2.55, S: 4.4, area: 0.35 },
        { name: 'Impurity B', lkw: 3.05, S: 5.6, area: 0.3 },
        { name: 'Impurity C', lkw: 3.40, S: 4.9, area: 0.4 },
        { name: 'Dimer', lkw: 4.10, S: 5.2, area: 0.25 },
      ],
    },
    {
      id: 'temperature',
      title: 'Turn up the heat',
      brief: 'Two isomers co-elute at any gradient. The column oven is unlocked: they respond to temperature differently, which changes selectivity, not just speed.',
      limit: 8,
      par: 5,
      injections: 7,
      start: { start: 10, end: 80, time: 8, temp: 30 },
      controls: ['start', 'end', 'time', 'temp'],
      compounds: [
        { name: 'Precursor', lkw: 2.10, S: 3.6, h: -0.010, area: 0.6 },
        { name: 'cis isomer', lkw: 2.90, S: 4.30, h: -0.004, area: 1.0 },
        { name: 'trans isomer', lkw: 2.925, S: 4.35, h: -0.0075, area: 1.0 },
        { name: 'Oxidation product', lkw: 3.45, S: 4.6, h: -0.011, area: 0.4 },
      ],
    },
    {
      id: 'rush',
      title: 'Release testing',
      brief: 'Seven components and a tight run time, because the lab needs throughput. Every pair has to hit Rs 1.5. Use everything you have learned.',
      limit: 8,
      par: 5.5,
      injections: 8,
      start: { start: 5, end: 95, time: 12, temp: 30 },
      controls: ['start', 'end', 'time', 'temp'],
      compounds: [
        { name: 'Uracil marker', lkw: 0.40, S: 2.0, h: -0.004, area: 0.4 },
        { name: 'Metabolite 1', lkw: 1.90, S: 3.4, h: -0.009, area: 0.5 },
        { name: 'Metabolite 2', lkw: 2.05, S: 3.9, h: -0.014, area: 0.5 },
        { name: 'Active', lkw: 2.75, S: 4.0, h: -0.010, area: 1.4 },
        { name: 'Degradant', lkw: 2.95, S: 4.5, h: -0.006, area: 0.35 },
        { name: 'Excipient', lkw: 3.55, S: 4.6, h: -0.012, area: 0.6 },
        { name: 'Antioxidant', lkw: 4.20, S: 4.9, h: -0.011, area: 0.45 },
      ],
    },
  ];

  const RANGES = {
    start: { min: 0, max: 80, step: 1, unit: '%B', label: 'Start' },
    end: { min: 20, max: 100, step: 1, unit: '%B', label: 'End' },
    time: { min: 0.5, max: 30, step: 0.5, unit: 'min', label: 'Gradient time' },
    temp: { min: 25, max: 70, step: 1, unit: '°C', label: 'Column temperature' },
  };

  /* Stars: 1 for any pass, 2 for passing within the par run time, 3 for par on the first or second injection. */
  function stars(result, level, injectionNo) {
    if (!result.pass) return 0;
    if (result.runTime <= level.par) return injectionNo <= 2 ? 3 : 2;
    return 1;
  }

  const api = { COLUMN, LEVELS, RANGES, run, signal, phiAt, stars };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ResolveEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
