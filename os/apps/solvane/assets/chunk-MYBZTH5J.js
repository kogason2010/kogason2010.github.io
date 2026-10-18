import{f as j,g as C,h as ye,i as Te,j as Re,k as Be,o as i,p as Oe,q as Ge,s as _e,t as Le,u as ze,v as Ie,w as we,x as De}from"./chunk-SHVV2NQU.js";import{A as Ze,B as W,C as $e,D as Qe,E as Je,F as et,G as Q,H as tt,I as le,J as F,K as ot,L as rt,M as at,a as ke,b as Ne,c as X,d as N,e as We,g as ne,h as se,j as R,k as Ue,n as z,o as je,p as T,q as D,r as xe,s as Xe,t as Ye,u as V,v as Ke,x as qe,y as He}from"./chunk-62LDRDAS.js";import{c as x,e as Z,i as oe,j as Ce,k as $,l as re,o as O,p as Ve,r as L}from"./chunk-2DDLU2W5.js";function it(){return F((t,n)=>{let c=L.progress,e=1-Math.exp(-n*6);i.p+=(c-i.p)*e,Math.abs(c-i.p)<1e-5&&(i.p=c);let o=i.p;i.sim=_e(o),i.inject=Le(o),i.reveal=ze(o),i.fade=Ie(o),i.signal=Be(i.sim),i.time=t.clock.elapsedTime},-10),null}var J=x(Z(),1);function nt({reducedMotion:t}){let{camera:n,size:c}=le(),e=(0,J.useMemo)(()=>({pos:[0,0,0],target:[0,0,0]}),[]),o=(0,J.useMemo)(()=>new R,[]),f=(0,J.useMemo)(()=>new R,[]),s=(0,J.useMemo)(()=>new R(-9,.3,0),[]),l=(0,J.useMemo)(()=>new se,[]);return F((u,h)=>{let w=c.width/c.height;if(t?(o.fromArray(we.pos),f.fromArray(we.target)):(De(i.p,e),o.fromArray(e.pos),f.fromArray(e.target)),w<1.25){let r=o.clone().sub(f),p=ne.clamp(1.25/w,1,2.3);o.copy(f).add(r.multiplyScalar(p)),i.p<.2&&!t&&(f.x+=1.3,o.x+=1.3)}let y=t?0:1;l.x+=(L.pointerX*y-l.x)*(1-Math.exp(-h*3)),l.y+=(L.pointerY*y-l.y)*(1-Math.exp(-h*3)),o.x+=l.x*.45,o.y+=l.y*.3,n.position.lerp(o,1-Math.exp(-h*5)),s.lerp(f,1-Math.exp(-h*5)),n.lookAt(s)}),null}var G=x(Z(),1);var st=`
  uniform float uTime;
  uniform float uSim;
  uniform float uInject;
  uniform float uReveal;
  uniform float uFade;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uInlet;
  uniform float uOutlet;
  uniform float uDetector;
  uniform float uRadius;
  uniform float uSigma0;
  uniform float uDisp;
  uniform float uMotion;
  uniform vec3 uCloud;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform float uK[4];
  uniform vec3 uColors[4];

  attribute float aPop;
  attribute vec4 aSeed;   // x: N(0,1) axial, y: angle, z: radial (0..1), w: stagger (0..1)
  attribute vec3 aCloud;  // gaussian offset inside the injected sample plug

  varying vec3 vColor;
  varying float vAlpha;
  varying float vFlash;

  float kOf(float p) {
    if (p < 0.5) return uK[0];
    if (p < 1.5) return uK[1];
    if (p < 2.5) return uK[2];
    return uK[3];
  }
  vec3 colorOf(float p) {
    if (p < 0.5) return uColors[0];
    if (p < 1.5) return uColors[1];
    if (p < 2.5) return uColors[2];
    return uColors[3];
  }
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  void main() {
    float k = kOf(aPop);
    float retained = k / (1.0 + k);

    // --- 1. The mixed sample: a slowly turning plug of all analytes together.
    vec3 c = aCloud;
    c.xz = rot(uTime * 0.12 * uMotion + aSeed.w * 0.4) * c.xz;
    c.xy = rot(sin(uTime * 0.07 + aSeed.x) * 0.25 * uMotion) * c.xy;
    vec3 cloudPos = uCloud + c * 0.95;

    // --- 2. Inside the column.
    float tLocal = max(uSim, 0.0);
    float v = 1.0 / (1.0 + k);
    float dist = v * tLocal;
    float sigma = uSigma0 + uDisp * sqrt(dist);
    float x = uInlet + dist + aSeed.x * sigma;

    // radial position; retained analytes linger near the packed wall
    float wobble = 0.5 + 0.5 * sin(uTime * (0.9 + aSeed.w) + aSeed.y * 13.0);
    float r = aSeed.z * uRadius * 0.86;
    r = mix(r, uRadius * 0.9, retained * wobble * 0.55);
    // narrow connecting capillary between column outlet and flow cell
    r *= mix(1.0, 0.28, smoothstep(uOutlet - 0.05, uOutlet + 0.25, x));
    float ang = aSeed.y + uTime * 0.25 * uMotion * (1.0 - retained);
    vec3 colPos = vec3(x, cos(ang) * r, sin(ang) * r);
    // Brownian shimmer
    colPos += 0.012 * vec3(sin(uTime * 3.1 + aSeed.y * 9.0), sin(uTime * 2.7 + aSeed.x * 7.0), cos(uTime * 2.3 + aSeed.w * 11.0)) * uMotion;


    // --- 3. Injection: plug \u2192 column, staggered per particle along an arc.
    float fi = smoothstep(0.0, 1.0, clamp(uInject * 1.7 - aSeed.w * 0.7, 0.0, 1.0));
    vec3 pos = mix(cloudPos, colPos, fi);
    pos.y += sin(fi * 3.14159) * 0.35 * (1.0 - aSeed.z * 0.5);

    // --- 4. Pointer: a gentle displacement field around the cursor ray.
    vec3 dp = pos - uPointer;
    float d2 = dot(dp, dp);
    pos += normalize(dp + 1e-4) * exp(-d2 * 2.2) * 0.22 * uPointerStrength;

    // --- Appearance
    vec3 mixed = vec3(0.78, 0.86, 0.95);
    vColor = mix(mixed, colorOf(aPop), uReveal);

    float passed = smoothstep(uDetector + 0.25, uDetector + 1.9, pos.x);
    vFlash = exp(-pow((pos.x - uDetector) / 0.16, 2.0)) * fi;
    vAlpha = (1.0 - passed) * uFade * (0.55 + 0.45 * aSeed.z);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.6 + 0.8 * fract(aSeed.w * 17.0)) * (1.0 + vFlash * 1.4);
    gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);
    // soft depth attenuation
    vAlpha *= smoothstep(26.0, 6.0, -mv.z) * 0.85 + 0.15;
  }
`,lt=`
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFlash;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    core = pow(core, 1.8);
    vec3 col = vColor * (0.9 + vFlash * 2.2) + vec3(1.0) * vFlash * 0.35;
    gl_FragColor = vec4(col, core * vAlpha);
  }
`,ut=`
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uOpacity;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (9.0 + aSeed * 10.0) * uPixelRatio / -mv.z;
    vA = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 0.6 + aSeed * 40.0))) * uOpacity;
  }
`,mt=`
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(vec3(0.55, 0.63, 0.74), a * vA * 0.32);
  }
`,ct=`
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.1 + aSeed * 30.0) * 0.25;
    p.x += cos(uTime * 0.08 + aSeed * 20.0) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (14.0 + aSeed * 22.0) * uPixelRatio / -mv.z;
    vA = 0.12 + aSeed * 0.18;
  }
`,ft=`
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.62, 0.72, 0.86, smoothstep(0.5, 0.0, d) * vA);
  }
`;var dt=x(O(),1),ue=new R(-7.6,.35,0);function pt({count:t,reducedMotion:n}){let{gl:c,camera:e,size:o}=le(),f=(0,G.useRef)(null),s=(0,G.useMemo)(()=>{let r=$(7),p=new Float32Array(t),d=new Float32Array(t*4),a=new Float32Array(t*3),g=new Float32Array(t*3);for(let E=0;E<t;E++)p[E]=E%4,d[E*4]=Math.max(-3,Math.min(3,re(r))),d[E*4+1]=r()*Math.PI*2,d[E*4+2]=Math.sqrt(r()),d[E*4+3]=r(),a[E*3]=re(r)*.55,a[E*3+1]=re(r)*.42,a[E*3+2]=re(r)*.55;let H=new D;return H.setAttribute("position",new T(g,3)),H.setAttribute("aPop",new T(p,1)),H.setAttribute("aSeed",new T(d,4)),H.setAttribute("aCloud",new T(a,3)),H.boundingSphere=new Ue(new R(0,0,0),30),H},[t]),l=(0,G.useMemo)(()=>new V({vertexShader:st,fragmentShader:lt,transparent:!0,depthWrite:!1,blending:N,uniforms:{uTime:{value:0},uSim:{value:0},uInject:{value:0},uReveal:{value:0},uFade:{value:1},uPixelRatio:{value:1},uSize:{value:26},uInlet:{value:C.inlet},uOutlet:{value:C.outlet},uDetector:{value:C.detector},uRadius:{value:C.radius},uSigma0:{value:C.sigma0},uDisp:{value:C.dispersion},uMotion:{value:1},uCloud:{value:ue.clone()},uPointer:{value:new R(99,99,99)},uPointerStrength:{value:0},uK:{value:j.map(r=>r.k)},uColors:{value:j.map(r=>new z(r.color))}}}),[]);(0,G.useEffect)(()=>()=>{s.dispose()},[s]),(0,G.useEffect)(()=>()=>l.dispose(),[l]);let u=(0,G.useMemo)(()=>new tt,[]),h=(0,G.useMemo)(()=>new Ke(new R(0,0,1),0),[]),w=(0,G.useMemo)(()=>new R,[]),y=(0,G.useMemo)(()=>new se,[]);return F((r,p)=>{let d=l.uniforms;d.uTime.value=i.time,d.uSim.value=i.sim,d.uInject.value=i.inject,d.uReveal.value=i.reveal,d.uFade.value=i.fade,d.uPixelRatio.value=c.getPixelRatio(),d.uMotion.value=n?.15:1,d.uSize.value=o.width<700?34:26,y.set(L.pointerX,L.pointerY),u.setFromCamera(y,e),u.ray.intersectPlane(h,w)&&d.uPointer.value.lerp(w,1-Math.exp(-p*8));let a=n?0:1;d.uPointerStrength.value+=(a-d.uPointerStrength.value)*(1-Math.exp(-p*3))}),(0,dt.jsx)("points",{ref:f,geometry:s,material:l,frustumCulled:!1})}var b=x(Z(),1);var me=`
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPosW;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,ce=`
  uniform vec3 uTint;
  uniform vec3 uLightPos;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vPosW;
  varying vec2 vUv;
  void main() {
    vec3 n = normalize(vNormalW);
    if (!gl_FrontFacing) n = -n;
    float fres = pow(1.0 - abs(dot(n, vViewDir)), 2.6);
    vec3 l = normalize(uLightPos - vPosW);
    vec3 h = normalize(l + vViewDir);
    float spec = pow(max(dot(n, h), 0.0), 60.0);
    // fine axial machining lines on the glass
    float lines = 0.5 + 0.5 * sin(vPosW.x * 60.0);
    vec3 col = uTint * (0.25 + fres * 1.4) + vec3(1.0) * spec * 0.45;
    float a = (0.035 + fres * 0.55 + spec * 0.22 + lines * 0.01) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`,be=`
  uniform float uT;
  uniform float uHeadX;
  uniform float uScale;
  uniform float uBase;
  uniform float uHeight;
  attribute float aT;
  attribute float aS;      // signal value at aT
  attribute float aFill;   // 1 = curve vertex, 0 = baseline vertex (fill only)
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFillV;
  void main() {
    float x = uHeadX - (uT - aT) * uScale;
    float y = uBase + aS * uHeight * aFill;
    vColor = aColor;
    vFillV = aFill;
    // invisible until the detector has produced this sample
    vAlpha = step(aT, uT) * smoothstep(0.0, 1.2, uT - aT + 1.2);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, 0.0, 1.0);
  }
