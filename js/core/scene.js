/* js/core/scene.js — Renderer, scene, camera and the room size constants. The modelling helpers (mat, box, cyl, plane, tex,
   led, module) are in js/core/helpers.js.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Scene ---------- */
const stage = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
