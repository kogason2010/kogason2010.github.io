/* instruments/lab-hplc/model.js — HPLC (Shimadzu Nexera) on the back bench.
   Solvent bottles, controller with touchscreen, pumps, autosampler, column oven; modelled full size, then scaled to the bench.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room. */
"use strict";

// ============================================================
// SHIMADZU NEXERA HPLC — REFERENCE-INSPIRED 3D MODEL
// ============================================================
//
// Reference:
// - Tall dark modular instrument stack
// - Integrated touchscreen on upper controller
// - Four distinct modules below touchscreen
// - Two clear solvent bottles on top
// - Narrow column oven on the right
// - Matte black and charcoal-gray finishes
// - Fine panel seams, green LEDs, subtle trim
//
// Front direction: +Z
// Right direction: +X
//
// Designed to replace the original HPLC section.
// Uses existing box(), plane(), tex(), hotGroup(),
// scaleAbout(), and THREE.
// ============================================================

const gHPLC = hotGroup(
  "hplc",
  "HPLC",
  new THREE.Vector3(-0.95, 4.05, -3.6)
);

const HPX = -1.12;
const HPZ = -3.7;
const HW = 0.62;
const HD = 0.8;
const HF = HPZ + HD / 2;
const HP_BASE = 1.31;

// Overall model scale
const HP_SCALE = 0.72;

// Column oven dimensions
const HP_OVEN_W = 0.35;
const HP_OVEN_H = 1.30;
const HP_OVEN_GAP = 0.014;

// Retain these shared definitions for compatibility
// with other instrument sections in the scene.
const hBody = 0x202427;
const hDoor = 0x2c3236;
const hTrim = 0x5d676d;

function lcdTex(lines) {
  return tex((g, W, H) => {
    g.fillStyle = "#0f1a20";
    g.fillRect(0, 0, W, H);

    g.fillStyle = "#8fe6ff";
    g.font = "bold 13px monospace";

    lines.forEach((l, i) => {
      g.fillText(l, 6, 16 + i * 16);
    });
  }, 120, 48);
}

// ============================================================
// MATERIALS
// ============================================================

const hpMat = {

  // Main dark instrument housing
  body: new THREE.MeshStandardMaterial({
    color: 0x121518,
    metalness: 0.18,
    roughness: 0.76
  }),

  // Front structural panels
  front: new THREE.MeshStandardMaterial({
    color: 0x1a1d21,
    metalness: 0.16,
    roughness: 0.73
  }),

  // Module doors
  door: new THREE.MeshStandardMaterial({
    color: 0x24272b,
    metalness: 0.16,
    roughness: 0.72
  }),

  // Autosampler lower drawer
  drawer: new THREE.MeshStandardMaterial({
    color: 0x303338,
    metalness: 0.20,
    roughness: 0.70
  }),

  // Top module and controller housing
  controller: new THREE.MeshStandardMaterial({
    color: 0x101215,
    metalness: 0.13,
    roughness: 0.75
  }),

  // Column oven body
  oven: new THREE.MeshStandardMaterial({
    color: 0x1b1e22,
    metalness: 0.18,
    roughness: 0.74
  }),

  // Column oven front door
  ovenDoor: new THREE.MeshStandardMaterial({
    color: 0x30343a,
    metalness: 0.16,
    roughness: 0.73,
    side: THREE.DoubleSide
  }),

  // Dark recessed control areas
  recess: new THREE.MeshStandardMaterial({
    color: 0x07090b,
    metalness: 0.05,
    roughness: 0.94
  }),

  // Dark panel separation
  seam: new THREE.MeshStandardMaterial({
    color: 0x060709,
    metalness: 0.04,
    roughness: 0.92
  }),

  // Small metallic accents
  trim: new THREE.MeshStandardMaterial({
    color: 0x666e74,
    metalness: 0.50,
    roughness: 0.54
  }),

  // Side panels
  side: new THREE.MeshStandardMaterial({
    color: 0x343940,
    metalness: 0.24,
    roughness: 0.72
  }),

  // Stainless-steel bottle rack
  rail: new THREE.MeshStandardMaterial({
    color: 0x89949b,
    metalness: 0.76,
    roughness: 0.38
  }),

  // Green status LEDs
  green: new THREE.MeshStandardMaterial({
    color: 0x37c879,
    emissive: 0x13a752,
    emissiveIntensity: 0.95
  }),

  // Small unlit indicators
  inactive: new THREE.MeshStandardMaterial({
    color: 0x646c73,
    metalness: 0.28,
    roughness: 0.65
  }),

  // Clear solvent bottles
  glass: new THREE.MeshStandardMaterial({
    color: 0xe1f2ff,
    transparent: true,
    opacity: 0.28,
    metalness: 0.02,
    roughness: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide
  }),

  // Liquid inside bottles
  liquid: new THREE.MeshStandardMaterial({
    color: 0xb8e3ff,
    transparent: true,
    opacity: 0.38,
    metalness: 0.0,
    roughness: 0.18,
    depthWrite: false
  }),

  // Bottle caps
  cap: new THREE.MeshStandardMaterial({
    color: 0xaeb8c0,
    metalness: 0.36,
    roughness: 0.48
  }),

  // Bottle tubing
  tubing: new THREE.MeshStandardMaterial({
    color: 0x39434b,
    metalness: 0.08,
    roughness: 0.60
  })
};