`,vt=`
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(mix(vec3(0.9, 0.95, 1.0), vColor, 0.65), vAlpha * uOpacity);
  }
`,Et=`
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFillV;
  void main() {
    gl_FragColor = vec4(vColor, vAlpha * uOpacity * 0.28 * vFillV);
  }
`,gt=`
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,ht=`
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float facing = abs(dot(normalize(vN), normalize(vV)));
    float core = pow(facing, 2.5);
    float flicker = 0.94 + 0.06 * sin(uTime * 40.0 + vUv.y * 30.0);
    float ends = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    gl_FragColor = vec4(uColor * core * uIntensity * flicker * ends, 1.0);
  }
`;var B=x(O(),1),{inlet:Y,outlet:ae,detector:yt,radius:fe}=C,Me=ae-Y,Tt=(Y+ae)/2;function Se(t,n,c){return new V({vertexShader:me,fragmentShader:ce,transparent:!0,depthWrite:!1,side:c,uniforms:{uTint:{value:new z(t)},uLightPos:{value:new R(0,4,6)},uOpacity:{value:n},uTime:{value:0}}})}function Rt({bedCount:t}){let n=(0,b.useMemo)(()=>Se("#6f8db3",.6,Ne),[]),c=(0,b.useMemo)(()=>Se("#9fc3ea",1,ke),[]),e=(0,b.useMemo)(()=>Se("#8fb2d8",.9,X),[]),o=(0,b.useMemo)(()=>new Q({color:"#9aa4b1",metalness:1,roughness:.26,envMapIntensity:1.1}),[]),f=(0,b.useMemo)(()=>new Q({color:"#2a3038",metalness:.9,roughness:.38,envMapIntensity:.9}),[]),s=(0,b.useMemo)(()=>{let a=$(21),g=new Float32Array(t*3),H=new Float32Array(t);for(let _=0;_<t;_++){let I=Math.sqrt(a())*fe*.95,ie=a()*Math.PI*2;g[_*3]=Y+a()*Me,g[_*3+1]=Math.cos(ie)*I,g[_*3+2]=Math.sin(ie)*I,H[_]=a()}let E=new D;E.setAttribute("position",new T(g,3)),E.setAttribute("aSeed",new T(H,1));let U=new V({vertexShader:ut,fragmentShader:mt,transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uPixelRatio:{value:1},uOpacity:{value:1}}});return{g:E,m:U}},[t]),l=(0,b.useMemo)(()=>new Ze([new R(ue.x+.9,ue.y-.05,0),new R(Y-1.15,.22,0),new R(Y-.6,0,0)]),[]),u=(0,b.useMemo)(()=>new et(l,48,.07,16,!1),[l]),h=(0,b.useMemo)(()=>new W(.1,.1,yt-ae+.3,20,1,!0).rotateZ(Math.PI/2),[]),w=(0,b.useMemo)(()=>new W(fe+.04,fe+.04,Me,64,1,!0).rotateZ(Math.PI/2),[]),y=(0,b.useMemo)(()=>new W(.44,.44,.36,48).rotateZ(Math.PI/2),[]),r=(0,b.useMemo)(()=>new W(.26,.26,.26,6).rotateZ(Math.PI/2),[]),p=(0,b.useMemo)(()=>new Je(fe+.045,.004,6,64).rotateY(Math.PI/2),[]),d=(0,b.useMemo)(()=>Array.from({length:21},(a,g)=>Y+g/20*Me),[]);return(0,b.useEffect)(()=>()=>{[n,c,e,o,f,s.m].forEach(a=>a.dispose()),[s.g,u,h,w,y,r,p].forEach(a=>a.dispose())},[n,c,e,o,f,s,u,h,w,y,r,p]),F(({gl:a})=>{let g=L.pointerX*6,H=3+L.pointerY*2;for(let E of[n,c,e])E.uniforms.uLightPos.value.set(g,H,6),E.uniforms.uTime.value=i.time;s.m.uniforms.uTime.value=i.time,s.m.uniforms.uPixelRatio.value=a.getPixelRatio()}),(0,B.jsxs)("group",{children:[(0,B.jsx)("points",{geometry:s.g,material:s.m,frustumCulled:!1}),(0,B.jsx)("mesh",{geometry:w,material:n,position:[Tt,0,0],renderOrder:1}),(0,B.jsx)("mesh",{geometry:w,material:c,position:[Tt,0,0],renderOrder:3}),d.map((a,g)=>(0,B.jsx)("mesh",{geometry:p,position:[a,0,0],renderOrder:3,children:(0,B.jsx)("meshBasicMaterial",{color:"#9fb7d4",transparent:!0,opacity:g%5===0?.55:.18,depthWrite:!1})},g)),[Y-.18,ae+.18].map((a,g)=>(0,B.jsxs)("group",{position:[a,0,0],children:[(0,B.jsx)("mesh",{geometry:y,material:o}),(0,B.jsx)("mesh",{geometry:r,material:f,position:[g===0?-.3:.3,0,0]})]},g)),(0,B.jsx)("mesh",{geometry:u,material:e,renderOrder:2}),(0,B.jsx)("mesh",{geometry:h,material:e,position:[(ae+yt)/2+.15,0,0],renderOrder:2})]})}var S=x(Z(),1);var v=x(O(),1),wt=C.detector,Ae=-1.35,Fe=1;function xt(){let t=(0,S.useMemo)(()=>new V({vertexShader:gt,fragmentShader:ht,transparent:!0,depthWrite:!1,blending:N,uniforms:{uColor:{value:new z("#8fb0ff")},uIntensity:{value:1},uTime:{value:0}}}),[]),n=(0,S.useMemo)(()=>{let r=t.clone();return r.uniforms=Ye.clone(t.uniforms),r},[t]),c=(0,S.useMemo)(()=>new V({vertexShader:me,fragmentShader:ce,transparent:!0,depthWrite:!1,side:X,uniforms:{uTint:{value:new z("#a9c8ee")},uLightPos:{value:new R(wt,3,5)},uOpacity:{value:.8},uTime:{value:0}}}),[]),e=(0,S.useMemo)(()=>new Q({color:"#1d232b",metalness:.85,roughness:.32,envMapIntensity:1}),[]),o=(0,S.useMemo)(()=>new Q({color:"#a8b2bf",metalness:1,roughness:.22,envMapIntensity:1.2}),[]),f=(0,S.useRef)(null),s=(0,S.useRef)(null),l=(0,S.useRef)(null),u=(0,S.useMemo)(()=>new Xe(.62,.62,.62),[]),h=(0,S.useMemo)(()=>new $e(u),[u]),w=(0,S.useMemo)(()=>new W(.075,.075,Math.abs(Ae)-.2,24,1,!0),[]),y=(0,S.useMemo)(()=>new W(.075,.075,Fe-.17,24,1,!0),[]);return(0,S.useEffect)(()=>()=>{[t,n,c,e,o].forEach(r=>r.dispose()),[u,h,w,y].forEach(r=>r.dispose())},[t,n,c,e,o,u,h,w,y]),F(()=>{let r=i.signal*.95,p=Math.pow(10,-r),d=i.time,a=ne.smoothstep(i.p,.16,.24);t.uniforms.uIntensity.value=1.25*a,n.uniforms.uIntensity.value=1.25*p*a,t.uniforms.uTime.value=d,n.uniforms.uTime.value=d,f.current&&f.current.color.setRGB(.25+.6*p*a,.35+.6*p*a,.55+.45*p*a),s.current&&s.current.color.setRGB(.35+.5*a,.45+.5*a,.7+.3*a),l.current&&(l.current.intensity=2.2*a*(.4+.6*p))}),(0,v.jsxs)("group",{position:[wt,0,0],children:[(0,v.jsx)("mesh",{geometry:u,material:c,renderOrder:4}),(0,v.jsx)("lineSegments",{geometry:h,renderOrder:4,children:(0,v.jsx)("lineBasicMaterial",{color:"#b9c8da",transparent:!0,opacity:.55})}),(0,v.jsxs)("group",{position:[0,Ae,0],children:[(0,v.jsx)("mesh",{material:e,children:(0,v.jsx)("boxGeometry",{args:[.7,.42,.7]})}),(0,v.jsxs)("mesh",{position:[0,.215,0],rotation:[-Math.PI/2,0,0],children:[(0,v.jsx)("circleGeometry",{args:[.1,32]}),(0,v.jsx)("meshBasicMaterial",{ref:s,color:"#b5c8ff",toneMapped:!1})]}),(0,v.jsx)("mesh",{material:o,position:[0,-.25,0],children:(0,v.jsx)("boxGeometry",{args:[.78,.06,.78]})})]}),(0,v.jsx)("mesh",{geometry:w,material:t,position:[0,(Ae+.2)/2,0],renderOrder:5}),(0,v.jsxs)("group",{position:[0,Fe,0],children:[(0,v.jsx)("mesh",{material:e,children:(0,v.jsx)("boxGeometry",{args:[.56,.34,.56]})}),(0,v.jsxs)("mesh",{position:[0,-.175,0],rotation:[Math.PI/2,0,0],children:[(0,v.jsx)("planeGeometry",{args:[.2,.2]}),(0,v.jsx)("meshBasicMaterial",{ref:f,color:"#6f8fd0",toneMapped:!1,side:X})]}),(0,v.jsx)("mesh",{material:o,position:[0,.2,0],children:(0,v.jsx)("boxGeometry",{args:[.62,.05,.62]})})]}),(0,v.jsx)("mesh",{geometry:y,material:n,position:[0,(Fe-.17)/2,0],renderOrder:5}),(0,v.jsx)("pointLight",{ref:l,color:"#9db8ff",distance:4,decay:2,position:[0,-.4,.4]})]})}var K=x(Z(),1);var q=x(O(),1),P=900,M={headX:C.detector,scale:11/Re,base:1.55,height:1.2};function Ht(){let{line:t,fill:n,uniforms:c}=(0,K.useMemo)(()=>{let s={uT:{value:0},uHeadX:{value:M.headX},uScale:{value:M.scale},uBase:{value:M.base},uHeight:{value:M.height},uOpacity:{value:1}},l=j.map(m=>new z(m.color)),u=new z("#cfe0f2"),h=new Float32Array(P),w=new Float32Array(P),y=new Float32Array(P*3),r=new z;for(let m=0;m<P;m++){let k=m/(P-1)*Re,de=0;r.setRGB(0,0,0);let ve=0;j.forEach((ge,he)=>{let te=ge.area*Ce(k,ye(ge.k),Te(ge.k));de+=te,r.r+=l[he].r*te,r.g+=l[he].g*te,r.b+=l[he].b*te,ve+=te}),de+=.006*Math.sin(m*12.9898)*Math.cos(m*4.1414);let Ee=ve>.02?r.multiplyScalar(1/ve):u;h[m]=k,w[m]=Math.max(0,de),y.set([Ee.r,Ee.g,Ee.b],m*3)}let p=new D;p.setAttribute("position",new T(new Float32Array(P*3),3)),p.setAttribute("aT",new T(h,1)),p.setAttribute("aS",new T(w,1)),p.setAttribute("aFill",new T(new Float32Array(P).fill(1),1)),p.setAttribute("aColor",new T(y,3));let d=new V({vertexShader:be,fragmentShader:vt,transparent:!0,depthWrite:!1,uniforms:s}),a=new He(p,d);a.frustumCulled=!1;let g=new Float32Array(P*2),H=new Float32Array(P*2),E=new Float32Array(P*2),U=new Float32Array(P*6);for(let m=0;m<P;m++)g[m*2]=g[m*2+1]=h[m],H[m*2]=H[m*2+1]=w[m],E[m*2]=1,E[m*2+1]=0,U.set(y.subarray(m*3,m*3+3),m*6),U.set(y.subarray(m*3,m*3+3),m*6+3);let _=[];for(let m=0;m<P-1;m++){let k=m*2;_.push(k,k+1,k+2,k+1,k+3,k+2)}let I=new D;I.setAttribute("position",new T(new Float32Array(P*6),3)),I.setAttribute("aT",new T(g,1)),I.setAttribute("aS",new T(H,1)),I.setAttribute("aFill",new T(E,1)),I.setAttribute("aColor",new T(U,3)),I.setIndex(_);let ie=new V({vertexShader:be,fragmentShader:Et,transparent:!0,depthWrite:!1,side:X,blending:N,uniforms:s}),Pe=new xe(I,ie);return Pe.frustumCulled=!1,{line:a,fill:Pe,uniforms:s}},[]),e=(0,K.useMemo)(()=>{let s=new D().setFromPoints([new R(0,0,0),new R(-1,0,0)]),l=new qe({color:"#7f93ab",transparent:!0,opacity:.35}),u=new He(s,l);return u.frustumCulled=!1,u},[]),o=(0,K.useMemo)(()=>new xe(new Qe(.035,16,16),new je({color:"#e6f3ff",toneMapped:!1})),[]);(0,K.useEffect)(()=>()=>{t.geometry.dispose(),t.material.dispose(),n.geometry.dispose(),n.material.dispose(),e.geometry.dispose(),e.material.dispose(),o.geometry.dispose(),o.material.dispose()},[t,n,e,o]);let f=(0,K.useMemo)(()=>new R,[]);return F(({camera:s,size:l})=>{let u=i.sim;c.uT.value=u;let h=oe(.17,.26,i.p);c.uOpacity.value=h;let w=Math.max(.001,u*M.scale);e.position.set(M.headX,M.base,0),e.scale.set(w,1,1),e.material.opacity=.35*h,o.position.set(M.headX,M.base+i.signal*M.height,0),o.visible=h>.01&&i.p<.9,j.forEach((r,p)=>{let d=Oe[p];if(!d)return;let a=ye(r.k),g=Te(r.k),H=r.area;f.set(M.headX-(u-a)*M.scale,M.base+H*M.height+.16,0),f.project(s);let E=(f.x*.5+.5)*l.width,U=(-f.y*.5+.5)*l.height,_=oe(a+g*1.5,a+g*3.5,u)*oe(.5,.58,i.p);d.style.opacity=_.toFixed(3),d.style.transform=`translate3d(${E.toFixed(1)}px, ${U.toFixed(1)}px, 0) translate(-50%, -100%)`});let y=Ge.current;if(y){f.set(M.headX-u*M.scale*.5,M.base-.12,0),f.project(s);let r=(f.x*.5+.5)*l.width,p=(-f.y*.5+.5)*l.height;y.style.opacity=oe(.84,.92,i.p).toFixed(3),y.style.transform=`translate3d(${r.toFixed(1)}px, ${p.toFixed(1)}px, 0) translate(-50%, 0)`}}),(0,q.jsxs)("group",{children:[(0,q.jsx)("primitive",{object:n,renderOrder:6}),(0,q.jsx)("primitive",{object:t,renderOrder:7}),(0,q.jsx)("primitive",{object:e}),(0,q.jsx)("primitive",{object:o})]})}var pe=x(Z(),1);var Mt=x(O(),1);function bt({count:t=600}){let{g:n,m:c}=(0,pe.useMemo)(()=>{let e=$(99),o=new Float32Array(t*3),f=new Float32Array(t);for(let u=0;u<t;u++)o[u*3]=(e()-.5)*34,o[u*3+1]=(e()-.5)*14,o[u*3+2]=-e()*18+3,f[u]=e();let s=new D;s.setAttribute("position",new T(o,3)),s.setAttribute("aSeed",new T(f,1));let l=new V({vertexShader:ct,fragmentShader:ft,transparent:!0,depthWrite:!1,blending:N,uniforms:{uTime:{value:0},uPixelRatio:{value:1}}});return{g:s,m:l}},[t]);return(0,pe.useEffect)(()=>()=>{n.dispose(),c.dispose()},[n,c]),F(({gl:e})=>{c.uniforms.uTime.value=i.time,c.uniforms.uPixelRatio.value=e.getPixelRatio()}),(0,Mt.jsx)("points",{geometry:n,material:c,frustumCulled:!1})}var A=x(O(),1);function St({active:t,reducedMotion:n,onReady:c}){let e=Ve();return(0,A.jsxs)(ot,{className:"hero-canvas",frameloop:t?"always":"never",dpr:e.dpr,camera:{fov:38,near:.1,far:80,position:[-9.6,.9,6.6]},gl:{antialias:e.tier!=="low",alpha:!0,powerPreference:"high-performance"},onCreated:({gl:o})=>{o.setClearColor(0,0),o.toneMapping=We,o.toneMappingExposure=1.05,requestAnimationFrame(()=>c?.())},"aria-hidden":"true",children:[(0,A.jsx)(it,{}),(0,A.jsx)(nt,{reducedMotion:n}),(0,A.jsx)(at,{intensity:.55}),(0,A.jsx)("ambientLight",{intensity:.15}),(0,A.jsx)("directionalLight",{position:[4,6,5],intensity:.9,color:"#dfe9ff"}),(0,A.jsx)("directionalLight",{position:[-6,-2,-4],intensity:.5,color:"#ffcf9e"}),(0,A.jsx)(Rt,{bedCount:e.bedParticles}),(0,A.jsx)(xt,{}),(0,A.jsx)(pt,{count:e.heroParticles,reducedMotion:n}),(0,A.jsx)(Ht,{}),(0,A.jsx)(bt,{count:e.tier==="low"?250:600}),(0,A.jsx)(rt,{min:e.dpr[0],max:e.dpr[1]})]})}export{St as default};
