/* instruments/nca-lc-pc/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// build it, then a placeholder for the screen js/chemistry/lc.js draws live on the site
workshop.run(buildLcWorkstation);
(function () {
  const s = FX_CHEM.lcScreen; if (!s) return;
  const g = s.c.getContext("2d"), W = s.c.width, H = s.c.height;
  g.fillStyle = "#0f1a20"; g.fillRect(0, 0, W, H); g.fillStyle = "#1d2c36"; g.fillRect(0, 0, W, 34);
  g.fillStyle = "#8fa3b0"; g.textAlign = "center"; g.font = "bold 26px sans-serif"; g.fillText("LC run screen", W / 2, H / 2 - 4);
  g.font = "18px sans-serif"; g.fillText("drawn live by js/chemistry/lc.js on the site", W / 2, H / 2 + 28);
  s.t.needsUpdate = true;
})();