// ============================================================
// GEOMETRY HELPERS
// ============================================================

// Rounded panel facing forward (+Z)
function hpRoundedFront(
  x, y, z,
  w, h, r,
  material
) {

  const s = new THREE.Shape();

  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);

  s.quadraticCurveTo(
    w / 2, -h / 2,
    w / 2, -h / 2 + r
  );

  s.lineTo(w / 2, h / 2 - r);

  s.quadraticCurveTo(
    w / 2, h / 2,
    w / 2 - r, h / 2
  );

  s.lineTo(-w / 2 + r, h / 2);

  s.quadraticCurveTo(
    -w / 2, h / 2,
    -w / 2, h / 2 - r
  );

  s.lineTo(-w / 2, -h / 2 + r);

  s.quadraticCurveTo(
    -w / 2, -h / 2,
    -w / 2 + r, -h / 2
  );

  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(s, 8),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  gHPLC.add(mesh);

  return mesh;
}

// Cylindrical component
function hpCylinder(
  rt, rb, h,
  x, y, z,
  material,
  segments = 24
) {

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      rt, rb, h, segments
    ),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = !material.transparent;
  mesh.receiveShadow = true;

  gHPLC.add(mesh);

  return mesh;
}

// Metal rod or tubing between two 3D points
function hpRod(
  a, b,
  radius,
  material
) {

  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);

  const direction = end.clone().sub(start);
  const length = direction.length();

  if (length < 0.0001) return;

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius, radius, length, 10
    ),
    material
  );

  mesh.position.copy(start)
    .add(end)
    .multiplyScalar(0.5);

  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  mesh.castShadow = true;
  gHPLC.add(mesh);

  return mesh;
}

// Small round front indicator
function hpIndicator(x, y, z, material, r = 0.008) {

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 10, 8),
    material
  );

  mesh.position.set(x, y, z);
  gHPLC.add(mesh);

  return mesh;
}

// ============================================================
// MAIN STACK MODULE BUILDER
// ============================================================

