/* instruments/basement-sfc/model.js — The SFC (supercritical fluid chromatograph) on the basement bench.
   Revised from photos of a preparative SFC: the CO₂ pump with its chiller grille, the valve and pump modules, the tall
   column oven, the detector, and the collection station with six bottles. Front faces +z.
   The live run (js/basement/sfc.js) uses SFC_PARTS at the end: the screens, the injection valve, the column inside
   the oven window, the detector's flow cell, the tubing (FLOW) and the six fraction bottles.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     SFC_PARTS (js/basement/sfc.js) */
"use strict";
const SY=BY+1.31,SZ=-3.8,SF=-3.45;
const gSFC=hotGroup("sfc","SFC",new THREE.Vector3(-0.35,BY+2.75,-3.7),basement,"down");
const sBody=0x202427,sDoor=0x2c3236,sTrim=0x5d676d;
const SW=0.62,SD=0.70,SH=1.32,SFC_GAP=0.018;
const AX=-1.55,BX2=AX+SW+SFC_GAP,CX2=BX2+SW+SFC_GAP;
const COLLECT_W=0.94,DX=CX2+SW/2+0.025+COLLECT_W/2;

const sfcMat={
  body:mat(0x252b2e,{roughness:0.61,metalness:0.12}),
  front:mat(0x353c41,{roughness:0.57,metalness:0.13}),
  door:mat(0x434a50,{roughness:0.58,metalness:0.14}),
  control:mat(0x171e21,{roughness:0.47,metalness:0.08}),
  side:mat(0xb3bdc3,{roughness:0.63,metalness:0.10}),
  seam:mat(0x0b1216,{roughness:0.83,metalness:0.03}),
  grille:mat(0x121b20,{roughness:0.71,metalness:0.12}),
  fin:mat(0x3a454b,{roughness:0.57,metalness:0.28}),
  satin:mat(0x959fa6,{roughness:0.40,metalness:0.48}),
  key:mat(0x78888f,{roughness:0.57,metalness:0.16}),
  shell:mat(0xe0e5e5,{roughness:0.58,metalness:0.03}),
  cap:mat(0xd2dddf,{roughness:0.53,metalness:0.03}),
  blue:mat(0x4888a3,{roughness:0.53,metalness:0.02}),
  tube:mat(0xbfcfd3,{roughness:0.48,metalness:0.05}),
  green:new THREE.MeshStandardMaterial({color:0x3e9b62,
    emissive:0x156c3b,emissiveIntensity:0.52,roughness:0.54})
};
Object.values(sfcMat).forEach(m=>m.color.convertSRGBToLinear());
sfcMat.glass=new THREE.MeshStandardMaterial({color:0xc5e0e8,
  transparent:true,opacity:0.19,roughness:0.11,metalness:0.01,
  depthWrite:false,side:THREE.DoubleSide});
sfcMat.liquid=new THREE.MeshStandardMaterial({color:0xc3e0e5,
  transparent:true,opacity:0.12,roughness:0.15,depthWrite:false});

