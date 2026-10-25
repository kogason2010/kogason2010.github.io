/* instruments/lab-toc/model.js — TOC analyzer on the island bench, with its autosampler and carrier-gas cylinder.
   Revised from photos of a TOC-L and its ASI-L autosampler. Front faces +z.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     ITOP, TX, TZ (js/core/lights.js)
     rotor (js/lab/merge.js, js/main.js) */
"use strict";

// the island bench this sits on (js/lab/island.js builds the bench at the same place)
const IX = 1.4, IZ = 1.3, ITOP = 1.26;

const gTOC = hotGroup("toc", "TOC analyzer", new THREE.Vector3(IX + 0.6, 2.8, IZ));
// TOC analyzer on the right, carousel autosampler on its left
const TX = IX + 0.95, TZ = IZ - 0.05, TW = 0.62, TH = 0.95, TD = 0.82, TF = TZ + TD / 2;
// Photo-reference TOC-L analyzer and ASI-L autosampler. Front faces +Z.
const tocMat = {
  shell: mat(0xdce0e2,{roughness:0.56,metalness:0.06}),
  side: mat(0xb7bcbf,{roughness:0.62,metalness:0.08}),
  fascia: mat(0x3c4347,{roughness:0.49,metalness:0.08}),
  lower: mat(0x30373c,{roughness:0.57,metalness:0.06}),
  top: mat(0x41474a,{roughness:0.64,metalness:0.07}),
  seam: mat(0x1c2327,{roughness:0.76,metalness:0.03}),
  edge: mat(0x737e84,{roughness:0.50,metalness:0.22}),
  metal: mat(0xb8c1c6,{roughness:0.32,metalness:0.55}),
  key: mat(0x364146,{roughness:0.52,metalness:0.09}),
  green: mat(0x468375,{roughness:0.55}),
  red: mat(0xa16278,{roughness:0.55})
};
Object.values(tocMat).forEach(m=>m.color.convertSRGBToLinear());
const tocHoodMat = new THREE.MeshStandardMaterial({
  color:new THREE.Color(0x35434f).convertSRGBToLinear(),
  transparent:true,opacity:0.48,roughness:0.22,metalness:0.09,
  side:THREE.DoubleSide,depthWrite:false
});
const tocVialMat = new THREE.MeshStandardMaterial({
  color:0xbac6cc,transparent:true,opacity:0.25,roughness:0.18,depthWrite:false
});
const tocBlueMat = new THREE.MeshBasicMaterial({color:0x0088c4});
tocBlueMat.color.convertSRGBToLinear();

function tocRoundedShape(w,h,r) {
  const s=new THREE.Shape(),l=-w/2,b=-h/2,t=h/2,q=w/2;
  s.moveTo(l+r,b);s.lineTo(q-r,b);s.quadraticCurveTo(q,b,q,b+r);
  s.lineTo(q,t-r);s.quadraticCurveTo(q,t,q-r,t);
  s.lineTo(l+r,t);s.quadraticCurveTo(l,t,l,t-r);
  s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);s.closePath();return s;
}
function tocSolid(shape,depth,material,parent,x,y,z,bevel=0.001) {
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
    depth,steps:1,curveSegments:16,bevelEnabled:bevel>0,
    bevelSize:bevel,bevelThickness:bevel,bevelSegments:3
  }),material);
  mesh.position.set(x,y,z-depth);mesh.castShadow=true;mesh.receiveShadow=true;
  parent.add(mesh);return mesh;
}
function tocPanel(w,h,r,d,material,parent,x,y,z) {
  return tocSolid(tocRoundedShape(w,h,r),d,material,parent,x,y,z);
}
function tocCurve(points,r,material,parent=gTOC) {
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),40,r,8,false),material);
  mesh.castShadow=true;parent.add(mesh);return mesh;
}
function tocDecal(w,h,texture,parent,x,y,z) {
  return plane(w,h,new THREE.MeshBasicMaterial({map:texture,transparent:true}),x,y,z,0,parent);
}
function tocTextTexture(text,color="#d6dfe2",size=32) {
  return tex((g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle=color;
    g.font="500 "+size+"px Arial";g.textAlign="center";g.textBaseline="middle";
    g.fillText(text,W/2,H/2);},256,64);
}