function hpModule(y, h, type) {

  const cy = y + h / 2;

  // Main structural housing
  box(
    HW, h - 0.008, HD,
    hpMat.body,
    HPX, cy, HPZ,
    gHPLC
  );

  // Thin gray side panel
  box(
    0.012,
    h - 0.026,
    HD - 0.030,
    hpMat.side,
    HPX - HW / 2 - 0.003,
    cy,
    HPZ,
    gHPLC
  );

  // Main front fascia
  box(
    HW - 0.020,
    h - 0.027,
    0.013,
    hpMat.front,
    HPX,
    cy,
    HF + 0.010,
    gHPLC
  );

  // Horizontal seam at the top
  box(
    HW - 0.012,
    0.009,
    0.023,
    hpMat.seam,
    HPX,
    y + h - 0.008,
    HF + 0.014,
    gHPLC
  );

  // ----------------------------------------------------------
  // BASE MODULE
  // ----------------------------------------------------------

  if (type === "base") {

    // Large lower front door
    box(
      HW - 0.052,
      h - 0.070,
      0.016,
      hpMat.door,
      HPX,
      cy + 0.015,
      HF + 0.024,
      gHPLC
    );

    // Broad projecting fascia
    box(
      HW - 0.070,
      0.135,
      0.030,
      hpMat.drawer,
      HPX,
      cy + 0.035,
      HF + 0.044,
      gHPLC
    );

    // Upper edge of compartment
    box(
      HW - 0.080,
      0.009,
      0.033,
      hpMat.trim,
      HPX,
      cy + 0.104,
      HF + 0.048,
      gHPLC
    );

    // Lower recess
    box(
      HW - 0.075,
      0.035,
      0.008,
      hpMat.recess,
      HPX,
      y + 0.055,
      HF + 0.041,
      gHPLC
    );

    return y + h;
  }

  // ----------------------------------------------------------
  // STANDARD MODULE CONTROL STRIP
  // ----------------------------------------------------------

  const CONTROL_X =
    HPX - HW / 2 + 0.075;

  // Black left-side control zone
  box(
    0.118,
    h - 0.043,
    0.014,
    hpMat.recess,
    CONTROL_X,
    cy,
    HF + 0.025,
    gHPLC
  );

  // Control-zone edge
  box(
    0.009,
    h - 0.050,
    0.020,
    hpMat.trim,
    CONTROL_X + 0.064,
    cy,
    HF + 0.031,
    gHPLC
  );

  // Green vertical indicator
  box(
    0.011,
    0.068,
    0.007,
    hpMat.green,
    CONTROL_X - 0.027,
    cy + h * 0.195,
    HF + 0.037,
    gHPLC
  );

  // Secondary indicator
  hpIndicator(
    CONTROL_X - 0.027,
    cy - h * 0.16,
    HF + 0.041,
    hpMat.inactive,
    0.008
  );

  // Small lower control button
  box(
    0.021,
    0.011,
    0.008,
    hpMat.inactive,
    CONTROL_X + 0.020,
    cy - h * 0.30,
    HF + 0.041,
    gHPLC
  );

  // ----------------------------------------------------------
  // MAIN MODULE DOOR
  // ----------------------------------------------------------

  const DOOR_X = HPX + 0.079;
  const DOOR_W = HW - 0.185;
  const DOOR_H = h - 0.058;

  // Dark frame behind door
  box(
    DOOR_W + 0.014,
    DOOR_H + 0.012,
    0.013,
    hpMat.seam,
    DOOR_X,
    cy,
    HF + 0.026,
    gHPLC
  );

  // Main charcoal door
  box(
    DOOR_W,
    DOOR_H,
    0.014,
    hpMat.door,
    DOOR_X,
    cy,
    HF + 0.035,
    gHPLC
  );

  // Door edge detail
  box(
    0.005,
    DOOR_H - 0.035,
    0.004,
    hpMat.trim,
    DOOR_X + DOOR_W / 2 - 0.017,
    cy,
    HF + 0.045,
    gHPLC
  );

  // ----------------------------------------------------------
  // DIFFERENCES BETWEEN MODULE TYPES
  // ----------------------------------------------------------

  if (type === "sampler") {

    // Recessed horizontal band
    box(
      DOOR_W - 0.035,
      0.036,
      0.006,
      hpMat.recess,
      DOOR_X,
      cy - DOOR_H * 0.29,
      HF + 0.047,
      gHPLC
    );

    // Very subtle injection-compartment seam
    box(
      DOOR_W - 0.040,
      0.006,
      0.006,
      hpMat.trim,
      DOOR_X,
      cy - DOOR_H * 0.12,
      HF + 0.047,
      gHPLC
    );
  }

  if (type === "pump") {

    // Narrow horizontal door break
    box(
      DOOR_W - 0.036,
      0.005,
      0.005,
      hpMat.seam,
      DOOR_X,
      cy - DOOR_H * 0.33,
      HF + 0.046,
      gHPLC
    );
  }

  if (type === "detector") {

    // Slightly cleaner front appearance
    box(
      DOOR_W - 0.042,
      0.006,
      0.005,
      hpMat.seam,
      DOOR_X,
      cy - DOOR_H * 0.34,
      HF + 0.046,
      gHPLC
    );
  }

  return y + h;
}

