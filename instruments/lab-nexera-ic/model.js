/* instruments/lab-nexera-ic/model.js — Nexera IC (ion chromatograph) on the left-wall bench.
   Revised from product photos: the compact autosampler unit with its drawer and rail basket, and the tall column /
   suppressor tower with its narrow door. Faces +x; +z is the viewer's left. The bench is part of the group.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     BX, BT, pcZ (js/core/background.js)
     icUnit (js/lab/merge.js) */
"use strict";

const gInst = hotGroup("ic", "Nexera IC", new THREE.Vector3(-3.4, 3.35, 2.15));
const BX = -3.55, BZ = 1.75, BT = 1.31;
const IC_DEPTH = 0.92, SHORT_W = 0.84, TOWER_W = 0.79;
const SHORT_H = 1.18, TOWER_H = 1.72, IC_SCALE = 0.58;
const TZc = BZ + 0.01;
const SZc = TZc + TOWER_W / 2 + 0.025 + SHORT_W / 2;
const IFX = BX + IC_DEPTH / 2, TOP = BT + TOWER_H;

const icMat = {
  body: mat(0x25292b, { roughness: 0.57, metalness: 0.12 }),
  face: mat(0x34383b, { roughness: 0.48, metalness: 0.16 }),
  top: mat(0x2c2f31, { roughness: 0.51, metalness: 0.13 }),
  door: mat(0x35383a, { roughness: 0.48, metalness: 0.12 }),
  drawer: mat(0x42464a, { roughness: 0.56, metalness: 0.09 }),
  side: mat(0x96999a, { roughness: 0.63, metalness: 0.18 }),
  edge: mat(0x424749, { roughness: 0.56, metalness: 0.2 }),
  recess: mat(0x030405, { roughness: 0.94, metalness: 0.01 }),
  seam: mat(0x080a0b, { roughness: 0.8, metalness: 0.02 }),
  trim: mat(0xc8cacc, { roughness: 0.42, metalness: 0.35 }),
  rail: mat(0xb5bdc2, { roughness: 0.27, metalness: 0.78 }),
  green: new THREE.MeshStandardMaterial({
    color: 0x398944, emissive: 0x16662b, emissiveIntensity: 0.48,
    roughness: 0.55, metalness: 0.05
  })
};
// This viewer expects linear material colors; keep these swatches in sRGB.
Object.values(icMat).forEach(material => material.color.convertSRGBToLinear());

// The existing lab bench and instrument position.
box(1.15, 0.08, 3.1, C.epoxy, BX, 1.27, BZ, gInst);
for (const [dx, dz] of [[-0.5,-1.5],[0.5,-1.5],[-0.5,1.5],[0.5,1.5]]) {
  box(0.07, 1.23, 0.07, C.steel, BX+dx, 0.62, BZ+dz, gInst, { metalness: 0.5 });
}
box(1.05, 0.04, 3.0, C.steel, BX, 0.35, BZ, gInst, { metalness: 0.4 });
const icUnit = new THREE.Group();
gInst.add(icUnit);

// A rounded front panel with actual thickness and softened edges.
function icShape(w, h, r, rightRadius = r) {
  const s = new THREE.Shape(), l=-w/2, b=-h/2, t=h/2, q=w/2;
  s.moveTo(l+r,b); s.lineTo(q-rightRadius,b);
  s.quadraticCurveTo(q,b,q,b+rightRadius);
  s.lineTo(q,t-rightRadius); s.quadraticCurveTo(q,t,q-rightRadius,t);
  s.lineTo(l+r,t); s.quadraticCurveTo(l,t,l,t-r);
  s.lineTo(l,b+r); s.quadraticCurveTo(l,b,l+r,b); s.closePath();
  return s;
}
function icPanel(w,h,r,depth,x,y,z,material,bevel=0.002,rightRadius=r) {
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(icShape(w,h,r,rightRadius), {
    depth, steps:1, curveSegments:12, bevelEnabled:bevel>0,
    bevelThickness:bevel, bevelSize:bevel, bevelSegments:3
  }), material);
  mesh.rotation.y = Math.PI/2;
  mesh.position.set(x-depth,y,z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  icUnit.add(mesh); return mesh;
}
function icFront(d,h,w,material,y,z,x=IFX+0.025) {
  return box(d,h,w,material,x,y,z,icUnit);
}

