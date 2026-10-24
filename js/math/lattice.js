/* js/math/lattice.js — A real SU(2) lattice gauge theory, simulated in the browser: a 6×6×6 periodic lattice in three
   dimensions with Wilson's action, updated by the Metropolis algorithm. Each link carries an SU(2) matrix, stored as a
   unit quaternion (a0, a1, a2, a3) ↔ a0·1 + i(a1σ1 + a2σ2 + a3σ3). The Math room draws it: links coloured by how far
   their matrix is from the identity, plaquettes glowing with their share of the action.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const LAT = { L: 6, beta: 2.4, eps: 0.45, hits: 2, accepted: 0, tried: 0, sweeps: 0, plaq: 1 };
LAT.N = LAT.L * LAT.L * LAT.L;
LAT.U = new Float64Array(LAT.N * 3 * 4);          // links: site * 3 + direction, 4 numbers each
LAT.E = new Float32Array(LAT.N * 3);              // plaquette energy 1 - ½Tr U_p, site * 3 + plane (xy, yz, zx)
const latIdx = (x, y, z) => ((x + LAT.L) % LAT.L) + LAT.L * (((y + LAT.L) % LAT.L) + LAT.L * ((z + LAT.L) % LAT.L));
const latSite = s => [s % LAT.L, ((s / LAT.L) | 0) % LAT.L, (s / (LAT.L * LAT.L)) | 0];
const LAT_STEP = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const latNb = (s, mu, sign) => { const p = latSite(s), d = LAT_STEP[mu]; return latIdx(p[0] + d[0] * sign, p[1] + d[1] * sign, p[2] + d[2] * sign); };

// quaternion helpers on scratch arrays (no allocation in the hot loop)
function qmul(a, b, o) { const a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  o[0] = a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3; o[1] = a0 * b1 + b0 * a1 + a2 * b3 - a3 * b2; o[2] = a0 * b2 + b0 * a2 + a3 * b1 - a1 * b3; o[3] = a0 * b3 + b0 * a3 + a1 * b2 - a2 * b1; return o; }
function qget(link, o, dag) { const k = link * 4, s = dag ? -1 : 1; o[0] = LAT.U[k]; o[1] = s * LAT.U[k + 1]; o[2] = s * LAT.U[k + 2]; o[3] = s * LAT.U[k + 3]; return o; }
const _q1 = [0, 0, 0, 0], _q2 = [0, 0, 0, 0], _q3 = [0, 0, 0, 0], _q4 = [0, 0, 0, 0], _st = [0, 0, 0, 0], _r = [0, 0, 0, 0], _u = [0, 0, 0, 0], _nu = [0, 0, 0, 0];

// a "hot" start: every link a random SU(2) element, uniform on the 3-sphere
function latRandomize() {
  for (let l = 0; l < LAT.N * 3; l++) {
    let a, b, c, d, n; do { a = Math.random() * 2 - 1; b = Math.random() * 2 - 1; c = Math.random() * 2 - 1; d = Math.random() * 2 - 1; n = a * a + b * b + c * c + d * d; } while (n > 1 || n < 1e-6);
    n = Math.sqrt(n); LAT.U.set([a / n, b / n, c / n, d / n], l * 4);
  }
  LAT.sweeps = 0; latMeasure();
}
// sum of the four staples around link (s, mu): U_mu(s) · staple traces each plaquette that contains the link
function latStaple(s, mu, o) {
  o[0] = o[1] = o[2] = o[3] = 0;
  const sm = latNb(s, mu, 1);
  for (let nu = 0; nu < 3; nu++) {
    if (nu === mu) continue;
    // upper: U_nu(s+mu) U_mu(s+nu)† U_nu(s)†
    qmul(qget(sm * 3 + nu, _q1), qget(latNb(s, nu, 1) * 3 + mu, _q2, true), _q3); qmul(_q3, qget(s * 3 + nu, _q1, true), _q4);
    o[0] += _q4[0]; o[1] += _q4[1]; o[2] += _q4[2]; o[3] += _q4[3];
    // lower: U_nu(s+mu-nu)† U_mu(s-nu)† U_nu(s-nu)
    const sn = latNb(s, nu, -1);
    qmul(qget(latNb(sm, nu, -1) * 3 + nu, _q1, true), qget(sn * 3 + mu, _q2, true), _q3); qmul(_q3, qget(sn * 3 + nu, _q1), _q4);
    o[0] += _q4[0]; o[1] += _q4[1]; o[2] += _q4[2]; o[3] += _q4[3];
  }
  return o;
}
// one Metropolis sweep: propose U' = R U with R a small random rotation; accept with probability min(1, e^-ΔS)
function latSweep() {
  const eps = LAT.eps, beta = LAT.beta;
  for (let l = 0; l < LAT.N * 3; l++) {
    const s = (l / 3) | 0, mu = l % 3;
    latStaple(s, mu, _st);
    for (let h = 0; h < LAT.hits; h++) {
      qget(l, _u);
      const b = (Math.random() - 0.5) * 2 * eps, c = (Math.random() - 0.5) * 2 * eps, d = (Math.random() - 0.5) * 2 * eps, a = Math.sqrt(Math.max(0, 1 - b * b - c * c - d * d));
      _r[0] = a; _r[1] = b; _r[2] = c; _r[3] = d; const n = Math.hypot(a, b, c, d); for (let k = 0; k < 4; k++) _r[k] /= n;
      if (Math.random() < 0.5) { _r[1] = -_r[1]; _r[2] = -_r[2]; _r[3] = -_r[3]; }
      qmul(_r, _u, _nu);
      // local action: -β · ½Re Tr(U · staple) = -β · (U·staple)_0
      const old = qmul(_u, _st, _q3)[0], neu = qmul(_nu, _st, _q4)[0], dS = -beta * (neu - old);
      LAT.tried++;
      if (dS <= 0 || Math.random() < Math.exp(-dS)) { const k = l * 4; LAT.U[k] = _nu[0]; LAT.U[k + 1] = _nu[1]; LAT.U[k + 2] = _nu[2]; LAT.U[k + 3] = _nu[3]; LAT.accepted++; }
    }
  }
  LAT.sweeps++;
  // keep the acceptance near half by tuning the step size
  const acc = LAT.accepted / Math.max(1, LAT.tried); if (LAT.tried > 2000) { LAT.eps = Math.min(1, Math.max(0.05, LAT.eps * (acc > 0.5 ? 1.05 : 0.95))); LAT.acc = acc; LAT.accepted = LAT.tried = 0; }
}
// plaquettes U_p = U_mu(s) U_nu(s+mu) U_mu(s+nu)† U_nu(s)†; energy 1 - ½Tr U_p, and the average ½Tr U_p
const LAT_PLANES = [[0, 1], [1, 2], [2, 0]];
function latMeasure() {
  let sum = 0;
  for (let s = 0; s < LAT.N; s++) LAT_PLANES.forEach(([mu, nu], p) => {
    qmul(qget(s * 3 + mu, _q1), qget(latNb(s, mu, 1) * 3 + nu, _q2), _q3);
    qmul(_q3, qget(latNb(s, nu, 1) * 3 + mu, _q1, true), _q4);
    const tr = qmul(_q4, qget(s * 3 + nu, _q2, true), _q3)[0];
    LAT.E[s * 3 + p] = 1 - tr; sum += tr;
  });
  LAT.plaq = sum / (LAT.N * 3);
}
latRandomize();