// ============================================================
// BUILD MAIN HPLC STACK
// ============================================================

let yy = HP_BASE;

// Bottom module
yy = hpModule(yy, 0.38, "base");

// Autosampler
yy = hpModule(yy, 0.37, "sampler");

// Pump
yy = hpModule(yy, 0.35, "pump");

// Detector
yy = hpModule(yy, 0.31, "detector");

// ============================================================
// TOUCHSCREEN SYSTEM CONTROLLER
// ============================================================

const CTRL_H = 0.38;
const CTRL_Y = yy + CTRL_H / 2;

// Controller body
box(
  HW,
  CTRL_H,
  HD,
  hpMat.controller,
  HPX,
  CTRL_Y,
  HPZ,
  gHPLC
);

// Front black bezel
box(
  HW - 0.028,
  CTRL_H - 0.036,
  0.020,
  hpMat.recess,
  HPX,
  CTRL_Y,
  HF + 0.017,
  gHPLC
);

// ------------------------------------------------------------
// TOUCHSCREEN TEXTURE
// ------------------------------------------------------------

const hpCtrlTex = tex((g, W, H) => {

  // Main screen background
  g.fillStyle = "#080d13";
  g.fillRect(0, 0, W, H);

  // Top navigation bar
  g.fillStyle = "#111c28";
  g.fillRect(0, 0, W, 34);

  g.fillStyle = "#b8d0df";
  g.font = "bold 17px sans-serif";
  g.fillText("Nexera", 18, 23);

  g.fillStyle = "#68d994";
  g.font = "12px sans-serif";
  g.fillText("READY", W - 92, 23);

  g.beginPath();
  g.arc(W - 105, 18, 5, 0, Math.PI * 2);
  g.fill();

  // Thin navigation separator
  g.fillStyle = "#283744";
  g.fillRect(0, 34, W, 2);

  // Three top status regions
  const cards = [
    ["PRESSURE", "32.4", "MPa"],
    ["FLOW", "0.40", "mL/min"],
    ["OVEN", "40.0", "C"]
  ];

  cards.forEach((t, i) => {

    const x = 15 + i * 165;

    g.fillStyle = "#14202b";
    g.fillRect(x, 49, 153, 69);

    g.strokeStyle = "#31414e";
    g.lineWidth = 1;
    g.strokeRect(x, 49, 153, 69);

    g.fillStyle = "#8da5b4";
    g.font = "13px sans-serif";
    g.fillText(t[0], x + 11, 69);

    g.fillStyle = "#edf7ff";
    g.font = "bold 26px sans-serif";
    g.fillText(t[1], x + 11, 101);

    g.fillStyle = "#8da5b4";
    g.font = "12px sans-serif";
    g.fillText(t[2], x + 102, 102);
  });

  // Lower screen chart area
  g.fillStyle = "#101a25";
  g.fillRect(15, 130, W - 30, 106);

  // Chart grid
  g.strokeStyle = "#223343";
  g.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const gy = 142 + i * 20;

    g.beginPath();
    g.moveTo(25, gy);
    g.lineTo(W - 25, gy);
    g.stroke();
  }

  // Chromatographic signal
  g.strokeStyle = "#55aefe";
  g.lineWidth = 2.5;
  g.beginPath();

  for (let x = 25; x < W - 25; x++) {

    const peak1 =
      54 * Math.exp(
        -Math.pow((x - 185) / 12, 2)
      );

    const peak2 =
      36 * Math.exp(
        -Math.pow((x - 340) / 17, 2)
      );

    const noise = 1.5 * Math.sin(x / 11);

    const py =
      218 - peak1 - peak2 + noise;

    if (x === 25) {
      g.moveTo(x, py);
    } else {
      g.lineTo(x, py);
    }
  }

  g.stroke();

  // Lower status bars
  g.fillStyle = "#28aa71";
  g.fillRect(25, 242, 125, 4);

  g.fillStyle = "#5b84b1";
  g.fillRect(161, 242, 85, 4);

  g.fillStyle = "#64717e";
  g.fillRect(257, 242, 80, 4);

}, 512, 256);