// Shallow convex fronts catch the light like the molded instrument fascia.
function icCurvedFace(w,h,bulge,x,y,z,material) {
  const p=[], indices=[], segments=32;
  for (let row=0; row<2; row++) {
    for (let i=0; i<=segments; i++) {
      const u=i/segments, v=2*u-1;
      p.push(x+bulge*(1-v*v), y+(row-0.5)*h, z+w/2-u*w);
    }
  }
  for (let i=0; i<segments; i++) {
    const a=i,b=i+1,c=i+segments+1,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));
  g.setIndex(indices); g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,material);
  mesh.castShadow=true; mesh.receiveShadow=true; icUnit.add(mesh);
}
function icRing(x,y,z,r) {
  const mesh=new THREE.Mesh(new THREE.RingGeometry(r*0.76,r,24),icMat.trim);
  mesh.rotation.y=Math.PI/2; mesh.position.set(x,y,z); icUnit.add(mesh);
}
function icRail(points,r=0.005) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,"centripetal");
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,48,r,8,false),icMat.rail);
  mesh.castShadow=true; icUnit.add(mesh);
}

// SHORT UNIT: silver side housing, dark curved front and a black lower base.
box(IC_DEPTH-0.055,SHORT_H-0.035,SHORT_W-0.012,icMat.side,
  BX-0.019,BT+SHORT_H/2,SZc,icUnit);
icPanel(SHORT_W,0.98,0.009,0.025,IFX+0.009,BT+0.51,SZc,icMat.body);
icCurvedFace(SHORT_W-0.016,0.355,0.019,IFX+0.018,BT+0.786,SZc,icMat.face);
icCurvedFace(SHORT_W-0.016,0.216,0.019,IFX+0.018,BT+0.131,SZc,icMat.face);
// Right upright alongside the drawer and its opening.
icCurvedFace(0.215,0.42,0.004,IFX+0.023,BT+0.447,SZc-SHORT_W/2+0.112,icMat.face);

// Broad top cover and the small seam beneath it.
icPanel(SHORT_W+0.006,0.210,0.012,IC_DEPTH,IFX+0.028,
  BT+SHORT_H-0.105,SZc,icMat.top,0.003);
icFront(0.012,0.012,SHORT_W-0.006,icMat.seam,BT+SHORT_H-0.217,SZc,IFX+0.022);
box(IC_DEPTH-0.09,0.012,SHORT_W-0.075,icMat.recess,
  BX, BT+SHORT_H+0.006, SZc, icUnit);

// Vertical control strip at the upper left; small green LED and power ring.
const IC_CTRL_Z=SZc+SHORT_W/2-0.042;
icPanel(0.063,0.330,0.004,0.009,IFX+0.047,BT+0.786,IC_CTRL_Z,icMat.edge,0.001);
icPanel(0.050,0.317,0.003,0.004,IFX+0.052,BT+0.786,IC_CTRL_Z,icMat.face,0.001);
icFront(0.005,0.069,0.009,icMat.green,BT+0.816,IC_CTRL_Z,IFX+0.057);
icFront(0.005,0.012,0.009,icMat.edge,BT+0.876,IC_CTRL_Z,IFX+0.057);
icRing(IFX+0.061,BT+0.708,IC_CTRL_Z,0.010);
icFront(0.003,0.005,0.022,icMat.trim,BT+0.674,IC_CTRL_Z,IFX+0.058);

