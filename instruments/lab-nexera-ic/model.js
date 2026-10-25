/* instruments/lab-nexera-ic/model.js — Nexera IC (ion chromatograph) on the left-wall bench.
   Compact autosampler unit, eluent tray and the tall column / suppressor tower; faces +x. The bench is part of the group.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     BX, BT, pcZ (js/core/background.js)
     icUnit (js/lab/merge.js) */
"use strict";

// ============================================================
// SHIMADZU NEXERA IC — REFINED 3D MODEL
// Reference-inspired compact autosampler + tall IC enclosure
//
// Improvements:
// - Reduced overall instrument scale
// - Darker matte-black materials
// - Reduced metallic reflections
// - Thinner silver door perimeter
// - More subtle status indicators
// - Preserved original bench and scene positioning
//
// Orientation:
// Front faces +X; viewer's left is +Z.
// ============================================================

const gInst = hotGroup(
  "ic",
  "Nexera IC",
  new THREE.Vector3(-3.4, 3.35, 2.15)
);

const BX = -3.55;
const BZ = 1.75;
const BT = 1.31;

// ------------------------------------------------------------
// MAIN DIMENSIONS
// ------------------------------------------------------------

const IC_DEPTH = 0.92;
const SHORT_W = 0.86;
const TOWER_W = 0.78;

const SHORT_H = 1.12;
const TOWER_H = 1.72;

// Reduced from 0.90 to 0.78
const IC_SCALE = 0.58;

// Position both enclosures
const SZc = BZ + 0.86;
const TZc = BZ + 0.01;

const IFX = BX + IC_DEPTH / 2;
const TOP = BT + TOWER_H;

// ------------------------------------------------------------
// REFINED MATERIALS
// ------------------------------------------------------------

const icMat = {

  // Main matte-black housing
  body: new THREE.MeshStandardMaterial({
    color: 0x101114,
    metalness: 0.15,
    roughness: 0.78
  }),

  // Upper covers and tray
  top: new THREE.MeshStandardMaterial({
    color: 0x0c0d10,
    metalness: 0.12,
    roughness: 0.72
  }),

  // Front instrument panels
  face: new THREE.MeshStandardMaterial({
    color: 0x16181b,
    metalness: 0.12,
    roughness: 0.76
  }),

  // Tall front enclosure door
  door: new THREE.MeshStandardMaterial({
    color: 0x191b1e,
    metalness: 0.12,
    roughness: 0.78,
    side: THREE.DoubleSide
  }),

  // Protruding autosampler compartment
  drawer: new THREE.MeshStandardMaterial({
    color: 0x292b30,
    metalness: 0.18,
    roughness: 0.72
  }),

  // Deep black openings and recessed areas
  recess: new THREE.MeshStandardMaterial({
    color: 0x050608,
    metalness: 0.04,
    roughness: 0.95
  }),

  // Gray side cabinet panels
  side: new THREE.MeshStandardMaterial({
    color: 0x4a4e54,
    metalness: 0.32,
    roughness: 0.70
  }),

  // Very dark panel gaps
  seam: new THREE.MeshStandardMaterial({
    color: 0x07080a,
    metalness: 0.06,
    roughness: 0.90
  }),

  // Subtle metallic door trim
  trim: new THREE.MeshStandardMaterial({
    color: 0x777d82,
    metalness: 0.55,
    roughness: 0.48,
    side: THREE.DoubleSide
  }),

  // Stainless-steel guardrails
  rail: new THREE.MeshStandardMaterial({
    color: 0x9fa5aa,
    metalness: 0.78,
    roughness: 0.34
  }),

  // Green status LEDs
  green: new THREE.MeshStandardMaterial({
    color: 0x32b56d,
    emissive: 0x128f45,
    emissiveIntensity: 0.85
  }),

  // Unlit status indicators
  indicator: new THREE.MeshStandardMaterial({
    color: 0x656b70,
    metalness: 0.32,
    roughness: 0.62
  })
};

// ------------------------------------------------------------
// BENCH
// Preserves existing scene placement and proportions
// ------------------------------------------------------------

box(
  1.15, 0.08, 3.1,
  C.epoxy,
  BX, 1.27, BZ,
  gInst
);

[
  [-0.5, -1.5],
  [ 0.5, -1.5],
  [-0.5,  1.5],
  [ 0.5,  1.5]
].forEach(([dx, dz]) => {

  box(
    0.07, 1.23, 0.07,
    C.steel,
    BX + dx,
    0.62,
    BZ + dz,
    gInst,
    { metalness: 0.5 }
  );

});

box(
  1.05, 0.04, 3.0,
  C.steel,
  BX, 0.35, BZ,
  gInst,
  { metalness: 0.4 }
);