// Sculpted white chassis: the upper front slopes back toward the recessed lid.
const tocProfile=new THREE.Shape();
tocProfile.moveTo(-TD/2+0.014,0.020);
tocProfile.lineTo(TD/2-0.022,0.020);
tocProfile.quadraticCurveTo(TD/2,0.020,TD/2,0.055);
tocProfile.lineTo(TD/2,0.40);
tocProfile.lineTo(TD/2-0.063,TH-0.060);
tocProfile.quadraticCurveTo(TD/2-0.073,TH-0.044,TD/2-0.100,TH-0.044);
tocProfile.lineTo(-TD/2+0.016,TH-0.044);
tocProfile.closePath();
const tocBodyGeo=new THREE.ExtrudeGeometry(tocProfile,{
  depth:TW-0.036,steps:1,bevelEnabled:true,bevelSize:0.016,
  bevelThickness:0.016,bevelSegments:5,curveSegments:20
});
tocBodyGeo.translate(0,0,-(TW-0.036)/2);
const tocBody=new THREE.Mesh(tocBodyGeo,tocMat.shell);
tocBody.rotation.y=-Math.PI/2;tocBody.position.set(TX,ITOP,TZ);
tocBody.castShadow=true;tocBody.receiveShadow=true;gTOC.add(tocBody);

// Upper dark fascia, wide at the top and rounded inward at the waist.
const tocFace=new THREE.Group();
tocFace.position.set(TX,ITOP+0.406,TF+0.011);
tocFace.rotation.x=-Math.atan2(0.063,0.49);gTOC.add(tocFace);
const tocUpperShape=new THREE.Shape();
tocUpperShape.moveTo(-0.238,0.490);tocUpperShape.lineTo(0.238,0.490);
tocUpperShape.lineTo(0.181,0.054);
tocUpperShape.quadraticCurveTo(0.174,0.004,0.122,0);
tocUpperShape.quadraticCurveTo(0,-0.017,-0.122,0);
tocUpperShape.quadraticCurveTo(-0.174,0.004,-0.181,0.054);
tocUpperShape.closePath();
tocSolid(tocUpperShape,0.010,tocMat.fascia,tocFace,0,0,0.008);

// Manufacturer header, display, and the characteristic blue separator at the waist.
const tocHeader=tex((g,W,H)=>{
  g.clearRect(0,0,W,H);g.fillStyle="#e1e6e7";g.font="bold 30px Arial";
  g.fillText("TOC-L",6,34);g.font="14px Arial";g.fillStyle="#abb9bf";
  g.fillText("SHIMADZU",116,24);g.fillStyle="#3e7d84";g.fillRect(116,31,180,2);
},512,64);
tocDecal(0.375,0.047,tocHeader,tocFace,-0.021,0.466,0.012);
tocPanel(0.368,0.218,0.006,0.004,tocMat.seam,tocFace,0,0.325,0.014);
const tocScreen=tex((g,W,H)=>{
  const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#14242d");bg.addColorStop(1,"#0c151e");
  g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.save();g.translate(W*0.49,H*0.24);g.scale(1,0.43);
  for(let i=0;i<18;i++){
    g.strokeStyle="rgba("+(42+i*3)+","+(136+i*4)+",204,"+(0.16+i*0.025)+")";
    g.lineWidth=2;g.beginPath();g.arc(0,0,19+i*13,Math.PI*0.04,Math.PI*1.88);g.stroke();
  }g.restore();
  g.fillStyle="#d6e8ee";g.font="18px Arial";g.textAlign="right";
  g.fillText("TOC-L",W-18,H-69);g.font="11px Arial";g.fillStyle="#7ea0b2";
  g.fillText("TOTAL ORGANIC CARBON ANALYZER",W-18,H-49);
  g.fillStyle="#20313d";g.fillRect(0,H-30,W,30);
  g.textAlign="left";g.fillStyle="#97b4c0";g.font="12px Arial";
  g.fillText("Ready",15,H-11);g.textAlign="right";g.fillText("System normal",W-15,H-11);
},640,360);
tocDecal(0.342,0.192,tocScreen,tocFace,0,0.325,0.018);
tocCurve([[-0.109,0.002,0.014],[0,-0.008,0.014],[0.109,0.002,0.014]],0.0025,tocBlueMat,tocFace);

