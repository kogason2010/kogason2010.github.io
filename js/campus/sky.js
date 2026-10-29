/* js/campus/sky.js — Sky, sun, image-based lighting, clouds, stars, night dome and moon.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// sky, sun, clouds, stars
function buildSky() {
  /* ---- sky, sun, clouds, stars ---- */
  const sky = new THREE.Sky(); sky.scale.setScalar(1400); world.add(sky); FX.sky = sky;
  const su = sky.material.uniforms; su.turbidity.value = 5.5; su.rayleigh.value = 1.35; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.82; su.sunPosition.value.copy(SUN_DIR);
  const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), envSky = new THREE.Sky(); envSky.scale.setScalar(1400); envScene.add(envSky);
  Object.keys(su).forEach(k => { if (envSky.material.uniforms[k] && su[k].value !== undefined) envSky.material.uniforms[k].value = su[k].value.clone ? su[k].value.clone() : su[k].value; });
  FX.envDay = pm.fromScene(envScene, 0, 1, 3000).texture;
  envSky.material.uniforms.sunPosition.value.setFromSphericalCoords(1, THREE.MathUtils.degToRad(95), THREE.MathUtils.degToRad(118));
  FX.envNight = pm.fromScene(envScene, 0, 1, 3000).texture; pm.dispose();
  const cloudTex = ctex(256, 128, (g, w, h) => {
    for (let i = 0; i < 26; i++) { const x = w * (0.18 + Math.random() * 0.64), y = h * (0.38 + Math.random() * 0.3), r = 18 + Math.random() * 34, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,0.75)"); gr.addColorStop(0.6, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  });
  for (let i = 0; i < 16; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true, opacity: 0.85 }));
    const a = rnd() * 6.283, r = 160 + rnd() * 300; sp.position.set(Math.cos(a) * r, 95 + rnd() * 70, Math.sin(a) * r); sp.scale.set(110 + rnd() * 120, 45 + rnd() * 35, 1); world.add(sp); FX.clouds.push(sp);
  }
  { const N = 1600, p = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, y = 0.08 + Math.random() * 0.92, r = Math.sqrt(1 - y * y); p.set([Math.cos(a) * r * 650, y * 650, Math.sin(a) * r * 650], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    FX.stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0xe8efff, fog: false, transparent: true, opacity: 0.85, depthWrite: false })); FX.stars.visible = false; world.add(FX.stars); }
  FX.nightDome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x03071a) }, hor: { value: new THREE.Color(0x1a2a52) } },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(hor, top, pow(clamp(h, 0.0, 1.0), 0.45)), 1.0); }" }));
  FX.nightDome.visible = false; world.add(FX.nightDome);
  { const mt = ctex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,252,236,1)"); r.addColorStop(0.16, "rgba(250,246,226,1)"); r.addColorStop(0.2, "rgba(200,214,255,0.35)"); r.addColorStop(1, "rgba(160,180,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    FX.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, fog: false, depthWrite: false, transparent: true })); FX.moon.position.set(-300, 230, -380); FX.moon.scale.setScalar(110); FX.moon.visible = false; world.add(FX.moon); }
  buildHorizon();
}

/* ---- what lies beyond the hedge: two ranges of mountains, a forest on the hills, a far-off town, low clouds.
        The far things ignore the fog and are coloured for the haze themselves (FX.horizon; horizonNight swaps day and night).
        Its own random numbers, so the campus keeps its layout. ---- */