function sfcShape(w,h,r){
  const s=new THREE.Shape(),l=-w/2,q=w/2,b=-h/2,t=h/2;
  s.moveTo(l+r,b);s.lineTo(q-r,b);s.quadraticCurveTo(q,b,q,b+r);
  s.lineTo(q,t-r);s.quadraticCurveTo(q,t,q-r,t);
  s.lineTo(l+r,t);s.quadraticCurveTo(l,t,l,t-r);
  s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);s.closePath();return s;
}
function sfcPanel(w,h,r,d,material,x,y,z){
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sfcShape(w,h,r),{
    depth:d,steps:1,curveSegments:12,bevelEnabled:true,
    bevelSize:0.0015,bevelThickness:0.0015,bevelSegments:3
  }),material);
  m.position.set(x,y,z-d);m.castShadow=true;m.receiveShadow=true;gSFC.add(m);return m;
}
function sfcCurve(points,r,material=sfcMat.tube){
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    points.map(p=>new THREE.Vector3(...p)),false,"centripetal"),40,r,8,false),material);
  m.castShadow=true;gSFC.add(m);return m;
}
function sfcDecal(w,h,t,x,y,z){
  return plane(w,h,new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}),x,y,z,0,gSFC);
}
function sfcLabel(text,w,h,x,y,z,color="#b8c5c9"){
  const t=tex((g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle=color;
    g.font="34px Arial";g.textBaseline="middle";g.fillText(text,3,H/2);
  },Math.max(96,text.length*21),48);
  return sfcDecal(w,h,t,x,y,z);
}
function sfcPower(x,y,z,r=0.005){
  const m=new THREE.Mesh(new THREE.RingGeometry(r*0.72,r,20),sfcMat.satin);
  m.position.set(x,y,z);gSFC.add(m);
  box(r*0.15,r*0.9,0.001,sfcMat.satin,x,y+r*0.5,z+0.001,gSFC);
}
function sfcCase(cx,y,h,w=SW){
  box(w-0.007,h-0.007,SD-0.028,sfcMat.side,cx,y+h/2,SZ-0.007,gSFC);
  sfcPanel(w-0.002,h-0.006,0.003,0.039,sfcMat.body,cx,y+h/2,SF+0.019);
  for(const side of [-1,1]){
    box(0.007,h-0.010,0.034,sfcMat.body,cx+side*(w/2-0.001),y+h/2,SF-0.001,gSFC);
  }
  box(w-0.008,0.005,0.013,sfcMat.seam,cx,y+h-0.003,SF+0.024,gSFC);
}
const sfcKeyGeo=new THREE.CylinderGeometry(0.0037,0.0037,0.002,12);
// Keypad displays are live screens: lcd.draw([line, line, line]) repaints one (js/basement/sfc.js does, during a run).
const sfcScreens=[],sfcKnobs=[];
function sfcLcdDraw(g,W,H,lines){
  g.clearRect(0,0,W,H);g.fillStyle="#c9d4cf";g.font="17px monospace";
  lines.forEach((s,i)=>g.fillText(s,4,20+i*20));
}
function sfcControls(cx,y,h,mode="keypad",label="",w=0.197){
  sfcPanel(w,h-0.013,0.002,0.014,sfcMat.control,cx,y+h/2,SF+0.036);
  if(mode==="keypad"){
    const lcd=screenTex(256,72,sfcLcdDraw);
    lcd.draw(["FLOW  10.00  mL/min","PRESS  15.0  MPa","READY     REMOTE"]);sfcScreens.push(lcd);
    sfcDecal(w-0.028,0.049,lcd.t,cx,y+h-0.043,SF+0.041);
    const keyTop=y+h-0.091;
    const keyRows=h>0.45?8:h>0.36?7:6;
    const keyPitch=h>0.45?0.039:h>0.36?0.035:0.027;
    for(let row=0;row<keyRows;row++)for(let col=0;col<4;col++){
      const key=new THREE.Mesh(sfcKeyGeo,sfcMat.key);
      key.rotation.x=Math.PI/2;key.position.set(cx-0.049+col*0.028,keyTop-row*keyPitch,SF+0.041);gSFC.add(key);
    }
    for(let row=0;row<keyRows;row++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(0.006,0.0009,5,16),sfcMat.key);
      ring.position.set(cx+w/2-0.018,keyTop-row*keyPitch,SF+0.041);gSFC.add(ring);
    }
    box(0.005,0.086,0.003,sfcMat.green,cx-w/2+0.017,y+h-0.145,SF+0.042,gSFC);
  }else if(mode==="status"){
    box(0.006,Math.min(0.100,h*0.36),0.004,sfcMat.green,cx-w/2+0.019,y+h*0.50,SF+0.042,gSFC);
    sfcLabel("STATUS",0.055,0.009,cx+0.023,y+h-0.052,SF+0.042);
    for(const yy of [y+h-0.026,y+h-0.045]){
      box(0.010,0.005,0.002,sfcMat.key,cx+w/2-0.030,yy,SF+0.042,gSFC);
    }
  }else{
    sfcLabel("POWER   STATUS",0.117,0.009,cx+0.007,y+h*0.64,SF+0.042);
    box(0.005,0.005,0.002,sfcMat.green,cx+0.013,y+h*0.49,SF+0.042,gSFC);
  }
  if(label)sfcLabel(label,0.102,0.009,cx-0.031,y+0.015,SF+0.043);
  sfcPower(cx-w/2+0.017,y+0.032,SF+0.043,0.004);
}
function sfcDoor(cx,y,h,w=0.389){
  sfcPanel(w,h-0.017,0.003,0.020,sfcMat.door,cx+0.111,y+h/2,SF+0.043);
  box(0.021,h-0.013,0.012,sfcMat.seam,cx-0.099,y+h/2,SF+0.035,gSFC);
  box(0.006,h-0.016,0.007,sfcMat.satin,cx-0.111,y+h/2,SF+0.044,gSFC);
  sfcLabel("SHIMADZU",0.092,0.009,cx+0.247,y+0.014,SF+0.047);
}
function sfcKnob(cx,y){
  const k=new THREE.Group();k.position.set(cx,y,0);gSFC.add(k);
  const rim=cyl(0.032,0.032,0.008,sfcMat.seam,0,0,SF+0.051,k,36);rim.rotation.x=Math.PI/2;
  const face=cyl(0.024,0.024,0.008,sfcMat.front,0,0,SF+0.058,k,32);face.rotation.x=Math.PI/2;
  box(0.003,0.024,0.002,sfcMat.satin,0,0.003,SF+0.064,k);
  return k;
}
function sfcModule(cx,y,h,mode,knob=false){
  sfcCase(cx,y,h);sfcControls(cx-SW/2+0.101,y,h,mode);sfcDoor(cx,y,h);
  if(knob)sfcKnobs.push(sfcKnob(cx+0.163,y+h-0.057));
  return y+h;
}