// Physical keypad: five function keys, numeric keys and a navigation cluster.
const tocLabelCache={};
function tocButton(x,y,label,r=0.012,material=tocMat.key) {
  const key=cyl(r,r,0.004,material,x,y,0.016,tocFace,20);key.rotation.x=Math.PI/2;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r+0.0007,0.0008,5,20),tocMat.edge);
  ring.position.set(x,y,0.019);tocFace.add(ring);
  if(label){
    if(!tocLabelCache[label])tocLabelCache[label]=tex((g,W,H)=>{
      g.clearRect(0,0,W,H);g.fillStyle="#c3cfd3";
      g.font=(label.length>1?"25":"34")+"px Arial";
      g.textAlign="center";g.textBaseline="middle";g.fillText(label,W/2,H/2);
    },64,64);
    tocDecal(r*1.45,r*1.45,tocLabelCache[label],tocFace,x,y,0.0205);
  }
}
for(let i=0;i<5;i++){
  const x=-0.145+i*0.072;
  tocPanel(0.061,0.022,0.006,0.004,tocMat.key,tocFace,x,0.199,0.017);
  tocDecal(0.046,0.010,tocTextTexture(["MENU","ENTER","BACK","START","STOP"][i],"#d6dfe2",44),tocFace,x,0.199,0.019);
}
const tocKeys=[["7","8","9"],["4","5","6"],["1","2","3"],[".","0","−"]];
tocKeys.forEach((row,j)=>row.forEach((label,i)=>tocButton(-0.139+i*0.048,0.160-j*0.038,label)));
for(const [dx,dy,label] of [[0,0,"OK"],[-0.036,0,"‹"],[0.036,0,"›"],[0,0.036,"▲"],[0,-0.036,"▼"]]){
  tocButton(0.105+dx,0.115+dy,label,0.011);
}
tocButton(-0.141,0.014,"",0.010,tocMat.green);
tocButton(-0.103,0.014,"",0.008,tocMat.red);
tocButton(0.106,0.029,"?",0.009);

// Lower furnace-access door has a broad, rounded trapezoid outline.
const tocLowerShape=new THREE.Shape();
tocLowerShape.moveTo(-0.222,0.029);tocLowerShape.lineTo(0.222,0.029);
tocLowerShape.lineTo(0.169,0.285);
tocLowerShape.quadraticCurveTo(0.162,0.324,0.122,0.330);
tocLowerShape.quadraticCurveTo(0,0.345,-0.122,0.330);
tocLowerShape.quadraticCurveTo(-0.162,0.324,-0.169,0.285);
tocLowerShape.closePath();
tocSolid(tocLowerShape,0.012,tocMat.lower,gTOC,TX,ITOP,TF+0.027);
tocCurve([[TX-0.065,ITOP+0.332,TF+0.031],[TX,ITOP+0.338,TF+0.031],
  [TX+0.065,ITOP+0.332,TF+0.031]],0.0024,tocBlueMat);
box(0.024,0.009,0.004,tocMat.seam,TX,ITOP+0.302,TF+0.036,gTOC);
box(0.012,0.003,0.004,tocMat.edge,TX,ITOP+0.294,TF+0.037,gTOC);
tocDecal(0.032,0.032,tex((g,W,H)=>{
  g.fillStyle="#7f9b9c";g.fillRect(0,0,W,H);g.fillStyle="#d7e4df";
  g.font="bold 24px Arial";g.fillText("eco",5,37);
},64,64),gTOC,TX-0.172,ITOP+0.074,TF+0.040);

// Dark recessed lid, two circular rear ports and narrow raised side rails.
box(TW-0.097,0.014,TD-0.126,tocMat.top,TX,ITOP+TH-0.028,TZ-0.018,gTOC);
for(const x of [TX-TW/2+0.033,TX+TW/2-0.033]){
  box(0.018,0.023,TD-0.105,tocMat.shell,x,ITOP+TH-0.009,TZ-0.017,gTOC);
}
for(const x of [TX-0.103,TX+0.103]){
  cyl(0.055,0.055,0.003,tocMat.seam,x,ITOP+TH-0.018,TZ-0.232,gTOC,40);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.055,0.0015,6,40),tocMat.edge);
  rim.rotation.x=Math.PI/2;rim.position.set(x,ITOP+TH-0.016,TZ-0.232);gTOC.add(rim);
}
box(TW-0.111,0.002,0.004,tocMat.seam,TX,ITOP+TH-0.020,TZ+0.110,gTOC);
// Discreet hinges and the service door on the right side.
for(const y of [ITOP+0.20,ITOP+0.75]){
  box(0.004,0.080,0.009,tocMat.edge,TX+TW/2+0.002,y,TZ+0.12,gTOC);
}
box(0.003,TH-0.10,0.002,tocMat.edge,TX+TW/2+0.003,ITOP+TH/2,TZ+0.22,gTOC);
box(0.005,0.026,0.016,tocMat.seam,TX+TW/2+0.006,ITOP+TH-0.080,TZ-0.27,gTOC);
for(const x of [TX-0.22,TX+0.22])for(const z of [TZ-0.31,TZ+0.30]){
  box(0.07,0.018,0.08,tocMat.seam,x,ITOP+0.009,z,gTOC);
}

