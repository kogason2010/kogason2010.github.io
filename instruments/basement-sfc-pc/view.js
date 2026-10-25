/* instruments/basement-sfc-pc/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// on the site js/basement/sfc.js draws the live run on this screen; this placeholder stands in
(function () {
  const g = sfcScreen.c.getContext("2d"), W = sfcScreen.c.width, H = sfcScreen.c.height;
  g.fillStyle = "#0f1a20"; g.fillRect(0, 0, W, H); g.fillStyle = "#1d2c36"; g.fillRect(0, 0, W, 34);
  g.fillStyle = "#8fa3b0"; g.textAlign = "center"; g.font = "bold 26px sans-serif"; g.fillText("SFC run screen", W / 2, H / 2 - 4);
  g.font = "18px sans-serif"; g.fillText("drawn live by js/basement/sfc.js on the site", W / 2, H / 2 + 28);
  sfcScreen.t.needsUpdate = true;
})();