// Screen plane
plane(
  0.515,
  0.278,
  new THREE.MeshBasicMaterial({
    map: hpCtrlTex,
    toneMapped: false
  }),
  HPX,
  CTRL_Y + 0.006,
  HF + 0.030,
  0,
  gHPLC
);

// Bottom controller bezel
box(
  HW - 0.045,
  0.020,
  0.024,
  hpMat.front,
  HPX,
  yy + 0.038,
  HF + 0.029,
  gHPLC
);

// Small power indicator
hpIndicator(
  HPX + HW / 2 - 0.057,
  yy + 0.040,
  HF + 0.045,
  hpMat.green,
  0.006
);

// Update top of stack
yy += CTRL_H;

// ============================================================
// SOLVENT BOTTLE TRAY
// ============================================================

const RACK_Y = yy + 0.036;

// Tray base
box(
  HW - 0.024,
  0.033,
  HD - 0.060,
  hpMat.controller,
  HPX,
  RACK_Y,
  HPZ,
  gHPLC
);

// Raised rear tray lip
box(
  HW - 0.025,
  0.045,
  0.023,
  hpMat.trim,
  HPX,
  RACK_Y + 0.020,
  HPZ - HD / 2 + 0.042,
  gHPLC
);

// ============================================================
// BOTTLE RACK GUARDRAILS
// ============================================================

const RX1 = HPX - HW / 2 + 0.036;
const RX2 = HPX + HW / 2 - 0.036;

const RZ1 = HPZ - HD / 2 + 0.060;
const RZ2 = HPZ + HD / 2 - 0.060;

const RY0 = RACK_Y + 0.020;
const RY1 = RACK_Y + 0.135;

// Four vertical posts
[
  [RX1, RZ1],
  [RX2, RZ1],
  [RX1, RZ2],
  [RX2, RZ2]
].forEach(([x, z]) => {

  hpRod(
    [x, RY0, z],
    [x, RY1, z],
    0.006,
    hpMat.rail
  );

});

// Front horizontal guardrail
hpRod(
  [RX1, RY1, RZ2],
  [RX2, RY1, RZ2],
  0.006,
  hpMat.rail
);

// Rear horizontal guardrail
hpRod(
  [RX1, RY1, RZ1],
  [RX2, RY1, RZ1],
  0.006,
  hpMat.rail
);

// Side guardrails
hpRod(
  [RX1, RY1, RZ1],
  [RX1, RY1, RZ2],
  0.006,
  hpMat.rail
);

hpRod(
  [RX2, RY1, RZ1],
  [RX2, RY1, RZ2],
  0.006,
  hpMat.rail
);

// ============================================================
// TWO SOLVENT BOTTLES
// ============================================================

function hpSolventBottle(x, z, fillLevel = 0.58) {

  const BOTTOM = RACK_Y + 0.022;

  const BODY_R = 0.097;
  const BODY_H = 0.300;

  // Main transparent bottle
  hpCylinder(
    BODY_R,
    BODY_R,
    BODY_H,
    x,
    BOTTOM + BODY_H / 2,
    z,
    hpMat.glass,
    28
  );

  // Sloped bottle shoulder
  hpCylinder(
    0.043,
    BODY_R,
    0.084,
    x,
    BOTTOM + BODY_H + 0.042,
    z,
    hpMat.glass,
    28
  );

  // Bottle neck
  hpCylinder(
    0.041,
    0.041,
    0.068,
    x,
    BOTTOM + BODY_H + 0.117,
    z,
    hpMat.glass,
    24
  );

  // Liquid volume
  const LIQ_H = BODY_H * fillLevel;

  hpCylinder(
    BODY_R - 0.009,
    BODY_R - 0.009,
    LIQ_H,
    x,
    BOTTOM + LIQ_H / 2 + 0.007,
    z,
    hpMat.liquid,
    28
  );

  // Screw cap
  hpCylinder(
    0.049,
    0.049,
    0.046,
    x,
    BOTTOM + BODY_H + 0.165,
    z,
    hpMat.cap,
    22
  );

  // Thin cap rim
  hpCylinder(
    0.051,
    0.051,
    0.008,
    x,
    BOTTOM + BODY_H + 0.145,
    z,
    hpMat.trim,
    22
  );

  // Solvent pickup tube inside bottle
  hpRod(
    [
      x + 0.018,
      BOTTOM + 0.025,
      z + 0.018
    ],
    [
      x + 0.018,
      BOTTOM + BODY_H + 0.170,
      z + 0.018
    ],
    0.003,
    hpMat.tubing
  );

}

