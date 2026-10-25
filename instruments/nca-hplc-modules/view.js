/* instruments/nca-hplc-modules/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// each module in a row, and behind them a finished system stacked the way the robots build it
modTextures();
[...STACK, "oven"].forEach((kind, i) => {
  const m = makeModule(kind); m.position.set(-1.65 + i * 0.55, 0, 0.75); lab.add(m);
});
let stackY = 0;
STACK.forEach(kind => { const m = makeModule(kind); m.position.set(-0.13, stackY, -0.5); lab.add(m); stackY += m.userData.h; });
const oven = makeModule("oven");
oven.position.set(-0.13 + MOD.W / 2 + 0.013 * MOD.W / NexeraModules.width + MOD_KINDS.oven.w / 2, 0, -0.5); lab.add(oven);
