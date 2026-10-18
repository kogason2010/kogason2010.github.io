/* ==========================================================================
   Portfolio configuration. This is the only file you need to edit.

   Add a GitHub Pages site (one line is enough; the URL, source link and
   icon are worked out from the repo name):
       { type: "github", repo: "kogason2010/my-new-site" },

   Make it a standalone app that runs from this portfolio's own copy:
       { type: "github", repo: "kogason2010/my-new-site", bundle: true },
   then run `node tools/sync-apps.mjs` (or let the GitHub Action do it) to
   copy the built site into apps/my-new-site/.

   Add any other website:
       { type: "website", id: "my-shop", title: "My Shop", url: "https://example.com/" },

   Put an app in a folder:  add  group: "nexera"  (or a new group id you
   define under `groups`).

   Show it somewhere:  add its id (or "group:<id>") to `desktop`,
   `pinned` (Start menu) or `taskbar`.

   Screenshots: `shots` is a list of [image, caption]. The first one is the
   cover unless you set `cover`. `node tools/capture-shots.mjs <id>` can
   take them for you.
   ========================================================================== */
window.PORTFOLIO = {
  owner: {
    name: "kogason2010",
    handle: "kogason2010",
    tagline: "Interactive 3D websites that make analytical science easy to see.",
    github: "https://github.com/kogason2010",
    tools: ["React", "TypeScript", "three.js", "GSAP", "Lenis", "Vite"],
  },

  system: {
    name: "KogasonOS",
    version: "1.1",
    accent: "ion",            // ion, uv, amber, blue, teal, rose
    wallpaper: "trace",       // trace, molecular, gradient, solid
    source: "",               // link to this portfolio's own repo, once it exists
  },

  github: {
    user: "kogason2010",
    autoDiscover: true,        // add any other repo that has GitHub Pages turned on
    discoveredGroup: null,     // or a group id, to file discovered sites in a folder
    exclude: ["kogason2010", "kogason2010.github.io", "lab"],
  },

  groups: [
    {
      id: "appnotes",
      title: "Application Notes",
      description:
        "Interactive companions to published Shimadzu application notes: the methods, conditions and results, retold in real-time 3D.",
      note:
        "Independent, unofficial projects. Not affiliated with, sponsored or endorsed by Shimadzu Corporation.",
    },
    {
      id: "explainers",
      title: "Instrument Explainers",
      description:
        "How the instruments work: ion chromatography from eluent to suppressor, and five HPLC detectors as live animated schematics.",
      note:
        "Independent projects. Nexera is a trademark of Shimadzu Corporation; these sites are not affiliated with or endorsed by Shimadzu.",
    },
  ],

  apps: [
    /* ---------- Application Notes folder ---------- */
    {
      type: "github",
      repo: "kogason2010/lcms-2050-oligos",
      title: "Strand by Strand",
      group: "appnotes",
      bundle: true,
      icon: "icons/lcms-2050-oligos.svg",
      description:
        "A scroll-driven 3D walk through four application notes on confirming synthetic oligonucleotides with the LCMS-2050 single quadrupole mass spectrometer: by charge state, by mass, and by where they elute.",
      tip: "Press D inside the app for a guided demo, or explore the charge ladder and screening grid yourself.",
      stack: ["three.js", "Single HTML file"],
      updated: "2026-10-15",
      shots: [
        ["media/lcms-2050-oligos/1.webp", "Strand by strand: a 20-mer oligonucleotide in 3D"],
        ["media/lcms-2050-oligos/2.webp", "The charge ladder: one molecule, many m/z values, one deconvoluted mass"],
        ["media/lcms-2050-oligos/3.webp", "The 24-run screening grid from LabSolutions MD method development"],
        ["media/lcms-2050-oligos/4.webp", "Ion-pair-free LC/MS of an siRNA: both strands confirmed separately"],
      ],
    },
    {
      type: "github",
      repo: "kogason2010/nexera-uc-epsa",
      title: "Exposed: EPSA by SFC",
      group: "appnotes",
      bundle: true,
      icon: "icons/nexera-uc-epsa.svg",
      description:
        "A scroll-driven 3D journey through measuring experimental polar surface area with supercritical fluid chromatography, from supercritical CO₂ to the calibration line and system suitability test.",
      tip: "Press D inside the app for a guided two-minute demo.",
      stack: ["three.js", "Single HTML file"],
      updated: "2026-10-10",
      cover: "media/nexera-uc-epsa/3.webp",
      shots: [
        ["media/nexera-uc-epsa/1.webp", "Exposed: how much of a molecule's polarity can a membrane see?"],
        ["media/nexera-uc-epsa/2.webp", "On paper: cyclosporin A and its TPSA of 278 Å²"],
        ["media/nexera-uc-epsa/3.webp", "Polarity becomes time: nine standards in the column"],
        ["media/nexera-uc-epsa/4.webp", "The calibration line, from retention time to EPSA"],
      ],
    },
    {
      type: "github",
      repo: "kogason2010/nexera-ic-applications",
      title: "Nexera IC Applications",
      group: "appnotes",
      bundle: true,
      icon: "icons/nexera-ic-applications.svg",
      description:
        "Published Nexera IC methods (EPA 300.1 Parts A and B, ASTM D6919-17 cations, dual channel) told through procedurally built 3D ions, with an ion atlas and a methods table.",
      stack: ["React", "three.js", "GSAP", "TypeScript"],
      updated: "2026-10-08",
      shots: [
        ["media/nexera-ic-applications/1.webp", "Three published methods, sixteen ions, one ion chromatograph"],
        ["media/nexera-ic-applications/2.webp", "The ion atlas: every ion as a 3D model"],
        ["media/nexera-ic-applications/3.webp", "Three methods, side by side"],
        ["media/nexera-ic-applications/4.webp", "EPA 300.1 Part A: seven anions in one twenty-minute run"],
      ],
    },

    /* ---------- Instrument Explainers folder ---------- */
    {
      type: "github",
      repo: "kogason2010/hplc-detectors",
      title: "HPLC Detectors",
      group: "explainers",
      bundle: true,
      // only source is in the repo, so the sync script builds it first
      build: { run: "npm ci && npm run build", dir: "dist" },
      icon: "icons/hplc-detectors.svg",
      description:
        "How five HPLC detectors turn chemistry into a peak: UV / PDA / DAD, fluorescence, refractive index, ELSD, and single and triple quadrupole mass spectrometry, each as a live animated schematic.",
      tip: "Hover the photodiode array in the UV / PDA / DAD tab to zoom into individual diodes.",
      stack: ["React", "TypeScript", "three.js", "GSAP", "Lenis", "Vite"],
      updated: "2026-10-12",
      shots: [
        ["media/hplc-detectors/1.webp", "What the detector actually sees: a mixed sample as a 3D particle cloud"],
        ["media/hplc-detectors/2.webp", "Separation becomes signal: one peak per compound"],
        ["media/hplc-detectors/3.webp", "Five ways to turn a molecule into a peak"],
        ["media/hplc-detectors/4.webp", "Triple quadrupole: precursor → product, recorded as an MRM chromatogram"],
      ],
    },
    {
      type: "github",
      repo: "kogason2010/nexera-ic",
      title: "Nexera IC",
      group: "explainers",
      bundle: true,
      icon: "icons/nexera-ic.svg",
      description:
        "A cinematic, interactive explainer of ion chromatography built around the Nexera IC: suppression, separation, dual-channel analysis and published method data.",
      stack: ["React", "three.js", "GSAP", "TypeScript"],
      updated: "2026-10-08",
      shots: [
        ["media/nexera-ic/1.webp", "Every ion, accounted for: the Nexera IC as an illustrative 3D model"],
        ["media/nexera-ic/2.webp", "The system: an SI-150 autosampler with one IC-150 main unit"],
        ["media/nexera-ic/3.webp", "Published method data, from drinking water to wastewater"],
        ["media/nexera-ic/4.webp", "Suppression: silence the background, amplify the ion"],
      ],
    },

    /* ---------- Tools and design studies ---------- */
    {
      type: "github",
      repo: "kogason2010/HPLC-tools",
      id: "hplc-tools",
      title: "HPLC Tools",
      bundle: true,
      icon: "icons/hplc-tools.svg",
      size: [1180, 800],
      description:
        "Browser-based calculators for everyday HPLC and UHPLC work: method transfer with USP <621> checks, gradient design, system suitability, buffer recipes with activity corrections, back-pressure and viscosity, and unit conversions.",
      tip: "Inputs are remembered, and every tab has a Copy link button that shares the current values.",
      stack: ["JavaScript", "No dependencies", "Unit tested"],
      updated: "2026-10-16",
      shots: [
        ["media/hplc-tools/1.webp", "Method transfer: scale a method between column geometries with USP <621> checks"],
        ["media/hplc-tools/2.webp", "Gradient design: k*, gradient volume and peak capacity"],
        ["media/hplc-tools/3.webp", "System suitability: resolution, symmetry, signal-to-noise and %RSD"],
        ["media/hplc-tools/4.webp", "Buffer preparation from the full charge balance, not just Henderson–Hasselbalch"],
      ],
    },
    {
      type: "github",
      repo: "kogason2010/solvane",
      title: "Solvane",
      bundle: true,
      icon: "icons/solvane.svg",
      description:
        "A cinematic website for Solvane, a fictional analytical-science company. A design study in separation, detection and motion.",
      stack: ["React", "three.js", "GSAP", "Lenis"],
      updated: "2026-10-08",
      shots: [
        ["media/solvane/1.webp", "From complexity, clarity: a particle sample entering the column"],
        ["media/solvane/2.webp", "Five ways to see a molecule"],
        ["media/solvane/3.webp", "Applications across seven industries"],
        ["media/solvane/4.webp", "Four steps between a vial and an answer"],
      ],
    },

    /* ---------- Built-in apps ---------- */
    /* ---------- The 3D lab: the front door at kogason2010.github.io/ ---------- */
    {
      type: "website",
      id: "lab",
      title: "Lab",
      url: "https://kogason2010.github.io/",
      open: "top",              // back to the lab: zooms out of its monitor (or opens it full-page from /os/)
      hash: "#desktop",         // the lab starts inside its monitor and pulls back to the room
      description: "A 3D analytical chemistry lab: an HPLC, a Nexera IC bench, a TOC analyzer and a fume hood distillation. KogasonOS runs on its monitor.",
    },
    { type: "builtin", id: "showcase", title: "Showcase", app: "showcase", icon: "showcase" },
    { type: "builtin", id: "explorer", title: "File Explorer", app: "explorer", location: "home", icon: "explorer" },
    { type: "builtin", id: "photos", title: "Photos", app: "photos", icon: "photos" },
    { type: "builtin", id: "terminal", title: "Terminal", app: "terminal", icon: "terminal" },
    { type: "builtin", id: "settings", title: "Settings", app: "settings", icon: "settings" },
    { type: "builtin", id: "notepad", title: "Notepad", app: "notepad", icon: "notepad" },
    { type: "builtin", id: "recycle", title: "Recycle Bin", app: "explorer", location: "recycle", icon: "recycle" },
    {
      type: "builtin", id: "resolve", title: "Resolve", app: "resolve", icon: "resolve",
      description: "A method-development game. Tune the gradient and column temperature until every peak pair is resolved, inside the run-time limit.",
    },
    { type: "builtin", id: "restore-desktop", title: "Restore Desktop", app: "reset", icon: "restoreApp" },

    /* ---------- Documents (open in Notepad) ---------- */
    {
      type: "document",
      id: "about",
      title: "About me.txt",
      text:
`Hi there,

I build interactive websites that make analytical science easier
to see: chromatography explained with real-time 3D, scroll-driven
stories and published app notes.

What's on this desktop
  Showcase             every project, with screenshots
  Application Notes    published Shimadzu app notes retold in
                       3D: ion chromatography, EPSA by SFC and
                       oligonucleotides on a single quad LC/MS
  Instrument           how the instruments work: the Nexera IC
  Explainers           and five HPLC detectors, as live schematics
  HPLC Tools           everyday HPLC calculators: method transfer,
                       gradients, buffers, system suitability
  Resolve              a method-development game: tune the gradient
                       until every peak pair is resolved
  Solvane              a design study for a fictional
                       analytical-science company

Every project runs as an app right here. Open one from the
desktop, the Start menu or Showcase.

Tools I use
  React, TypeScript, three.js, GSAP, Lenis, Vite, GitHub Pages

Find me
  GitHub   github.com/kogason2010
`,
    },
    {
      type: "document",
      id: "readme",
      title: "How to use this desktop.txt",
      text:
`Welcome to KogasonOS.

Open things
  Double-click an icon on the desktop, or use the Start menu.
  Showcase lists every project with screenshots.
  Each project runs as its own app. The buttons in its title bar
  show details, go full screen or open the live site in a new tab.

Move windows around
  Drag a title bar to move a window.
  Drag it to a side to fill half the screen, or to a corner for
  a quarter. Drag it to the top edge to maximize.
  Hover over the maximize button for more snap layouts.
  Task view, next to Search on the taskbar, shows every open window.
  Hover a taskbar button to preview its window.

Rearrange the desktop
  Drag icons wherever you like. Right-click the desktop for View
  (icon size) and Sort by. Right-click an icon to pin it to the
  taskbar or Start, see its Properties, or send it to the Recycle
  Bin (you can restore it from there).

Start over
  Restore Desktop (on the desktop) puts everything back the way
  it was: icons, pins, the Recycle Bin, theme and wallpaper.

Shortcuts
  Start typing on the desktop to search.
  The Terminal understands a few commands. Type "help".
  Settings changes the theme, accent color and background.
`,
    },
  ],

  /* Where things appear (ids, or "group:<id>" for a folder) */
  desktop: ["recycle", "lab", "showcase", "explorer", "group:appnotes", "group:explainers", "hplc-tools", "solvane", "resolve", "photos", "about", "terminal", "restore-desktop"],
  pinned: ["showcase", "explorer", "group:appnotes", "group:explainers", "hplc-tools", "solvane", "resolve", "photos", "terminal", "settings", "notepad", "about", "readme"],
  taskbar: ["lab", "explorer", "showcase", "hplc-tools", "photos", "terminal"],
  startup: ["showcase"],
};
