/* js/library/catalog.js — The library's catalogue: its shelves (one alcove each) and the app notes on them.
   To add a note, copy one entry in APP_NOTES and change the fields. It appears in its shelf's alcove, in the
   catalogue at the central desk, and in the reader. A shelf with no notes yet shows as "coming soon".
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// seven alcoves round the reading room (the eighth arch is the entrance)
const LIB_SHELVES = [
  { id: "lc", name: "Liquid chromatography", plaque: "LIQUID CHROMATOGRAPHY" },
  { id: "lcms", name: "LC-MS", plaque: "MASS SPECTROMETRY" },
  { id: "ic", name: "Ion chromatography", plaque: "ION CHROMATOGRAPHY" },
  { id: "sfc", name: "SFC and UC", plaque: "SUPERCRITICAL FLUID" },
  { id: "gc", name: "GC and GC-MS", plaque: "GAS CHROMATOGRAPHY" },
  { id: "spec", name: "Spectroscopy", plaque: "SPECTROSCOPY" },
  { id: "tools", name: "Tools and studio", plaque: "TOOLS & STUDIO" },
];

// shelf: one of the ids above. sources: the application notes a site is built from (leave empty if none).
// cover: the book's colour on the shelf. url: the site to open in the reader.
const APP_NOTES = [
  {
    id: "lcms-2050-oligos", shelf: "lcms", cover: "#7a2430",
    title: "Strand by Strand", subtitle: "Confirming synthetic oligonucleotides on the LCMS-2050",
    summary: "A scroll-driven 3D walkthrough of four Shimadzu application notes on confirming synthetic oligonucleotides with the LCMS-2050 single-quadrupole mass spectrometer: charge states, ion-pair and ion-pair-free reversed phase, and HILIC.",
    sources: ["SSI 02-SSI-LCMS-173 (Nov 2024)", "01-00766-EN (Sep 2024)", "01-01180-EN (May 2026)", "01-01238-EN (Jul 2026)"],
    url: "https://kogason2010.github.io/lcms-2050-oligos/",
  },
  {
    id: "nexera-uc-epsa", shelf: "sfc", cover: "#1f5a73",
    title: "Exposed Polar Surface", subtitle: "Measuring EPSA by SFC on the Nexera UC",
    summary: "How supercritical fluid chromatography measures experimental polar surface area: supercritical CO₂ as the mobile phase, EPSA versus calculated TPSA for cyclosporin A, calibration, system suitability, and a tool that maps a retention time to EPSA.",
    sources: ["Application News 01-01161-EN (Apr 2026)"],
    url: "https://kogason2010.github.io/nexera-uc-epsa/",
  },
  {
    id: "nexera-ic", shelf: "ic", cover: "#245a3c",
    title: "Nexera IC", subtitle: "Every ion, accounted for",
    summary: "An interactive showcase of the Nexera IC ion chromatograph: suppression, separation, dual-channel detection and published method data.",
    sources: [],
    url: "https://kogason2010.github.io/nexera-ic/",
  },
  {
    id: "nexera-ic-applications", shelf: "ic", cover: "#2f6b4f",
    title: "Nexera IC Applications", subtitle: "The ions behind every peak",
    summary: "Three published Nexera IC methods, sixteen ions on one instrument: drinking-water anions, disinfection by-products and wastewater cations, with each ion shown as a 3D model.",
    sources: [],
    url: "https://kogason2010.github.io/nexera-ic-applications/",
  },
  {
    id: "hplc-detectors", shelf: "lc", cover: "#2c3e6b",
    title: "Inside the HPLC Detector", subtitle: "UV/DAD, fluorescence, RI, ELSD and MS",
    summary: "An interactive 3D guide to the chemistry behind five kinds of HPLC detector.",
    sources: [],
    url: "https://kogason2010.github.io/hplc-detectors/",
  },
  {
    id: "hplc-tools", shelf: "tools", cover: "#5a4a1e",
    title: "HPLC Tools", subtitle: "Calculators for everyday LC work",
    summary: "Browser-based calculators for method transfer and column scaling, system suitability, buffer preparation, pressure and viscosity, column volume and solvent use, and unit conversion. Everything runs in the browser.",
    sources: [],
    url: "https://kogason2010.github.io/HPLC-tools/",
  },
  {
    id: "solvane", shelf: "tools", cover: "#3d2f5a",
    title: "Solvane", subtitle: "From complexity, clarity",
    summary: "A design study for a fictional analytical science company: separation, detection and data as one story.",
    sources: [],
    url: "https://kogason2010.github.io/solvane/",
  },
];
const notesOn = shelf => APP_NOTES.filter(n => n.shelf === shelf);
