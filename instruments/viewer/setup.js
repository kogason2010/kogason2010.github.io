/* instruments/viewer/setup.js — Stands in for the rest of the site around one instrument, for the offline viewer only
   (the site never loads this). It makes the scene and the group a model builds into, a few things the site normally
   provides, and remembers which line of model.js adds each part so clicking a part can show it.
   Loaded before js/core/helpers.js and the instrument's model.js. */
"use strict";

/* errors in model.js are listed on the page (with line numbers when the browser shares them) */
const workshopErrors = [];
window.addEventListener("error", e => {
  workshopErrors.push({ message: e.message, file: (e.filename || "").split("/").pop(), line: e.lineno });
  if (typeof window.workshopShowErrors === "function") window.workshopShowErrors();
});

/* the scene, and the group every model builds into; on the site the lab, the basement and NCA are separate groups */
const scene = new THREE.Scene();
const lab = new THREE.Group(); scene.add(lab);
const basement = lab, chem = lab;
const FX_CHEM = {};                  // NCA's shared live parts (js/chemistry/room.js makes this on the site)

/* settings the viewer page can use: what to frame, which way the front faces, things to animate, builders to run */
const workshop = {
  focusObj: null, frontDir: new THREE.Vector3(0, 0, 1), anims: [], built: false,
  focus(o) { this.focusObj = o; },
  front(x, y, z) { this.frontDir.set(x, y, z).normalize(); },
  animate(fn) { this.anims.push(fn); },
  // run a builder (the NCA instruments are functions); an error in it is shown with its line in model.js
  run(fn) {
    try { fn(); } catch (err) {
      const m = String(err && err.stack || "").match(/([^/\s()]+\.js):(\d+):\d+/);
      workshopErrors.push({ message: String(err && err.message || err), file: m ? m[1] : "", line: m ? +m[2] : 0 });
      if (typeof window.workshopShowErrors === "function") window.workshopShowErrors();
    }
  },
};

/* remember which line of model.js adds each part (only while the model is being built) */
(function () {
  const add = THREE.Object3D.prototype.add;
  function where() {
    const out = [];
    for (const s of String(new Error().stack || "").split("\n")) {
      const m = s.match(/((?:file|https?):\/\/[^\s)]*?model\.js):(\d+):(\d+)/);
      if (m) out.push({ url: m[1], line: +m[2] });
    }
    return out;
  }
  try { Error.stackTraceLimit = 40; } catch (e) { /* not every browser has it */ }
  THREE.Object3D.prototype.add = function (...objs) {
    if (!workshop.built) {
      const at = where();
      if (at.length) objs.forEach(o => { if (o && o.isObject3D && !o.userData.madeAt) o.userData.madeAt = at; });
    }
    return add.apply(this, objs);
  };
})();
