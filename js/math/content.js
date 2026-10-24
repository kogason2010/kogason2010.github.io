/* js/math/content.js — The words in the Mathematics building's panels: the Yang–Mills problem, the live lattice, confinement,
   SU(2) and bundles, the glueball evidence, the seven Millennium Prize Problems and the prize rules.
   Facts are from the Clay Mathematics Institute's official problem description (Jaffe and Witten) and its 2018 prize rules,
   and from Morningstar and Peardon's lattice study. Nothing here claims a solution: the problem is open.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const MATH_SRC = {
  jw: '<a href="https://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf" target="_blank" rel="noopener">Jaffe &amp; Witten, “Quantum Yang–Mills Theory” (Clay)</a>',
  clay: '<a href="https://www.claymath.org/millennium-problems" target="_blank" rel="noopener">Clay Mathematics Institute: Millennium Problems</a>',
  rules: '<a href="https://www.claymath.org/wp-content/uploads/2022/03/millennium_prize_rules_0.pdf" target="_blank" rel="noopener">Rules for the Millennium Prizes (2018, PDF)</a>',
  mp: '<a href="https://arxiv.org/abs/hep-lat/9901004" target="_blank" rel="noopener">Morningstar &amp; Peardon, “The glueball spectrum from an anisotropic lattice study” (arXiv: hep-lat/9901004)</a>',
};
const mathSources = (...k) => `<p class="m-src">Sources: ${k.map(x => MATH_SRC[x]).join(" · ")}</p>`;

// the glueball chart: one row per state, a dot at the mass with its combined error, the gap shaded from zero to the lightest
function glueballSvg() {
  const W = 340, rowH = 22, top = 18, H = top + GLUEBALLS.length * rowH + 34, L = 46, R = W - 58, gx = v => L + v / 4400 * (R - L);
  let s = `<svg class="m-chart" width="${W}" height="${H}" style="aspect-ratio: ${W} / ${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Glueball masses from lattice simulations, lightest 1.73 GeV">`;
  s += `<rect x="${gx(0)}" y="${top - 8}" width="${gx(1730) - gx(0)}" height="${GLUEBALLS.length * rowH + 4}" class="m-gap"/>`;
  s += `<text x="${(gx(0) + gx(1730)) / 2}" y="${top + GLUEBALLS.length * rowH + 10}" class="m-gaplab" text-anchor="middle">Δ, the gap</text>`;
  [0, 1, 2, 3, 4].forEach(v => { s += `<line x1="${gx(v * 1000)}" x2="${gx(v * 1000)}" y1="${top - 8}" y2="${top + GLUEBALLS.length * rowH - 4}" class="m-grid"/><text x="${gx(v * 1000)}" y="${H - 4}" class="m-ax" text-anchor="middle">${v} GeV</text>`; });
  GLUEBALLS.forEach(([j, m, e1, e2], i) => {
    const y = top + i * rowH + 6, e = Math.hypot(e1, e2);
    s += `<g class="m-row"><title>${j}: ${m} MeV (± ${e1} statistical, ± ${e2} scale)</title><rect x="0" y="${y - 12}" width="${W}" height="${rowH}" fill="transparent"/>`;
    s += `<text x="${L - 8}" y="${y + 4}" class="m-j" text-anchor="end">${j}</text><line x1="${gx(m - e)}" x2="${gx(m + e)}" y1="${y}" y2="${y}" class="m-err"/><circle cx="${gx(m)}" cy="${y}" r="4.5" class="m-dot"/>`;
    s += `<text x="${R + 6}" y="${y + 4}" class="m-v">${m}</text></g>`;
  });
  return s + "</svg>";
}

Object.assign(SECTIONS, {
  mathProblem: {
    kicker: "Mathematics · the problem", title: "Yang–Mills existence and mass gap",
    html: `<p>Yang–Mills theory is the mathematics behind the strong and weak nuclear forces: fields whose values live in a non-commutative group, such as SU(3) for quarks and gluons. Physicists calculate with it to astonishing precision. Mathematicians still can't build the quantum theory in four dimensions to the standard a proof needs.</p>
      <div class="m-state"><b>The question.</b> For every compact simple gauge group G, prove that a non-trivial quantum Yang–Mills theory exists on ℝ⁴, with properties at least as strong as the Wightman or Osterwalder–Schrader axioms, and that it has a <i>mass gap</i> Δ &gt; 0.</div>
      <p><b>What the gap means.</b> The vacuum has energy zero. A gap means nothing sits just above it: the Hamiltonian has no spectrum between 0 and Δ. Physically, the lightest particle has a positive mass, even though the classical Yang–Mills waves are massless.</p>
      <p class="m-open"><b>Status: open.</b> No one has solved it, and this room doesn't either. It shows what the problem asks, why it is believed, and what stands in the way.</p>
      <h3 class="m-h">What a proof would have to do</h3>
      <ol class="m-steps">
        <li><b>Start on a lattice.</b> Wilson's lattice version is finite, gauge invariant and reflection positive, so every quantity is a well-defined integral.</li>
        <li><b>Take away the lattice.</b> Show a limit exists as the spacing shrinks to zero. Balaban's renormalisation-group work went a long way on a finite box, but the four-dimensional construction is not complete.</li>
        <li><b>Take away the box.</b> Reach infinite volume while keeping a gap that doesn't shrink with the box. No method yet does this.</li>
        <li><b>Check the axioms.</b> Rebuild the Hilbert space and Hamiltonian from the limit and show the spectrum is {0} ∪ [Δ, ∞).</li>
      </ol>
      <p>Showing that a limit exists only abstractly, by compactness, doesn't count unless the gap and the axioms are proved for it too.</p>
      ${mathSources("jw", "clay")}`,
  },
  mathLattice: {
    kicker: "Mathematics · live simulation", title: "A lattice gauge field",
    html: `<p>This is a real Monte Carlo simulation of SU(2) lattice gauge theory, running in your browser: 6 × 6 × 6 sites with periodic edges, in three dimensions. The Clay problem is in four.</p>
      <p>Each link carries a 2 × 2 SU(2) matrix, stored as a unit quaternion; its colour shows how far it is from the identity. Each small square, a <i>plaquette</i>, glows with its share of Wilson's action, S = β Σ (1 − ½ Tr U<sub>p</sub>). Every few frames the computer offers each link a small random rotation and keeps it with probability min(1, e<sup>−ΔS</sup>).</p>
      <label class="m-slider"><span>Coupling β <b id="latBetaV">${LAT.beta.toFixed(1)}</b></span><input id="latBeta" type="range" min="0.5" max="8" step="0.1" value="${LAT.beta}"></label>
      <div class="m-read"><div><span>Average plaquette ½ Tr U<sub>p</sub></span><b id="latPlaq">–</b></div><div><span>Sweeps</span><b id="latSweeps">–</b></div><div><span>Acceptance</span><b id="latAcc">–</b></div></div>
      <button class="btn" type="button" data-lat="hot">Scramble the field</button>
      <p>At small β, strong coupling, the average plaquette is close to β/4; at large β it creeps toward 1 and the squares go dark. Simulations like this one, much larger and in four dimensions with a careful limit as the spacing shrinks, are the main evidence for the gap. They are evidence, not a proof.</p>
      ${mathSources("jw")}`,
  },
  mathFlux: {
    kicker: "Mathematics · confinement", title: "Why quarks never come alone",
    html: `<p>Between two electric charges the field lines spread out, and the force weakens with distance. In Yang–Mills theory with SU(3), physicists expect the colour field between a quark and an antiquark to squeeze into a narrow tube instead.</p>
      <p>A tube of fixed width holds a fixed energy per metre, so the energy grows roughly in proportion to the separation, V(r) ≈ σ r. Pulling the pair apart never gets easier, which is why no free quark has ever been seen.</p>
      <p>Confinement and the mass gap are closely tied together in physics, but the Clay problem asks only for existence and a gap. Jaffe and Witten list confinement as a further property one would hope to prove. The display here is a stylised picture, not a simulation.</p>
      ${mathSources("jw")}`,
  },
  mathHopf: {
    kicker: "Mathematics · geometry", title: "SU(2), the 3-sphere and bundles",
    html: `<p>SU(2), the group on every link of the lattice, is a 3-sphere: the unit quaternions with a₀² + a₁² + a₂² + a₃² = 1.</p>
      <p>The Hopf map sends each point of that 3-sphere to a point of an ordinary 2-sphere. All the points that land on the same spot form a circle, and every one of these circles is linked with every other. The sculpture shows a family of them, projected into three dimensions and coloured by where they land.</p>
      <p>Gauge fields live on structures like this, called <i>bundles</i>. A gauge field is a <i>connection</i>: a rule for comparing the circle, or the group, over one point with the one over a nearby point. Its curvature is F = dA + A ∧ A. That last term is what makes Yang–Mills theory nonlinear, unlike Maxwell's electromagnetism: the gluons that carry the force also feel it.</p>
      ${mathSources("jw")}`,
  },
  mathGlue: {
    kicker: "Mathematics · the evidence", title: "Glueballs and the gap",
    html: `<p>With no quarks at all, Yang–Mills theory is expected to contain particles made of the gauge field alone, called <i>glueballs</i>. If the theory exists and has a gap, the lightest glueball's mass is Δ.</p>
      ${glueballSvg()}
      <p class="m-cap">Every state below 4 GeV in the paper's final table: SU(3) theory without quarks, extrapolated to zero lattice spacing. Error bars combine the statistical and scale uncertainties; the paper marks 0*++ and 2*−+ as needing further study. Hover a row for the numbers.</p>
      <p>The lightest state, 0<sup>++</sup>, comes out at 1730 ± 50 ± 80 MeV, clearly above zero. The second uncertainty comes from converting lattice units to MeV, using a scale set from the real world (r₀⁻¹ = 410 ± 20 MeV). Later, larger lattice studies found a similar spectrum.</p>
      <p class="m-open">This is strong numerical evidence that the gap is real. It is not a proof, which must hold exactly, for every compact simple group, in infinite volume and at zero spacing.</p>
      ${mathSources("mp", "jw")}`,
  },
  mathSeven: {
    kicker: "Mathematics · Millennium Prize Problems", title: "The seven problems",
    html: `<p>The Clay Mathematics Institute announced seven problems in Paris on 24 May 2000, with $1 million for each. One has been solved.</p>
      <ul class="m-seven">
        ${MILLENNIUM.map(([n, st, l]) => `<li class="${st === "Solved" ? "solved" : ""}"><b>${n}</b><span class="m-tag">${st}</span><br>${l}</li>`).join("")}
      </ul>
      <p>Grigori Perelman proved the Poincaré conjecture. The Institute announced his prize on 18 March 2010; he declined it, saying it should have been shared with Richard Hamilton, whose Ricci-flow programme his proof completed. He had also declined the Fields Medal in 2006.</p>
      ${mathSources("clay")}`,
  },
  mathRules: {
    kicker: "Mathematics · Millennium Prize Problems", title: "The prize rules",
    html: `<p>The rules were revised by the Clay Mathematics Institute's board on 26 September 2018. In short:</p>
      <ol class="m-steps">
        <li><b>Publish first.</b> A solution must appear in a <i>qualifying outlet</i>: a refereed mathematics publication of worldwide repute, with a real editorial board and refereeing process.</li>
        <li><b>Wait two years.</b> At least two years must pass after publication.</li>
        <li><b>Win acceptance.</b> It must be generally accepted by the global mathematics community, as judged by the Institute.</li>
        <li><b>Answer the actual question.</b> It must settle the problem as stated in its official description. Closely related results don't count.</li>
        <li><b>No direct submissions.</b> The Institute does not accept solutions sent to it.</li>
      </ol>
      <p><b>How it's judged.</b> After the two years, the Institute decides whether the work merits a closer look. If so, it appoints a special advisory committee of at least three people, at least two of them experts in the area, and decides on the prize from their report. Its decisions are final, and it gives no reasons.</p>
      <p><b>The money.</b> $1 million per problem, from a $7 million fund. A prize can be split between several solvers, and the citation can credit earlier work the solution relied on.</p>
      <p><b>Disproofs.</b> For P vs NP and Navier–Stokes, a resolution either way is judged the same as a proof. For the other problems, a counterexample that truly settles the problem can win the prize. If the problem survives in a reformulated version, a smaller award is possible.</p>
      ${mathSources("rules")}`,
  },
});