// LEFT STACK: large ventilated base, keypad module and slim top unit.
const SFC_GRILLE_H=0.66;
sfcCase(AX,SY,SFC_GRILLE_H);
sfcPanel(SW-0.030,0.604,0.003,0.009,sfcMat.grille,AX,SY+0.332,SF+0.034);
sfcPanel(SW-0.061,0.567,0.001,0.004,sfcMat.seam,AX,SY+0.331,SF+0.039);
for(let i=0;i<36;i++){
  const x=AX-0.269+i*0.538/35;
  box(0.0025,0.550,0.010,sfcMat.fin,x,SY+0.331,SF+0.045,gSFC);
}
for(let i=0;i<18;i++){
  box(0.548,0.0025,0.007,sfcMat.fin,AX,SY+0.064+i*0.0314,SF+0.048,gSFC);
}
sfcLabel("SHIMADZU",0.095,0.010,AX+0.242,SY+0.014,SF+0.050);
sfcModule(AX,SY+0.66,0.50,"keypad");
sfcModule(AX,SY+1.16,0.16,"quiet");

// MIDDLE STACK: two matching valve/pump modules, a slim unit and status module.
let midY=SY;
midY=sfcModule(BX2,midY,0.42,"keypad",true);
midY=sfcModule(BX2,midY,0.42,"keypad",true);
midY=sfcModule(BX2,midY,0.16,"quiet");
sfcModule(BX2,midY,0.32,"status");

// RIGHT STACK: the tall split cabinet beneath a separate top module.
sfcCase(CX2,SY,1.00);
sfcPanel(0.389,0.975,0.004,0.020,sfcMat.door,CX2+0.111,SY+0.502,SF+0.043);
box(0.022,0.975,0.012,sfcMat.seam,CX2-0.099,SY+0.502,SF+0.035,gSFC);
box(0.006,0.975,0.008,sfcMat.satin,CX2-0.111,SY+0.502,SF+0.044,gSFC);
sfcControls(CX2-SW/2+0.101,SY+0.682,0.318,"keypad");
// Lower left service covers and a vertical recessed handle on the tall door.
for(const y of [SY+0.196,SY+0.433]){
  sfcPanel(0.172,0.207,0.0015,0.005,sfcMat.seam,CX2-SW/2+0.100,y,SF+0.037);
  sfcPanel(0.162,0.197,0.001,0.005,sfcMat.front,CX2-SW/2+0.100,y,SF+0.041);
}
sfcPanel(0.020,0.466,0.002,0.004,sfcMat.seam,CX2-0.044,SY+0.498,SF+0.050);
box(0.006,0.439,0.008,sfcMat.front,CX2-0.035,SY+0.498,SF+0.054,gSFC);
sfcPower(CX2-SW/2+0.021,SY+0.037,SF+0.045);
sfcLabel("SHIMADZU",0.094,0.009,CX2+0.244,SY+0.014,SF+0.048);
sfcModule(CX2,SY+1.00,0.32,"keypad");