// The projecting charcoal drawer sits above a deep, shadowed opening.
const IC_DRAWER_W=0.584, IC_DRAWER_Z=SZc+0.118;
icFront(0.012,0.195,IC_DRAWER_W+0.014,icMat.recess,
  BT+0.323,IC_DRAWER_Z,IFX+0.027);
icFront(0.125,0.012,IC_DRAWER_W+0.006,icMat.edge,
  BT+0.236,IC_DRAWER_Z,IFX+0.014);
icFront(0.093,0.009,IC_DRAWER_W-0.012,icMat.seam,
  BT+0.263,IC_DRAWER_Z,IFX+0.018);
icPanel(IC_DRAWER_W+0.012,0.241,0.005,0.100,IFX+0.105,
  BT+0.483,IC_DRAWER_Z,icMat.seam,0.001);
icPanel(IC_DRAWER_W,0.209,0.004,0.013,IFX+0.116,
  BT+0.492,IC_DRAWER_Z,icMat.drawer,0.002);
icFront(0.006,0.012,IC_DRAWER_W-0.008,icMat.body,
  BT+0.379,IC_DRAWER_Z,IFX+0.117);

// A slim rail basket above the top cover, with rounded bends and four posts.
const IC_RAIL_Y=BT+SHORT_H+0.176, IC_RAIL_BASE=BT+SHORT_H+0.012;
const IC_RAIL_X0=BX-IC_DEPTH/2+0.060, IC_RAIL_X1=IFX-0.055;
const IC_RAIL_Z0=SZc-SHORT_W/2+0.037, IC_RAIL_Z1=SZc+SHORT_W/2-0.037;
for (const z of [IC_RAIL_Z0,IC_RAIL_Z1]) {
  icRail([
    [IC_RAIL_X0,IC_RAIL_BASE,z], [IC_RAIL_X0,IC_RAIL_Y-0.026,z],
    [IC_RAIL_X0+0.008,IC_RAIL_Y-0.007,z], [IC_RAIL_X0+0.027,IC_RAIL_Y,z],
    [IC_RAIL_X1-0.027,IC_RAIL_Y,z], [IC_RAIL_X1-0.008,IC_RAIL_Y-0.007,z],
    [IC_RAIL_X1,IC_RAIL_Y-0.026,z], [IC_RAIL_X1,IC_RAIL_BASE,z]
  ]);
}
for (const x of [IC_RAIL_X0,IC_RAIL_X1]) {
  icRail([[x,IC_RAIL_Y-0.020,IC_RAIL_Z0],[x,IC_RAIL_Y-0.020,IC_RAIL_Z1]],0.0045);
}

// TALL UNIT: silver service cabinet behind the black front fascia.
box(IC_DEPTH-0.045,TOWER_H-0.022,TOWER_W-0.014,icMat.side,
  BX-0.020,BT+TOWER_H/2,TZc,icUnit);
icPanel(TOWER_W,TOWER_H-0.014,0.008,0.030,IFX+0.014,
  BT+TOWER_H/2,TZc,icMat.body,0.002);
icCurvedFace(TOWER_W-0.064,TOWER_H-0.041,0.012,IFX+0.019,
  BT+TOWER_H/2,TZc-0.020,icMat.face);

// Gray left edge with one indicator, upper screw and fine vertical seam.
const IC_TOWER_CTRL=TZc+TOWER_W/2-0.023;
icFront(0.012,TOWER_H-0.018,0.030,icMat.edge,
  BT+TOWER_H/2,IC_TOWER_CTRL,IFX+0.030);
icFront(0.007,TOWER_H-0.020,0.008,icMat.seam,
  BT+TOWER_H/2,IC_TOWER_CTRL-0.023,IFX+0.038);
icFront(0.005,0.060,0.009,icMat.green,TOP-0.134,IC_TOWER_CTRL,IFX+0.039);
icRing(IFX+0.040,TOP-0.049,IC_TOWER_CTRL,0.006);