function buildHorizon() {
  const R = seeded(1729), H = FX.horizon = { ridges: [], town: null, townDay: null, townNight: null };
  // mountains: a ring of jagged ridge, haze at its foot, its colour at the top (vertex colours, set by horizonNight)
  [[640, 70, 120, 3.1, 0], [530, 35, 75, 5.3, 1]].forEach(([r, base, amp, freq, k]) => {
    const N = 360, pos = [], hgt = [], ix = [];
    for (let i = 0; i <= N; i++) {
      const a = i / N * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const h = base + amp * Math.pow(fbm(ca * freq + 7 + k * 13, 0.5, sa * freq + 3, 5), 1.6) * 1.9;
      pos.push(ca * r, -30, sa * r, ca * r, h, sa * r); hgt.push(0, 1);
      if (i < N) { const v = i * 2; ix.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(new Array(pos.length).fill(1), 3)); g.setIndex(ix);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, depthWrite: true }));
    m.userData = { hgt, far: !k }; m.renderOrder = -1; world.add(m); H.ridges.push(m);
  });
  // woods on the hills: lumpy dark crowns in clusters with clearings; the fog softens them with distance
  { const crown = new THREE.IcosahedronGeometry(3.6, 1), cp = crown.attributes.position, d = new THREE.Vector3();
    for (let i = 0; i < cp.count; i++) { d.set(cp.getX(i), cp.getY(i), cp.getZ(i)).normalize(); const k = 0.78 + fbm(d.x * 2.2 + 5, d.y * 2.2, d.z * 2.2, 3) * 0.5; cp.setXYZ(i, d.x * 3.6 * k, d.y * 3.6 * k * 0.8 + 4.2, d.z * 3.6 * k); }
    crown.computeVertexNormals();
    const im = new THREE.InstancedMesh(crown, new THREE.MeshLambertMaterial({ color: 0xffffff }), LIGHT ? 300 : 700), q = new THREE.Quaternion(), c = new THREE.Color();
    for (let i = 0; i < im.count; i++) {
      let x, z; do { const a = R() * Math.PI * 2, rr = 170 + Math.pow(R(), 0.7) * 190; x = Math.cos(a) * rr; z = Math.sin(a) * rr; } while (fbm(x * 0.012, 9, z * 0.012, 2) < 0.42);   // woods, with clearings
      const s = 0.9 + R() * 0.8; tmp.compose(V(x, hillH(x, z) - 1.2, z), q.setFromAxisAngle(UP, R() * 6.283), V(s * (0.9 + R() * 0.3), s * (0.8 + R() * 0.5), s)); im.setMatrixAt(i, tmp);
      const v = 0.6 + R() * 0.35; im.setColorAt(i, c.setRGB(0.07 * v, 0.15 * v, 0.05 * v));
    }
    im.receiveShadow = false; world.add(im);
  }
  // a small town far off past the library side, under the mountains: hazy by day, windows lit at night
  { const win = lit => ctex(128, 256, (g, w, h) => {
      g.fillStyle = lit ? "#0e1424" : "#b9c8d4"; g.fillRect(0, 0, w, h);
      for (let y = 8; y < h - 6; y += 14) for (let x = 6; x < w - 6; x += 12) { if (lit && R() < 0.55) continue; g.fillStyle = lit ? (R() < 0.7 ? "#ffd9a0" : "#dfe8ff") : "#a6b7c4"; g.fillRect(x, y, 6, 8); }
    });
    H.townDay = new THREE.MeshBasicMaterial({ map: win(false), fog: false }); H.townNight = new THREE.MeshBasicMaterial({ map: win(true), fog: false });
    const parts = [], dirA = Math.atan2(0.94, 0.34);
    for (let i = 0; i < 38; i++) {
      const a = dirA + (R() - 0.5) * 0.28, r = 470 + R() * 40, w = 10 + R() * 22, h = 12 + Math.pow(R(), 2) * 60, b = new THREE.BoxGeometry(w, h, w * (0.7 + R() * 0.6));
      b.rotateY(-a + Math.PI / 2).translate(Math.cos(a) * r, h / 2 - 4, Math.sin(a) * r);
      const U = b.attributes.uv; for (let k = 0; k < U.count; k++) U.setXY(k, U.getX(k) * w / 40, U.getY(k) * h / 80); parts.push(b);
    }
    H.town = new THREE.Mesh(joinGeos(parts), H.townDay); H.town.renderOrder = -1; H.town.material.map.wrapS = H.town.material.map.wrapT = THREE.RepeatWrapping; world.add(H.town);
    H.townNight.map.wrapS = H.townNight.map.wrapT = THREE.RepeatWrapping;
  }
  // low clouds along the horizon (drifting with the others)
  const tex = FX.clouds[0] && FX.clouds[0].material.map;
  if (tex) for (let i = 0; i < 12; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, depthWrite: false, transparent: true, opacity: 0.7 }));
    const a = R() * 6.283, r = 380 + R() * 90; sp.position.set(Math.cos(a) * r, 55 + R() * 35, Math.sin(a) * r); sp.scale.set(150 + R() * 140, 38 + R() * 22, 1); world.add(sp); FX.clouds.push(sp);
  }
  horizonNight(false);
}
// day: blue-grey ranges fading into the haze, the far one paler; night: dark silhouettes against the night sky
function horizonNight(on) {
  const H = FX.horizon; if (!H) return;
  H.ridges.forEach(m => {
    const top = on ? (m.userData.far ? [0.07, 0.09, 0.16] : [0.045, 0.06, 0.11]) : (m.userData.far ? [0.66, 0.74, 0.82] : [0.55, 0.64, 0.72]), foot = on ? [0.09, 0.13, 0.24] : [0.79, 0.86, 0.91];
    const C = m.geometry.attributes.color; m.userData.hgt.forEach((t, i) => C.setXYZ(i, ...(t ? top : foot))); C.needsUpdate = true;
  });
  if (H.town) H.town.material = on ? H.townNight : H.townDay;
}
