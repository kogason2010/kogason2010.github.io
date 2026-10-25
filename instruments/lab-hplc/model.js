/* instruments/lab-hplc/model.js — HPLC (Shimadzu Nexera) on the back bench.
   Revised from photos of a Nexera: SIL-40C autosampler, LC-40D pump, SPD-M40 detector, DGU-405 degasser, SCL-40
   controller with its touchscreen, the bottle tray, and the CTO-40S column oven beside the stack. Front faces +z;
   modelled full size, then scaled to the bench.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room. */
"use strict";

const gHPLC=hotGroup("hplc","HPLC",new THREE.Vector3(-0.95,4.05,-3.6));
const HPX=-1.12, HPZ=-3.7, HW=0.62, HD=0.8, HF=HPZ+HD/2;
const HP_BASE=1.31, HP_SCALE=0.72;
const HP_OVEN_W=0.31, HP_OVEN_H=1.32, HP_OVEN_GAP=0.013;
const hBody=0x202427,hDoor=0x2c3236,hTrim=0x5d676d;
function lcdTex(lines){return tex((g,W,H)=>{
  g.fillStyle="#0d1417";g.fillRect(0,0,W,H);g.fillStyle="#d4dcd9";
  g.font="13px monospace";lines.forEach((s,i)=>g.fillText(s,5,16+i*15));
},160,64);}

const hpMat={
  body:mat(0x24282c,{roughness:0.59,metalness:0.13}),
  front:mat(0x33383e,{roughness:0.57,metalness:0.14}),
  door:mat(0x474d54,{roughness:0.58,metalness:0.16}),
  drawer:mat(0x3b4148,{roughness:0.60,metalness:0.12}),
  control:mat(0x171e21,{roughness:0.43,metalness:0.10}),
  side:mat(0xbcc4c7,{roughness:0.61,metalness:0.12}),
  seam:mat(0x101518,{roughness:0.85,metalness:0.03}),
  recess:mat(0x070c10,{roughness:0.91,metalness:0.01}),
  satin:mat(0xa1a8ad,{roughness:0.39,metalness:0.53}),
  rail:mat(0xb7bfc4,{roughness:0.30,metalness:0.70}),
  cap:mat(0xd5dcdf,{roughness:0.51,metalness:0.03}),
  capRib:mat(0xb9c2c7,{roughness:0.57,metalness:0.04}),
  inactive:mat(0x81908f,{roughness:0.58,metalness:0.10}),
  green:new THREE.MeshStandardMaterial({color:0x2d9865,
    emissive:0x126d3c,emissiveIntensity:0.55,roughness:0.53})
};
Object.values(hpMat).forEach(m=>m.color.convertSRGBToLinear());
hpMat.glass=new THREE.MeshStandardMaterial({
  color:0xc3dce7,transparent:true,opacity:0.17,roughness:0.10,
  metalness:0.02,depthWrite:false,side:THREE.DoubleSide
});
hpMat.liquid=new THREE.MeshStandardMaterial({
  color:0xc2dfe9,transparent:true,opacity:0.13,roughness:0.14,depthWrite:false
});

function hpShape(w,h,r){
  const s=new THREE.Shape(),l=-w/2,q=w/2,b=-h/2,t=h/2;
  s.moveTo(l+r,b);s.lineTo(q-r,b);s.quadraticCurveTo(q,b,q,b+r);
  s.lineTo(q,t-r);s.quadraticCurveTo(q,t,q-r,t);
  s.lineTo(l+r,t);s.quadraticCurveTo(l,t,l,t-r);
  s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);s.closePath();return s;
}
function hpPanel(w,h,r,d,material,x,y,z){
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(hpShape(w,h,r),{
    depth:d,steps:1,curveSegments:10,bevelEnabled:true,
    bevelSize:0.0015,bevelThickness:0.0015,bevelSegments:3
  }),material);
  m.position.set(x,y,z-d);m.castShadow=true;m.receiveShadow=true;gHPLC.add(m);return m;
}
function hpRod(a,b,r,material=hpMat.rail){
  const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),delta=B.clone().sub(A);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),material);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  m.castShadow=true;gHPLC.add(m);return m;
}
function hpCurve(points,r,material=hpMat.rail){
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    points.map(p=>new THREE.Vector3(...p)),false,"centripetal"),48,r,8,false),material);
  m.castShadow=true;gHPLC.add(m);return m;
}
function hpDecal(w,h,t,x,y,z){
  return plane(w,h,new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}),x,y,z,0,gHPLC);
}
function hpLabel(text,w,h,x,y,z,color="#b9c5c8"){
  const t=tex((g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle=color;
    g.font="500 34px Arial";g.textBaseline="middle";g.fillText(text,3,H/2);},Math.max(96,text.length*21),48);
  return hpDecal(w,h,t,x,y,z);
}
function hpPower(x,y,z,r=0.007){
  const m=new THREE.Mesh(new THREE.RingGeometry(r*0.72,r,20),hpMat.satin);
  m.position.set(x,y,z);gHPLC.add(m);
  box(r*0.16,r*0.9,0.001,hpMat.satin,x,y+r*0.5,z+0.001,gHPLC);
}