const icUnit = new THREE.Group();
gInst.add(icUnit);

// ------------------------------------------------------------
// GEOMETRY HELPERS
// ------------------------------------------------------------

// Rounded panel facing +X
function icRoundedPanel(
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

  mesh.rotation.y = Math.PI / 2;

  mesh.position.set(x, y, z);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  icUnit.add(mesh);

  return mesh;
}

// Cylindrical metal rail between XYZ coordinates
function icRod(
  a,
  b,
  radius = 0.008
) {

  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);

  const direction = end.clone().sub(start);
  const length = direction.length();

  if (length < 0.0001) return;

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      10
    ),
    icMat.rail
  );

  mesh.position.copy(start)
    .add(end)
    .multiplyScalar(0.5);

  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  mesh.castShadow = true;

  icUnit.add(mesh);
}

// Connected rail system with rounded joints
function icRailPath(
  points,
  radius = 0.008
) {

  for (let i = 0; i < points.length - 1; i++) {
    icRod(
      points[i],
      points[i + 1],
      radius
    );
  }

  for (const p of points) {

    const joint = new THREE.Mesh(
      new THREE.SphereGeometry(
        radius, 10, 7
      ),
      icMat.rail
    );

    joint.position.set(...p);

    icUnit.add(joint);
  }
}

// ============================================================
// LEFT UNIT
// COMPACT AUTOSAMPLER / PUMP ENCLOSURE
// ============================================================

// Main body
box(
  IC_DEPTH,
  SHORT_H - 0.10,
  SHORT_W,
  icMat.body,
  BX,
  BT + (SHORT_H - 0.10) / 2,
  SZc,
  icUnit
);

// Dark front panel
box(
  0.019,
  0.76,
  SHORT_W - 0.035,
  icMat.face,
  IFX + 0.010,
  BT + 0.48,
  SZc,
  icUnit
);

// Side cabinet panel
box(
  IC_DEPTH - 0.035,
  0.76,
  0.014,
  icMat.side,
  BX,
  BT + 0.49,
  SZc + SHORT_W / 2 + 0.006,
  icUnit
);

// ------------------------------------------------------------
// UPPER AUTOSAMPLER COVER
// ------------------------------------------------------------

box(
  IC_DEPTH + 0.012,
  0.16,
  SHORT_W + 0.008,
  icMat.top,
  BX,
  BT + SHORT_H - 0.08,
  SZc,
  icUnit
);

// Top cap edge
box(
  IC_DEPTH + 0.018,
  0.018,
  SHORT_W + 0.015,
  icMat.face,
  BX,
  BT + SHORT_H + 0.002,
  SZc,
  icUnit
);

// Separation beneath upper cover
box(
  0.025,
  0.012,
  SHORT_W - 0.02,
  icMat.seam,
  IFX + 0.017,
  BT + 0.95,
  SZc,
  icUnit
);

// ------------------------------------------------------------
// FRONT CONTROL PANEL
// ------------------------------------------------------------

box(
  0.025,
  0.255,
  SHORT_W - 0.05,
  icMat.body,
  IFX + 0.020,
  BT + 0.805,
  SZc,
  icUnit
);

const CTRL_Z =
  SZc + SHORT_W / 2 - 0.095;

// Vertical status panel
box(
  0.031,
  0.267,
  0.080,
  icMat.drawer,
  IFX + 0.035,
  BT + 0.805,
  CTRL_Z,
  icUnit
);

// Dark center of control strip
box(
  0.008,
  0.213,
  0.049,
  icMat.body,
  IFX + 0.053,
  BT + 0.805,
  CTRL_Z,
  icUnit
);

// Green operational LED
box(
  0.010,
  0.075,
  0.012,
  icMat.green,
  IFX + 0.059,
  BT + 0.856,
  CTRL_Z,
  icUnit
);

// Small secondary indicator
box(
  0.009,
  0.018,
  0.012,
  icMat.indicator,
  IFX + 0.059,
  BT + 0.748,
  CTRL_Z,
  icUnit
);

// ------------------------------------------------------------
// PROJECTING AUTOSAMPLER COMPARTMENT
// ------------------------------------------------------------

// Black inset behind drawer
box(
  0.023,
  0.33,
  SHORT_W - 0.13,
  icMat.recess,
  IFX + 0.030,
  BT + 0.49,
  SZc - 0.035,
  icUnit
);

// Projecting drawer / compartment fascia
box(
  0.075,
  0.235,
  SHORT_W - 0.16,
  icMat.drawer,
  IFX + 0.072,
  BT + 0.520,
  SZc - 0.035,
  icUnit
);