// Narrow door on the right half. The silver border rounds only the left corners.
const IC_DOOR_W=0.352, IC_DOOR_H=TOWER_H-0.104;
const IC_DOOR_Z=TZc-TOWER_W/2+IC_DOOR_W/2+0.002;
const IC_DOOR_Y=BT+TOWER_H/2;
icPanel(IC_DOOR_W,IC_DOOR_H,0.047,0.010,IFX+0.046,
  IC_DOOR_Y,IC_DOOR_Z,icMat.trim,0.001,0.002);
icPanel(IC_DOOR_W-0.008,IC_DOOR_H-0.016,0.039,0.012,IFX+0.050,
  IC_DOOR_Y,IC_DOOR_Z-0.004,icMat.door,0.002,0.002);

// Recessed vertical pull just inside the silver edge.
const IC_HANDLE_Z=IC_DOOR_Z+IC_DOOR_W/2-0.033;
icPanel(0.039,0.505,0.003,0.004,IFX+0.055,
  BT+0.855,IC_HANDLE_Z,icMat.recess,0.001);
icFront(0.019,0.472,0.013,icMat.body,
  BT+0.855,IC_HANDLE_Z-0.012,IFX+0.061);
icFront(0.005,0.451,0.003,icMat.edge,
  BT+0.855,IC_HANDLE_Z-0.020,IFX+0.072);

// Ventilation on the inner silver side, and the outer side's service-panel seam.
for (let row=0;row<16;row++) {
  box(0.32,0.006,0.004,icMat.edge,BX-0.185,TOP-0.075-row*0.018,
    TZc+TOWER_W/2-0.003,icUnit);
}
const IC_SIDE_Z=TZc-TOWER_W/2+0.001;
for (const x of [BX-0.335,BX+0.260]) {
  box(0.003,0.334,0.003,icMat.edge,x,BT+0.255,IC_SIDE_Z,icUnit);
}
for (const y of [BT+0.088,BT+0.422]) {
  box(0.598,0.003,0.003,icMat.edge,BX-0.0375,y,IC_SIDE_Z,icUnit);
}
box(0.010,0.187,0.004,icMat.edge,BX+0.252,TOP-0.235,IC_SIDE_Z,icUnit);
box(IC_DEPTH-0.012,0.010,TOWER_W-0.008,icMat.side,
  BX-0.012,TOP-0.016,TZc,icUnit);

// Low plinths and feet.
icFront(0.024,0.023,TOWER_W-0.025,icMat.seam,BT+0.021,TZc,IFX+0.021);
for (const [z,w] of [[SZc,SHORT_W],[TZc,TOWER_W]]) {
  for (const side of [-1,1]) {
    box(0.14,0.027,0.095,icMat.seam,BX+0.25,BT+0.0135,z+side*(w/2-0.074),icUnit);
    box(0.035,0.012,0.047,icMat.edge,IFX+0.022,BT+0.015,z+side*(w/2-0.074),icUnit);
  }
}

scaleAbout(icUnit,IC_SCALE,BX-IC_DEPTH/2,BT,(SZc+TZc)/2);

// under the bench: the workstation's PC tower, a waste carboy and a box of consumables
const pcZ = BZ - 0.72;
box(0.42, 0.48, 0.2, 0x2a3036, BX, 0.61, pcZ + 0.3, gInst);
led(BX + 0.215, 0.78, pcZ + 0.3, 0x63d3ff, gInst);
// lower shelf: waste carboy + consumables
cyl(0.16, 0.16, 0.42, 0xf2f4f5, BX, 0.58, SZc, gInst, 18);
cyl(0.05, 0.05, 0.06, 0xd23c3c, BX, 0.82, SZc, gInst, 12);
box(0.4, 0.22, 0.32, 0xd8c7a6, BX, 0.48, BZ - 0.9, gInst);
hotspots.find(h => h.key === "ic").focusObj = icUnit;
