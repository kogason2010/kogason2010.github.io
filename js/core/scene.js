/* js/core/scene.js — Renderer, scene, camera and the room size constants. The modelling helpers (mat, box, cyl, plane, tex,
   led, module) are in js/core/helpers.js.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Graphics: "full", or "light" for phones, tablets and modest computers ---------- */
// Light draws fewer trees, tufts of grass and leaves outside, softer shadows and fewer pixels. It's chosen automatically
// unless the visitor picks one in the Places menu (remembered in this browser).
// The graphics chip's name, where the browser shares it: built-in chips (Intel, basic Radeon, phone and tablet GPUs) and
// software rendering get Light even on a computer with plenty of cores and memory.
const GPU_NAME = (() => {
  try { const gl = document.createElement("canvas").getContext("webgl"), ext = gl && gl.getExtension("WEBGL_debug_renderer_info"), name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ""; const lose = gl && gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext(); return name; } catch (e) { return ""; }
})();
const WEAK_GPU = /Intel|Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Basic Render|Radeon\(TM\) Graphics|Radeon Vega|Vega \d/i.test(GPU_NAME);
let QUALITY_CHOSEN = false;   // the visitor picked it (perf.js then leaves it alone)
let QUALITY = (() => {
  try { const q = localStorage.getItem("labQuality"); if (q === "full" || q === "light") { QUALITY_CHOSEN = true; return q; } } catch (e) { /* no storage: choose */ }
  const touch = window.matchMedia("(pointer: coarse)").matches, cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8;
  return touch || WEAK_GPU || cores <= 4 || mem <= 4 ? "light" : "full";
})();
let LIGHT = QUALITY === "light", PIXELS_MAX = LIGHT ? 1.25 : 2;   // perf.js can drop to Light while the page runs
function setQuality(q) { try { localStorage.setItem("labQuality", q); } catch (e) { /* this visit only */ } location.reload(); }

/* ---------- Scene ---------- */
const stage = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXELS_MAX));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = LIGHT ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;   // soft shadows cost a lot on weak chips
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const lab = new THREE.Group(); scene.add(lab);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
// room footprint: walls along x = -4.2 and z = -4.2, open (cut-away) sides at +5.4
const ROOM0 = -4.2, ROOM1 = 5.4, ROOMSZ = ROOM1 - ROOM0, ROOMMID = (ROOM0 + ROOM1) / 2;
const DOOR = { x: 4.6, w: 1.0, h: 2.2 };                 // exit door in the back wall, past the robot dock
const HOME = new THREE.Vector3(13.1, 10.5, 13.1);
const TARGET = new THREE.Vector3(0.3, 1.6, 0.3);
camera.position.copy(HOME);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minAzimuthAngle = 0.12;
controls.maxAzimuthAngle = Math.PI / 2 - 0.12;
controls.minPolarAngle = 0.45;
controls.maxPolarAngle = 1.3;
controls.minDistance = 8;
controls.maxDistance = 28;