// Two bottles instead of the original four
hpSolventBottle(
  HPX - 0.153,
  HPZ + 0.005,
  0.62
);

hpSolventBottle(
  HPX + 0.153,
  HPZ + 0.005,
  0.78
);

// ============================================================
// RIGHT-SIDE COLUMN OVEN
// ============================================================

const COX =
  HPX +
  HW / 2 +
  HP_OVEN_GAP +
  HP_OVEN_W / 2;

const COY = HP_BASE + HP_OVEN_H / 2;
const COT = HP_BASE + HP_OVEN_H;

// Main oven enclosure
box(
  HP_OVEN_W,
  HP_OVEN_H,
  HD,
  hpMat.oven,
  COX,
  COY,
  HPZ,
  gHPLC
);

// Side casing
box(
  0.014,
  HP_OVEN_H - 0.030,
  HD - 0.020,
  hpMat.side,
  COX + HP_OVEN_W / 2 + 0.003,
  COY,
  HPZ,
  gHPLC
);

// Top cap
box(
  HP_OVEN_W + 0.006,
  0.018,
  HD + 0.006,
  hpMat.controller,
  COX,
  COT - 0.009,
  HPZ,
  gHPLC
);

// ------------------------------------------------------------
// COLUMN OVEN LOWER DOOR
// ------------------------------------------------------------

const OVEN_DOOR_H = HP_OVEN_H - 0.435;
const OVEN_DOOR_Y =
  HP_BASE + 0.049 + OVEN_DOOR_H / 2;

// Black border behind lower door
hpRoundedFront(
  COX,
  OVEN_DOOR_Y,
  HF + 0.016,
  HP_OVEN_W - 0.025,
  OVEN_DOOR_H,
  0.018,
  hpMat.recess
);

// Large gray lower door
hpRoundedFront(
  COX,
  OVEN_DOOR_Y,
  HF + 0.020,
  HP_OVEN_W - 0.042,
  OVEN_DOOR_H - 0.018,
  0.015,
  hpMat.ovenDoor
);

// Thin vertical seam near right edge
box(
  0.006,
  OVEN_DOOR_H - 0.060,
  0.006,
  hpMat.seam,
  COX + HP_OVEN_W / 2 - 0.049,
  OVEN_DOOR_Y,
  HF + 0.025,
  gHPLC
);

// Small lower access panel
box(
  0.092,
  0.115,
  0.009,
  hpMat.door,
  COX - 0.012,
  HP_BASE + 0.230,
  HF + 0.028,
  gHPLC
);

// Access panel border
box(
  0.074,
  0.090,
  0.010,
  hpMat.front,
  COX - 0.012,
  HP_BASE + 0.230,
  HF + 0.035,
  gHPLC
);

// ------------------------------------------------------------
// COLUMN OVEN UPPER CONTROL PANEL
// ------------------------------------------------------------

const OVEN_CTRL_H = 0.365;
const OVEN_CTRL_Y = COT - OVEN_CTRL_H / 2 - 0.012;

// Upper control casing
box(
  HP_OVEN_W - 0.015,
  OVEN_CTRL_H,
  0.025,
  hpMat.controller,
  COX,
  OVEN_CTRL_Y,
  HF + 0.015,
  gHPLC
);

// Black control screen bezel
box(
  HP_OVEN_W - 0.036,
  OVEN_CTRL_H - 0.030,
  0.014,
  hpMat.recess,
  COX,
  OVEN_CTRL_Y,
  HF + 0.034,
  gHPLC
);

// ------------------------------------------------------------
// COLUMN OVEN DISPLAY TEXTURE
// ------------------------------------------------------------