// Upper drawer lip
box(
  0.082,
  0.018,
  SHORT_W - 0.165,
  icMat.trim,
  IFX + 0.072,
  BT + 0.638,
  SZc - 0.035,
  icUnit
);

// Deep recessed opening below drawer
box(
  0.014,
  0.105,
  SHORT_W - 0.17,
  icMat.recess,
  IFX + 0.033,
  BT + 0.329,
  SZc - 0.035,
  icUnit
);

// Lower opening edge
box(
  0.033,
  0.018,
  SHORT_W - 0.17,
  icMat.seam,
  IFX + 0.041,
  BT + 0.265,
  SZc - 0.035,
  icUnit
);

// Lower front panel
box(
  0.019,
  0.218,
  SHORT_W - 0.055,
  icMat.body,
  IFX + 0.022,
  BT + 0.137,
  SZc,
  icUnit
);

// Bottom seam
box(
  0.025,
  0.009,
  SHORT_W - 0.08,
  icMat.seam,
  IFX + 0.034,
  BT + 0.055,
  SZc,
  icUnit
);

// Feet
for (const dz of [-0.32, 0.32]) {

  box(
    0.16,
    0.035,
    0.10,
    icMat.recess,
    BX,
    BT + 0.018,
    SZc + dz,
    icUnit
  );

}

// ============================================================
// TOP ELUENT TRAY AND STAINLESS GUARDRAILS
// ============================================================

const TRAY_Y = BT + SHORT_H + 0.014;

// Flat top tray
box(
  IC_DEPTH - 0.055,
  0.018,
  SHORT_W - 0.085,
  icMat.top,
  BX,
  TRAY_Y,
  SZc,
  icUnit
);

// Raised rear tray lip
box(
  0.026,
  0.046,
  SHORT_W - 0.09,
  icMat.face,
  BX - IC_DEPTH / 2 + 0.055,
  TRAY_Y + 0.014,
  SZc,
  icUnit
);

const RAIL_Y0 = TRAY_Y + 0.015;
const RAIL_Y1 = TRAY_Y + 0.215;

const RAIL_REAR =
  BX - IC_DEPTH / 2 + 0.080;

const RAIL_FRONT =
  BX + IC_DEPTH / 2 - 0.090;

const RAIL_Z1 =
  SZc - SHORT_W / 2 + 0.060;

const RAIL_Z2 =
  SZc + SHORT_W / 2 - 0.060;

// First side railing
icRailPath([
  [RAIL_REAR,  RAIL_Y0, RAIL_Z1],
  [RAIL_REAR,  RAIL_Y1, RAIL_Z1],
  [RAIL_FRONT, RAIL_Y1, RAIL_Z1],
  [RAIL_FRONT, RAIL_Y0, RAIL_Z1]
]);

// Second side railing
icRailPath([
  [RAIL_REAR,  RAIL_Y0, RAIL_Z2],
  [RAIL_REAR,  RAIL_Y1, RAIL_Z2],
  [RAIL_FRONT, RAIL_Y1, RAIL_Z2],
  [RAIL_FRONT, RAIL_Y0, RAIL_Z2]
]);

// Rear crossbar
icRailPath([
  [RAIL_REAR, RAIL_Y1, RAIL_Z1],
  [RAIL_REAR, RAIL_Y1, RAIL_Z2]
]);

// ============================================================
// RIGHT UNIT
// TALL COLUMN / SUPPRESSOR / DETECTOR ENCLOSURE
// ============================================================

// Main cabinet
box(
  IC_DEPTH,
  TOWER_H,
  TOWER_W,
  icMat.body,
  BX,
  BT + TOWER_H / 2,
  TZc,
  icUnit
);

// Right-side gray cabinet shell
box(
  IC_DEPTH - 0.025,
  TOWER_H - 0.055,
  0.015,
  icMat.side,
  BX,
  BT + TOWER_H / 2,
  TZc - TOWER_W / 2 - 0.006,
  icUnit
);

// Top cabinet surface
box(
  IC_DEPTH + 0.008,
  0.022,
  TOWER_W + 0.006,
  icMat.top,
  BX,
  TOP - 0.011,
  TZc,
  icUnit
);

// Right-side panel seam
box(
  0.009,
  TOWER_H - 0.23,
  0.008,
  icMat.seam,
  BX + 0.14,
  BT + TOWER_H / 2,
  TZc - TOWER_W / 2 - 0.019,
  icUnit
);

// Upper side service-panel detail
box(
  0.008,
  0.28,
  0.009,
  icMat.trim,
  BX - 0.22,
  TOP - 0.22,
  TZc - TOWER_W / 2 - 0.019,
  icUnit
);

// ------------------------------------------------------------
// LEFT CABINET CONTROL STRIP
// ------------------------------------------------------------

