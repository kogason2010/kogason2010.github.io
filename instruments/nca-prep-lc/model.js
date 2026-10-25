/* instruments/nca-prep-lc/model.js — Prep LC on the left-wall bench, with its fraction collector.
   Revised from photos: two LC-20AP prep pumps, autosampler, SPD-20A detector and CBM-20A controller, the tall column
   cabinet with its window, and the fraction collector with three racks of 24 tubes. Faces +x.
   NCA builds its instruments the first time you walk in, so this one is a function that js/chemistry/instruments.js
   calls. js/chemistry/lc.js moves the collector's arm (fArm, fHead) over the tubes listed in prepTubes.
   The site loads this file as it is. To work on it offline, open index.html in this folder (see instruments/README.md).
   Built from the shared building blocks in js/core/helpers.js (box, cyl, plane, mat, tex, led, …). Sizes are in metres;
   +x points right, +y up and +z toward the front of the room.
   Other files use these names, so keep them as they are:
     buildPrepLc (js/chemistry/instruments.js) */
"use strict";

function buildPrepLc() {
  const PREP_T=CH.top;
  const gP=hotGroup("prep","Prep LC",new THREE.Vector3(-3.7,PREP_T+1.05,2.4),chem,"chem");
  box(0.78,PREP_T-0.06,3.4,C.cab,-3.8,(PREP_T-0.06)/2,1.7,gP);
  for(let z=0;z<3.39;z+=0.68){
    box(0.014,PREP_T-0.28,0.66,C.cab,-3.403,(PREP_T-0.28)/2+0.1,z+0.34,gP,{roughness:0.55});
  }
  box(0.82,0.06,3.44,C.epoxy,-3.8,PREP_T-0.03,1.7,gP);
  // Local +Z is the instrument front; rotating the complete system keeps all parts aligned.
  const prepUnit=new THREE.Group();prepUnit.position.set(-3.8,PREP_T,1.7);
  prepUnit.rotation.y=Math.PI/2;gP.add(prepUnit);
  const PF=0.38,PD=0.76;
  const prepMat={
    body:mat(0x252d32,{roughness:0.58,metalness:0.12}),
    door:mat(0x464e54,{roughness:0.56,metalness:0.15}),
    control:mat(0x242d32,{roughness:0.48,metalness:0.09}),
    side:mat(0xbac3c7,{roughness:0.62,metalness:0.09}),
    dark:mat(0x0c151b,{roughness:0.79,metalness:0.02}),
    black:mat(0x172128,{roughness:0.37,metalness:0.12}),
    key:mat(0x7c8b93,{roughness:0.53,metalness:0.17}),
    steel:mat(0xb9c4cb,{roughness:0.30,metalness:0.55}),
    satin:mat(0x8a989f,{roughness:0.42,metalness:0.42}),
    white:mat(0xe0e5e6,{roughness:0.57,metalness:0.03}),
    rack:mat(0xcad3d7,{roughness:0.60,metalness:0.02}),
    blue:mat(0x457f99,{roughness:0.48}),
    tube:mat(0xc6d5da,{roughness:0.49}),
    green:new THREE.MeshStandardMaterial({color:0x3f9961,
      emissive:0x136b3b,emissiveIntensity:0.48,roughness:0.52})
  };
  Object.values(prepMat).forEach(m=>m.color.convertSRGBToLinear());
  prepMat.window=new THREE.MeshStandardMaterial({
    color:new THREE.Color(0x23343e).convertSRGBToLinear(),transparent:true,
    opacity:0.22,roughness:0.16,metalness:0.06,depthWrite:false,side:THREE.DoubleSide
  });
  prepMat.glass=new THREE.MeshStandardMaterial({color:0xc6dee7,
    transparent:true,opacity:0.23,roughness:0.13,metalness:0.01,
    depthWrite:false,side:THREE.DoubleSide});
  prepMat.liquid=new THREE.MeshStandardMaterial({color:0xdce8df,
    transparent:true,opacity:0.14,roughness:0.15,depthWrite:false});

  function prepShape(w,h,r){
    const s=new THREE.Shape(),l=-w/2,q=w/2,b=-h/2,t=h/2;
    s.moveTo(l+r,b);s.lineTo(q-r,b);s.quadraticCurveTo(q,b,q,b+r);
    s.lineTo(q,t-r);s.quadraticCurveTo(q,t,q-r,t);
    s.lineTo(l+r,t);s.quadraticCurveTo(l,t,l,t-r);
    s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);s.closePath();return s;
  }
  function prepPanel(w,h,r,d,material,x,y,z,parent=prepUnit){
    const m=new THREE.Mesh(new THREE.ExtrudeGeometry(prepShape(w,h,r),{
      depth:d,steps:1,curveSegments:12,bevelEnabled:true,
      bevelSize:0.0015,bevelThickness:0.0015,bevelSegments:3
    }),material);
    m.position.set(x,y,z-d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function prepBox(w,h,d,material,x,y,z,parent=prepUnit){return box(w,h,d,material,x,y,z,parent);}
  function prepCylinder(r,h,material,x,y,z,parent=prepUnit,segments=24){
    return cyl(r,r,h,material,x,y,z,parent,segments);
  }
  function prepCurve(points,r,material=prepMat.tube,parent=prepUnit){
    const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
      points.map(p=>new THREE.Vector3(...p)),false,"centripetal"),40,r,8,false),material);
    m.castShadow=true;parent.add(m);return m;
  }
  function prepDecal(w,h,t,x,y,z,parent=prepUnit){
    return plane(w,h,new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}),x,y,z,0,parent);
  }
  function prepLabel(text,w,h,x,y,z,parent=prepUnit){
    const t=tex((g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle="#c3d0d3";
      g.font="34px Arial";g.textBaseline="middle";g.fillText(text,3,H/2);
    },Math.max(96,text.length*21),48);
    return prepDecal(w,h,t,x,y,z,parent);
  }
  function prepPower(x,y,z){
    const m=new THREE.Mesh(new THREE.RingGeometry(0.0036,0.005,18),prepMat.satin);
    m.position.set(x,y,z);prepUnit.add(m);
  }
  function prepCase(cx,y,h,w=0.62){
    prepBox(w-0.008,h-0.008,PD-0.028,prepMat.side,cx,y+h/2,-0.007);
    prepPanel(w-0.002,h-0.006,0.003,0.040,prepMat.body,cx,y+h/2,PF+0.020);
    prepBox(w-0.006,0.005,0.013,prepMat.dark,cx,y+h-0.003,PF+0.024);
    for(const side of [-1,1]){
      prepBox(0.007,h-0.011,0.034,prepMat.body,cx+side*(w/2-0.001),y+h/2,PF-0.001);
    }
  }
  const prepKeyGeo=new THREE.CylinderGeometry(0.004,0.004,0.002,12);
  function prepControls(cx,y,h,mode,label){
    const w=0.198;
    prepPanel(w,h-0.015,0.002,0.014,prepMat.control,cx,y+h/2,PF+0.036);
    if(mode==="keypad"){
      const lcd=tex((g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle="#c9d4cf";
        g.font="17px monospace";[label,"FLOW  40.0 mL/min","READY     REMOTE"].forEach((s,i)=>g.fillText(s,4,20+i*20));
      },256,72);
      prepDecal(0.174,0.050,lcd,cx,y+h-0.043,PF+0.041);
      const rows=h>0.40?7:5,pitch=h>0.40?0.041:0.027;
      for(let row=0;row<rows;row++){
        for(let col=0;col<4;col++){
          const key=new THREE.Mesh(prepKeyGeo,prepMat.key);key.rotation.x=Math.PI/2;
          key.position.set(cx-0.064+col*0.029,y+h-0.100-row*pitch,PF+0.042);prepUnit.add(key);
        }
        const ring=new THREE.Mesh(new THREE.TorusGeometry(0.006,0.0009,5,16),prepMat.key);
        ring.position.set(cx+0.065,y+h-0.100-row*pitch,PF+0.043);prepUnit.add(ring);
      }
      prepBox(0.004,Math.min(0.095,h*0.27),0.003,prepMat.green,cx+0.085,y+h-0.080,PF+0.043);
    }else{
      prepBox(0.005,Math.min(0.096,h*0.35),0.003,prepMat.green,cx-0.079,y+h*0.53,PF+0.043);
      prepLabel("STATUS",0.058,0.010,cx+0.025,y+h-0.045,PF+0.043);
    }
    prepLabel(label,0.106,0.009,cx-0.029,y+0.015,PF+0.044);
    prepPower(cx-0.080,y+0.034,PF+0.044);
  }
  function prepDoor(cx,y,h,w=0.62){
    const doorW=w-0.224,doorX=cx+0.108;
    prepPanel(doorW,h-0.018,0.004,0.020,prepMat.door,doorX,y+h/2,PF+0.044);
    prepBox(0.021,h-0.014,0.013,prepMat.dark,cx-w/2+0.210,y+h/2,PF+0.035);
    prepBox(0.006,h-0.020,0.007,prepMat.satin,cx-w/2+0.200,y+h/2,PF+0.045);
    prepLabel("SHIMADZU",0.095,0.009,cx+w/2-0.058,y+0.015,PF+0.048);
  }
  function prepPump(cx,y){
    const h=0.51;prepCase(cx,y,h);prepControls(cx-0.209,y,h,"keypad","LC-20AP");prepDoor(cx,y,h);
    // Perforated upper door band and the round manual valve knob.
    prepPanel(0.392,0.086,0.002,0.003,prepMat.control,cx+0.108,y+h-0.055,PF+0.048);
    const vents=new THREE.InstancedMesh(new THREE.CircleGeometry(0.0016,8),prepMat.dark,42);
    const matrix=new THREE.Matrix4();let n=0;
    for(let row=0;row<3;row++)for(let col=0;col<14;col++){
      matrix.makeTranslation(cx-0.072+col*0.026,y+h-0.032-row*0.020,PF+0.051);
      vents.setMatrixAt(n++,matrix);
    }prepUnit.add(vents);
    const knob=prepCylinder(0.031,0.010,prepMat.dark,cx+0.163,y+h-0.058,PF+0.058,prepUnit,36);
    knob.rotation.x=Math.PI/2;
    const face=prepCylinder(0.024,0.007,prepMat.door,cx+0.163,y+h-0.058,PF+0.066,prepUnit,32);
    face.rotation.x=Math.PI/2;
    prepBox(0.003,0.024,0.002,prepMat.satin,cx+0.163,y+h-0.055,PF+0.071);
  }
  function prepSlim(cx,y,h,label){
    prepCase(cx,y,h);prepDoor(cx,y,h);
    prepPanel(0.198,h-0.015,0.002,0.014,prepMat.black,cx-0.209,y+h/2,PF+0.036);
    prepLabel(label,0.098,0.010,cx-0.228,y+0.020,PF+0.043);
    prepBox(0.005,0.006,0.002,prepMat.green,cx-0.183,y+h*0.56,PF+0.043);
  }

  // LEFT: two large prep pumps, two slim units and a shallow upper cover.
  const PUMP_X=-1.31;
  prepPump(PUMP_X,0);prepSlim(PUMP_X,0.51,0.14,"DEGASSER");
  prepPump(PUMP_X,0.65);prepSlim(PUMP_X,1.16,0.14,"SYSTEM");
  prepCase(PUMP_X,1.30,0.14);
  prepPanel(0.609,0.119,0.003,0.014,prepMat.door,PUMP_X,1.37,PF+0.037);
  prepLabel("SHIMADZU",0.096,0.009,PUMP_X+0.246,1.316,PF+0.042);

  // SECOND STACK: sampler, UV detector and compact controller/status module.
  const MID_X=-0.655,MID_W=0.60;
  prepCase(MID_X,0,0.64,MID_W);
  prepPanel(0.374,0.454,0.002,0.008,prepMat.dark,MID_X+0.106,0.398,PF+0.028);
  prepPanel(0.312,0.413,0.002,0.004,prepMat.black,MID_X+0.112,0.409,PF+0.033);
  prepControls(MID_X-MID_W/2+0.101,0.338,0.302,"status","AUTOSAMPLER");
  prepBox(0.006,0.292,0.007,prepMat.satin,MID_X-0.100,0.489,PF+0.045);
  prepPanel(MID_W-0.016,0.151,0.003,0.024,prepMat.door,MID_X,0.087,PF+0.041);
  prepPanel(0.430,0.139,0.003,0.065,prepMat.door,MID_X-0.066,0.173,PF+0.096);
  prepBox(0.423,0.015,0.011,prepMat.dark,MID_X-0.066,0.098,PF+0.090);
  prepLabel("SHIMADZU",0.095,0.009,MID_X+0.240,0.014,PF+0.048);
  prepCase(MID_X,0.64,0.39,MID_W);
  prepControls(MID_X-MID_W/2+0.101,0.64,0.39,"keypad","SPD-20A");
  prepDoor(MID_X,0.64,0.39,MID_W);
  prepCase(MID_X,1.03,0.29,MID_W);
  prepControls(MID_X-MID_W/2+0.101,1.03,0.29,"status","CBM-20A");
  prepDoor(MID_X,1.03,0.29,MID_W);

  // TALL COLUMN CABINET: a deep smoked window with visible column hardware inside.
  const COLUMN_X=-0.010,COLUMN_W=0.61,COLUMN_H=1.30;
  prepBox(COLUMN_W-0.010,COLUMN_H-0.012,PD-0.142,prepMat.side,COLUMN_X,COLUMN_H/2,-0.071);
  prepPanel(0.391,1.164,0.003,0.008,prepMat.dark,COLUMN_X+0.010,0.650,PF-0.103);
  prepBox(0.040,1.143,0.114,prepMat.dark,COLUMN_X-0.180,0.650,PF-0.043);
  prepBox(0.040,1.143,0.114,prepMat.dark,COLUMN_X+0.200,0.650,PF-0.043);
  for(const side of [-1,1]){
    prepPanel(0.129,COLUMN_H-0.010,0.004,0.042,prepMat.body,
      COLUMN_X+side*(COLUMN_W/2-0.0645),COLUMN_H/2,PF+0.039);
  }
  for(const y of [0.050,COLUMN_H-0.050]){
    prepPanel(COLUMN_W-0.008,0.098,0.003,0.042,prepMat.body,COLUMN_X,y,PF+0.039);
  }
  prepBox(0.279,0.020,0.086,prepMat.satin,COLUMN_X+0.010,0.264,PF-0.045);
  prepBox(0.279,0.014,0.086,prepMat.satin,COLUMN_X+0.010,0.953,PF-0.045);
  prepCylinder(0.006,0.916,prepMat.steel,COLUMN_X-0.107,0.665,PF-0.035);
  const prepCol=prepCylinder(0.026,0.622,prepMat.steel,COLUMN_X+0.024,0.644,PF-0.024,prepUnit,36);
  prepCol.name="Prep column inside window";
  for(const y of [0.327,0.962]){
    prepCylinder(0.037,0.032,prepMat.satin,COLUMN_X+0.024,y,PF-0.024);
    prepCylinder(0.012,0.048,prepMat.blue,COLUMN_X+0.024,y+(y>0.6?0.034:-0.034),PF-0.024);
  }
  for(const y of [0.405,0.875]){
    prepBox(0.161,0.018,0.026,prepMat.black,COLUMN_X-0.044,y,PF-0.038);
  }
  const injection=prepCylinder(0.033,0.014,prepMat.satin,COLUMN_X-0.084,1.075,PF-0.027);
  injection.rotation.x=Math.PI/2;
  prepCurve([[COLUMN_X-0.078,1.077,PF-0.012],[COLUMN_X+0.087,1.125,PF+0.002],
    [COLUMN_X+0.112,1.027,PF+0.003],[COLUMN_X+0.024,0.994,PF-0.024]],0.0025,prepMat.steel);
  prepPanel(0.345,1.104,0.002,0.002,prepMat.window,COLUMN_X+0.010,0.650,PF+0.042);
  prepPanel(0.017,0.216,0.002,0.004,prepMat.dark,COLUMN_X+0.247,0.654,PF+0.048);
  prepLabel("PREP LC",0.089,0.010,COLUMN_X-0.196,1.276,PF+0.045);

  // FRACTION COLLECTOR: three removable racks under a wide dark gantry hood.
  const FCX=1.010,FCW=1.18,FCD=0.82;
  prepPanel(FCW,0.105,0.004,FCD,prepMat.body,FCX,0.064,0.430);
  prepBox(FCW-0.030,0.019,FCD-0.030,prepMat.door,FCX,0.126,0.020);
  prepBox(0.012,0.030,0.003,prepMat.green,FCX-FCW/2+0.025,0.064,0.436);
  prepLabel("FRACTION COLLECTOR",0.243,0.011,FCX-FCW/2+0.171,0.029,0.437);
  prepLabel("SHIMADZU",0.098,0.010,FCX+FCW/2-0.062,0.029,0.437);
  prepPanel(1.094,0.985,0.002,0.022,prepMat.white,FCX,0.654,-0.310);
  // Rear mast projects above the horizontal cover, as in the reference.
  prepPanel(0.161,1.532,0.003,0.129,prepMat.white,FCX+0.421,0.909,-0.259);
  prepBox(0.080,0.011,0.002,prepMat.green,FCX+0.421,1.615,-0.251);
  prepPanel(FCW+0.010,0.214,0.004,0.395,prepMat.body,FCX,1.191,0.111);
  prepPanel(FCW-0.036,0.174,0.002,0.005,prepMat.black,FCX,1.190,0.119);
  prepPanel(FCW-0.056,0.129,0.001,0.002,prepMat.window,FCX,1.192,0.123);
  prepBox(0.034,0.997,0.041,prepMat.satin,FCX-FCW/2+0.033,0.650,-0.268);

  // Gauge and wash fitting on the backplate.
  const gauge=prepCylinder(0.035,0.012,prepMat.dark,FCX+0.032,0.830,-0.287);gauge.rotation.x=Math.PI/2;
  const dial=prepCylinder(0.028,0.012,prepMat.white,FCX+0.032,0.830,-0.277);dial.rotation.x=Math.PI/2;
  const gaugeNeedle=prepBox(0.002,0.022,0.002,prepMat.black,FCX+0.037,0.835,-0.269);gaugeNeedle.rotation.z=-0.47;
  prepCylinder(0.018,0.152,prepMat.steel,FCX-0.410,0.737,-0.238);
  prepCurve([[FCX-0.410,0.815,-0.238],[FCX-0.350,0.875,-0.220],
    [FCX-0.315,0.815,-0.170]],0.003,prepMat.steel);

  // Three white racks hold 72 clear collection tubes, arranged four by six per rack.
  const RACK_CENTERS=[FCX-0.337,FCX,FCX+0.337];
  const prepTubePositions=[];
  for(const [rackIndex,cx] of RACK_CENTERS.entries()){
    const rack=prepPanel(0.280,0.174,0.008,0.017,prepMat.white,cx,0.238,0.331);
    rack.name="Collection rack "+(rackIndex+1);
    prepBox(0.280,0.016,0.601,prepMat.rack,cx,0.157,0.022);
    for(const side of [-1,1]){
      prepBox(0.012,0.174,0.600,prepMat.rack,cx+side*0.134,0.238,0.022);
    }
    prepPanel(0.171,0.026,0.006,0.002,prepMat.rack,cx,0.243,0.334);
    for(let row=0;row<6;row++)for(let col=0;col<4;col++){
      prepTubePositions.push([cx+(col-1.5)*0.047,0.020+(row-2.5)*0.077]);
    }
  }
  const tubeM=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0130,0.0130,0.270,14,1,true),prepMat.glass,72);
  const tubeRims=new THREE.InstancedMesh(new THREE.TorusGeometry(0.0131,0.0018,5,16),prepMat.glass,72);
  const fillM=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0113,0.0113,0.063,14),prepMat.liquid,72);
  const m4=new THREE.Matrix4(),rimRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
  prepTubePositions.forEach(([x,z],i)=>{
    m4.makeTranslation(x,0.356,z);tubeM.setMatrixAt(i,m4);
    m4.compose(new THREE.Vector3(x,0.492,z),rimRotation,new THREE.Vector3(1,1,1));tubeRims.setMatrixAt(i,m4);
    m4.makeTranslation(x,0.253,z);fillM.setMatrixAt(i,m4);
  });
  tubeM.name="72 clear collection tubes";tubeM.renderOrder=3;tubeRims.renderOrder=3;fillM.renderOrder=2;
  prepUnit.add(tubeM,tubeRims,fillM);

  // Sliding arm and dispensing head remain separate for the collector animation.
  const fArm=new THREE.Group();fArm.position.set(FCX+0.337,1.074,0);prepUnit.add(fArm);
  prepBox(0.062,0.036,0.626,prepMat.satin,0,0,0.010,fArm);
  const fHead=new THREE.Group();fHead.position.z=0.174;fArm.add(fHead);
  prepPanel(0.095,0.383,0.003,0.087,prepMat.white,0,-0.196,0.049,fHead);
  prepCylinder(0.008,0.029,prepMat.blue,0,-0.407,0.012,fHead,16);
  prepCylinder(0.0027,0.146,prepMat.steel,0,-0.486,0.012,fHead,10);
  Object.assign(FX_CHEM,{fArm,fHead,prepTubes:prepTubePositions});
  prepCurve([[COLUMN_X+0.024,0.290,PF-0.024],[COLUMN_X+0.163,0.165,PF+0.018],
    [FCX-0.534,0.194,0.250],[FCX-0.443,0.651,-0.202]],0.003,prepMat.tube);

  // Dark feet under the stacks and chamber.
  for(const [cx,w] of [[PUMP_X,0.62],[MID_X,MID_W],[COLUMN_X,COLUMN_W]]){
    prepBox(w-0.012,0.019,PD-0.010,prepMat.dark,cx,0.010,0);
    for(const side of [-1,1]){
      prepBox(0.055,0.022,0.074,prepMat.dark,cx+side*(w/2-0.046),0.011,0.268);
    }
  }
}
