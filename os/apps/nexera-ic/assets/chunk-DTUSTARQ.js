import{A as m,B as Te,D as rt,F as ot,G as at,H as Ce,I as nt,r as Y,s as xe,t as k,u as Qe,v as Je,w as ie,x as Ke,y as et}from"./chunk-CE73LPWX.js";import{f as X,g as ae}from"./chunk-656KD425.js";import{a as it,b as st}from"./chunk-WHY5VXEL.js";import{$ as tt,A as j,C as we,D as U,G as _e,H as We,I as Fe,K as qe,O as De,P as Pe,Q as Ne,S as je,T as Ye,U as Xe,V as _,W as Ze,X as $e,Z,_ as C,b as H,d as K,e as L,f as Be,h as de,k as Ie,l as ee,m as Le,p as N,q as be,s as E,t as te,u as Ue,w as ne,y as R,z as ve}from"./chunk-45CVEOLQ.js";var Ae=H(K(),1);var ge={c:0,sigma:0,inColumn:!1};function lt(){return C((e,t)=>{let a=de.progress,i=1-Math.exp(-t*6);m.p+=(a-m.p)*i,Math.abs(a-m.p)<1e-5&&(m.p=a);let s=m.p;m.sim=ot(s),m.minutes=m.sim*Je,m.inject=at(s),m.signal=et(m.minutes),m.time=e.clock.elapsedTime,ie.forEach((v,p)=>{Ke(v,m.sim,ge),m.c[p]=ge.c,m.sigma[p]=ge.sigma,m.inColumn[p]=ge.inColumn?1:0,m.amp[p]=Math.min(1.2,.22/ge.sigma*(.45+Math.min(1,v.h/5)))})},-10),null}var se=H(K(),1);function ut({reducedMotion:e}){let{camera:t,size:a}=Z(),i=(0,se.useMemo)(()=>({pos:[0,0,0],target:[0,0,0]}),[]),s=(0,se.useMemo)(()=>new E,[]),v=(0,se.useMemo)(()=>new E,[]),p=(0,se.useMemo)(()=>new E(-9,.3,0),[]),c=(0,se.useMemo)(()=>new be,[]);return C((n,d)=>{let r=a.width/a.height;if(e?(s.fromArray(Ce.pos),v.fromArray(Ce.target)):(nt(m.p,i),s.fromArray(i.pos),v.fromArray(i.target)),r<1.25){let g=s.clone().sub(v),u=N.clamp(1.25/r,1,2.3);if(s.copy(v).add(g.multiplyScalar(u)),!e){let b=m.p,y=N.lerp(3.4,0,N.smoothstep(b,.02,.1)),l=N.lerp(-1.6,-.5,N.smoothstep(b,.02,.1));v.x+=y,s.x+=y,v.y+=l,s.y+=l}}let h=e?0:1;c.x+=(de.pointerX*h-c.x)*(1-Math.exp(-d*3)),c.y+=(de.pointerY*h-c.y)*(1-Math.exp(-d*3)),s.x+=c.x*.45,s.y+=c.y*.3,t.position.lerp(s,1-Math.exp(-d*5)),p.lerp(v,1-Math.exp(-d*5)),t.lookAt(p)}),null}var ye=H(K(),1);var mt=`
  uniform float uC[7];
  uniform float uSg[7];
  uniform float uAmp[7];
  uniform vec3 uCol[7];
  vec4 bandColor(float s) {
    vec3 col = vec3(0.0);
    float a = 0.0;
    for (int i = 0; i < 7; i++) {
      float d = (s - uC[i]) / uSg[i];
      float c = uAmp[i] * exp(-0.5 * d * d);
      col += uCol[i] * c;
      a += c;
    }
    return vec4(col, a);
  }
`,ct=`
  attribute float aS;
  varying float vS;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vS = aS;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,ft=`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uTintAfter;   // analytes fade after leaving the cell (they go on to waste)
  ${mt}
  varying float vS;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    vec4 b = bandColor(vS);
    float after = 1.0 - 0.7 * smoothstep(uTintAfter, uTintAfter + 1.5, vS);
    b *= after;
    // eluent: faint cyan liquid with streaks drifting downstream
    float streak = smoothstep(0.82, 1.0, sin(vS * 9.0 - uTime * 4.0) * 0.5 + 0.5);
    vec3 eluent = vec3(0.32, 0.55, 0.75) * (0.28 + 0.18 * streak);
    vec3 wall = vec3(0.75, 0.84, 0.95) * fres * 0.55;
    float conc = clamp(b.a, 0.0, 1.0);
    vec3 col = mix(eluent, b.rgb / max(b.a, 1e-3), conc) * (1.0 + conc * 0.9) + wall;
    float alpha = (0.42 + fres * 0.4 + conc * 0.45) * uOpacity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`,Se=`
  uniform float uS0;
  uniform float uS1;
  varying float vS;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vS = mix(uS0, uS1, uv.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,He=`
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uBase;
  uniform float uBandGain;
  uniform float uFlow;
  ${mt}
  varying float vS;
  varying vec2 vUv;
  void main() {
    vec4 b = bandColor(vS) * uBandGain;
    float conc = clamp(b.a, 0.0, 1.0);
    float streak = smoothstep(0.86, 1.0, sin(vUv.x * 40.0 - uTime * 3.0 * uFlow + vUv.y * 3.0) * 0.5 + 0.5) * uFlow;
    vec3 col = mix(uBase * (0.85 + 0.25 * streak), b.rgb / max(b.a, 1e-3), conc * 0.85);
    float edge = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    gl_FragColor = vec4(col, (0.26 + conc * 0.42 + streak * 0.05) * uOpacity * (0.6 + 0.4 * edge));
  }
`,le=`
  uniform float uSim;
  uniform float uTime;
  uniform float uPix;
  uniform float uSize;
  uniform float uMode;      // 0 column, 1 suppressor channel, 2 magnified cell
  uniform float uS0;
  uniform float uS1;
  uniform vec3 uOrigin;     // world position of s = uS0 on the channel axis
  uniform float uScale;     // world units per unit of s
  uniform vec3 uHalf;       // channel half-extent in y and z (x unused)
  uniform float uFb[8];     // fraction of time held on the stationary phase (7 analytes + eluent)
  uniform float uOpacity;
  uniform float uC[7];
  uniform float uSg[7];

  attribute vec4 aSeed;     // x: N(0,1), y: U(0,1), z: U(0,1), w: U(0,1)
  attribute float aBand;    // 0..6 analyte, 7 carbonate eluent

  varying float vType;
  varying float vBand;
  varying float vBound;
  varying float vAlpha;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    int b = int(aBand + 0.5);
    float L = uS1 - uS0;
    float s;
    float bound = 0.0;
    float cycleId = 0.0;
    if (b < 7) {
      float c = 0.0; float sg = 1.0;
      for (int i = 0; i < 7; i++) { if (i == b) { c = uC[i]; sg = uSg[i]; } }
      s = c + aSeed.x * sg;
      if (uMode < 0.5) {
        float fb = 0.0;
        for (int i = 0; i < 7; i++) { if (i == b) fb = uFb[i]; }
        float P = 0.9;
        float ph = uSim / P + aSeed.y;
        float phi = fract(ph);
        cycleId = floor(ph);
        float vb = 1.0 - fb;
        float A = vb * fb * P;
        s += phi < fb ? (A * 0.5 - vb * phi * P) : (-A * 0.5 + fb * (phi - fb) * P);
        bound = phi < fb ? 1.0 : 0.0;
      } else {
        // free solution: gentle drift with the flow (idle motion even when scroll pauses)
        s += sin(uTime * 0.9 + aSeed.y * 30.0) * 0.015;
        cycleId = floor(uTime * 0.25 + aSeed.y);
      }
    } else {
      float fb = uFb[7];
      float P = 1.4;
      float ph = uTime / P + aSeed.y * 7.0;
      float phi = fract(ph);
      cycleId = floor(ph);
      float base = fract(aSeed.z + uTime * 0.035);
      s = uS0 + base * L;
      float vb = 1.0 - fb;
      float A = vb * fb * P * 0.35;
      s += phi < fb ? (A * 0.5 - vb * phi * P * 0.35) : (-A * 0.5 + fb * (phi - fb) * P * 0.35);
      bound = phi < fb ? 1.0 : 0.0;
    }

    float inside = step(uS0, s) * step(s, uS1);
    float h1 = hash(aSeed.w * 91.7 + cycleId * 13.1);
    float h2 = hash(aSeed.z * 47.3 + cycleId * 7.7);
    vec3 p = uOrigin + vec3((s - uS0) * uScale, 0.0, 0.0);
    if (uMode < 0.5) {
      // back half of the bed (the front half is cut away): y\xB2 + z\xB2 < R\xB2, z \u2264 0
      float r = sqrt(h1) * uHalf.y;
      float a = 3.14159265 * h2;
      p.y += cos(a) * r;
      p.z += -sin(a) * r * uHalf.z / uHalf.y + 0.02;
    } else {
      p.y += (h1 * 2.0 - 1.0) * uHalf.y;
      p.z += (h2 * 2.0 - 1.0) * uHalf.z;
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = b < 7 ? 1.0 : 0.72;
    gl_PointSize = inside * uSize * size * uPix / max(0.5, -mv.z);
    vType = b < 7 ? 0.0 : (uMode > 1.5 ? 4.0 : 1.0);
    vBand = float(b);
    vBound = bound;
    vAlpha = inside * uOpacity;
  }
`,$=`
  uniform vec3 uCol[7];
  varying float vType;
  varying float vBand;
  varying float vBound;
  varying float vAlpha;

  float bar(vec2 q, vec2 h) { vec2 d = abs(q) - h; return 1.0 - smoothstep(0.0, 0.04, max(d.x, d.y)); }

  void main() {
    vec2 q = gl_PointCoord - 0.5;
    q.y = -q.y;
    float d = length(q);
    int t = int(vType + 0.5);
    vec3 col = vec3(0.0);
    float disc = 1.0 - smoothstep(0.36, 0.42, d);
    float minus = bar(q, vec2(0.17, 0.04));
    float plus = max(minus, bar(q, vec2(0.04, 0.17)));
    vec4 o = vec4(0.0);
    if (t == 0) {
      int b = int(vBand + 0.5);
      for (int i = 0; i < 7; i++) { if (i == b) col = uCol[i]; }
      o = vec4(mix(col, vec3(0.03, 0.05, 0.08), minus * 0.9), disc);
      float ring = smoothstep(0.42, 0.45, d) * (1.0 - smoothstep(0.47, 0.5, d)) * vBound;
      o = max(o, vec4(col * 1.3, ring * 0.9));
    } else if (t == 1) {
      col = vec3(0.56, 0.62, 0.78);
      o = vec4(mix(col, vec3(0.04, 0.05, 0.08), minus * 0.9), disc * (0.55 + 0.25 * vBound));
    } else if (t == 2) {
      col = vec3(1.0, 0.72, 0.47);
      o = vec4(mix(col, vec3(0.08, 0.05, 0.03), plus * 0.9), disc);
    } else if (t == 3) {
      col = vec3(0.92, 0.97, 1.0);
      o = vec4(mix(col, vec3(0.05, 0.07, 0.1), plus * 0.9), disc * 0.95);
    } else if (t == 4) {
      float ring = smoothstep(0.26, 0.3, d) * (1.0 - smoothstep(0.38, 0.42, d));
      o = vec4(vec3(0.62, 0.66, 0.72), ring * 0.75);
    } else {
      o = vec4(vec3(1.0, 0.82, 0.5), plus * 0.95);
    }
    if (o.a * vAlpha < 0.02) discard;
    gl_FragColor = vec4(o.rgb, o.a * vAlpha);
  }
`,Me=`
  uniform float uPix;
  uniform float uSize;
  uniform float uOpacity;
  attribute float aType;
  attribute float aScale;
  attribute float aBand;
  varying float vType;
  varying float vBand;
  varying float vBound;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPix / max(0.5, -mv.z);
    vType = aType;
    vBand = aBand;
    vBound = 0.0;
    vAlpha = uOpacity * step(0.001, aScale);
  }
`;var O={uC:{value:new Array(7).fill(-100)},uSg:{value:new Array(7).fill(1)},uAmp:{value:new Array(7).fill(0)},uCol:{value:ie.map(e=>new ne(e.color))}};function pt(){for(let e=0;e<7;e++)O.uC.value[e]=m.c[e],O.uSg.value[e]=m.sigma[e],O.uAmp.value[e]=m.amp[e]}function ht(){return{steel:new _({color:"#aab3be",metalness:.85,roughness:.38,envMapIntensity:.8}),darkSteel:new _({color:"#4a525d",metalness:.7,roughness:.45,envMapIntensity:.7}),peek:new _({color:"#cbbd98",metalness:0,roughness:.6}),peekDark:new _({color:"#30353d",metalness:.1,roughness:.62}),housing:new _({color:"#1d222a",metalness:.3,roughness:.6}),housingLight:new _({color:"#59616c",metalness:.35,roughness:.55}),resin:new _({color:"#6e7c8f",metalness:0,roughness:.55,envMapIntensity:.6}),electrode:new _({color:"#c9ced6",metalness:1,roughness:.3,envMapIntensity:.9}),glass:new Ze({color:"#cfe2f3",roughness:.08,metalness:0,transparent:!0,opacity:.22,depthWrite:!1,side:ee,envMapIntensity:1.2}),membrane:new _({color:"#c9a6ff",metalness:0,roughness:.7,transparent:!0,opacity:.45,side:ee,depthWrite:!1}),line:new We({color:"#8fa6c2",transparent:!0,opacity:.55}),dashed:new $e({color:"#9fb5d1",transparent:!0,opacity:.6,dashSize:.08,gapSize:.06})}}var Ge=H(L(),1),xt=.07;function dt(){let e=(0,ye.useMemo)(()=>new U({vertexShader:ct,fragmentShader:ft,transparent:!0,depthWrite:!1,uniforms:{...O,uTime:{value:0},uOpacity:{value:1},uTintAfter:{value:k.cellOut}}}),[]),t=(0,ye.useMemo)(()=>Qe().map(([a,i])=>{let s=xe.slice(a,i+1),v=new qe(s.map(u=>u.p),!1,"catmullrom",.1),p=Math.max(8,s.length),c=new Xe(v,p,xt,10,!1),n=s[0].s,d=s[s.length-1].s,r=c.attributes.position.count,h=new Float32Array(r),g=c.attributes.uv;for(let u=0;u<r;u++)h[u]=n+g.getX(u)*(d-n);return c.setAttribute("aS",new R(h,1)),c}),[]);return(0,ye.useEffect)(()=>()=>{t.forEach(a=>a.dispose()),e.dispose()},[t,e]),C(()=>{e.uniforms.uTime.value=m.time}),(0,Ge.jsx)("group",{children:t.map((a,i)=>(0,Ge.jsx)("mesh",{geometry:a,material:e,renderOrder:4},i))})}var D=H(K(),1);var o=H(L(),1),W=Y;function vt(e,t=40){let a=(0,D.useMemo)(()=>new De(e.map(([i,s])=>new be(i,s)),t),[e,t]);return(0,D.useEffect)(()=>()=>a.dispose(),[a]),a}var Tt=[[0,0],[.58,0],[.62,.05],[.62,1.85],[.5,2.1],[.24,2.3],[.2,2.5]],St=[[0,0],[.36,0],[.38,.04],[.38,.72],[.2,.86],[.15,.95]];function Ht({m:e}){let t=vt(Tt);return(0,o.jsxs)("group",{position:[W.bottle.x,W.bottle.y,0],children:[(0,o.jsx)("mesh",{geometry:t,material:e.glass,renderOrder:5}),(0,o.jsxs)("mesh",{position:[0,.85,0],renderOrder:3,children:[(0,o.jsx)("cylinderGeometry",{args:[.58,.58,1.65,40]}),(0,o.jsx)("meshStandardMaterial",{color:"#5f8fb8",transparent:!0,opacity:.28,roughness:.2,depthWrite:!1})]}),(0,o.jsx)("mesh",{position:[0,2.56,0],material:e.peekDark,children:(0,o.jsx)("cylinderGeometry",{args:[.24,.24,.2,28]})})]})}function Mt({m:e}){return(0,o.jsxs)("group",{position:[W.pump.x,W.pump.y,0],children:[(0,o.jsx)("mesh",{material:e.housingLight,children:(0,o.jsx)("boxGeometry",{args:[1.35,1.05,.8]})}),(0,o.jsx)("mesh",{material:e.housing,position:[0,-.05,.41],children:(0,o.jsx)("boxGeometry",{args:[1.2,.86,.02]})}),[-.3,.3].map(t=>(0,o.jsxs)("group",{position:[t,.3,.42],children:[(0,o.jsx)("mesh",{material:e.peek,rotation:[Math.PI/2,0,0],position:[0,0,.12],children:(0,o.jsx)("cylinderGeometry",{args:[.2,.2,.24,32]})}),(0,o.jsx)("mesh",{material:e.steel,rotation:[Math.PI/2,0,0],position:[0,0,.27],children:(0,o.jsx)("cylinderGeometry",{args:[.08,.08,.06,6]})}),[-1,1].map(a=>(0,o.jsx)("mesh",{material:e.steel,position:[0,a*.27,.12],children:(0,o.jsx)("cylinderGeometry",{args:[.05,.05,.16,16]})},a))]},t))]})}function Rt({m:e}){let t=(0,D.useRef)(null);return C(()=>{t.current&&(t.current.rotation.z=-m.inject*(Math.PI/3))}),(0,o.jsxs)("group",{position:[W.valve.x,W.valve.y,-.1],children:[(0,o.jsx)("mesh",{material:e.steel,rotation:[Math.PI/2,0,0],children:(0,o.jsx)("cylinderGeometry",{args:[W.valve.r+.06,W.valve.r+.06,.24,48]})}),(0,o.jsxs)("group",{ref:t,position:[0,0,.13],children:[(0,o.jsx)("mesh",{material:e.peekDark,rotation:[Math.PI/2,0,0],children:(0,o.jsx)("cylinderGeometry",{args:[.3,.3,.04,40]})}),(0,o.jsx)("mesh",{material:e.steel,position:[0,.2,.03],children:(0,o.jsx)("boxGeometry",{args:[.05,.16,.02]})})]}),Array.from({length:6},(a,i)=>{let s=i/6*Math.PI*2;return(0,o.jsx)("mesh",{material:e.peek,position:[Math.cos(s)*.43,Math.sin(s)*.43,.16],rotation:[Math.PI/2,0,0],children:(0,o.jsx)("cylinderGeometry",{args:[.065,.065,.1,6]})},i)})]})}function Re({x:e,dir:t,r:a,m:i}){return(0,o.jsxs)("group",{position:[e,0,0],children:[(0,o.jsx)("mesh",{material:i.steel,rotation:[0,0,Math.PI/2],children:(0,o.jsx)("cylinderGeometry",{args:[a+.06,a+.06,.32,6]})}),(0,o.jsx)("mesh",{material:i.peek,rotation:[0,0,Math.PI/2],position:[t*.24,0,0],children:(0,o.jsx)("cylinderGeometry",{args:[.11,.11,.2,6]})})]})}function At({m:e}){let t=W.column,a=t.r+.05,i=(0,D.useMemo)(()=>{let p=u=>new Pe(a,a,u,56,1,!0).rotateZ(Math.PI/2),c=(u,b)=>new Pe(u,u,b,40,1,!0,Math.PI/2,Math.PI).rotateZ(Math.PI/2),n=t.win0-t.x0,d=t.x1-t.win1,r=t.win1-t.win0,h=new je(t.r,a,32,1,-Math.PI/2,Math.PI).rotateY(Math.PI/2),g=new we(r,a-t.r,.004);return{a:p(n),b:p(d),outer:c(a,r),inner:c(t.r,r),ring:h,edge:g,lenA:n,lenB:d,lenW:r}},[t,a]);(0,D.useEffect)(()=>()=>Object.values(i).forEach(p=>typeof p!="number"&&p.dispose()),[i]);let s=W.guard,v=(0,D.useMemo)(()=>new _({color:"#141a22",roughness:.9,metalness:0,side:Ie}),[]);return(0,D.useEffect)(()=>()=>v.dispose(),[v]),(0,o.jsxs)("group",{children:[(0,o.jsx)("mesh",{material:e.housingLight,position:[(s.x0+s.x1)/2,0,0],rotation:[0,0,Math.PI/2],children:(0,o.jsx)("cylinderGeometry",{args:[s.r,s.r,s.x1-s.x0,32]})}),(0,o.jsx)(Re,{x:s.x0,dir:-1,r:s.r-.04,m:e}),(0,o.jsx)(Re,{x:s.x1,dir:1,r:s.r-.04,m:e}),(0,o.jsx)("mesh",{geometry:i.a,material:e.housingLight,position:[t.x0+i.lenA/2,0,0]}),(0,o.jsx)("mesh",{geometry:i.b,material:e.housingLight,position:[t.win1+i.lenB/2,0,0]}),(0,o.jsx)("mesh",{geometry:i.outer,material:e.housingLight,position:[t.win0+i.lenW/2,0,0]}),(0,o.jsx)("mesh",{geometry:i.inner,material:v,position:[t.win0+i.lenW/2,0,0]}),(0,o.jsx)("mesh",{geometry:i.ring,material:e.steel,position:[t.win0,0,0]}),(0,o.jsx)("mesh",{geometry:i.ring,material:e.steel,position:[t.win1,0,0]}),[1,-1].map(p=>(0,o.jsx)("mesh",{geometry:i.edge,material:e.steel,position:[t.win0+i.lenW/2,p*(t.r+(a-t.r)/2),0]},p)),(0,o.jsx)(Re,{x:t.x0,dir:-1,r:t.r,m:e}),(0,o.jsx)(Re,{x:t.x1,dir:1,r:t.r,m:e})]})}function Bt({m:e}){let t=vt(St,32);return(0,o.jsxs)("group",{position:[W.waste.x,W.waste.y,0],children:[(0,o.jsx)("mesh",{geometry:t,material:e.glass,renderOrder:5}),(0,o.jsxs)("mesh",{position:[0,.2,0],renderOrder:3,children:[(0,o.jsx)("cylinderGeometry",{args:[.35,.35,.36,32]}),(0,o.jsx)("meshStandardMaterial",{color:"#6d7f93",transparent:!0,opacity:.3,roughness:.3,depthWrite:!1})]})]})}function gt({m:e}){return(0,o.jsxs)("group",{children:[(0,o.jsx)(Ht,{m:e}),(0,o.jsx)(Mt,{m:e}),(0,o.jsx)(Rt,{m:e}),(0,o.jsx)(At,{m:e}),(0,o.jsx)(Bt,{m:e})]})}var ue=H(K(),1);var me=H(L(),1),z=Y.column;function yt({m:e,beads:t,ions:a}){let{gl:i}=Z(),{beadMesh:s,siteGeo:v}=(0,ue.useMemo)(()=>{let n=X(31),d=.118,r=[],h=[];for(let P=z.win0+.06;P<z.win1-.06;P+=d)for(let A=-z.r;A<=z.r;A+=d)for(let B=-z.r;B<=.03;B+=d){let F=new E(P+(n()-.5)*.04,A+(n()-.5)*.04,B+(n()-.5)*.04),V=.046+n()*.012;F.y*F.y+F.z*F.z>(z.r-V)**2||F.z>.02||(r.push(F),h.push(V))}let g=Math.min(1,t/r.length),u=[];r.forEach((P,A)=>{n()<g&&u.push(A)});let b=new Ye(1,14,10),y=new _e(b,e.resin,u.length),l=new Ue;u.forEach((P,A)=>{let B=h[P];l.makeScale(B,B,B).setPosition(r[P]),y.setMatrixAt(A,l)});let S=[];u.forEach(P=>{let A=r[P];if(A.z<-.24)return;let B=h[P];for(let F=0;F<2;F++){let V=new E(n()*2-1,n()*2-1,.6+n()*.8).normalize();S.push(A.x+V.x*B*1.02,A.y+V.y*B*1.02,A.z+V.z*B*1.02)}});let q=S.length/3,I=new j;return I.setAttribute("position",new ve(S,3)),I.setAttribute("aType",new ve(new Float32Array(q).fill(5),1)),I.setAttribute("aScale",new ve(new Float32Array(q).fill(1),1)),I.setAttribute("aBand",new ve(new Float32Array(q),1)),{beadMesh:y,siteGeo:I}},[e.resin,t]),p=(0,ue.useMemo)(()=>new U({vertexShader:Me,fragmentShader:$,transparent:!0,depthWrite:!1,uniforms:{...O,uPix:{value:1},uSize:{value:46},uOpacity:{value:1}}}),[]),c=(0,ue.useMemo)(()=>{let n=X(53),d=Math.round(a*3.2),r=a*7+d,h=new Float32Array(r*4),g=new Float32Array(r);for(let l=0;l<r;l++){let S=l>=a*7;g[l]=S?7:l%7,h[l*4]=Math.max(-2.6,Math.min(2.6,ae(n))),h[l*4+1]=n(),h[l*4+2]=n(),h[l*4+3]=n()}let u=new j;u.setAttribute("position",new R(new Float32Array(r*3),3)),u.setAttribute("aSeed",new R(h,4)),u.setAttribute("aBand",new R(g,1)),u.boundingSphere=new te(new E(0,0,0),40);let b=ie.map(l=>l.kc/(1+l.kc)),y=new U({vertexShader:le,fragmentShader:$,transparent:!0,depthWrite:!1,uniforms:{...O,uSim:{value:0},uTime:{value:0},uPix:{value:1},uSize:{value:66},uMode:{value:0},uS0:{value:k.colIn+(z.win0-z.x0)},uS1:{value:k.colIn+(z.win1-z.x0)},uOrigin:{value:new E(z.win0,0,0)},uScale:{value:1},uHalf:{value:new E(0,z.r-.05,z.r-.05)},uFb:{value:[...b,.5]},uOpacity:{value:1}}});return{g:u,mat:y}},[a]);return(0,ue.useEffect)(()=>()=>{s.geometry.dispose(),v.dispose(),p.dispose(),c.g.dispose(),c.mat.dispose()},[s,v,p,c]),C(()=>{let n=i.getPixelRatio(),d=c.mat.uniforms;d.uSim.value=m.sim,d.uTime.value=m.time,d.uPix.value=n,p.uniforms.uPix.value=n}),(0,me.jsxs)("group",{children:[(0,me.jsx)("primitive",{object:s}),(0,me.jsx)("points",{geometry:v,material:p,frustumCulled:!1,renderOrder:6}),(0,me.jsx)("points",{geometry:c.g,material:c.mat,frustumCulled:!1,renderOrder:7})]})}var J=H(K(),1);var x=H(L(),1),G=Y.supp,M=G.x1-G.x0,ce=G.ch,Ee=.26,Ft=ce/2,Q=ce+Ee/2+.06;function Et(e){let t=1/0,a=-1/0;for(let i of xe)i.kind!=="regen"||i.p.y>0!==e||(t=Math.min(t,i.s),a=Math.max(a,i.s));return[t,a]}function Oe(e,t,a,i,s){return new U({vertexShader:Se,fragmentShader:He,transparent:!0,depthWrite:!1,side:ee,uniforms:{...O,uS0:{value:e},uS1:{value:t},uTime:{value:0},uOpacity:{value:1},uBase:{value:new ne(a)},uBandGain:{value:i},uFlow:{value:s}}})}function bt({m:e}){let{gl:t}=Z(),[a,i]=(0,J.useMemo)(()=>Et(!0),[]),[s,v]=(0,J.useMemo)(()=>Et(!1),[]),p=(0,J.useMemo)(()=>({top:Oe(i,a,"#2c4a63",.25,-1),mid:Oe(k.suppIn,k.suppOut,"#3a6e93",1,1),bot:Oe(s,v,"#2c4a63",.25,1)}),[a,i,s,v]),c=(0,J.useMemo)(()=>{let r=X(61),g=34*7,u=new Float32Array(g*4),b=new Float32Array(g);for(let S=0;S<g;S++)b[S]=S%7,u[S*4]=Math.max(-2.4,Math.min(2.4,ae(r))),u[S*4+1]=r(),u[S*4+2]=r(),u[S*4+3]=r();let y=new j;y.setAttribute("position",new R(new Float32Array(g*3),3)),y.setAttribute("aSeed",new R(u,4)),y.setAttribute("aBand",new R(b,1)),y.boundingSphere=new te(new E(0,0,0),40);let l=new U({vertexShader:le,fragmentShader:$,transparent:!0,depthWrite:!1,uniforms:{...O,uSim:{value:0},uTime:{value:0},uPix:{value:1},uSize:{value:46},uMode:{value:1},uS0:{value:k.suppIn},uS1:{value:k.suppOut},uOrigin:{value:new E(G.x0,G.y,.05)},uScale:{value:1},uHalf:{value:new E(0,Ee/2-.04,.12)},uFb:{value:new Array(8).fill(0)},uOpacity:{value:1}}});return{g:y,mat:l}},[]),n=(0,J.useMemo)(()=>{let r=X(71),h=[];for(let y=0;y<34;y++)h.push({type:2,a:r(),b:r(),c:r()});for(let y=0;y<34;y++)h.push({type:3,a:r(),b:r(),c:r()});for(let y=0;y<36;y++)h.push({type:1,a:r(),b:r(),c:r()});for(let y=0;y<28;y++)h.push({type:9,a:r(),b:r(),c:r()});let g=h.length,u=new j;u.setAttribute("position",new R(new Float32Array(g*3),3)),u.setAttribute("aType",new R(new Float32Array(g),1)),u.setAttribute("aScale",new R(new Float32Array(g),1)),u.setAttribute("aBand",new R(new Float32Array(g),1)),u.boundingSphere=new te(new E(G.x0+M/2,0,0),4);let b=new U({vertexShader:Me,fragmentShader:$,transparent:!0,depthWrite:!1,uniforms:{...O,uPix:{value:1},uSize:{value:40},uOpacity:{value:1}}});return{spec:h,g:u,mat:b}},[]);(0,J.useEffect)(()=>()=>{Object.values(p).forEach(r=>r.dispose()),c.g.dispose(),c.mat.dispose(),n.g.dispose(),n.mat.dispose()},[p,c,n]),C(()=>{let r=m.time,h=t.getPixelRatio();for(let l of Object.values(p))l.uniforms.uTime.value=r;c.mat.uniforms.uSim.value=m.sim,c.mat.uniforms.uTime.value=r,c.mat.uniforms.uPix.value=h,n.mat.uniforms.uPix.value=h;let g=n.g.attributes.position,u=n.g.attributes.aType,b=n.g.attributes.aScale,y=.06;n.spec.forEach((l,S)=>{let q=(r*.16+l.a)%1,I=0,P=0,A=l.type,B=1;if(l.type===2){let F=.12+l.b*.55;I=G.x0+q*M;let V=N.smoothstep(q,F,F+.18);P=(l.c-.5)*.12*(1-V)-V*(ce+(l.c-.5)*.1),B=.8}else if(l.type===3){let F=G.x0+.1+l.b*(M-.5),V=N.smoothstep(q,0,.4);P=Q-.08-V*(Q-.08-(l.c-.5)*.12),I=F+Math.max(0,q-.4)*M*.9,B=I>G.x1-.04?0:.62}else if(l.type===1)I=G.x0+q*M,P=(l.b-.5)*.16,A=q>.22+l.c*.4?4:1,B=A===4?.9:.85;else{let F=l.b<.5,V=(r*.1+l.a)%1;I=F?G.x1-V*M:G.x0+V*M,P=(F?1:-1)*(ce+.05+l.c*.05),A=4,B=.4+l.c*.3}g.setXYZ(S,I,P,y+S%5*.012),u.setX(S,A),b.setX(S,B)}),g.needsUpdate=!0,u.needsUpdate=!0,b.needsUpdate=!0});let d=G.x0+M/2;return(0,x.jsxs)("group",{children:[(0,x.jsx)("mesh",{material:e.housing,position:[d,0,-.32],children:(0,x.jsx)("boxGeometry",{args:[M+.4,2*Q+.4,.06]})}),[-1,1].map(r=>(0,x.jsx)("mesh",{material:e.housingLight,position:[d,r*(Q+.16),-.06],children:(0,x.jsx)("boxGeometry",{args:[M+.4,.08,.5]})},r)),[-1,1].map(r=>(0,x.jsx)("mesh",{material:e.housingLight,position:[d+r*(M/2+.16),0,-.06],children:(0,x.jsx)("boxGeometry",{args:[.08,2*Q+.4,.5]})},r)),[1,-1].map(r=>(0,x.jsx)("mesh",{material:e.electrode,position:[d,r*Q,-.05],children:(0,x.jsx)("boxGeometry",{args:[M-.1,.035,.42]})},r)),[1,-1].map(r=>(0,x.jsx)("mesh",{material:e.membrane,position:[d,r*Ft,-.05],renderOrder:5,children:(0,x.jsx)("boxGeometry",{args:[M,.03,.44]})},r)),(0,x.jsx)("mesh",{material:p.top,position:[d,ce,0],renderOrder:4,children:(0,x.jsx)("planeGeometry",{args:[M,Ee]})}),(0,x.jsx)("mesh",{material:p.mid,position:[d,0,0],renderOrder:4,children:(0,x.jsx)("planeGeometry",{args:[M,Ee]})}),(0,x.jsx)("mesh",{material:p.bot,position:[d,-ce,0],renderOrder:4,children:(0,x.jsx)("planeGeometry",{args:[M,Ee]})}),(0,x.jsx)("points",{geometry:n.g,material:n.mat,frustumCulled:!1,renderOrder:8}),(0,x.jsx)("points",{geometry:c.g,material:c.mat,frustumCulled:!1,renderOrder:9})]})}var yr={anode:new E(G.x0+M/2,Q+.25,0),cathode:new E(G.x0+M/2,-Q-.25,0),mid:new E(G.x0+M/2,0,0)};var oe=H(K(),1);var T=H(L(),1),he=Y.cell,f=Y.inset,fe=(he.x0+he.x1)/2,Ve=he.x1-he.x0+.2,pe=.6,ke=k.cellIn-.05,ze=k.cellOut+.05;function wt({m:e}){let{gl:t,camera:a,size:i}=Z(),s=(0,oe.useMemo)(()=>new U({vertexShader:Se,fragmentShader:He,transparent:!0,depthWrite:!1,side:ee,uniforms:{...O,uS0:{value:ke},uS1:{value:ze},uTime:{value:0},uOpacity:{value:1},uBase:{value:new ne("#2f5873")},uBandGain:{value:1.25},uFlow:{value:1}}}),[]),v=(0,oe.useMemo)(()=>{let n=X(83),d=26,h=d*7+60,g=new Float32Array(h*4),u=new Float32Array(h);for(let l=0;l<h;l++)u[l]=l<d*7?l%7:7,g[l*4]=Math.max(-2.4,Math.min(2.4,ae(n))),g[l*4+1]=n(),g[l*4+2]=n(),g[l*4+3]=n();let b=new j;b.setAttribute("position",new R(new Float32Array(h*3),3)),b.setAttribute("aSeed",new R(g,4)),b.setAttribute("aBand",new R(u,1)),b.boundingSphere=new te(new E(f.x,f.y,0),5);let y=new U({vertexShader:le,fragmentShader:$,transparent:!0,depthWrite:!1,uniforms:{...O,uSim:{value:0},uTime:{value:0},uPix:{value:1},uSize:{value:52},uMode:{value:2},uS0:{value:ke},uS1:{value:ze},uOrigin:{value:new E(f.x-f.len/2,f.y,.06)},uScale:{value:f.len/(ze-ke)},uHalf:{value:new E(0,f.h/2-.2,.08)},uFb:{value:new Array(8).fill(0)},uOpacity:{value:1}}});return{g:b,mat:y}},[]),p=(0,oe.useMemo)(()=>{let n=new Fe(new Ne(new we(f.len+.2,f.h+.2,.3)),e.line);n.position.set(f.x,f.y,-.05);let d=[new E(fe-Ve/2,pe/2,.3),new E(f.x-f.len/2-.1,f.y-f.h/2-.1,.1),new E(fe+Ve/2,pe/2,.3),new E(f.x+f.len/2+.1,f.y-f.h/2-.1,.1)],r=new j().setFromPoints(d),h=new Fe(r,e.dashed);return h.computeLineDistances(),{frame:n,leaders:h}},[e.line,e.dashed]);(0,oe.useEffect)(()=>()=>{s.dispose(),v.g.dispose(),v.mat.dispose(),p.frame.geometry.dispose(),p.leaders.geometry.dispose()},[s,v,p]);let c=(0,oe.useMemo)(()=>new E,[]);return C(()=>{s.uniforms.uTime.value=m.time;let n=v.mat.uniforms;n.uSim.value=m.sim,n.uTime.value=m.time,n.uPix.value=t.getPixelRatio(),c.set(fe,pe/2+.05,0).project(a),Te.cell.x=(c.x*.5+.5)*i.width,Te.cell.y=(-c.y*.5+.5)*i.height,Te.cell.on=c.z<1&&Math.abs(c.x)<1.1&&Math.abs(c.y)<1.1}),(0,T.jsxs)("group",{children:[(0,T.jsx)("mesh",{material:e.darkSteel,position:[fe,0,0],children:(0,T.jsx)("boxGeometry",{args:[Ve,pe,.6]})}),[he.x0-.06,he.x1+.06].map(n=>(0,T.jsx)("mesh",{material:e.peek,position:[n,0,0],rotation:[0,0,Math.PI/2],children:(0,T.jsx)("cylinderGeometry",{args:[.1,.1,.16,6]})},n)),(0,T.jsx)("mesh",{material:e.housing,position:[fe,pe/2+.05,0],children:(0,T.jsx)("cylinderGeometry",{args:[.06,.06,.12,16]})}),(0,T.jsx)("primitive",{object:p.frame}),(0,T.jsx)("primitive",{object:p.leaders}),(0,T.jsxs)("mesh",{position:[f.x,f.y,-.2],children:[(0,T.jsx)("planeGeometry",{args:[f.len+.2,f.h+.2]}),(0,T.jsx)("meshBasicMaterial",{color:"#0b1118",transparent:!0,opacity:.82,depthWrite:!1})]}),(0,T.jsx)("mesh",{material:s,position:[f.x,f.y,0],renderOrder:4,children:(0,T.jsx)("planeGeometry",{args:[f.len,f.h-.2]})}),[1,-1].map(n=>(0,T.jsx)("mesh",{material:e.electrode,position:[f.x,f.y+n*(f.h/2-.04),0],children:(0,T.jsx)("boxGeometry",{args:[f.len*.5,.06,.25]})},n)),[1,-1].map(n=>(0,T.jsx)("mesh",{material:e.electrode,position:[f.x+.6,f.y+n*(f.h/2+.2),0],children:(0,T.jsx)("boxGeometry",{args:[.025,.42,.025]})},`w${n}`)),(0,T.jsx)("points",{geometry:v.g,material:v.mat,frustumCulled:!1,renderOrder:9})]})}var Mr={housing:new E(fe,-pe/2-.1,0),inset:new E(f.x,f.y+f.h/2+.45,0)};var w=H(L(),1);function Pt(){return C(()=>pt(),-9),null}function Ct({reducedMotion:e}){let t=Be(),a=(0,Ae.useMemo)(()=>ht(),[]);return(0,Ae.useEffect)(()=>()=>Object.values(a).forEach(i=>i.dispose()),[a]),(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(lt,{}),(0,w.jsx)(Pt,{}),(0,w.jsx)(ut,{reducedMotion:e}),(0,w.jsx)(gt,{m:a}),(0,w.jsx)(dt,{}),(0,w.jsx)(yt,{m:a,beads:t.tier==="low"?700:t.tier==="medium"?1100:1600,ions:t.tier==="low"?70:120}),(0,w.jsx)(bt,{m:a}),(0,w.jsx)(wt,{m:a}),(0,w.jsx)(rt,{reducedMotion:e})]})}function Gt({active:e,reducedMotion:t,onReady:a}){let i=Be();return(0,w.jsxs)(tt,{className:"hero-canvas",frameloop:e?"always":"never",dpr:i.dpr,camera:{fov:38,near:.1,far:80,position:[-15.2,.6,9.6]},gl:{antialias:i.tier!=="low",alpha:!0,powerPreference:"high-performance"},onCreated:({gl:s})=>{s.setClearColor(0,0),s.toneMapping=Le,s.toneMappingExposure=1,requestAnimationFrame(()=>a?.())},"aria-hidden":"true",children:[(0,w.jsx)(st,{intensity:.45}),(0,w.jsx)("ambientLight",{intensity:.22}),(0,w.jsx)("directionalLight",{position:[4,6,7],intensity:1.1,color:"#e6eeff"}),(0,w.jsx)("directionalLight",{position:[-8,2,-5],intensity:.7,color:"#7fd4ff"}),(0,w.jsx)("directionalLight",{position:[6,-3,-4],intensity:.5,color:"#b48cff"}),(0,w.jsx)(Ct,{reducedMotion:t}),(0,w.jsx)(it,{min:i.dpr[0],max:i.dpr[1]})]})}export{Gt as default};