// Pale side housings, dark front frames and fine horizontal gaps.
function hpCase(y,h,w=HW,x=HPX){
  box(w-0.007,h-0.009,HD-0.030,hpMat.side,x,y+h/2,HPZ-0.008,gHPLC);
  hpPanel(w-0.002,h-0.007,0.003,0.043,hpMat.body,x,y+h/2,HF+0.019);
  box(w-0.006,0.006,0.014,hpMat.seam,x,y+h-0.003,HF+0.020,gHPLC);
  // Dark side flanges stop the light gray casing just behind the front face.
  for(const side of [-1,1]){
    box(0.008,h-0.012,0.038,hpMat.body,x+side*(w/2-0.002),y+h/2,HF-0.001,gHPLC);
  }
}
const HP_CTRL_X=HPX-HW/2+0.101;
const HP_DOOR_W=0.385,HP_DOOR_X=HPX+0.116;
function hpControl(y,h,kind,x=HP_CTRL_X,w=0.195){
  hpPanel(w,h-0.014,0.002,0.016,hpMat.control,x,y+h/2,HF+0.035);
  const t=tex((g,W,H)=>{
    g.clearRect(0,0,W,H);
    g.fillStyle="#c9d1ce";g.font="15px monospace";g.textAlign="left";
    const rows=kind==="pump"?["A: 0.5000  B:0.0%","B: 0.0000  T:0.0%","PRESS  12.6 MPa"]:
      kind==="detector"?["SPD-M40","READY    254 nm"]:
      kind==="oven"?["SET  ACTUAL  T.MAX","40.0  40.0  85.0","TEMP.  READY"]:
      ["SIL-40C  ST:Ready","LINK   SAMPLE: 07","INJECTION  10 uL"];
    rows.forEach((s,i)=>g.fillText(s,46,27+i*20));
    g.font="14px Arial";g.textAlign="center";
    for(const [xx,yy,s] of [[116,150,"▲"],[116,224,"▼"],[77,187,"‹"],[157,187,"›"],
      [193,127,"↵"],[193,235,"Enter"],[193,281,"Menu"]]){
      g.fillText(s,xx,yy);
    }
    g.font="11px Arial";g.textAlign="left";
    g.fillText(kind==="pump"?"LC-40D":kind==="detector"?"SPD-M40":kind==="oven"?"CTO-40S":"SIL-40C",8,H-12);
  },256,400);
  hpDecal(w-0.012,h-0.026,t,x,y+h/2,HF+0.039);
  box(0.006,Math.min(0.102,h*0.32),0.004,hpMat.green,
    x-w/2+0.019,y+h*0.49,HF+0.042,gHPLC);
  const dot=new THREE.Mesh(new THREE.CircleGeometry(0.0038,14),hpMat.inactive);
  dot.position.set(x-w/2+0.019,y+h*0.79,HF+0.043);gHPLC.add(dot);
  hpPower(x-w/2+0.019,y+0.039,HF+0.043,0.0055);
}
function hpDoor(y,h){
  hpPanel(HP_DOOR_W,h-0.020,0.004,0.020,hpMat.door,
    HP_DOOR_X,y+h/2,HF+0.041);
  // A shallow convex front gives the satin door a soft vertical highlight.
  const positions=[],indices=[],segments=32,w=HP_DOOR_W-0.004;
  for(let row=0;row<2;row++)for(let i=0;i<=segments;i++){
    const u=i/segments,v=2*u-1;
    positions.push(HP_DOOR_X+(u-0.5)*w,y+h/2+(row-0.5)*(h-0.026),HF+0.043+0.006*(1-v*v));
  }
  for(let i=0;i<segments;i++){
    const a=i,b=i+1,c=i+segments+1,d=c+1;indices.push(a,b,c,b,d,c);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const skin=new THREE.Mesh(geometry,hpMat.door);skin.castShadow=true;skin.receiveShadow=true;gHPLC.add(skin);
  // The narrow satin separator belongs at the left of the module door.
  box(0.022,h-0.015,0.017,hpMat.seam,HPX-0.097,y+h/2,HF+0.036,gHPLC);
  box(0.006,h-0.020,0.009,hpMat.satin,HPX-0.108,y+h/2,HF+0.043,gHPLC);
  hpLabel("SHIMADZU",0.105,0.010,HPX+0.242,y+0.016,HF+0.052);
}

// Lower autosampler is one tall unit, with an inset compartment and projecting drawer.
const HP_AS_H=0.66;
hpCase(HP_BASE,HP_AS_H);
hpPanel(0.405,0.479,0.002,0.009,hpMat.recess,HPX+0.102,HP_BASE+0.403,HF+0.028);
hpPanel(0.231,0.455,0.002,0.006,hpMat.control,HPX+0.086,HP_BASE+0.409,HF+0.032);
box(0.029,0.494,0.020,hpMat.front,HPX+HW/2-0.023,HP_BASE+0.398,HF+0.028,gHPLC);
hpControl(HP_BASE+0.401,0.259,"sampler");
box(0.006,0.249,0.009,hpMat.satin,HPX-0.108,HP_BASE+0.531,HF+0.044,gHPLC);
hpPanel(HW-0.014,0.180,0.003,0.025,hpMat.front,HPX,HP_BASE+0.094,HF+0.039);
const HP_DRAWER_X=HPX-0.089,HP_DRAWER_W=0.443;
hpPanel(HP_DRAWER_W+0.010,0.083,0.002,0.010,hpMat.recess,
  HP_DRAWER_X,HP_BASE+0.196,HF+0.051);
hpPanel(HP_DRAWER_W,0.186,0.003,0.088,hpMat.drawer,
  HP_DRAWER_X,HP_BASE+0.312,HF+0.121);
box(HP_DRAWER_W-0.009,0.012,0.015,hpMat.seam,
  HP_DRAWER_X,HP_BASE+0.216,HF+0.117,gHPLC);
hpPower(HPX-HW/2+0.025,HP_BASE+0.067,HF+0.054);
hpLabel("SIL-40C",0.110,0.010,HPX-HW/2+0.063,HP_BASE+0.014,HF+0.054);
hpLabel("SHIMADZU",0.106,0.010,HPX+0.242,HP_BASE+0.014,HF+0.054);

// Pump and detector: matching full-height doors with compact black controls.
let yy=HP_BASE+HP_AS_H;
for(const kind of ["pump","detector"]){
  const h=0.33;hpCase(yy,h);hpControl(yy,h,kind);hpDoor(yy,h);yy+=h;
}
// The degasser is half the height of the modules below it.
const HP_DEG_H=0.17;
hpCase(yy,HP_DEG_H);
hpPanel(0.195,HP_DEG_H-0.016,0.002,0.016,hpMat.control,HP_CTRL_X,yy+HP_DEG_H/2,HF+0.035);
hpDoor(yy,HP_DEG_H);
hpLabel("DGU-405",0.112,0.010,HP_CTRL_X-0.025,yy+0.015,HF+0.042);
hpLabel("STATUS     READY",0.133,0.011,HP_CTRL_X+0.007,yy+0.109,HF+0.042);
box(0.005,0.006,0.002,hpMat.green,HP_CTRL_X-0.007,yy+0.085,HF+0.042,gHPLC);
yy+=HP_DEG_H;

// SCL-40 touchscreen controller with the compact, dark status dashboard.
const CTRL_H=0.33,CTRL_Y=yy+CTRL_H/2;
hpCase(yy,CTRL_H);
hpPanel(HW-0.012,CTRL_H-0.017,0.003,0.012,hpMat.front,HPX,CTRL_Y,HF+0.031);
hpPanel(0.411,0.251,0.003,0.009,hpMat.recess,HPX,CTRL_Y+0.012,HF+0.043);
const hpCtrlTex=tex((g,W,H)=>{
  g.fillStyle="#1a2124";g.fillRect(0,0,W,H);
  g.fillStyle="#2b3335";g.fillRect(0,0,W,27);
  g.font="14px Arial";g.fillStyle="#80ba97";g.fillText("Ready",10,19);
  g.fillStyle="#a1aeb0";g.fillText("NEXERA  |  SYSTEM STATUS",100,19);
  g.fillStyle="#11191e";g.fillRect(14,40,147,128);
  g.strokeStyle="#688f9e";g.lineWidth=3;g.beginPath();g.moveTo(25,131);
  g.lineTo(57,131);g.lineTo(57,76);g.lineTo(123,76);g.lineTo(123,131);g.lineTo(151,131);g.stroke();
  for(const x of [57,90,123]){g.fillStyle="#b5d0db";g.fillRect(x-5,70,10,14);}
  g.font="12px Arial";g.fillStyle="#9baeb4";g.fillText("FLOW PATH",24,57);
  const cards=[["FLOW","0.500","mL/min"],["PRESSURE","12.6","MPa"],["OVEN","40.0","°C"]];
  cards.forEach((c,i)=>{
    const x=174+i*137;g.fillStyle="#2c3639";g.fillRect(x,40,126,128);
    g.fillStyle="#9dacaf";g.font="12px Arial";g.fillText(c[0],x+9,61);
    g.fillStyle="#e0e7e5";g.font="24px Arial";g.fillText(c[1],x+8,110);
    g.fillStyle="#9aa9ae";g.font="12px Arial";g.fillText(c[2],x+8,143);
    g.fillStyle="#668ca0";g.fillRect(x+6,75,111,3);
  });
  for(let i=0;i<4;i++){
    const x=14+i*141;g.fillStyle="#273034";g.fillRect(x,180,130,83);
    g.fillStyle="#9ba9ae";g.font="12px Arial";
    g.fillText(["PUMP","AUTOSAMPLER","DETECTOR","RUN TIME"][i],x+8,200);
    g.fillStyle="#c9d9df";g.font="20px Arial";g.fillText(["Ready","07 / 96","254 nm","00:00"][i],x+8,233);
  }
  g.fillStyle="#11191d";g.fillRect(0,277,W,43);
  for(let i=0;i<7;i++){
    const x=16+i*74;g.fillStyle="#456371";g.fillRect(x,285,21,21);
    g.fillStyle="#d5e3e7";g.font="12px Arial";g.fillText(["⌂","▦","↔","▣","◷","⚙","?"][i],x+5,301);
  }
  g.fillStyle="#42634c";g.fillRect(W-93,281,81,31);
  g.fillStyle="#c4e3c8";g.font="14px Arial";g.fillText("START",W-78,302);
},640,320);
hpDecal(0.385,0.224,hpCtrlTex,HPX,CTRL_Y+0.013,HF+0.047);
hpPower(HPX-HW/2+0.027,yy+0.051,HF+0.047,0.009);
hpLabel("SCL-40",0.078,0.011,HPX-HW/2+0.056,yy+0.017,HF+0.047);
hpLabel("SHIMADZU",0.101,0.010,HPX+0.239,yy+0.017,HF+0.047);
yy+=CTRL_H;

// Shallow bottle tray with thin, rounded stainless guardrails.
const RACK_Y=yy+0.015;
box(HW-0.014,0.024,HD-0.035,hpMat.body,HPX,RACK_Y,HPZ,gHPLC);
const RX0=HPX-HW/2+0.025,RX1=HPX+HW/2-0.025;
const RZ0=HPZ-HD/2+0.035,RZ1=HF-0.035;
const RY0=RACK_Y+0.012,RY1=RACK_Y+0.117;
for(const z of [RZ0,RZ1]){
  hpCurve([[RX0,RY0,z],[RX0,RY1-0.020,z],[RX0+0.006,RY1-0.006,z],
    [RX0+0.021,RY1,z],[RX1-0.021,RY1,z],[RX1-0.006,RY1-0.006,z],
    [RX1,RY1-0.020,z],[RX1,RY0,z]],0.0045);
}
for(const x of [RX0,RX1])hpRod([x,RY1-0.018,RZ0],[x,RY1-0.018,RZ1],0.0045);

// Four clear bottles in two rows: two silhouettes in front view, four in perspective.
const hpGraduations=tex((g,W,H)=>{
  g.clearRect(0,0,W,H);g.fillStyle="rgba(199,220,229,.75)";
  g.strokeStyle="rgba(199,220,229,.65)";g.lineWidth=2;g.font="18px Arial";
  for(let i=0;i<6;i++){
    const y=45+i*69;g.beginPath();g.moveTo(24,y);g.lineTo(140,y);g.stroke();
    g.fillText(String(1000-i*150),148,y+6);
    g.beginPath();g.moveTo(75,y+34);g.lineTo(140,y+34);g.stroke();
  }
},256,512);
function hpSolventBottle(x,z,fillLevel){
  const bottom=RACK_Y+0.014;
  const profile=[[0,0],[0.080,0],[0.100,0.006],[0.105,0.021],
    [0.105,0.290],[0.101,0.310],[0.082,0.334],[0.053,0.366],
    [0.041,0.379],[0.041,0.422]].map(p=>new THREE.Vector2(...p));
  const bottle=new THREE.Mesh(new THREE.LatheGeometry(profile,48),hpMat.glass);
  bottle.position.set(x,bottom,z);bottle.renderOrder=3;gHPLC.add(bottle);
  const liquid=cyl(0.098,0.098,0.280*fillLevel,hpMat.liquid,
    x,bottom+0.006+0.140*fillLevel,z,gHPLC,40);liquid.castShadow=false;liquid.renderOrder=2;
  for(const y of [0.024,0.288,0.307,0.392]){
    const r=y>0.35?0.041:y>0.30?0.101:0.105;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.0015,5,40),hpMat.glass);
    ring.rotation.x=Math.PI/2;ring.position.set(x,bottom+y,z);ring.renderOrder=3;gHPLC.add(ring);
  }
  cyl(0.049,0.049,0.043,hpMat.cap,x,bottom+0.434,z,gHPLC,48);
  cyl(0.051,0.051,0.006,hpMat.capRib,x,bottom+0.412,z,gHPLC,48);
  for(let i=0;i<28;i++){
    const a=i*2*Math.PI/28;
    hpRod([x+0.049*Math.cos(a),bottom+0.416,z+0.049*Math.sin(a)],
      [x+0.049*Math.cos(a),bottom+0.452,z+0.049*Math.sin(a)],0.0009,hpMat.capRib);
  }
  const marks=hpDecal(0.140,0.251,hpGraduations,x,bottom+0.156,z+0.106);
  marks.renderOrder=4;
  hpRod([x+0.012,bottom+0.026,z],[x+0.012,bottom+0.422,z],0.0014,hpMat.cap);
}
for(const [z,fill] of [[HPZ-0.170,0.61],[HPZ+0.160,0.72]]){
  hpSolventBottle(HPX-0.132,z,fill);hpSolventBottle(HPX+0.132,z,fill+0.08);
}

