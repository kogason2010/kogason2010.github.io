/* js/campus/grass.js — Fluffy grass tufts round the robot (after FluffyGrass by Ebenezer, MIT).
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// grass
function buildGrass() {
  /* ---- grass: fluffy tufts after "How to Make the Fluffiest Grass with Three.js" (Ebenezer, FluffyGrass, MIT):
          crossed alpha-cut cards, dark roots fading to noise-varied tips, shading from the sun's shadow only, wind and a parting wake
          round the robot. The tufts tile a 40 m patch that travels with the robot. ---- */
  const mask = canvasOf(512, 512), mg = mask.getContext("2d"), MS = 512 / 128, MX = v => (v + 64) * MS;
  mg.fillStyle = "#fff"; mg.fillRect(0, 0, 512, 512); mg.fillStyle = "#000"; mg.strokeStyle = "#000"; mg.lineCap = "butt";
  CAMPUS.paths.forEach(p => { mg.lineWidth = (p[4] + 0.5) * MS; mg.beginPath(); mg.moveTo(MX(p[0]), MX(p[1])); mg.lineTo(MX(p[2]), MX(p[3])); mg.stroke(); });
  CAMPUS.boxes.forEach(b => mg.fillRect(MX(b[0]) - 2, MX(b[1]) - 2, (b[2] - b[0]) * MS + 4, (b[3] - b[1]) * MS + 4));
  CAMPUS.circles.forEach(c => { if (c[3] === "tree" || c[3] === "lamp" || c[3] === "shrub") return; mg.beginPath(); mg.arc(MX(c[0]), MX(c[1]), (c[2] + 0.3) * MS, 0, 7); mg.fill(); });
  [[0, 0, 11.9], [-30, 30, 11.4]].forEach(([x, z, r]) => { mg.beginPath(); mg.arc(MX(x), MX(z), r * MS, 0, 7); mg.fill(); });
  CAMPUS.lots.forEach(l => mg.fillRect(MX(l[0]) - 2, MX(l[1]) - 2, (l[2] - l[0]) * MS + 4, (l[3] - l[1]) * MS + 4));
  CAMPUS.gardens.forEach(c => { mg.beginPath(); mg.arc(MX(c[0]), MX(c[1]), c[2] * 0.72 * MS, 0, 7); mg.fill(); });
  CAMPUS.mulch.forEach(({ box: b }) => mg.fillRect(MX(b[0]) - 1, MX(b[1]) - 1, (b[2] - b[0]) * MS + 2, (b[3] - b[1]) * MS + 2));
  mg.fillRect(MX(-23), MX(-9.5), 11 * MS, 6 * MS);
  [[0, -WB], [0, WB], [-WB, 0], [WB, 0]].forEach(([x, z]) => mg.fillRect(MX(x - (z ? WB : 1.0)), MX(z - (x ? WB : 1.0)), (z ? WB * 2 : 2.0) * MS, (x ? WB * 2 : 2.0) * MS));
  const maskTex = new THREE.CanvasTexture(mask); maskTex.wrapS = maskTex.wrapT = THREE.ClampToEdgeWrapping; maskTex.flipY = false;
  // soft, tileable colour-variation noise (blurred random grid, wrapped)
  const noiseTex = ctex(128, 128, (g, w) => {
    const N = 16, cell = [...Array(N * N)].map(() => Math.random()), img = g.createImageData(w, w), sm = t => t * t * (3 - 2 * t);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const fx = x / w * N, fy = y / w * N, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0), C = (i, j) => cell[((j + N) % N) * N + ((i + N) % N)];
      const v = (C(x0, y0) * (1 - tx) + C(x0 + 1, y0) * tx) * (1 - ty) + (C(x0, y0 + 1) * (1 - tx) + C(x0 + 1, y0 + 1) * tx) * ty, k = (y * w + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, true);
  const tuftTex = new THREE.TextureLoader().load("assets/grass/tuft.jpg"); tuftTex.anisotropy = 4;
  // one tuft: three crossed cards, each two rows tall so it can bend, leaning slightly outward so it still reads from above
  const tp = [], tuv = [], tix = [];
  for (let k = 0; k < 3; k++) {
    const a = k * Math.PI / 3, cx = Math.cos(a), cz = Math.sin(a), lx = -cz * 0.12, lz = cx * 0.12, i0 = tp.length / 3;
    [0, 0.5, 1].forEach(v => [-0.5, 0.5].forEach(u => { const lean = v * v * (k % 2 ? 1 : -1); tp.push(u * cx + lx * lean, v, u * cz + lz * lean); tuv.push(u + 0.5, v); }));
    tix.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2, i0 + 2, i0 + 3, i0 + 4, i0 + 3, i0 + 5, i0 + 4);
  }
  const GN = LIGHT ? 14000 : 36000, GH = 18, gg = new THREE.InstancedBufferGeometry();
  gg.setAttribute("position", new THREE.Float32BufferAttribute(tp, 3)); gg.setAttribute("uv", new THREE.Float32BufferAttribute(tuv, 2)); gg.setIndex(tix);
  gg.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(tp.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  const goff = new Float32Array(GN * 2), grnd = new Float32Array(GN * 4);
  for (let i = 0; i < GN; i++) { goff[i * 2] = Math.random() * GH * 2; goff[i * 2 + 1] = Math.random() * GH * 2; grnd.set([0.75 + Math.random() * 0.6, Math.random() * 6.283, Math.random() * 6.283, Math.random()], i * 4); }
  gg.setAttribute("aOff", new THREE.InstancedBufferAttribute(goff, 2)); gg.setAttribute("aRnd", new THREE.InstancedBufferAttribute(grnd, 4)); gg.instanceCount = GN;
  FX.grassU = { uCenter: { value: new THREE.Vector2() }, uMask: { value: maskTex }, uPush: { value: new THREE.Vector3(0, 0, 0.42) }, uTuft: { value: tuftTex }, uNoise: { value: noiseTex },
    uBase: { value: new THREE.Color(0.04, 0.09, 0.025) }, uTip1: { value: new THREE.Color(0.24, 0.44, 0.08) }, uTip2: { value: new THREE.Color(0.13, 0.28, 0.05) } };
  const gm = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  gm.onBeforeCompile = shd => {
    Object.assign(shd.uniforms, FX.grassU, { uWind: FX.wind });
    shd.vertexShader = `attribute vec2 aOff; attribute vec4 aRnd; uniform vec2 uCenter; uniform sampler2D uMask; uniform sampler2D uNoise; uniform vec3 uPush; uniform float uWind;
      varying vec2 vTuv; varying float vVar;\n` + shd.vertexShader
      .replace("#include <beginnormal_vertex>", "vec3 objectNormal = vec3(0.0, 1.0, 0.0);")
      .replace("#include <begin_vertex>", `
        vec2 gp = uCenter - ${GH.toFixed(1)} + mod(aOff - (uCenter - ${GH.toFixed(1)}), ${(GH * 2).toFixed(1)});
        float m = texture2D(uMask, (gp + 64.0) / 128.0).r;
        float fade = 1.0 - smoothstep(${(GH * 0.65).toFixed(1)}, ${GH.toFixed(1)}, length(gp - uCenter));
        float s = aRnd.x * smoothstep(0.35, 0.9, m) * fade;
        float ca = cos(aRnd.y), sa = sin(aRnd.y), yy = position.y;
        vec3 p = vec3(position.x * ca - position.z * sa, yy, position.x * sa + position.z * ca) * vec3(0.3, 0.15, 0.3) * s;
        float n = texture2D(uNoise, gp * 0.035 + uWind * 0.012).r;
        float sway = (sin(uWind * 1.6 + dot(gp, vec2(0.31, 0.27)) + n * 5.5) * 0.6 + sin(uWind * 3.1 + aRnd.z) * 0.15) * 0.07 * yy * yy * s;
        vec2 away = gp - uPush.xy; float dd = length(away);
        vec2 push = dd < uPush.z ? (away / max(dd, 0.001)) * (uPush.z - dd) * 1.1 * yy : vec2(0.0);
        vec3 transformed = vec3(gp.x + p.x + sway + push.x, p.y * (1.0 - 0.45 * length(push) / max(uPush.z, 0.01)), gp.y + p.z + sway * 0.6 + push.y);
        vTuv = uv; vVar = texture2D(uNoise, gp * 0.06).r * 0.7 + aRnd.w * 0.3;`);
    shd.fragmentShader = `#undef DOUBLE_SIDED
      uniform sampler2D uTuft; uniform vec3 uBase; uniform vec3 uTip1; uniform vec3 uTip2; varying vec2 vTuv; varying float vVar;\n` + shd.fragmentShader
      .replace("#include <alphatest_fragment>", "if (texture2D(uTuft, vTuv).r < 0.45) discard;")
      .replace("#include <color_fragment>", "diffuseColor.rgb = mix(uBase, mix(uTip1, uTip2, smoothstep(0.25, 0.75, vVar)), smoothstep(0.0, 0.95, vTuv.y));")
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n\tgl_FragColor.a = 1.0;");
  };
  gm.customProgramCacheKey = () => "fluffyGrass";
  FX.grass = new THREE.Mesh(gg, gm); FX.grass.frustumCulled = false; FX.grass.receiveShadow = true; world.add(FX.grass);
}
