/* js/chemistry/content.js — Text for the info panels in the Chemistry building's LC lab. Edit the words here.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

Object.assign(SECTIONS, {
  uhplc: {
    kicker: "NCA · back bench · UHPLC",
    title: "Small particles, high pressure",
    html: `
      <p>Ultra-high-performance liquid chromatography is HPLC with columns packed with very small particles, usually under 2 µm. Small particles give sharper peaks and faster runs, but pushing liquid through them takes pumps rated to around 1,000 bar or more.</p>
      <div class="row"><span class="k">Flow path</span><span class="v">Solvent bottles A (water with a little acid) and B (acetonitrile) · degasser · binary pump · autosampler · column oven · PDA detector · waste</span></div>
      <div class="row"><span class="k">Degasser</span><span class="v">Pulls dissolved air out of the solvents so bubbles don't form in the pump or the detector cell</span></div>
      <div class="row"><span class="k">Gradient</span><span class="v">The pump blends A and B and raises the share of B during the run, so strongly retained compounds still elute in good time</span></div>
      <div class="row"><span class="k">PDA detector</span><span class="v">A photodiode array records a whole UV–visible spectrum at every moment, not just one wavelength</span></div>
      <button class="cta" type="button" data-lcapp>Open the LC workstation</button>
      <p class="also">Related projects: <a href="https://kogason2010.github.io/HPLC-tools/" target="_blank" rel="noopener" data-launch="hplc-tools">HPLC Tools</a> · <a href="https://kogason2010.github.io/hplc-detectors/" target="_blank" rel="noopener" data-launch="hplc-detectors">HPLC detectors</a></p>`
  },
  ilc: {
    kicker: "NCA · back bench · integrated LC",
    title: "One cabinet, whole system",
    html: `
      <p>An integrated LC puts the pump, autosampler, column oven and detector in a single housing with one touchscreen. It takes less bench space than a stack of separate modules and suits routine work, such as quality-control labs running the same validated method every day.</p>
      <div class="row"><span class="k">Four solvent lines</span><span class="v">A quaternary pump can blend up to four solvents, handy for switching between methods without changing bottles</span></div>`
  },
  lcms: {
    kicker: "NCA · back bench · LC-MS/MS",
    title: "Separate, then weigh",
    html: `
      <p>Here the LC feeds a triple-quadrupole mass spectrometer. The ion source turns molecules in the column effluent into gas-phase ions, commonly by electrospray. The first quadrupole picks one precursor ion, the collision cell breaks it apart, and the third quadrupole picks one fragment.</p>
      <p>Watching chosen precursor-to-fragment pairs, called multiple reaction monitoring (MRM), makes LC-MS/MS very selective and sensitive. It is a workhorse for drugs in plasma, pesticide residues in food, and contaminants in water.</p>
      <div class="row"><span class="k">Nitrogen generator</span><span class="v">Makes nitrogen from compressed air for the nebulizing and drying gas at the ion source</span></div>
      <div class="row"><span class="k">Backing pump</span><span class="v">Rough pump on the shelf below; it backs the turbomolecular pumps that keep the analyser under high vacuum</span></div>
      <div class="row"><span class="k">Snorkel</span><span class="v">Extracts solvent vapour from the ion source exhaust</span></div>
      <p class="also">Related project: <a href="https://kogason2010.github.io/lcms-2050-oligos/" target="_blank" rel="noopener" data-launch="lcms-2050-oligos">LCMS-2050 oligonucleotides</a></p>`
  },
  prep: {
    kicker: "NCA · left bench · preparative LC",
    title: "Collect, don't just measure",
    html: `
      <p>Preparative LC purifies material instead of only measuring it. Columns are much wider (often around 20 mm across or more), flows run to tens of millilitres per minute, and a fraction collector moves to a fresh tube as each peak reaches the detector.</p>
      <div class="row"><span class="k">Injection</span><span class="v">A manual valve with a large sample loop loads milligrams to grams of material</span></div>
      <div class="row"><span class="k">Triggering</span><span class="v">The collector switches tubes on the UV signal, by threshold or slope, so each compound lands in its own tubes</span></div>
      <div class="row"><span class="k">Scale-up</span><span class="v">Methods are usually developed on an analytical column, then flow and load are scaled by the ratio of column cross-sections</span></div>`
  },
  solvents: {
    kicker: "NCA · solvent storage",
    title: "Mobile phase starts here",
    html: `
      <p>Acetonitrile and methanol are flammable, so bulk bottles live in a vented flammable-storage cabinet rather than on the bench.</p>
      <div class="row"><span class="k">Grade</span><span class="v">HPLC-grade or LC-MS-grade solvents and water keep the baseline clean and the ion source free of residue</span></div>
      <div class="row"><span class="k">Additives</span><span class="v">For LC-MS, volatile additives such as formic acid or ammonium acetate; non-volatile phosphate buffers would foul the ion source</span></div>
      <div class="row"><span class="k">Waste</span><span class="v">Used solvent drains to a capped carboy with a vapour-tight lid, then goes for proper disposal</span></div>`
  },
  columns: {
    kicker: "NCA · column storage",
    title: "Choosing the column",
    html: `
      <p>Most reversed-phase work uses C18: silica particles bonded with 18-carbon chains. Other phases change which compounds hold on longest.</p>
      <div class="row"><span class="k">C8</span><span class="v">Shorter chains, a little less retentive than C18</span></div>
      <div class="row"><span class="k">Phenyl-hexyl</span><span class="v">Extra selectivity for aromatic compounds through π–π interactions</span></div>
      <div class="row"><span class="k">HILIC</span><span class="v">For very polar compounds that run straight through a C18 column</span></div>
      <div class="row"><span class="k">Chiral</span><span class="v">Separates mirror-image forms of a molecule</span></div>
      <div class="row"><span class="k">Particles</span><span class="v">Fully porous sub-2 µm particles, or superficially porous (core–shell) particles around 2.7 µm, which give similar efficiency at lower pressure</span></div>`
  },
  sampleprep: {
    kicker: "NCA · island · sample prep",
    title: "Most errors start here",
    html: `
      <p>A good chromatogram needs a clean, well-defined sample. The island holds the usual steps.</p>
      <div class="row"><span class="k">Weigh</span><span class="v">Analytical balance with a draft shield, reading to 0.01 mg</span></div>
      <div class="row"><span class="k">Dissolve</span><span class="v">Ultrasonic bath to dissolve standards and to degas solvents</span></div>
      <div class="row"><span class="k">Filter</span><span class="v">Vacuum filtration for aqueous mobile phases; 0.2 µm syringe filters for samples, so particles don't block the column frit</span></div>
      <div class="row"><span class="k">Mix and vial</span><span class="v">Vortex mixer, then 2 mL autosampler vials with septum caps</span></div>`
  },
  assembly: {
    kicker: "NCA · the new hall · automation",
    title: "Robots building an HPLC",
    html: `
      <p>Four robot arms put together a modular HPLC, one module per stop. Each pallet moves along the line, the arm at each stop takes the next module from its lift and sets it on the stack, and a QC arch scans the finished system before it ships.</p>
      <p>A modular HPLC is a stack of separate instruments, each with one job. The order here is one common arrangement; labs stack them to suit their bench.</p>
      <div class="row"><span class="k">Autosampler</span><span class="v">At the bottom. Holds the sample vials and injects a set volume of each into the flowing solvent</span></div>
      <div class="row"><span class="k">Detector</span><span class="v">Measures compounds as they leave the column, for example by UV absorbance</span></div>
      <div class="row"><span class="k">Pumps A and B</span><span class="v">Two pumps, one per solvent, push the mobile phase at high pressure and blend the two for a gradient</span></div>
      <div class="row"><span class="k">System controller</span><span class="v">Links the modules and shows pressure, flow and oven temperature at a glance</span></div>
      <div class="row"><span class="k">Solvent tray</span><span class="v">On top, holding the mobile-phase bottles that feed the pumps</span></div>
      <div class="row"><span class="k">Column oven</span><span class="v">Stands alongside and holds the column at a steady temperature, so retention times stay repeatable</span></div>
      <p class="also">A playful illustration, not a picture of how any real instrument is made. The arms solve their joint angles every frame (two-link inverse kinematics), so they really reach for each part.</p>`
  },
});