// ASI-L: a broad low drum with a square back and a smoked carousel enclosure.
const ASX=TX-TW/2-0.125-0.323, ASZ=IZ+0.160;
const ASR=0.323;
cyl(ASR,ASR,0.164,tocMat.shell,ASX,ITOP+0.091,ASZ+0.027,gTOC,80);
box(ASR*2,0.164,0.326,tocMat.shell,ASX,ITOP+0.091,ASZ-0.135,gTOC);
cyl(ASR+0.001,ASR+0.001,0.016,tocMat.edge,ASX,ITOP+0.177,ASZ+0.027,gTOC,80);
cyl(ASR,ASR,0.040,tocMat.lower,ASX,ITOP+0.202,ASZ+0.027,gTOC,80);
const rotor=new THREE.Group();rotor.position.set(ASX,ITOP+0.212,ASZ+0.027);gTOC.add(rotor);
cyl(0.307,0.307,0.014,tocMat.metal,0,0.007,0,rotor,72);
cyl(0.307,0.307,0.012,tocMat.metal,0,0.078,0,rotor,72);
for(const [r,n] of [[0.265,24],[0.204,18],[0.137,12],[0.068,6]]){
  for(let i=0;i<n;i++){
    const a=i*2*Math.PI/n, x=Math.cos(a)*r, z=Math.sin(a)*r;
    cyl(0.018,0.018,0.003,tocMat.seam,x,0.017,z,rotor,16);
    cyl(0.014,0.014,0.002,tocMat.seam,x,0.085,z,rotor,16);
    cyl(0.0135,0.0135,0.066,tocVialMat,x,0.049,z,rotor,12).castShadow=false;
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.0148,0.002,5,16),tocMat.edge);
    rim.rotation.x=Math.PI/2;rim.position.set(x,0.087,z);rotor.add(rim);
  }
}
cyl(0.035,0.035,0.025,tocMat.top,0,0.026,0,rotor,24);
// Open-ended transparent wall keeps the sample tray visible from above.
const tocHood=new THREE.Mesh(new THREE.CylinderGeometry(ASR+0.003,ASR+0.003,0.145,80,1,true),tocHoodMat);
tocHood.position.set(ASX,ITOP+0.293,ASZ+0.027);gTOC.add(tocHood);
for(const y of [ITOP+0.224,ITOP+0.365]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(ASR+0.003,0.004,8,80),tocMat.edge);
  ring.rotation.x=Math.PI/2;ring.position.set(ASX,y,ASZ+0.027);gTOC.add(ring);
}
const tocClearLid=new THREE.Mesh(new THREE.CircleGeometry(ASR,80),tocHoodMat.clone());
tocClearLid.material.opacity=0.13;tocClearLid.rotation.x=-Math.PI/2;
tocClearLid.position.set(ASX,ITOP+0.368,ASZ+0.027);gTOC.add(tocClearLid);

// Rear white deck and its diagonal needle-access slot.
const tocDeckShape=new THREE.Shape();
tocDeckShape.moveTo(-ASR,0.300);tocDeckShape.lineTo(ASR,0.300);
tocDeckShape.lineTo(ASR,-0.004);tocDeckShape.quadraticCurveTo(0.27,-0.080,0.10,-0.089);
tocDeckShape.lineTo(-0.15,-0.089);tocDeckShape.quadraticCurveTo(-0.30,-0.060,-ASR,0.010);
tocDeckShape.closePath();
const tocDeck=new THREE.Mesh(new THREE.ExtrudeGeometry(tocDeckShape,{
  depth:0.011,bevelEnabled:true,bevelSize:0.003,bevelThickness:0.002,bevelSegments:2,curveSegments:20
}),tocMat.shell);
tocDeck.rotation.x=-Math.PI/2;tocDeck.position.set(ASX,ITOP+0.370,ASZ);tocDeck.castShadow=true;gTOC.add(tocDeck);
const tocSlot=box(0.29,0.003,0.017,tocMat.seam,ASX-0.065,ITOP+0.386,ASZ-0.010,gTOC);
tocSlot.rotation.y=-0.22;
for(const x of [ASX-0.100,ASX+0.017]){
  const pull=box(0.080,0.004,0.005,tocMat.metal,x,ITOP+0.386,ASZ+0.062,gTOC);pull.rotation.y=-0.40;
}
tocPanel(0.024,0.035,0.004,0.018,tocMat.lower,gTOC,ASX,ITOP+0.374,ASZ+ASR+0.034);

