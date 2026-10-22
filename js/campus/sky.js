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
}
