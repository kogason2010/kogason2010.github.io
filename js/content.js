/* js/content.js — Text shown in the info panels when you click a tag in the lab (About, Projects, HPLC, ...). Edit the words here.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Panel content ---------- */
const SECTIONS = {
  about: {
    kicker: "Reagent cabinet · about",
    title: "Reading the fine print",
    html: `
      <p>I take application notes, the short technical write-ups that show an instrument solving a real analytical problem, and rebuild them as interactive web pages.</p>
      <p>The rule for every page is the same: stay factual and accurate to the source. The interactivity is there to make the method easier to follow, not to dress it up.</p>
      <div class="chips"><span class="chip">HTML</span><span class="chip">JavaScript</span><span class="chip">GitHub Pages</span><span class="chip">Three.js</span></div>
      <a class="cta" href="https://kogason2010.github.io/os/" target="_blank" rel="noopener" data-launch="showcase">Explore the desktop</a>`
  },
  notes: {
    kicker: "Desktop · app note series",
    title: "One note, one site",
    html: `
      <p>Each site in the series starts from a single Shimadzu application note and lives in its own repository.</p>
      <div class="row"><span class="k">Latest</span><span class="v">lcms-2050-oligos</span></div>
      <a class="cta" href="https://github.com/kogason2010/lcms-2050-oligos" target="_blank" rel="noopener">Open the repo</a>
      <p>Browse the rest of the series on the <a href="https://github.com/kogason2010?tab=repositories" target="_blank" rel="noopener">repositories page</a>.</p>`
  },
  ic: {
    kicker: "Instrument bench · ion chromatography",
    title: "Nexera IC",
    html: `
      <p>Nexera IC is Shimadzu's ion chromatograph, announced in February 2026. Ion chromatography separates charged species, such as the anions in drinking water, on an ion-exchange column.</p>
      <p>Shimadzu highlights a compact design, low maintenance, a simpler interface, and software that watches system status and results to help prevent errors.</p>
      <div class="row"><span class="k">Featured applications</span><span class="v">Drinking-water analysis following EPA Method 300.1 · high-sensitivity analysis with a cation suppressor</span></div>
      <div class="row"><span class="k">IC workstation</span><span class="v">Click the computer on the bench to compare column types and scale a method</span></div>
      <a class="cta" href="https://kogason2010.github.io/nexera-ic/" target="_blank" rel="noopener" data-launch="nexera-ic">Open the Nexera IC project</a>
      <p>Also see <a href="https://kogason2010.github.io/nexera-ic-applications/" target="_blank" rel="noopener" data-launch="nexera-ic-applications">Nexera IC Applications</a> and <a href="https://www.shimadzu.com/an/products/liquid-chromatography/ion-chromatograph/nexera-ic/index.html" target="_blank" rel="noopener">Shimadzu's product page</a>. For research use only.</p>`
  },
  hplc: {
    kicker: "Back bench · HPLC",
    title: "Separation first",
    html: `
      <p>High-performance liquid chromatography pumps a liquid sample through a packed column at high pressure. Compounds move through the column at different speeds, so they reach the detector one after another.</p>
      <div class="row"><span class="k">Stack, top to bottom</span><span class="v">Solvent bottles · system controller · degasser · detector · pump · autosampler, with the column oven in the tower beside it</span></div>
      <a class="cta" href="https://kogason2010.github.io/hplc-detectors/" target="_blank" rel="noopener" data-launch="hplc-detectors">See related project: HPLC Detectors</a>
      <p class="also">Also: <a href="https://kogason2010.github.io/HPLC-tools/" target="_blank" rel="noopener" data-launch="hplc-tools">HPLC Tools</a>, browser calculators for everyday HPLC work.</p>`
  },
  toc: {
    kicker: "Island bench · TOC analyzer",
    title: "Carbon in water",
    html: `
      <p>A total organic carbon analyzer measures how much organically bound carbon is in a water sample.</p>
      <p>A common method oxidizes the sample over a heated catalyst, which turns the carbon into CO₂, then measures that CO₂ with a non-dispersive infrared (NDIR) detector.</p>
      <div class="row"><span class="k">Turntable</span><span class="v">Rotates sample vials to the injection needle, one at a time</span></div>
      <div class="row"><span class="k">Orange window</span><span class="v">The furnace, shown glowing</span></div>
      <a class="cta" href="https://kogason2010.github.io/os/" target="_blank" rel="noopener" data-launch="showcase">Explore the desktop</a>`
  },
  build: {
    kicker: "Workstation · this lab",
    title: "How the lab is made",
    html: `
      <p>Everything here is drawn in code with Three.js. No model files are loaded, so the whole lab ships as one page.</p>
      <div class="row"><span class="k">Particles</span><span class="v">The lab's surfaces are sampled into a point cloud, then a custom shader morphs every point into a ball-and-stick caffeine molecule</span></div>
      <div class="row"><span class="k">Interaction</span><span class="v">Points near your cursor's ray are pushed aside on the GPU</span></div>
      <div class="row"><span class="k">More particles</span><span class="v">A CPU-driven system shows vapor rising through the still in the fume hood</span></div>
      <button class="btn primary" type="button" data-particles>Try particle mode</button>`
  },
  co2: {
    kicker: "Basement · gas supply",
    title: "Where the CO₂ comes from",
    html: `
      <p>SFC runs on carbon dioxide drawn from cylinders fitted with a dip tube, so the pump is fed liquid CO₂ rather than gas.</p>
      <div class="row"><span class="k">Chilled pump head</span><span class="v">Keeps the CO₂ liquid while it is metered. The chiller on the floor circulates the coolant.</span></div>
      <div class="row"><span class="k">Back-pressure regulator</span><span class="v">Holds the column above CO₂'s critical pressure. Past it, the CO₂ expands back to a gas and goes up the extraction snorkel.</span></div>
      <div class="row"><span class="k">CO₂ monitor</span><span class="v">CO₂ is heavier than air and can collect in low rooms like basements. OSHA's workplace limit is 5,000 ppm averaged over 8 hours.</span></div>
      <p>Methanol is the usual modifier: a few percent to a few tens of percent mixed into the CO₂ to move polar compounds along.</p>`
  },
  sfc: {
    kicker: "Basement · supercritical fluid chromatography",
    title: "Chromatography with CO₂",
    html: `
      <p>SFC uses supercritical carbon dioxide as the main mobile phase, usually with some methanol mixed in. The CO₂ is dense enough to dissolve compounds but flows almost like a gas, so runs are fast and use far less organic solvent than HPLC.</p>
      <div class="row"><span class="k">Flow path</span><span class="v">CO₂ pump and modifier pump · mixer · autosampler · column oven · PDA detector · back-pressure regulator</span></div>
      <div class="row"><span class="k">Good at</span><span class="v">Chiral separations, fast screening, and polarity measurements such as EPSA</span></div>
      <button class="cta" type="button" data-sfcapp>Open the SFC workstation</button>
      <p class="also">Related project: <a href="https://kogason2010.github.io/nexera-uc-epsa/" target="_blank" rel="noopener" data-launch="nexera-uc-epsa">Nexera UC EPSA</a></p>`
  },
  contact: {
    kicker: "Whiteboard · contact",
    title: "Contact Me",
    html: `
      <p>Hey there </p>
      <div class="row"><span class="k">Profile-Trentkoga.com</span><span class="v">Profile - TK website</span></div>
      <a class="cta" href="https://trentkoga.com/" target="_blank" rel="noopener">Visit profile</a>`
  }
};