// COLLECTION STATION: low black tray, framed white backplate and white bottle bin.
const SFC_BASE_H=0.113,SFC_BOARD_Z=SZ-0.314;
sfcPanel(COLLECT_W,0.091,0.004,0.760,sfcMat.body,DX,SY+0.059,SZ+0.440);
box(COLLECT_W-0.023,0.019,0.747,sfcMat.front,DX,SY+0.111,SZ+0.068,gSFC);
sfcPanel(0.829,0.842,0.004,0.032,sfcMat.body,DX,SY+0.545,SFC_BOARD_Z);
sfcPanel(0.731,0.744,0.002,0.005,sfcMat.shell,DX,SY+0.548,SFC_BOARD_Z+0.008);
// The bin is open: thin walls leave all bottle shoulders visible.
box(0.808,0.017,0.620,sfcMat.shell,DX,SY+0.143,SZ+0.013,gSFC);
sfcPanel(0.817,0.220,0.014,0.016,sfcMat.shell,DX,SY+0.262,SZ+0.327);
for(const side of [-1,1]){
  box(0.015,0.220,0.622,sfcMat.shell,DX+side*0.401,SY+0.262,SZ+0.016,gSFC);
}
sfcPanel(0.316,0.059,0.022,0.002,sfcMat.side,DX,SY+0.259,SZ+0.332);
sfcPanel(0.253,0.043,0.018,0.002,sfcMat.shell,DX,SY+0.259,SZ+0.335);
box(0.005,0.026,0.003,sfcMat.green,DX-COLLECT_W/2+0.030,SY+0.063,SZ+0.446,gSFC);
sfcLabel("COLLECTION",0.129,0.010,DX-COLLECT_W/2+0.114,SY+0.029,SZ+0.446);
sfcLabel("SHIMADZU",0.095,0.009,DX+COLLECT_W/2-0.059,SY+0.029,SZ+0.446);

// Six FRS collection bottles, arranged in two complete rows of three.
const sfcBottleLabel=tex((g,W,H)=>{
  g.clearRect(0,0,W,H);g.fillStyle="rgba(126,174,194,.7)";
  g.font="18px Arial";g.fillText("1000 mL",22,27);
  g.strokeStyle="rgba(126,174,194,.65)";g.lineWidth=2;
  for(let i=0;i<7;i++){
    const y=45+i*48;g.beginPath();g.moveTo(37,y);g.lineTo(115,y);g.stroke();
    g.fillText(String(900-i*100),124,y+5);
  }
},224,384);
function sfcBottle(x,z,index){
  const bottom=SY+0.152;
  const profile=[[0,0],[0.091,0],[0.109,0.009],[0.113,0.024],
    [0.113,0.342],[0.108,0.367],[0.085,0.402],[0.049,0.438],
    [0.040,0.454],[0.040,0.522]].map(p=>new THREE.Vector2(...p));
  const bottle=new THREE.Mesh(new THREE.LatheGeometry(profile,48),sfcMat.glass);
  bottle.name="FRS collection bottle "+index;
  bottle.position.set(x,bottom,z);bottle.renderOrder=3;gSFC.add(bottle);
  const liquid=cyl(0.105,0.105,0.183,sfcMat.liquid.clone(),x,bottom+0.098,z,gSFC,40);
  liquid.userData.keep=true;sfcFractions.push({liquid,bottom});   // the live run fills each bottle, so its liquid stays its own mesh
  liquid.castShadow=false;liquid.renderOrder=2;
  for(const [y,r] of [[0.025,0.113],[0.341,0.113],[0.376,0.104],[0.480,0.040]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.0015,5,40),sfcMat.glass);
    ring.rotation.x=Math.PI/2;ring.position.set(x,bottom+y,z);ring.renderOrder=3;gSFC.add(ring);
  }
  cyl(0.047,0.047,0.049,sfcMat.cap,x,bottom+0.538,z,gSFC,40);
  cyl(0.051,0.051,0.007,sfcMat.shell,x,bottom+0.514,z,gSFC,40);
  for(let i=0;i<22;i++){
    const a=i*2*Math.PI/22;
    box(0.0015,0.035,0.0015,sfcMat.shell,
      x+0.047*Math.cos(a),bottom+0.537,z+0.047*Math.sin(a),gSFC);
  }
  box(0.024,0.063,0.0015,sfcMat.blue,x,bottom+0.535,z+0.048,gSFC);
  sfcLabel(String(index),0.015,0.022,x+0.001,bottom+0.536,z+0.051,"#ecf2ef");
  cyl(0.011,0.011,0.029,sfcMat.shell,x,bottom+0.574,z,gSFC,16);
  const marks=sfcDecal(0.143,0.274,sfcBottleLabel,x,bottom+0.205,z+0.114);marks.renderOrder=4;
  return bottom+0.588;
}
const sfcFractions=[];
const sfcBottles=[-0.168,0.120].flatMap(z=>
  [-0.254,0,0.254].map(x=>[DX+x,SZ+z]));