// CTO-40S oven: a narrow full-height cabinet, not another stacked module.
const COX=HPX+HW/2+HP_OVEN_GAP+HP_OVEN_W/2;
const COT=HP_BASE+HP_OVEN_H,HP_OVEN_CTRL_H=0.32;
hpCase(HP_BASE,HP_OVEN_H,HP_OVEN_W,COX);
hpPanel(HP_OVEN_W-0.014,0.979,0.003,0.018,hpMat.door,
  COX,HP_BASE+0.505,HF+0.039);
const HP_OVEN_CTRL_W=0.208,HP_OVEN_CTRL_X=COX-HP_OVEN_W/2+0.108;
hpControl(COT-HP_OVEN_CTRL_H,HP_OVEN_CTRL_H,"oven",HP_OVEN_CTRL_X,HP_OVEN_CTRL_W);
box(HP_OVEN_W-0.008,0.006,0.014,hpMat.seam,COX,COT-HP_OVEN_CTRL_H,HF+0.040,gHPLC);
// Long recessed pull near the right edge, and a small square service hatch.
hpPanel(0.029,0.332,0.002,0.005,hpMat.seam,
  COX+HP_OVEN_W/2-0.030,HP_BASE+0.831,HF+0.044);
box(0.006,0.309,0.010,hpMat.front,
  COX+HP_OVEN_W/2-0.021,HP_BASE+0.831,HF+0.048,gHPLC);
hpPanel(0.163,0.167,0.0015,0.004,hpMat.seam,COX-0.022,HP_BASE+0.258,HF+0.045);
hpPanel(0.158,0.162,0.001,0.004,hpMat.front,COX-0.022,HP_BASE+0.258,HF+0.048);
hpPower(COX-HP_OVEN_W/2+0.023,HP_BASE+0.065,HF+0.048,0.006);
hpLabel("SHIMADZU",0.101,0.010,COX+0.072,HP_BASE+0.015,HF+0.048);

// Low dark feet and plinths beneath both units.
for(const [x,w] of [[HPX,HW],[COX,HP_OVEN_W]]){
  box(w-0.010,0.017,HD-0.006,hpMat.seam,x,HP_BASE+0.0085,HPZ,gHPLC);
  for(const side of [-1,1])for(const z of [HPZ-0.28,HPZ+0.28]){
    box(0.055,0.022,0.074,hpMat.seam,x+side*(w/2-0.047),HP_BASE+0.011,z,gHPLC);
  }
}
scaleAbout(gHPLC,HP_SCALE,-0.95,HP_BASE,-4.12);