// Black vertical cabinet edge
box(
  0.022,
  TOWER_H - 0.035,
  0.086,
  icMat.top,
  IFX + 0.010,
  BT + TOWER_H / 2,
  TZc + TOWER_W / 2 - 0.055,
  icUnit
);

// Thin vertical cabinet trim
box(
  0.014,
  TOWER_H - 0.042,
  0.010,
  icMat.trim,
  IFX + 0.020,
  BT + TOWER_H / 2,
  TZc + TOWER_W / 2 - 0.098,
  icUnit
);

// ============================================================
// TALL FRONT DOOR — REFINED THIN PERIMETER
// ============================================================

const DOOR_Y = BT + TOWER_H / 2;
const DOOR_Z = TZc - 0.021;

const DOOR_W = TOWER_W - 0.165;
const DOOR_H = TOWER_H - 0.145;

// Silver perimeter
icRoundedPanel(
  IFX + 0.019,
  DOOR_Y,
  DOOR_Z,
  DOOR_W,
  DOOR_H,
  0.065,
  icMat.trim
);

// Dark front panel:
// Reduced border width from 0.020 to 0.010
icRoundedPanel(
  IFX + 0.022,
  DOOR_Y,
  DOOR_Z,
  DOOR_W - 0.010,
  DOOR_H - 0.010,
  0.059,
  icMat.door
);

// Dark door-edge separation
box(
  0.009,
  DOOR_H - 0.10,
  0.009,
  icMat.seam,
  IFX + 0.025,
  DOOR_Y,
  DOOR_Z - DOOR_W / 2 + 0.022,
  icUnit
);

// ============================================================
// RECESSED VERTICAL DOOR HANDLE
// ============================================================

const HANDLE_Z =
  DOOR_Z + DOOR_W / 2 - 0.100;

const HANDLE_Y = BT + 0.88;

// Recessed dark handle pocket
box(
  0.010,
  0.435,
  0.052,
  icMat.recess,
  IFX + 0.031,
  HANDLE_Y,
  HANDLE_Z,
  icUnit
);

// Inner grip
box(
  0.014,
  0.365,
  0.016,
  icMat.body,
  IFX + 0.039,
  HANDLE_Y,
  HANDLE_Z - 0.010,
  icUnit
);

// Narrow vertical handle highlight
box(
  0.009,
  0.315,
  0.006,
  icMat.drawer,
  IFX + 0.049,
  HANDLE_Y,
  HANDLE_Z - 0.019,
  icUnit
);

// ============================================================
// TALL ENCLOSURE INDICATORS
// ============================================================

const TOWER_CTRL_Z =
  TZc + TOWER_W / 2 - 0.047;

// Green status LED
box(
  0.013,
  0.075,
  0.012,
  icMat.green,
  IFX + 0.024,
  TOP - 0.165,
  TOWER_CTRL_Z,
  icUnit
);

// Small upper indicator
box(
  0.012,
  0.015,
  0.015,
  icMat.indicator,
  IFX + 0.024,
  TOP - 0.073,
  TOWER_CTRL_Z,
  icUnit
);

// ------------------------------------------------------------
// LOWER ENCLOSURE DETAILS
// ------------------------------------------------------------

// Lower cabinet separation
box(
  0.023,
  0.014,
  TOWER_W - 0.035,
  icMat.seam,
  IFX + 0.015,
  BT + 0.040,
  TZc,
  icUnit
);

// Cabinet feet
for (const dz of [-0.30, 0.30]) {

  box(
    0.16,
    0.035,
    0.10,
    icMat.recess,
    BX,
    BT + 0.018,
    TZc + dz,
    icUnit
  );

}

// ============================================================
// FINAL SCALING
// ============================================================

scaleAbout(
  icUnit,
  IC_SCALE,
  BX - IC_DEPTH / 2,
  BT,
  (SZc + TZc) / 2
);

// ============================================================
// END SHIMADZU NEXERA IC
// ============================================================

// under the bench: the workstation's PC tower, a waste carboy and a box of consumables
const pcZ = BZ - 0.72;
box(0.42, 0.48, 0.2, 0x2a3036, BX, 0.61, pcZ + 0.3, gInst);
led(BX + 0.215, 0.78, pcZ + 0.3, 0x63d3ff, gInst);
// lower shelf: waste carboy + consumables
cyl(0.16, 0.16, 0.42, 0xf2f4f5, BX, 0.58, SZc, gInst, 18);
cyl(0.05, 0.05, 0.06, 0xd23c3c, BX, 0.82, SZc, gInst, 12);
box(0.4, 0.22, 0.32, 0xd8c7a6, BX, 0.48, BZ - 0.9, gInst);
hotspots.find(h => h.key === "ic").focusObj = icUnit;