const hpOvenTex = tex((g, W, H) => {

  g.fillStyle = "#080d12";
  g.fillRect(0, 0, W, H);

  // Header
  g.fillStyle = "#16222b";
  g.fillRect(0, 0, W, 27);

  g.fillStyle = "#b3c8d5";
  g.font = "bold 13px sans-serif";
  g.fillText("COLUMN OVEN", 10, 18);

  // Status indicator
  g.fillStyle = "#43d889";
  g.beginPath();
  g.arc(W - 17, 14, 5, 0, Math.PI * 2);
  g.fill();

  // Operating temperature
  g.fillStyle = "#a0b5c1";
  g.font = "12px sans-serif";
  g.fillText("TEMPERATURE", 12, 52);

  g.fillStyle = "#e3f2fc";
  g.font = "bold 30px sans-serif";
  g.fillText("40.0", 12, 89);

  g.fillStyle = "#a0b5c1";
  g.font = "13px sans-serif";
  g.fillText("C", 108, 87);

  // Horizontal separator
  g.strokeStyle = "#334451";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(12, 104);
  g.lineTo(W - 12, 104);
  g.stroke();

  // Operational rows
  const rows = [
    ["HEATER", "ON"],
    ["READY", "YES"],
    ["STATUS", "NORMAL"]
  ];

  rows.forEach((r, i) => {

    const y = 130 + i * 26;

    g.fillStyle = "#8298a7";
    g.font = "12px sans-serif";
    g.fillText(r[0], 13, y);

    g.fillStyle = "#58d69a";
    g.fillText(r[1], W - 68, y);
  });

}, 192, 224);

plane(
  HP_OVEN_W - 0.062,
  OVEN_CTRL_H - 0.064,
  new THREE.MeshBasicMaterial({
    map: hpOvenTex,
    toneMapped: false
  }),
  COX,
  OVEN_CTRL_Y,
  HF + 0.046,
  0,
  gHPLC
);

// ------------------------------------------------------------
// COLUMN OVEN FRONT INDICATORS
// ------------------------------------------------------------

// Small green operational LED
box(
  0.009,
  0.047,
  0.006,
  hpMat.green,
  COX - HP_OVEN_W / 2 + 0.025,
  COT - 0.185,
  HF + 0.051,
  gHPLC
);

// Small upper status light
hpIndicator(
  COX - HP_OVEN_W / 2 + 0.025,
  COT - 0.085,
  HF + 0.051,
  hpMat.inactive,
  0.006
);

// Horizontal seam beneath display
box(
  HP_OVEN_W - 0.026,
  0.012,
  0.026,
  hpMat.seam,
  COX,
  COT - OVEN_CTRL_H - 0.027,
  HF + 0.026,
  gHPLC
);

// ============================================================
// STACK AND OVEN BASE DETAILS
// ============================================================

// Main HPLC base seam
box(
  HW - 0.025,
  0.013,
  HD - 0.010,
  hpMat.seam,
  HPX,
  HP_BASE + 0.015,
  HPZ,
  gHPLC
);

// Column oven bottom separation
box(
  HP_OVEN_W - 0.016,
  0.014,
  HD - 0.014,
  hpMat.seam,
  COX,
  HP_BASE + 0.016,
  HPZ,
  gHPLC
);

// Feet below main instrument
for (const dx of [-0.245, 0.245]) {

  box(
    0.075,
    0.030,
    0.105,
    hpMat.recess,
    HPX + dx,
    HP_BASE + 0.015,
    HPZ + 0.22,
    gHPLC
  );

}

// Feet below column oven
for (const dz of [-0.27, 0.27]) {

  box(
    0.075,
    0.030,
    0.090,
    hpMat.recess,
    COX,
    HP_BASE + 0.015,
    HPZ + dz,
    gHPLC
  );

}

// ============================================================
// FINAL SCALE AND PLACEMENT
// ============================================================

// Preserve existing HPLC scene anchor and scaling
scaleAbout(
  gHPLC,
  HP_SCALE,
  -0.95,
  HP_BASE,
  -4.12
);

// ============================================================
// END SHIMADZU NEXERA HPLC
// ============================================================