sfcBottles.forEach(([x,z],i)=>{
  const capY=sfcBottle(x,z,i+1);
  const column=i%3,row=Math.floor(i/3);
  const portX=DX+(column-1)*0.286,portY=SY+0.869-row*0.087;
  const port=new THREE.Mesh(new THREE.CircleGeometry(0.030,32),sfcMat.seam);
  port.position.set(portX,portY,SFC_BOARD_Z+0.018);gSFC.add(port);
  const socket=new THREE.Mesh(new THREE.RingGeometry(0.019,0.026,32),sfcMat.front);
  socket.position.set(portX,portY,SFC_BOARD_Z+0.020);gSFC.add(socket);
  const line=sfcCurve([[portX,portY,SFC_BOARD_Z+0.021],
    [portX-0.018,portY+0.042,SFC_BOARD_Z+0.090],
    [x,portY+0.019,z-0.060],[x,capY,z]],0.004,sfcMat.tube);
  sfcFractions[i].line=line.geometry.parameters.path;sfcFractions[i].port=new THREE.Vector3(portX,portY,SFC_BOARD_Z+0.021);
});

// Low dark plinths and feet on all three main stacks.
for(const cx of [AX,BX2,CX2]){
  box(SW-0.012,0.020,SD-0.008,sfcMat.seam,cx,SY+0.010,SZ,gSFC);
  for(const side of [-1,1])for(const z of [SZ-0.245,SZ+0.245]){
    box(0.051,0.022,0.067,sfcMat.seam,cx+side*(SW/2-0.047),SY+0.011,z,gSFC);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// LIVE RUN: what js/basement/sfc.js moves when you inject in the SFC app. A window onto the column in the oven door,
// the injection valve, the detector's flow cell, a methanol bottle, and the tubing the mobile phase follows.
// ---------------------------------------------------------------------------------------------------------------
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const FZ=SF+0.074;                                  // tubing runs just in front of the module faces
const GL=AX+SW/2+SFC_GAP/2, GM=BX2+SW/2+SFC_GAP/2;  // the gaps between the stacks, where lines run up and down
const GR=CX2+SW/2+(DX-COLLECT_W/2-(CX2+SW/2))/2;

// Column oven window: a bezel on the tall door, the dark oven inside, a clear column with steel end fittings.
const SFC_WIN={x:CX2+0.133,y:SY+0.52,w:0.17,h:0.74};
const sfcWinMat=new THREE.MeshStandardMaterial({color:new THREE.Color(0x23343e).convertSRGBToLinear(),
  transparent:true,opacity:0.16,roughness:0.12,metalness:0.06,depthWrite:false,side:THREE.DoubleSide});
sfcPanel(SFC_WIN.w+0.026,SFC_WIN.h+0.026,0.006,0.010,sfcMat.satin,SFC_WIN.x,SFC_WIN.y,SF+0.053);
sfcPanel(SFC_WIN.w,SFC_WIN.h,0.004,0.004,sfcMat.seam,SFC_WIN.x,SFC_WIN.y,SF+0.057);
for(const side of [-1,1]){
  box(0.008,SFC_WIN.h+0.02,0.034,sfcMat.satin,SFC_WIN.x+side*(SFC_WIN.w/2+0.006),SFC_WIN.y,SF+0.070,gSFC);
  box(SFC_WIN.w+0.02,0.008,0.034,sfcMat.satin,SFC_WIN.x,SFC_WIN.y+side*(SFC_WIN.h/2+0.006),SF+0.070,gSFC);
}
const COL_TOP=SY+0.83,COL_BOT=SY+0.21,COL_R=0.017,COL_Z=SF+0.072;
const sfcColGlass=new THREE.MeshStandardMaterial({color:0xe6f6ff,roughness:0.05,transparent:true,opacity:0.12,depthWrite:false});
cyl(COL_R,COL_R,COL_TOP-COL_BOT,sfcColGlass,SFC_WIN.x,(COL_TOP+COL_BOT)/2,COL_Z,gSFC,24).castShadow=false;
for(const y of [COL_TOP+0.018,COL_BOT-0.018]) cyl(0.024,0.024,0.036,sfcMat.satin,SFC_WIN.x,y,COL_Z,gSFC,20);
for(const y of [SY+0.27,SY+0.77]) box(0.07,0.012,0.022,sfcMat.satin,SFC_WIN.x-0.03,y,COL_Z-0.004,gSFC);   // column clips
sfcPanel(SFC_WIN.w,SFC_WIN.h,0.004,0.002,sfcWinMat,SFC_WIN.x,SFC_WIN.y,SF+0.090);
sfcLabel("COLUMN OVEN",0.102,0.009,SFC_WIN.x-0.035,SFC_WIN.y+SFC_WIN.h/2+0.03,SF+0.048);

// Detector flow cell: a small window on the detector (the top-right module) that lights in each compound's colour.
const sfcCellMat=new THREE.MeshBasicMaterial({color:0x24313a});
box(0.054,0.054,0.006,sfcMat.satin,CX2+0.205,SY+1.17,SF+0.047,gSFC);
box(0.040,0.040,0.006,sfcCellMat,CX2+0.205,SY+1.17,SF+0.051,gSFC).userData.keep=true;
sfcLabel("FLOW CELL",0.07,0.008,CX2+0.205,SY+1.13,SF+0.049);

// Methanol for the modifier pump, on top of the middle stack.
const MEOH={x:BX2-0.15,y:SY+1.32,z:SZ+0.06};
cyl(0.075,0.075,0.26,sfcMat.glass,MEOH.x,MEOH.y+0.13,MEOH.z,gSFC,32).castShadow=false;
cyl(0.069,0.069,0.18,sfcMat.liquid,MEOH.x,MEOH.y+0.095,MEOH.z,gSFC,32).castShadow=false;
cyl(0.034,0.034,0.04,sfcMat.cap,MEOH.x,MEOH.y+0.28,MEOH.z,gSFC,24);
box(0.07,0.05,0.002,sfcMat.shell,MEOH.x,MEOH.y+0.14,MEOH.z+0.076,gSFC);
sfcLabel("MeOH",0.05,0.012,MEOH.x-0.012,MEOH.y+0.14,MEOH.z+0.078,"#2a3438");

// The flow path, in run order: CO₂ in from the cylinders, methanol down from its bottle, the mixing tee, the
// injection valve, the column, the detector, then over to the collection station's distribution valve.
const sfcKnobInj=sfcKnobs[1];                         // the upper valve module is the injector
const KNOB=sfcKnobInj.position;
const MIX=V3(GL,SY+0.42,FZ);
const CO2_FEED=[V3(-4.06,BY+1.86,-1.55),V3(-4.06,BY+1.86,-4.06),V3(AX-0.12,BY+1.86,-4.06),V3(AX-0.12,SY+0.3,-4.06)];   // drawn by instruments/basement-co2
const FLOW={
  co2:new THREE.CatmullRomCurve3([...CO2_FEED,V3(GL,SY+0.30,-4.12),V3(GL,SY+0.30,FZ),MIX],false,"chordal",0),
  mod:new THREE.CatmullRomCurve3([V3(MEOH.x,MEOH.y+0.30,MEOH.z),V3(MEOH.x-0.04,MEOH.y+0.34,MEOH.z+0.14),
    V3(GL,MEOH.y+0.06,FZ),V3(GL,SY+0.80,FZ),MIX],false,"centripetal"),
  mix:new THREE.CatmullRomCurve3([MIX,V3(BX2-0.05,SY+0.42,FZ),V3(KNOB.x-0.05,SY+0.47,FZ),V3(KNOB.x,KNOB.y-0.04,FZ+0.004),
    V3(KNOB.x+0.06,KNOB.y+0.05,FZ),V3(GM,SY+0.95,FZ),V3(SFC_WIN.x,SY+0.95,FZ),V3(SFC_WIN.x,COL_TOP+0.04,COL_Z)],false,"centripetal"),
  out:new THREE.CatmullRomCurve3([V3(SFC_WIN.x,COL_BOT-0.04,COL_Z),V3(SFC_WIN.x,SY+0.11,FZ),V3(GR,SY+0.10,FZ),
    V3(GR,SY+1.10,FZ),V3(CX2+0.205,SY+1.17,FZ-0.012),V3(GR,SY+1.24,FZ),V3(DX-0.36,SY+1.0,SZ+0.1),
    V3(DX-0.36,SY+0.95,SFC_BOARD_Z+0.03)],false,"centripetal"),
};
const sfcSteel=mat(0xb9c4cb,{metalness:0.6,roughness:0.32});
["mix","out"].forEach(k=>gSFC.add(new THREE.Mesh(new THREE.TubeGeometry(FLOW[k],90,0.0035,6,false),sfcSteel)));
gSFC.add(new THREE.Mesh(new THREE.TubeGeometry(FLOW.mod,60,0.004,6,false),sfcMat.tube));
gSFC.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(FLOW.co2.points.slice(3),false,"chordal",0),40,0.005,6,false),sfcSteel));
cyl(0.009,0.009,0.03,sfcMat.satin,MIX.x,MIX.y,MIX.z,gSFC,12);                              // the mixing tee
box(0.05,0.05,0.016,sfcMat.satin,DX-0.36,SY+0.95,SFC_BOARD_Z+0.03,gSFC);                    // distribution valve