// Tall, rounded rectangular sampling mast at the rear right of the carousel.
const tocMastX=ASX+0.075, tocMastZ=ASZ-0.177;
const tocMastShape=new THREE.Shape();
tocMastShape.moveTo(-0.132,0.377);tocMastShape.lineTo(0.132,0.377);
tocMastShape.lineTo(0.132,0.940);tocMastShape.quadraticCurveTo(0.115,0.957,0.060,0.954);
tocMastShape.lineTo(0.008,0.951);tocMastShape.quadraticCurveTo(-0.006,0.933,-0.024,0.931);
tocMastShape.lineTo(-0.095,0.936);tocMastShape.quadraticCurveTo(-0.132,0.936,-0.132,0.919);
tocMastShape.closePath();
tocSolid(tocMastShape,0.247,tocMat.shell,gTOC,tocMastX,ITOP,tocMastZ+0.106,0.007);
tocPanel(0.119,0.472,0.010,0.008,tocMat.seam,gTOC,
  tocMastX+0.054,ITOP+0.652,tocMastZ+0.121);
// Subtle mechanism behind the dark front window.
for(const dx of [-0.024,0.024]){
  cyl(0.002,0.002,0.362,tocMat.metal,tocMastX+0.054+dx,
    ITOP+0.640,tocMastZ+0.128,gTOC,8);
}
box(0.059,0.047,0.012,tocMat.edge,tocMastX+0.054,ITOP+0.704,tocMastZ+0.130,gTOC);
cyl(0.0025,0.0025,0.290,tocMat.metal,tocMastX+0.054,ITOP+0.538,tocMastZ+0.135,gTOC,8);
tocPanel(0.109,0.452,0.008,0.003,tocHoodMat,gTOC,
  tocMastX+0.054,ITOP+0.652,tocMastZ+0.144);
tocDecal(0.075,0.021,tocTextTexture("ASI-L"),gTOC,
  tocMastX+0.054,ITOP+0.862,tocMastZ+0.149);
// Connection fittings and a pale sampling tube between the two modules.
for(const y of [ITOP+0.16,ITOP+0.235]){
  const fitting=cyl(0.011,0.011,0.016,tocMat.seam,ASX+ASR+0.007,y,ASZ-0.15,gTOC,16);
  fitting.rotation.z=Math.PI/2;
}
tocCurve([[ASX+0.329,ITOP+0.235,ASZ-0.15],
  [ASX+0.355,ITOP+0.170,ASZ-0.20],
  [TX-TW/2-0.022,ITOP+0.125,TZ-0.23],
  [TX-TW/2-0.013,ITOP+0.420,TZ-0.24]],0.003,tocMat.metal);

// carrier gas cylinder by the island
const GX = IX + 1.35 + 0.18, GZ = IZ - 0.25;
cyl(0.16, 0.16, 1.5, 0x5f7f9a, GX, 0.75, GZ, null, 20, { metalness: 0.3, roughness: 0.4 });
cyl(0.1, 0.16, 0.18, 0x5f7f9a, GX, 1.59, GZ, null, 20, { metalness: 0.3 });
cyl(0.04, 0.04, 0.16, C.steel, GX, 1.76, GZ, null, 10, { metalness: 0.7 });
box(0.12, 0.1, 0.08, C.steel, GX, 1.84, GZ + 0.03, null, { metalness: 0.7 });
[0.06, -0.06].forEach(dz => cyl(0.03, 0.03, 0.02, 0xdde3e6, GX, 1.86, GZ + 0.07 + dz * 0, null, 12).rotation.x = Math.PI / 2);
cyl(0.165, 0.165, 0.05, 0x1f9a4f, GX, 1.3, GZ, null, 20);
[0.55, 1.05].forEach(y => {
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.012, 6, 28), mat(0x2a2f33)); strap.rotation.x = Math.PI / 2; strap.position.set(GX, y, GZ); lab.add(strap);
  box(0.06, 0.05, 0.08, C.steel, GX - 0.17, y, GZ, null, { metalness: 0.6 });
});
const gasLine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(GX, 1.88, GZ + 0.06), new THREE.Vector3(GX - 0.05, 2.0, GZ + 0.05), new THREE.Vector3(TX + 0.2, 2.0, TZ - 0.38), new THREE.Vector3(TX + 0.2, 1.9, TZ - 0.42)
]), 30, 0.008, 6, false), mat(C.steel, { metalness: 0.7, roughness: 0.3 })); lab.add(gasLine);
