/* instruments/lab-fume-hood/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// the vapour particles (js/lab/effects.js makes them on the site), then boil, drip and steam
const dotTex = tex((g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,0.9)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, w, w);
}, 32, 32);
vapor = new THREE.Points(vapGeo, new THREE.PointsMaterial({ size: 0.035, map: dotTex, color: 0xeaf7ff, transparent: true, opacity: 0.8, depthWrite: false, sizeAttenuation: true }));
vapor.frustumCulled = false; lab.add(vapor);
updateDistill(0, 0);
workshop.animate(updateDistill);
