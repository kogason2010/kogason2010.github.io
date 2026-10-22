/* js/campus/cars.js — Parking lot and the parked cars.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// parking lot and glossy cars
function buildParking() {
  /* ---- parking lot and glossy cars ---- */
  const asc = canvasOf(256, 256), ash = canvasOf(256, 256), ag = asc.getContext("2d"), ahg = ash.getContext("2d");
  ag.fillStyle = "#4b5155"; ag.fillRect(0, 0, 256, 256); ahg.fillStyle = "#808080"; ahg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 7000; i++) { const x = Math.random() * 256, y = Math.random() * 256, k = Math.random(); ag.fillStyle = k < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.22)"; ag.fillRect(x, y, 1.2, 1.2); ahg.fillStyle = k < 0.5 ? "#a0a0a0" : "#606060"; ahg.fillRect(x, y, 1.2, 1.2); }
  const asMap = new THREE.CanvasTexture(asc); asMap.encoding = THREE.sRGBEncoding; asMap.wrapS = asMap.wrapT = THREE.RepeatWrapping; asMap.repeat.set(10, 7.5); const asN = normalFrom(ash, 2); asN.repeat.set(10, 7.5);
  flat(new THREE.PlaneGeometry(24, 18), new THREE.MeshStandardMaterial({ map: asMap, normalMap: asN, roughness: 0.88 }), 32, 0.016, 32);
  CAMPUS.lots.push([20, 23, 44, 41]);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.7 });
  for (let i = 0; i <= 8; i++) { const lx = 21.6 + i * 2.6; flat(new THREE.PlaneGeometry(0.1, 5.2), lineMat, lx, 0.02, 26.6); flat(new THREE.PlaneGeometry(0.1, 5.2), lineMat, lx, 0.02, 37.4); }
  const bodyShape = new THREE.Shape(); bodyShape.moveTo(-2.15, 0.3); bodyShape.lineTo(-1.76, 0.3); bodyShape.absarc(-1.35, 0.32, 0.41, Math.PI, 0, true); bodyShape.lineTo(0.94, 0.3); bodyShape.absarc(1.35, 0.32, 0.41, Math.PI, 0, true);
  bodyShape.lineTo(2.12, 0.3); bodyShape.quadraticCurveTo(2.26, 0.42, 2.22, 0.64); bodyShape.quadraticCurveTo(2.16, 0.84, 1.86, 0.88); bodyShape.lineTo(0.95, 0.95); bodyShape.lineTo(-1.6, 0.97); bodyShape.quadraticCurveTo(-2.12, 0.95, -2.2, 0.72); bodyShape.lineTo(-2.2, 0.44); bodyShape.quadraticCurveTo(-2.2, 0.3, -2.15, 0.3);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 1.62, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 14 }); bodyGeo.translate(0, 0, -0.81); bodyGeo.rotateY(-Math.PI / 2);
  const cabShape = new THREE.Shape(); cabShape.moveTo(0.98, 0.93); cabShape.quadraticCurveTo(0.56, 1.37, 0.18, 1.42); cabShape.lineTo(-0.86, 1.42); cabShape.quadraticCurveTo(-1.28, 1.38, -1.58, 0.96); cabShape.lineTo(0.98, 0.93);
  const cabGeo = new THREE.ExtrudeGeometry(cabShape, { depth: 1.36, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 12 }); cabGeo.translate(0, 0, -0.68); cabGeo.rotateY(-Math.PI / 2);
  const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 24); tireGeo.rotateZ(Math.PI / 2); const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.27, 16); rimGeo.rotateZ(Math.PI / 2);
  const rubber = mat(0x17191b, { roughness: 0.85 }), alloy = new THREE.MeshStandardMaterial({ color: 0xc9ced1, metalness: 0.9, roughness: 0.25 }), tint = new THREE.MeshPhysicalMaterial({ color: 0x141c22, metalness: 0.3, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 });
  const headM = new THREE.MeshStandardMaterial({ color: 0xf2f2ea, emissive: 0x000000, roughness: 0.2 }), tailM = new THREE.MeshStandardMaterial({ color: 0x8a1416, emissive: 0x000000, roughness: 0.3 }); FX.carLamps = [headM, tailM];
  const carCols = [0xb3262b, 0x1f5fa8, 0xeef0f0, 0x22282c, 0x8a959b, 0x2f7a4c, 0xd7a332, 0x5a3f98, 0xc9cfd2, 0x7a1e2d, 0x2d4f6c];
  const filled = [[0, 0], [1, 0], [2, 0], [4, 0], [6, 0], [7, 0], [0, 1], [2, 1], [3, 1], [5, 1], [6, 1]];
  filled.forEach(([i, row], n) => car(21.6 + 1.3 + i * 2.6, row ? 37.4 : 26.6, row ? Math.PI : 0, carCols[n % carCols.length]));
  function car(x, z, ry, color) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.add(g);
    const paintM = new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 });
    const b = new THREE.Mesh(bodyGeo, paintM), cab = new THREE.Mesh(cabGeo, tint); b.castShadow = b.receiveShadow = cab.castShadow = true; g.add(b, cab);
    [[-0.84, 1.35], [0.84, 1.35], [-0.84, -1.35], [0.84, -1.35]].forEach(([wx, wz]) => { const t = new THREE.Mesh(tireGeo, rubber), r = new THREE.Mesh(rimGeo, alloy); t.position.set(wx, 0.36, wz); r.position.set(wx, 0.36, wz); t.castShadow = true; g.add(t, r); });
    [-0.55, 0.55].forEach(lx => { box(0.36, 0.1, 0.06, headM, lx, 0.72, 2.27, g); box(0.38, 0.1, 0.06, tailM, lx, 0.74, -2.25, g); });
    box(1.2, 0.18, 0.08, 0x2a3034, 0, 0.42, 2.3, g, { roughness: 0.5 });
    CAMPUS.boxes.push([x - 0.95, z - 2.25, x + 0.95, z + 2.25, "car"]); blobs.push([x, z, 2.4, 5.0, ry]);
  }
}