// Everything the live run uses (js/basement/sfc.js): keep these names.
const SFC_PARTS={
  lcd:{co2:sfcScreens[0],mod:sfcScreens[1],inj:sfcScreens[2],oven:sfcScreens[3],det:sfcScreens[4]},
  injKnob:sfcKnobInj,
  column:{a:V3(SFC_WIN.x,COL_TOP,COL_Z),b:V3(SFC_WIN.x,COL_BOT,COL_Z),r:COL_R*0.75},
  cell:sfcCellMat, flow:FLOW, fractions:sfcFractions,
  vent:V3(DX,SY+0.99,SFC_BOARD_Z+0.03),
  views:{col:{c:V3(SFC_WIN.x,SFC_WIN.y,COL_Z),w:0.46,h:0.72},inj:{c:V3(BX2+0.06,SY+0.72,SF+0.05),w:0.74,h:0.44}},
};

// chiller on the floor at the end of the bench, coolant lines up to the CO₂ pump head
box(0.5, 0.62, 0.56, 0xe7ebec, -2.78, BY + 0.31, -3.85, basement);
box(0.36, 0.3, 0.012, 0x3a4248, -2.78, BY + 0.3, -3.564, basement);
const chillLcd = screenTex(120, 40, lcdLines); chillLcd.draw(["COOL  5.0C", "RUN"]);
plane(0.14, 0.047, new THREE.MeshBasicMaterial({ map: chillLcd.t }), -2.78, BY + 0.53, -3.564, 0, basement);
const hoseMat2 = mat(0x2a2f33, { roughness: 0.7 });
[0, 1].forEach(i => basement.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.68 + i * 0.08, BY + 0.62, -3.95), new THREE.Vector3(-2.55 + i * 0.08, BY + 1.5, -4.05), new THREE.Vector3(AX - 0.2 + i * 0.06, SY + 0.32, -4.12)]), 30, 0.014, 8, false), hoseMat2)));
hotspots.find(h => h.key === "sfc").focus = { center: new THREE.Vector3(-0.43, SY + 0.62, SZ + 0.05), size: new THREE.Vector3(3.0, 1.45, 0.8) };
