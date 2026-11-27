/* js/core/post.js — Richer rendering indoors on Full graphics: soft contact shadows where things meet (screen-space
   ambient occlusion) and a gentle glow round screens, status LEDs, lit panels and lamps (bloom from just those things).
   The room is drawn into an antialiased off-screen image with its depth; the shadows are worked out from the depth at
   half size and smoothed without bleeding across edges; the glowing things are drawn again on their own, kept only where
   the room doesn't hide them, and blurred at two sizes. One last pass puts it together on screen.
   It keeps what the plain renderer does: the page shows through wherever nothing is drawn (the backdrop behind the
   diorama), and the live KogasonOS monitor, a hole in the canvas with the desktop behind it, stays a clean hole.
   Light graphics, older browsers (it needs WebGL 2), the campus and orbit draw as before. js/ui/perf.js turns it off for
   the visit if frames run long, before it lowers the resolution.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const GLOW_LAYER = 5;
const POST = {
  ok: !LIGHT && renderer.capabilities.isWebGL2,   // Full graphics on a browser that can do it
  off: false,                                     // turned off for this visit (too slow, or the visitor's browser objects)
  ao: true, bloom: true, active: false,
  aoStrength: 0.75, bloomStrength: 0.85,
};
if (POST.ok) {
  const size = new THREE.Vector2();
  const rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
  // the room: antialiased colour plus depth (resolved together, so the depth matches what's on screen)
  const main = new THREE.WebGLMultisampleRenderTarget(1, 1, Object.assign({}, rtOpts));
  // (on a high-density screen the pixels are already small, so 2× antialiasing is enough and saves a lot of graphics memory)
  main.samples = Math.min((window.devicePixelRatio || 1) >= 1.75 ? 2 : 4, renderer.capabilities.maxSamples || 4);
  main.texture.encoding = THREE.sRGBEncoding;     // the room is drawn tone-mapped and encoded, exactly as it would be on screen
  main.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  // the glowing things on their own, at half size, with their own depth to compare against the room's
  const glow = new THREE.WebGLRenderTarget(1, 1, Object.assign({}, rtOpts));
  glow.texture.encoding = THREE.sRGBEncoding;
  glow.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  const aoA = new THREE.WebGLRenderTarget(1, 1, rtOpts), aoB = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const bHalf = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const b4a = new THREE.WebGLRenderTarget(1, 1, rtOpts), b4b = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const b8a = new THREE.WebGLRenderTarget(1, 1, rtOpts), b8b = new THREE.WebGLRenderTarget(1, 1, rtOpts);

  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false; quadScene.add(quad);
  const VS = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
  const pass = (fs, uniforms) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, blending: THREE.NoBlending, toneMapped: false });
  const VIEWZ = `
    uniform float uNear, uFar;
    float viewZ(float d) { return (uNear * uFar) / ((uFar - uNear) * d - uFar); }   // depth (0..1) to view-space z (negative)
  `;

  // ambient occlusion from depth: for each pixel, sample a spiral of points around it and darken it by how much of the
  // nearby surface rises in front of it (McGuire's Alchemy / SAO estimator, with normals rebuilt from the depth)
  const ssaoMat = pass(`
    uniform sampler2D tDepth; uniform mat4 uProjInv; uniform vec2 uRes; uniform float uRadius, uProjScale, uIntensity, uBias;
    varying vec2 vUv;
    #define NS 16
    vec3 viewPos(vec2 uv) { float d = texture2D(tDepth, uv).x; vec4 p = uProjInv * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
    void main() {
      vec2 px = 1.0 / uRes, uv = (floor(vUv * uRes) + 0.5) * px;      // the centre of one full-size depth texel (this pass runs at half size)
      float d = texture2D(tDepth, uv).x;
      if (d >= 1.0) { gl_FragColor = vec4(1.0); return; }
      vec3 C = viewPos(uv);
      vec3 l = viewPos(uv - vec2(px.x, 0.0)), r = viewPos(uv + vec2(px.x, 0.0)), b = viewPos(uv - vec2(0.0, px.y)), t = viewPos(uv + vec2(0.0, px.y));
      vec3 dx = abs(l.z - C.z) < abs(r.z - C.z) ? C - l : r - C;      // the flatter side, so edges don't bend the normal
      vec3 dy = abs(b.z - C.z) < abs(t.z - C.z) ? C - b : t - C;
      vec3 cn = cross(dx, dy);
      if (dot(cn, cn) < 1e-20) { gl_FragColor = vec4(1.0); return; }
      vec3 n = normalize(cn);
      float ssR = min(uRadius * uProjScale / -C.z, 160.0);              // the radius in pixels at this depth
      float rnd = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;
      float r2 = uRadius * uRadius, sum = 0.0;
      for (int i = 0; i < NS; i++) {
        float a = (float(i) + 0.5) / float(NS), ang = a * 43.98 + rnd;  // 7 turns of the spiral
        vec3 v = viewPos(uv + vec2(cos(ang), sin(ang)) * a * ssR * px) - C;
        float vv = dot(v, v), f = max(r2 - vv, 0.0);
        sum += f * f * f * max((dot(v, n) - uBias * -C.z) / (0.01 + vv), 0.0);
      }
      float ao = max(0.0, 1.0 - sum / (r2 * r2 * r2) * (5.0 / float(NS)) * uIntensity);
      gl_FragColor = vec4(vec3(ao), 1.0);
    }`, { tDepth: { value: null }, uProjInv: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2() }, uRadius: { value: 0.26 }, uProjScale: { value: 1 }, uIntensity: { value: 1.0 }, uBias: { value: 0.006 } });

  // smooth the shadows along x, then y, without blurring across a jump in depth (so they stay off the thing in front)
  const aoBlurMat = pass(VIEWZ + `
    uniform sampler2D tAO, tDepth; uniform vec2 uDir;
    varying vec2 vUv;
    void main() {
      float z0 = viewZ(texture2D(tDepth, vUv).x), s = 0.0, w = 0.0;
      for (int i = -4; i <= 4; i++) {
        vec2 uv = vUv + uDir * float(i);
        float z = viewZ(texture2D(tDepth, uv).x), k = exp(-float(i * i) / 12.0) * exp(-abs(z - z0) / (0.02 * -z0));
        s += texture2D(tAO, uv).r * k; w += k;
      }
      gl_FragColor = vec4(vec3(s / w), 1.0);
    }`, { tAO: { value: null }, tDepth: { value: null }, uDir: { value: new THREE.Vector2() }, uNear: { value: 0.1 }, uFar: { value: 100 } });

  // the glowing things, kept only where nothing in the room is in front of them, and only their brighter parts
  const brightMat = pass(VIEWZ + `
    uniform sampler2D tGlow, tGlowDepth, tDepth;
    varying vec2 vUv;
    void main() {
      vec4 g = texture2D(tGlow, vUv); float gd = texture2D(tGlowDepth, vUv).x;
      if (gd >= 1.0) { gl_FragColor = vec4(0.0); return; }
      float gz = viewZ(gd), mz = viewZ(texture2D(tDepth, vUv).x);
      float seen = step(mz - 0.03 * -mz, gz);                           // not hidden behind the room (a little give for the half-size image)
      vec3 c = min(max(g.rgb - 0.3, 0.0) * 1.3, vec3(0.6));            // (capped, so a white screen gives a halo, not a blob)
      gl_FragColor = vec4(c * seen, 1.0);
    }`, { tGlow: { value: glow.texture }, tGlowDepth: { value: glow.depthTexture }, tDepth: { value: null }, uNear: { value: 0.1 }, uFar: { value: 100 } });

  // a 9-tap gaussian (bilinear taps, so it reaches 17 pixels)
  const blurMat = pass(`
    uniform sampler2D tSrc; uniform vec2 uDir;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
      c += (texture2D(tSrc, vUv + uDir * 1.3846153846).rgb + texture2D(tSrc, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
      c += (texture2D(tSrc, vUv + uDir * 3.2307692308).rgb + texture2D(tSrc, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
      gl_FragColor = vec4(c, 1.0);
    }`, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });

  // put it together: the room, darkened by the shadows, plus the glow. Over the page's backdrop the glow brings its own
  // alpha so a halo shows there too; the monitor's hole (drawn, but see-through) stays exactly as it was
  const compMat = pass(`
    uniform sampler2D tColor, tDepth, tAO, tB1, tB2; uniform float uAO, uBloom, uDebug;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tColor, vUv); float d = texture2D(tDepth, vUv).x;
      if (d < 1.0 && c.a < 0.004) { gl_FragColor = vec4(0.0); return; }
      if (uDebug > 0.5) { gl_FragColor = uDebug < 1.5 ? vec4(vec3(texture2D(tAO, vUv).r), 1.0) : vec4(texture2D(tB1, vUv).rgb + texture2D(tB2, vUv).rgb, 1.0); return; }
      float ao = d < 1.0 ? mix(1.0, max(texture2D(tAO, vUv).r, 0.45), uAO) : 1.0;   // (never darker than about half: soft, not sooty)
      vec3 bl = (texture2D(tB1, vUv).rgb * 0.4 + texture2D(tB2, vUv).rgb * 0.75) * uBloom;
      vec3 col = c.rgb * ao + bl * (1.0 - c.rgb * 0.5);                   // screen-ish add, so white doesn't blow out
      float a = max(c.a, min(1.0, max(bl.r, max(bl.g, bl.b))));
      gl_FragColor = vec4(col, a);
    }`, { tColor: { value: main.texture }, tDepth: { value: main.depthTexture }, tAO: { value: aoB.texture }, tB1: { value: b4b.texture }, tB2: { value: b8b.texture }, uAO: { value: 1 }, uBloom: { value: 1 }, uDebug: { value: 0 } });

  const black = new THREE.Color(0, 0, 0), clearWas = new THREE.Color();
  const osGlowMat = new THREE.MeshBasicMaterial({ color: 0x5d8fd0, toneMapped: false });
  function draw(material, target) { quad.material = material; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); }
  function fit(rt, w, h) { if (rt.width !== w || rt.height !== h) rt.setSize(w, h); }

  // what glows: status LEDs, the canvas screens, unlit "lit" things (panels, neon, bulbs, counters), and anything with a
  // strong emissive colour. Checked about once a second (lamps brighten at night; LEDs blink by hiding)
  // two big monitors are drawn on canvases of their own (not screenTex), so they're named here
  const glowMats = new Set();
  function namedScreens() { [screenMesh.material !== holeMat && screenMesh, icScreen].forEach(o => { if (o && o.material) glowMats.add(o.material); }); }
  function glows(m) {
    if (!m || Array.isArray(m) || m.isShaderMaterial || m.visible === false || m.blending === THREE.AdditiveBlending) return false;
    if (glowMats.has(m)) return true;
    if (m.transparent && !(m.isMeshBasicMaterial && m.toneMapped === false)) return false;   // (see-through, unless it's a lit screen overlay)
    if (m.isMeshBasicMaterial) {
      if (m.vertexColors) return false;   // (the mathematics lattice: hundreds of small lit panes that would blur into one white blob)
      if (m.map) return SCREEN_TEX.has(m.map) || m.toneMapped === false;
      const c = m.color; return m.toneMapped === false || 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.55;   // (black or dark: a hole, a bezel)
    }
    if (m.emissive) { const e = m.emissive, k = m.emissiveIntensity * Math.max(e.r, e.g, e.b); return k >= 0.22 || (!!m.emissiveMap && m.emissiveIntensity >= 0.4); }
    return false;
  }
  const ledSet = new Set(leds);
  let scanAt = 0;
  function scanGlow() {
    namedScreens();
    scene.traverseVisible(o => {
      if (o.isLight) { o.layers.enable(GLOW_LAYER); return; }
      if (!o.isMesh) return;
      if (ledSet.has(o) || glows(o.material)) o.layers.enable(GLOW_LAYER); else o.layers.disable(GLOW_LAYER);
    });
  }

  POST.render = function () {
    renderer.getDrawingBufferSize(size);
    const W = size.x, H = size.y, w2 = Math.max(1, W >> 1), h2 = Math.max(1, H >> 1), w4 = Math.max(1, W >> 2), h4 = Math.max(1, H >> 2), w8 = Math.max(1, W >> 3), h8 = Math.max(1, H >> 3);
    fit(main, W, H); fit(glow, w2, h2); fit(aoA, w2, h2); fit(aoB, w2, h2); fit(bHalf, w2, h2); fit(b4a, w4, h4); fit(b4b, w4, h4); fit(b8a, w8, h8); fit(b8b, w8, h8);
    const now = performance.now();
    if (POST.bloom && now > scanAt) { scanAt = now + 1000; scanGlow(); }
    renderer.info.autoReset = false; renderer.info.reset();
    renderer.getClearColor(clearWas); const alphaWas = renderer.getClearAlpha();

    // 1. the room
    renderer.setRenderTarget(main); renderer.render(scene, camera);
    const near = camera.near, far = camera.far;
    // 2. contact shadows
    if (POST.ao) {
      // the shadow reach grows with the viewing distance: room-wide views get soft corners and benches, close-ups only
      // the contact right where things touch (a fixed reach makes dark halos up close)
      ssaoMat.uniforms.uRadius.value = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * 0.03, 0.2, 0.62);
      ssaoMat.uniforms.tDepth.value = main.depthTexture; ssaoMat.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
      ssaoMat.uniforms.uRes.value.set(W, H); ssaoMat.uniforms.uProjScale.value = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));   // metres to full-size pixels at unit depth
      draw(ssaoMat, aoA);
      aoBlurMat.uniforms.tDepth.value = main.depthTexture; aoBlurMat.uniforms.uNear.value = near; aoBlurMat.uniforms.uFar.value = far;
      aoBlurMat.uniforms.tAO.value = aoA.texture; aoBlurMat.uniforms.uDir.value.set(1 / w2, 0); draw(aoBlurMat, aoB);
      aoBlurMat.uniforms.tAO.value = aoB.texture; aoBlurMat.uniforms.uDir.value.set(0, 1 / h2); draw(aoBlurMat, aoA);
      compMat.uniforms.tAO.value = aoA.texture;
    }
    // 3. glow: the glowing things alone (no fresh shadow maps for this pass), then blurred at a quarter and an eighth
    if (POST.bloom) {
      const layersWas = camera.layers.mask, shadowWas = renderer.shadowMap.autoUpdate;
      // the live KogasonOS monitor is a hole with the desktop behind it: for this pass only, it stands in as a lit blue
      // panel, so its glow spills onto the bezel and the wall round it (the hole itself is left clear at the end)
      const live = typeof osLive !== "undefined" && osLive && lab.visible && screenMesh.material === holeMat;
      if (live) { screenMesh.material = osGlowMat; screenMesh.layers.enable(GLOW_LAYER); }
      camera.layers.set(GLOW_LAYER); renderer.shadowMap.autoUpdate = false; renderer.setClearColor(black, 0);
      renderer.setRenderTarget(glow); renderer.render(scene, camera);
      camera.layers.mask = layersWas; renderer.shadowMap.autoUpdate = shadowWas; renderer.setClearColor(clearWas, alphaWas);
      if (live) { screenMesh.material = holeMat; screenMesh.layers.disable(GLOW_LAYER); }
      brightMat.uniforms.tDepth.value = main.depthTexture; brightMat.uniforms.uNear.value = near; brightMat.uniforms.uFar.value = far;
      draw(brightMat, bHalf);
      blurMat.uniforms.tSrc.value = bHalf.texture; blurMat.uniforms.uDir.value.set(1 / w4, 0); draw(blurMat, b4a);
      blurMat.uniforms.tSrc.value = b4a.texture; blurMat.uniforms.uDir.value.set(0, 1 / h4); draw(blurMat, b4b);
      blurMat.uniforms.tSrc.value = b4b.texture; blurMat.uniforms.uDir.value.set(1 / w8, 0); draw(blurMat, b8a);
      blurMat.uniforms.tSrc.value = b8a.texture; blurMat.uniforms.uDir.value.set(0, 1 / h8); draw(blurMat, b8b);
    }
    // 4. on screen
    compMat.uniforms.uAO.value = POST.ao ? POST.aoStrength : 0;
    // glow shows most in the dark: by day, in a bright room, a screen barely haloes
    compMat.uniforms.uBloom.value = POST.bloom ? POST.bloomStrength * (darkScene ? 1 : 0.4) : 0;
    compMat.uniforms.uDebug.value = POST.debug || 0;   // (1: the shadows alone, 2: the glow alone; for tuning)
    draw(compMat, null);
    renderer.info.autoReset = true;
  };
}
// draw this frame with the effects? Indoors on Full graphics; not outside, in orbit, or while the lab is a cloud of points
function postWanted() { return POST.ok && !POST.off && !worldOn && !spaceOn && !pMode && !(P && P.points.visible) && (POST.ao || POST.bloom); }
