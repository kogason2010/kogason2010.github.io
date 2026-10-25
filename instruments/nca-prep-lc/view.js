/* instruments/nca-prep-lc/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// build it, frame it, and glide the collector's arm over the tubes (js/chemistry/lc.js steps it on the site)
workshop.run(buildPrepLc);
if (FX_CHEM.fArm) {
  workshop.focus(FX_CHEM.fArm.parent);
  const tubes = FX_CHEM.prepTubes;
  workshop.animate((dt, time) => {
    const u = (60 + time * 0.22) % tubes.length, i = Math.floor(u), f = u - i;
    const a = tubes[i], b = tubes[(i + 1) % tubes.length], e = f * f * (3 - 2 * f);
    FX_CHEM.fArm.position.x = a[0] + (b[0] - a[0]) * e;
    FX_CHEM.fHead.position.z = a[1] + (b[1] - a[1]) * e - 0.012;
  });
}
