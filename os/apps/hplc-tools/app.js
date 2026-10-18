/* HPLC Tools — UI layer. All math lives in calc.js (window.HPLC). */
(function () {
  "use strict";
  const C = window.HPLC;

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const num = (id) => {
    const el = $(id);
    if (!el || el.value === "") return NaN;
    return parseFloat(el.value);
  };
  const ok = (...xs) => xs.every((x) => Number.isFinite(x));
  const pos = (...xs) => xs.every((x) => Number.isFinite(x) && x > 0);

  function fmt(x, sig = 3) {
    if (!Number.isFinite(x)) return "—";
    if (x === 0) return "0";
    const a = Math.abs(x);
    if (a >= 1e5 && a < 1e12) return Math.round(x).toLocaleString();
    if (a >= 1e12 || a < 1e-3) return x.toExponential(sig - 1);
    const d = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
    return x.toFixed(Math.min(d, 6));
  }
  const fix = (x, d) => (Number.isFinite(x) ? x.toFixed(d) : "—");
  const int = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString() : "—");
  const signed = (x, d = 1) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(d);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function stat(label, value, sub = "", cls = "") {
    return `<div class="stat ${cls}"><div class="k">${label}</div><div class="v">${value}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>`;
  }
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const calcs = []; // every recalculation function, run after state changes
  function bindAll(ids, fn) {
    calcs.push(fn);
    ids.forEach((id) => {
      const el = $(id);
      if (el) { el.addEventListener("input", fn); el.addEventListener("change", fn); }
    });
  }

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let done = false;
      try { done = document.execCommand("copy"); } catch (e2) { done = false; }
      ta.remove();
      return done;
    }
  }

  // ---------- simple line chart ----------
  function lineChart(canvas, opts) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    if (!w) return;
    const h = parseInt(canvas.getAttribute("height"), 10);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const ink = cssVar("--ink"), muted = cssVar("--muted"), line = cssVar("--line");
    ctx.font = "12px " + cssVar("--sans");
    let legendRows = 1, tx = 8;
    opts.series.forEach((s) => {
      const wi = 24 + ctx.measureText(s.name).width + 14;
      if (tx + wi > w - 4 && tx > 8) { legendRows++; tx = 8; }
      tx += wi;
    });
    const pad = { l: 52, r: 16, t: 18 + 16 * legendRows, b: 42 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const [x0, x1] = opts.xRange, [y0, y1] = opts.yRange;
    const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * pw;
    const Y = (y) => pad.t + ph - ((y - y0) / (y1 - y0)) * ph;

    ctx.font = "12px " + cssVar("--sans");
    ctx.strokeStyle = line; ctx.fillStyle = muted; ctx.lineWidth = 1;
    opts.yTicks.forEach((v) => {
      ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(pad.l + pw, Y(v)); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(opts.yFmt ? opts.yFmt(v) : v, pad.l - 6, Y(v));
    });
    const minGap = 40;
    let lastX = -Infinity;
    opts.xTicks.forEach((v) => {
      if (X(v) - lastX < minGap) return;
      lastX = X(v);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(opts.xFmt ? opts.xFmt(v) : v, X(v), pad.t + ph + 6);
    });
    ctx.textAlign = "center";
    ctx.fillText(opts.xLabel, pad.l + pw / 2, h - 16);
    ctx.save(); ctx.translate(13, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(opts.yLabel, 0, 0); ctx.restore();

    (opts.hLines || []).forEach((hl) => {
      if (hl.y < y0 || hl.y > y1) return;
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.moveTo(pad.l, Y(hl.y)); ctx.lineTo(pad.l + pw, Y(hl.y)); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = muted; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillText(hl.label, pad.l + pw - 4, Y(hl.y) - 3);
    });

    ctx.save();
    ctx.beginPath(); ctx.rect(pad.l, pad.t, pw, ph); ctx.clip();
    opts.series.forEach((s) => {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
      ctx.stroke();
    });
    ctx.restore();

    if (opts.marker && ok(opts.marker.x, opts.marker.y)) {
      const mx = X(opts.marker.x), my = Y(Math.min(Math.max(opts.marker.y, y0), y1));
      ctx.fillStyle = opts.marker.color; ctx.strokeStyle = cssVar("--surface"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    let lx = 8, ly = 12;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    opts.series.forEach((s) => {
      const wItem = 24 + ctx.measureText(s.name).width + 14;
      if (lx + wItem > w - 4 && lx > 8) { lx = 8; ly += 16; }
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.setLineDash(s.dash || []);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ink; ctx.fillText(s.name, lx + 24, ly);
      lx += wItem;
    });
  }

  // =====================================================================
  // 1. METHOD TRANSFER
  // =====================================================================
  const DEFAULT_GRAD = [[0, 5], [10, 95], [12, 95], [12.1, 5], [17, 5]];
  let gradRows = DEFAULT_GRAD.map((r) => r.slice());
  let lastScaledGradient = [];

  function renderGradInputs() {
    const tb = $("t_grad").querySelector("tbody");
    tb.innerHTML = gradRows.map((r, i) => `
      <tr>
        <td><input type="number" step="any" min="0" data-i="${i}" data-c="0" value="${Number.isFinite(r[0]) ? r[0] : ""}" aria-label="Original time, step ${i + 1}"></td>
        <td><input type="number" step="any" min="0" max="100" data-i="${i}" data-c="1" value="${Number.isFinite(r[1]) ? r[1] : ""}" aria-label="%B, step ${i + 1}"></td>
        <td><button type="button" data-del="${i}" aria-label="Remove step ${i + 1}" title="Remove step">×</button></td>
      </tr>`).join("");
    tb.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", (e) => {
      const i = +e.target.dataset.i, c = +e.target.dataset.c;
      gradRows[i][c] = e.target.value === "" ? NaN : parseFloat(e.target.value);
      calcTransfer();
      saveState();
    }));
    tb.querySelectorAll("button[data-del]").forEach((b) => b.addEventListener("click", () => {
      if (gradRows.length <= 1) return;
      gradRows.splice(+b.dataset.del, 1);
      renderGradInputs(); calcTransfer(); saveState();
    }));
  }
  $("t_addrow").addEventListener("click", () => {
    const last = gradRows[gradRows.length - 1] || [0, 5];
    gradRows.push([(Number.isFinite(last[0]) ? last[0] : 0) + 1, last[1]]);
    renderGradInputs(); calcTransfer(); saveState();
    const inputs = $("t_grad").querySelectorAll("tbody tr:last-child input");
    if (inputs[0]) inputs[0].focus();
  });
  $("t_copy").addEventListener("click", async () => {
    if (!lastScaledGradient.length) return;
    const F2 = lastScaledGradient.flow;
    const text = ["Time (min)\t%B\tFlow (mL/min)"]
      .concat(lastScaledGradient.map((r) => `${r[0].toFixed(2)}\t${fmt(r[1], 3)}\t${F2.toFixed(3)}`))
      .join("\n");
    toast((await copyText(text)) ? "Gradient table copied" : "Copy failed. Select the table manually.");
  });

  function calcTransfer() {
    const L1 = num("t_L1"), d1 = num("t_d1"), p1 = num("t_p1"), F1 = num("t_F1"), V1 = num("t_V1"), D1 = num("t_D1"), P1 = num("t_P1");
    const L2 = num("t_L2"), d2 = num("t_d2"), p2 = num("t_p2"), D2 = num("t_D2"), Pmax = num("t_Pmax");
    const extra = Number.isFinite(num("t_extra")) ? num("t_extra") : 0;
    const spp = $("t_spp").checked;
    const out = $("t_out"), gout = $("t_gout").querySelector("tbody"), dn = $("t_dwell"), run = $("t_run");

    if (!pos(L1, d1, p1, F1, L2, d2, p2)) {
      out.innerHTML = stat("Enter column dimensions and flow", "—");
      gout.innerHTML = ""; dn.innerHTML = ""; run.innerHTML = "";
      lastScaledGradient = [];
      return;
    }
    const r = C.transfer({ L1, d1, p1, F1, V1, L2, d2, p2, useDp: $("t_dpflow").checked, extraPct: extra });

    let html = "";
    html += stat("New flow rate", fmt(r.F2) + " mL/min", `linear velocity ×${fmt(r.velocityRatio)}`, "key");
    html += stat("New injection volume", Number.isFinite(r.V2) ? fmt(r.V2) + " µL" : "—", "same load per column volume", "key");
    html += stat("Time scaling factor", "×" + fmt(r.timeFactor), "applies to gradient steps and run time");
    if (spp) {
      html += stat("L/d<sub>p</sub>", `${int(r.lp1)} → ${int(r.lp2)}`,
        `${signed(r.lpChange * 100)}% · particle-type change: USP uses the efficiency criterion instead (see notes)`);
    } else {
      html += stat("L/d<sub>p</sub>", `${int(r.lp1)} → ${int(r.lp2)}`,
        `${signed(r.lpChange * 100)}% · USP window −25% to +50% · ${r.lpOK ? "within" : "outside"}`,
        r.lpOK ? "pass" : "fail");
    }
    if (extra !== 0) {
      html += stat("Extra flow adjustment", signed(extra, 0) + "%", `USP allows ±50% · ${r.flowAdjOK ? "within" : "outside"}`, r.flowAdjOK ? "pass" : "fail");
    }
    html += stat("Pressure ratio P<sub>2</sub>/P<sub>1</sub>", "×" + fmt(r.pressureRatio), "same mobile phase &amp; temperature");
    if (pos(P1)) {
      const P2 = P1 * r.pressureRatio;
      let cls = "", sub = `${fmt(P2 * 14.5038, 3)} psi`;
      if (pos(Pmax)) {
        const frac = P2 / Pmax;
        cls = frac <= 0.9 ? "pass" : "fail";
        sub += ` · ${fix(frac * 100, 0)}% of the ${fmt(Pmax)} bar limit` + (frac > 0.9 ? (frac > 1 ? " (over the limit)" : " (less than 10% headroom)") : "");
      }
      html += stat("Estimated new column pressure", fmt(P2) + " bar", sub, cls);
    } else if (pos(Pmax)) {
      html += stat("Pressure check", "—", "enter the original back-pressure to compare with the system limit");
    }
    html += stat("Column volume ratio", "×" + fmt(r.volRatio));
    out.innerHTML = html;

    // dwell
    let hold = 0, dwellMsg = "";
    if (ok(D1, D2) && D1 >= 0 && D2 >= 0) {
      const dw = C.dwellCompensation(D1, D2, r.volRatio, r.F2);
      if (dw.diff === 0) {
        dwellMsg = `The new system's dwell volume already matches the scaled original (${fmt(dw.target)} mL). No compensation needed.`;
      } else if (dw.hold > 0) {
        hold = dw.hold;
        dwellMsg = `Scaled original dwell volume = <b>${fmt(dw.target)} mL</b>; new system = ${fmt(D2)} mL. ` +
          `To reproduce the original gradient delay, add an initial isocratic hold of <b>${fmt(hold)} min</b> (${fmt(dw.diff)} mL at ${fmt(r.F2)} mL/min).`;
      } else {
        dwellMsg = `Scaled original dwell volume = <b>${fmt(dw.target)} mL</b>; the new system's ${fmt(D2)} mL is larger. ` +
          `To match, delay injection by <b>${fmt(dw.delay)} min</b> after the gradient starts (if your system supports it), or reduce the dwell volume. ` +
          `Otherwise early-eluting peaks will elute relatively later than in the original method.`;
      }
    }
    dn.innerHTML = gradRows.filter((x) => ok(x[0], x[1])).length > 1 ? dwellMsg : "";

    // gradient output
    const includeHold = $("t_hold").checked && hold > 0;
    const scaled = C.scaleGradient(gradRows, r.timeFactor, includeHold ? hold : 0);
    scaled.flow = r.F2;
    lastScaledGradient = scaled;
    gout.innerHTML = scaled.map((row) =>
      `<tr><td class="out">${fix(row[0], 2)}</td><td class="out">${fmt(row[1], 3)}</td><td class="out">${fix(r.F2, 3)}</td></tr>`
    ).join("");

    // run time & solvent
    const times = gradRows.map((x) => x[0]).filter(Number.isFinite);
    const t1 = times.length ? Math.max(...times) : NaN;
    if (pos(t1) && scaled.length) {
      const t2 = scaled[scaled.length - 1][0];
      const s1 = F1 * t1, s2 = r.F2 * t2;
      run.innerHTML =
        stat("Run time", `${fmt(t1)} → ${fmt(t2)} min`, `${fmt(t1 / t2)}× faster`) +
        stat("Solvent per run", `${fmt(s1)} → ${fmt(s2)} mL`, `${fix((1 - s2 / s1) * 100, 0)}% less`);
    } else {
      run.innerHTML = "";
    }
  }
  bindAll(["t_L1", "t_d1", "t_p1", "t_F1", "t_V1", "t_D1", "t_P1", "t_L2", "t_d2", "t_p2", "t_D2", "t_Pmax", "t_dpflow", "t_spp", "t_extra", "t_hold"], calcTransfer);

  // =====================================================================
  // 2. GRADIENT
  // =====================================================================
  function calcGradient() {
    const L = num("g_L"), d = num("g_d"), eps = num("g_eps"), F = num("g_F");
    const b0 = num("g_b0"), b1 = num("g_b1"), tG = num("g_tG"), S = num("g_S"), kt = num("g_kt"), w = num("g_w");
    let html = "";
    if (!pos(L, d, eps, F)) { $("g_out").innerHTML = stat("Enter column dimensions and flow", "—"); return; }
    const Vm = C.voidVolume(L, d, eps);
    const t0 = Vm / F;
    html += stat("Void volume V<sub>m</sub>", fmt(Vm * 1000) + " µL", `t<sub>0</sub> = ${fmt(t0)} min`);
    const dPhi = Math.abs(b1 - b0) / 100;
    if (pos(tG, S, dPhi)) {
      const k = C.gradientK(tG, F, Vm, dPhi, S);
      let cls, sub;
      if (k < 1) { cls = "fail"; sub = "low: peaks crowd together; lengthen t<sub>G</sub> or narrow the %B range"; }
      else if (k < 2) { cls = ""; sub = "on the low side; resolution may suffer"; }
      else if (k <= 10) { cls = "pass"; sub = "within the usual 2–10 working range"; }
      else { cls = "fail"; sub = "high: long run and broad, diluted peaks; shorten t<sub>G</sub>"; }
      html += stat("Gradient retention factor k*", fmt(k), sub, cls);
      const cv = (F * tG) / Vm;
      html += stat("Gradient volume", fmt(cv) + " column volumes", `slope ${fmt((Math.abs(b1 - b0)) / cv)} %B per column volume`);
      if (pos(kt)) {
        const tGt = C.gradientTimeForK(kt, F, Vm, dPhi, S);
        html += stat(`t<sub>G</sub> for k* = ${fmt(kt)}`, fmt(tGt) + " min", `same column, flow and %B range`, "key");
      }
      if (pos(w)) html += stat("Peak capacity", int(C.peakCapacity(tG, w)), `t<sub>G</sub> / ${fmt(w)} min average 4σ width`);
    } else {
      html += stat("Enter a %B range, t<sub>G</sub> and S", "—");
    }
    $("g_out").innerHTML = html;

    const first = num("g_first"), last = num("g_last"), stG = num("g_stG");
    if (ok(first, last) && pos(stG) && last > first) {
      const frac = (last - first) / stG;
      let verdict, cls;
      if (frac < 0.25) { verdict = "isocratic elution should be feasible"; cls = "pass"; }
      else if (frac > 0.40) { verdict = "use gradient elution"; cls = "key"; }
      else { verdict = "either may work; gradient usually gives a shorter run"; cls = ""; }
      $("g_scout").innerHTML = stat("Δt<sub>R</sub> / t<sub>G</sub>", fix(frac, 2), verdict, cls);
    } else {
      $("g_scout").innerHTML = stat("Δt<sub>R</sub> / t<sub>G</sub>", "—", "enter first and last peak (last > first)");
    }
  }
  bindAll(["g_L", "g_d", "g_eps", "g_F", "g_b0", "g_b1", "g_tG", "g_S", "g_kt", "g_w", "g_first", "g_last", "g_stG"], calcGradient);

  // =====================================================================
  // 3. SYSTEM SUITABILITY
  // =====================================================================
  function calcSST() {
    const t0 = num("s_t0"), tr1 = num("s_tr1"), tr2 = num("s_tr2"), w1 = num("s_w1"), w2 = num("s_w2");
    const basis = $("s_basis").value;
    const k1 = pos(t0) && ok(tr1) ? C.retentionFactor(tr1, t0) : NaN;
    const k2 = pos(t0) && ok(tr2) ? C.retentionFactor(tr2, t0) : NaN;
    const alpha = k1 > 0 && k2 > 0 ? Math.max(k1, k2) / Math.min(k1, k2) : NaN;
    const N1 = pos(tr1, w1) ? C.plates(tr1, w1, basis) : NaN;
    const N2 = pos(tr2, w2) ? C.plates(tr2, w2, basis) : NaN;
    const Rs = pos(w1, w2) && ok(tr1, tr2) ? C.resolution(tr1, tr2, w1, w2, basis) : NaN;
    const L = num("s_L"), dp = num("s_dp");

    let html = "";
    html += stat("k (peak 1)", fmt(k1), k1 > 0 && k1 < 1 ? "below 1: close to the void; aim for k ≥ 2" : "");
    html += stat("k (peak 2)", fmt(k2));
    html += stat("Selectivity α", fmt(alpha, 4));
    const hSub = (N) => (pos(L, dp, N) ? `h = ${fix(C.reducedPlateHeight(L, N, dp), 2)} (reduced plate height)` : "");
    html += stat("Plates N (peak 1)", int(N1), hSub(N1));
    html += stat("Plates N (peak 2)", int(N2), hSub(N2));
    const rsCls = Number.isFinite(Rs) ? (Rs >= 1.5 ? "pass" : "fail") : "";
    html += stat("Resolution R<sub>s</sub>", fix(Rs, 2), Number.isFinite(Rs) ? (Rs >= 1.5 ? "≥ 1.5: baseline resolved" : "< 1.5: not baseline resolved") : "", rsCls);
    $("s_out").innerHTML = html;

    const W = num("s_w005"), f = num("s_f");
    if (pos(W, f) && f <= W) {
      const T = C.symmetry(W, f);
      const inDefault = T >= 0.8 && T <= 1.8;
      $("s_tail").innerHTML = stat("Symmetry factor A<sub>s</sub>", fix(T, 2),
        (inDefault ? "within" : "outside") + " the Ph. Eur. default 0.8–1.8 (the monograph limit takes precedence)", inDefault ? "pass" : "fail");
    } else {
      $("s_tail").innerHTML = stat("Symmetry factor A<sub>s</sub>", "—", pos(W, f) ? "f cannot exceed W<sub>0.05</sub>" : "");
    }

    const Hh = num("s_H"), nh = num("s_h"), conc = num("s_c");
    if (pos(Hh, nh)) {
      const sn = C.signalToNoise(Hh, nh);
      let sh = stat("Signal-to-noise S/N", fmt(sn), sn >= 10 ? "≥ 10: quantifiable" : sn >= 3 ? "3–10: detectable, below the usual LOQ" : "< 3: below the usual LOD", sn >= 10 ? "pass" : "fail");
      if (pos(conc)) sh += stat("Estimated LOD / LOQ", `${fmt(conc * 3 / sn)} / ${fmt(conc * 10 / sn)}`, "S/N 3 and 10, same unit as the concentration, assuming linear response");
      $("s_sn").innerHTML = sh;
    } else {
      $("s_sn").innerHTML = stat("Signal-to-noise S/N", "—");
    }
  }
  bindAll(["s_t0", "s_basis", "s_tr1", "s_tr2", "s_w1", "s_w2", "s_L", "s_dp", "s_w005", "s_f", "s_H", "s_h", "s_c"], calcSST);

  function calcReps() {
    const vals = C.parseNumbers($("s_reps").value);
    const lim = num("s_rsdlim");
    const s = C.stats(vals);
    if (s.n < 2) { $("s_rep").innerHTML = stat("%RSD", "—", "enter at least two values"); return; }
    const pass = pos(lim) ? s.rsd <= lim : null;
    $("s_rep").innerHTML =
      stat("%RSD", fix(s.rsd, 2) + "%", pos(lim) ? `${pass ? "≤" : ">"} ${fmt(lim)}% limit · n = ${s.n}` : `n = ${s.n}`, pass === null ? "" : pass ? "pass" : "fail") +
      stat("Mean ± SD", `${fmt(s.mean, 5)} ± ${fmt(s.sd, 3)}`, `range ${fmt(s.min, 5)} – ${fmt(s.max, 5)}`);
  }
  bindAll(["s_reps", "s_rsdlim"], calcReps);

  function calcPurnell() {
    const N = num("p_N"), a = num("p_a"), k = num("p_k"), target = num("p_rs");
    let html = "";
    if (pos(N, k) && a > 1) {
      const Rs = C.purnell(N, a, k);
      html += stat("Predicted R<sub>s</sub>", fix(Rs, 2), "", "key");
      if (pos(target)) {
        const Nreq = C.purnellPlatesNeeded(target, a, k);
        html += stat("Plates needed for target", int(Nreq), `×${fmt(Nreq / N)} current N (column length ×${fmt(Nreq / N)} at the same d<sub>p</sub>)`);
        const aReq = C.purnellAlphaNeeded(target, N, k);
        html += stat("α needed at current N, k", Number.isFinite(aReq) ? fmt(aReq, 4) : "not reachable", Number.isFinite(aReq) ? "" : "target too high for this N and k");
      }
      html += stat("Selectivity term (α−1)/α", fmt((a - 1) / a));
      html += stat("Retention term k/(1+k)", fmt(k / (1 + k)), k < 2 ? "increasing k still helps noticeably" : "little gain from more retention");
    } else {
      html += stat("Enter N > 0, α > 1, k > 0", "—");
    }
    $("p_out").innerHTML = html;
    drawPurnell();
  }

  function drawPurnell() {
    const canvas = $("p_chart");
    if ($("sst").hidden) return;
    const N = num("p_N"), a = num("p_a"), k = num("p_k"), target = num("p_rs");
    if (!(pos(N, k) && a > 1)) { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); return; }
    const aMax = Math.max(1.3, Math.ceil((a + 0.1) * 10) / 10);
    const curves = [N / 2, N, N * 2];
    const colors = [cssVar("--muted"), cssVar("--accent"), cssVar("--accent2")];
    const series = curves.map((n, i) => {
      const pts = [];
      for (let x = 1; x <= aMax + 1e-9; x += (aMax - 1) / 120) pts.push([x, C.purnell(n, x, k)]);
      return { name: `N = ${int(n)}`, color: colors[i], pts, dash: i === 1 ? [] : [5, 4] };
    });
    const yTop = Math.max(...series.map((s) => s.pts[s.pts.length - 1][1]), target || 0);
    const ys = yTop > 16 ? 5 : yTop > 8 ? 2 : 1;
    const yMax = Math.max(3, Math.ceil((yTop + 0.5) / ys) * ys);
    const xt = [];
    const step = aMax - 1 > 1 ? 0.25 : aMax - 1 > 0.5 ? 0.1 : 0.05;
    for (let x = 1; x <= aMax + 1e-9; x += step) xt.push(Math.round(x * 100) / 100);
    const yt = [];
    for (let y = 0; y <= yMax; y += ys) yt.push(y);
    lineChart(canvas, {
      xRange: [1, aMax], yRange: [0, yMax], xTicks: xt, yTicks: yt,
      xFmt: (v) => v.toFixed(2), xLabel: `Selectivity α  (k = ${fmt(k)})`, yLabel: "Rs",
      series, hLines: pos(target) ? [{ y: target, label: `target Rs ${target}` }] : [{ y: 1.5, label: "Rs 1.5" }],
      marker: { x: a, y: C.purnell(N, a, k), color: cssVar("--accent") },
    });
  }
  bindAll(["p_N", "p_a", "p_k", "p_rs"], calcPurnell);

  // =====================================================================
  // 4. BUFFER
  // =====================================================================
  (function initBuffer() {
    $("b_sys").innerHTML = C.BUFFERS.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join("");
    $("a_sys").innerHTML = C.ADDITIVES.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("");
    $("b_table").innerHTML = `<div class="gtable-wrap"><table><thead><tr><th>System</th><th>pKa (25 °C)</th><th>Acid form</th><th>Base form</th><th>MS-compatible</th></tr></thead><tbody>` +
      C.BUFFERS.map((b) => `<tr><td>${esc(b.name.split(" — ")[0])}</td><td>${b.pKa}</td>` +
        `<td>${esc(b.acid.name)}, ${b.acid.mw} g/mol${b.acid.liqNote ? " (" + esc(b.acid.liqNote) + ")" : ""}</td>` +
        `<td>${esc(b.base.name)}, ${b.base.mw} g/mol${b.base.liqNote ? " (" + esc(b.base.liqNote) + ")" : ""}</td>` +
        `<td>${b.ms ? "Yes (volatile)" : "No"}</td></tr>`).join("") +
      `</tbody></table></div><p>pKa values are thermodynamic values at 25 °C. Useful buffering range is about pKa ± 1.</p>`;
  })();

  function amountText(comp, mol) {
    if (comp.liquid) {
      const mL = mol / comp.liquid;
      return { main: mL >= 1 ? fmt(mL, 3) + " mL" : fmt(mL * 1000, 3) + " µL", sub: `${fmt(mol * 1000, 3)} mmol · ${comp.liqNote}` };
    }
    const g = mol * comp.mw;
    return { main: g >= 1 ? fmt(g, 4) + " g" : fmt(g * 1000, 3) + " mg", sub: `${fmt(mol * 1000, 3)} mmol · MW ${comp.mw}` };
  }

  function calcBuffer() {
    const b = C.BUFFERS.find((x) => x.id === $("b_sys").value);
    const pH = num("b_pH"), c = num("b_c"), v = num("b_v");
    if (!b || !ok(pH) || !pos(c, v)) { $("b_out").innerHTML = stat("Enter pH, concentration and volume", "—"); return; }
    const r = C.bufferPrep(b, pH, c, v, { activity: $("b_act").checked });
    let html = "";
    if (!r.feasible) {
      const msg = r.needs === "acid"
        ? `pH ${fmt(pH, 3)} is too acidic to reach with these two reagents at ${fmt(c)} mM: the free H⁺ alone exceeds what the acid form supplies. Use a stronger acid (or a lower-pKa buffer).`
        : `pH ${fmt(pH, 3)} is too basic to reach with these two reagents at ${fmt(c)} mM. Use a stronger base (or a higher-pKa buffer).`;
      $("b_out").innerHTML = stat("Not achievable", "—", msg, "fail");
      return;
    }
    const a = amountText(b.acid, r.molAcid), ba = amountText(b.base, r.molBase);
    html += stat(esc(b.acid.name), a.main, a.sub, "key");
    html += stat(esc(b.base.name), ba.main, ba.sub, "key");
    const dist = Math.abs(pH - r.pKaEff);
    html += stat("Effective pK<sub>a</sub>′", fix(r.pKaEff, 2),
      `ionic strength ${fmt(r.ionicStrength * 1000, 3)} mM · ${fix(dist, 2)} from target` + (dist > 1 ? " (outside ±1: weak buffering)" : ""),
      dist <= 1 ? "pass" : "fail");
    html += stat("Buffer capacity β", fmt(r.bufferCapacity * 1000, 3) + " mM/pH", `fraction in base form ${fix(r.alpha * 100, 1)}%`);
    const hhDiff = Math.abs(r.hhMolBase - r.molBase) / Math.max(r.molBase, 1e-12);
    if (hhDiff > 0.02) {
      const hb = amountText(b.base, r.hhMolBase), ha = amountText(b.acid, r.hhMolAcid);
      html += stat("Plain Henderson–Hasselbalch would give", `${ha.main} / ${hb.main}`, `acid / base, ${fix(hhDiff * 100, 0)}% off on the base form`);
    }
    if (b.note) html += stat("Note", "", esc(b.note));
    $("b_out").innerHTML = html;
  }
  bindAll(["b_sys", "b_pH", "b_c", "b_v", "b_act"], calcBuffer);

  function calcAdditive() {
    const a = C.ADDITIVES.find((x) => x.id === $("a_sys").value);
    const pct = num("a_pct");
    if (!a || !pos(pct)) { $("a_out").innerHTML = ""; return; }
    const M = C.additiveMolarity(a, pct);
    const pH = C.weakAcidPH(a.pKa, M);
    $("a_out").innerHTML =
      stat("Estimated pH", fix(pH, 2), "in water, 25 °C", "key") +
      stat("Concentration", fmt(M * 1000) + " mM", `pK<sub>a</sub> ${a.pKa}` + (a.id === "phosphoric" ? " (first dissociation only)" : ""));
  }
  bindAll(["a_sys", "a_pct"], calcAdditive);

  // =====================================================================
  // 5. PRESSURE & VISCOSITY
  // =====================================================================
  function calcPressure() {
    const org = $("v_org").value, pct = num("v_pct"), T = num("v_T"), etaO = num("v_eta");
    const L = num("v_L"), d = num("v_d"), dp = num("v_dp"), F = num("v_F"), eps = num("v_eps"), phi = num("v_phi"), Pm = num("v_Pm");
    let html = "";
    const etaCalc = ok(pct, T) ? C.viscosity(org, pct, T) : NaN;
    const eta = pos(etaO) ? etaO : etaCalc;
    html += stat("Viscosity η", fix(eta, 3) + " cP", pos(etaO) ? "user override" : `${C.VISCOSITY[org].name} ${fmt(pct)}% at ${fmt(T)} °C`);
    if (pos(eta, L, d, dp, F, eps)) {
      if (pos(Pm)) {
        const phiCal = C.flowResistance(Pm, eta, L, d, dp, F, eps);
        html += stat("Calibrated φ for this column", int(phiCal),
          `<button type="button" class="linkbtn" id="v_usephi">Use this value</button> to predict other conditions`, "key");
      }
      if (pos(phi)) {
        const P = C.columnPressure(phi, eta, L, d, dp, F, eps);
        html += stat("Estimated column ΔP", fmt(P, 3) + " bar", `${fmt(P * 14.5038, 3)} psi · ${fmt(P / 10, 3)} MPa`, pos(Pm) ? "" : "key");
        if (!pos(etaO)) {
          let pmax = 0, atPct = 0;
          for (let x = 5; x <= 95; x += 1) {
            const pp = C.columnPressure(phi, C.viscosity(org, x, T), L, d, dp, F, eps);
            if (pp > pmax) { pmax = pp; atPct = x; }
          }
          html += stat("Peak ΔP over a 5–95% gradient", fmt(pmax, 3) + " bar", `at ≈${atPct}% ${C.VISCOSITY[org].name.toLowerCase()}`);
        }
      }
      const u0 = C.linearVelocity(F, d, eps);
      html += stat("Linear velocity u<sub>0</sub>", fmt(u0, 3) + " mm/s", `t<sub>0</sub> = ${fmt(L / u0 / 60, 3)} min`);
    }
    if ($("v_out").innerHTML !== html) $("v_out").innerHTML = html;
    drawVisc();
  }

  $("v_out").addEventListener("click", (e) => {
    if (!e.target.closest("#v_usephi")) return;
    const eta = pos(num("v_eta")) ? num("v_eta") : C.viscosity($("v_org").value, num("v_pct"), num("v_T"));
    const phiCal = C.flowResistance(num("v_Pm"), eta, num("v_L"), num("v_d"), num("v_dp"), num("v_F"), num("v_eps"));
    if (!pos(phiCal)) return;
    $("v_phi").value = Math.round(phiCal);
    $("v_Pm").value = "";
    calcPressure(); saveState();
    toast("φ updated to " + Math.round(phiCal));
  });

  function drawVisc() {
    if ($("pressure").hidden) return;
    const T = num("v_T"), pct = num("v_pct"), org = $("v_org").value;
    if (!ok(T)) return;
    const mk = (o) => { const pts = []; for (let x = 0; x <= 100; x += 1) pts.push([x, C.viscosity(o, x, T)]); return pts; };
    const acn = mk("acn"), meoh = mk("meoh");
    const top = Math.max(...meoh.map((p) => p[1]), ...acn.map((p) => p[1]));
    const ys = top > 2 ? 0.5 : 0.2;
    const yMax = Math.ceil((top + 0.1) / ys) * ys;
    const yt = []; for (let y = 0; y <= yMax + 1e-9; y += ys) yt.push(Math.round(y * 10) / 10);
    lineChart($("v_chart"), {
      xRange: [0, 100], yRange: [0, yMax], xTicks: [0, 20, 40, 60, 80, 100], yTicks: yt,
      yFmt: (v) => v.toFixed(1), xLabel: `Organic content (% v/v) at ${fmt(T)} °C`, yLabel: "η (cP)",
      series: [
        { name: "Water–methanol", color: cssVar("--accent2"), pts: meoh },
        { name: "Water–acetonitrile", color: cssVar("--accent"), pts: acn },
      ],
      marker: ok(pct) ? { x: Math.min(Math.max(pct, 0), 100), y: C.viscosity(org, pct, T), color: org === "acn" ? cssVar("--accent") : cssVar("--accent2") } : null,
    });
  }
  bindAll(["v_org", "v_pct", "v_T", "v_eta", "v_L", "v_d", "v_dp", "v_F", "v_eps", "v_phi", "v_Pm"], calcPressure);

  // =====================================================================
  // 6. COLUMN & SOLVENT
  // =====================================================================
  function syncColumnType() {
    const custom = $("c_type").value === "custom";
    $("c_epsw").hidden = !custom;
    if (!custom) $("c_eps").value = $("c_type").value;
  }
  $("c_type").addEventListener("change", () => { syncColumnType(); calcColumn(); });
  function calcColumn() {
    const L = num("c_L"), d = num("c_d"), eps = num("c_eps"), F = num("c_F"), D = num("c_D"), cv = num("c_cv");
    const rt = num("c_rt"), n = num("c_n"), b = num("c_b"), ex = num("c_extra");
    let html = "";
    if (pos(L, d, eps)) {
      const Vempty = C.columnVolume(L, d);
      const Vm = C.voidVolume(L, d, eps);
      html += stat("Column void volume V<sub>m</sub>", fmt(Vm * 1000, 3) + " µL", `empty column ${fmt(Vempty, 3)} mL`, "key");
      if (pos(F)) {
        const t0 = Vm / F;
        html += stat("Dead time t<sub>0</sub>", fmt(t0, 3) + " min", fmt(t0 * 60, 3) + " s", "key");
        html += stat("Linear velocity u", fmt(C.linearVelocity(F, d, eps), 3) + " mm/s");
        if (ok(D) && D >= 0) html += stat("Dwell time t<sub>D</sub>", fmt(D / F, 3) + " min", `gradient reaches the column ${fmt(D / F * 60, 3)} s after it starts`);
        if (pos(cv)) {
          const eqV = cv * Vm + (ok(D) && D > 0 ? D : 0);
          html += stat("Re-equilibration", fmt(eqV / F, 3) + " min", `${fmt(cv)} column volumes + dwell = ${fmt(eqV, 3)} mL`);
        }
      }
    }
    if (pos(F, rt, n)) {
      const total = F * rt * n * (1 + (pos(ex) ? ex : 0) / 100);
      const fb = ok(b) ? Math.min(Math.max(b, 0), 100) / 100 : 0.5;
      const vol = (mL) => (mL >= 1000 ? fmt(mL / 1000, 3) + " L" : fmt(mL, 3) + " mL");
      html += stat("Total mobile phase", vol(total), `${fmt(F * rt, 3)} mL per injection`, "key");
      html += stat("Channel A", vol(total * (1 - fb)));
      html += stat("Channel B", vol(total * fb));
      html += stat("Sequence time", fmt(rt * n / 60, 3) + " h");
    }
    $("c_out").innerHTML = html || stat("Enter column dimensions", "—");
  }
  bindAll(["c_L", "c_d", "c_eps", "c_F", "c_D", "c_cv", "c_rt", "c_n", "c_b", "c_extra"], calcColumn);

  // =====================================================================
  // 7. UNITS
  // =====================================================================
  const PRESS = C.PRESSURE_PER_BAR;
  const pressInputs = document.querySelectorAll("#u_press input");
  function convPress(src) {
    const v = parseFloat(src.value);
    if (!Number.isFinite(v)) return;
    const bar = v / PRESS[src.dataset.u];
    pressInputs.forEach((inp) => { if (inp !== src) inp.value = +(bar * PRESS[inp.dataset.u]).toPrecision(6); });
    if (src.dataset.u !== "bar") $("u_bar").value = +bar.toPrecision(6);
  }
  pressInputs.forEach((inp) => inp.addEventListener("input", () => { convPress(inp); saveState(); }));
  calcs.push(() => convPress($("u_bar")));

  function calcConc() {
    const mw = num("u_mw"), v = num("u_cv"), u = $("u_cu").value, inj = num("u_inj");
    if (!pos(mw) || !ok(v)) { $("u_conc").innerHTML = ""; return; }
    const toMgPerMl = { mgml: 1, ugml: 1e-3, ngml: 1e-6 };
    let mgml, molar;
    if (u in toMgPerMl) { mgml = v * toMgPerMl[u]; molar = mgml / mw; }
    else { molar = v * { m: 1, mm: 1e-3, um: 1e-6 }[u]; mgml = molar * mw; }
    let html =
      stat("mg/mL", fmt(mgml, 4)) + stat("µg/mL (ppm)", fmt(mgml * 1e3, 4)) + stat("ng/mL (ppb)", fmt(mgml * 1e6, 4)) +
      stat("mM", fmt(molar * 1e3, 4)) + stat("µM", fmt(molar * 1e6, 4)) + stat("nM", fmt(molar * 1e9, 4));
    if (pos(inj)) {
      const ng = mgml * inj * 1000; // mg/mL × µL = µg → ×1000 ng
      const pmol = molar * inj * 1e6; // mol/L × µL = µmol ×1e-3… → pmol
      html += stat("On column", ng >= 1000 ? fmt(ng / 1000, 4) + " µg" : fmt(ng, 4) + " ng", `${fmt(pmol, 4)} pmol in ${fmt(inj)} µL`, "key");
    }
    $("u_conc").innerHTML = html;
  }
  bindAll(["u_mw", "u_cv", "u_cu", "u_inj"], calcConc);

  function calcVel() {
    const d = num("u_d"), eps = num("u_eps"), F = num("u_F");
    if (!pos(d, eps, F)) { $("u_vel").innerHTML = ""; return; }
    const u = C.linearVelocity(F, d, eps);
    $("u_vel").innerHTML = stat("Linear velocity", fmt(u, 3) + " mm/s", fmt(u / 10 * 60, 3) + " cm/min", "key") +
      stat("Flow for 1 mm/s", fmt(F / u, 3) + " mL/min");
  }
  bindAll(["u_d", "u_eps", "u_F"], calcVel);

  // =====================================================================
  // State: remember inputs, share links, reset
  // =====================================================================
  const STORE_KEY = "hplc-tools:v2";
  const panels = Array.from(document.querySelectorAll(".panel"));
  const fieldsOf = (panel) => Array.from(panel.querySelectorAll("input[id], select[id], textarea[id]"));
  const readField = (el) => (el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value);
  const writeField = (el, v) => { if (el.type === "checkbox") el.checked = v === "1" || v === true; else el.value = v; };

  const defaults = {};
  panels.forEach((p) => fieldsOf(p).forEach((el) => { defaults[el.id] = readField(el); }));

  const encodeGrad = (rows) => rows.filter((r) => ok(r[0], r[1])).map((r) => `${r[0]}:${r[1]}`).join(",");
  const decodeGrad = (s) => String(s).split(",").map((p) => p.split(":").map(Number)).filter((r) => r.length === 2 && ok(r[0], r[1]));

  function collectState(panel) {
    const st = {};
    (panel ? [panel] : panels).forEach((p) => fieldsOf(p).forEach((el) => { st[el.id] = readField(el); }));
    if (!panel || panel.id === "transfer") st.grad = encodeGrad(gradRows);
    return st;
  }
  function applyState(st) {
    Object.keys(st).forEach((k) => {
      if (k === "grad") {
        const g = decodeGrad(st.grad);
        if (g.length) gradRows = g;
        return;
      }
      const el = $(k);
      if (el && el.closest(".panel")) writeField(el, st[k]);
    });
  }
  let saveTimer;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(collectState())); } catch (e) { /* storage unavailable */ }
    }, 250);
  }
  function loadStored() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  document.addEventListener("input", (e) => { if (e.target.closest && e.target.closest(".panel")) saveState(); });
  document.addEventListener("change", (e) => { if (e.target.closest && e.target.closest(".panel")) saveState(); });

  function recalcAll() { calcs.forEach((fn) => fn()); }

  // toolbar in each panel
  panels.forEach((p) => {
    const head = p.querySelector(".panel-head");
    const bar = document.createElement("div");
    bar.className = "toolbar";
    bar.innerHTML = `<button type="button" class="btn ghost small" data-act="link">Copy link</button>` +
      `<button type="button" class="btn ghost small" data-act="reset">Reset</button>`;
    head.appendChild(bar);
    bar.querySelector('[data-act="link"]').addEventListener("click", async () => {
      const st = collectState(p);
      const params = new URLSearchParams();
      Object.keys(st).forEach((k) => { if (k === "grad" || st[k] !== defaults[k]) params.set(k, st[k]); });
      const url = location.href.split("#")[0] + "#" + p.id + (params.toString() ? "?" + params.toString() : "");
      toast((await copyText(url)) ? "Link with these inputs copied" : "Copy failed");
    });
    bar.querySelector('[data-act="reset"]').addEventListener("click", () => {
      fieldsOf(p).forEach((el) => writeField(el, defaults[el.id]));
      if (p.id === "transfer") { gradRows = DEFAULT_GRAD.map((r) => r.slice()); renderGradInputs(); }
      if (p.id === "column") syncColumnType();
      recalcAll(); saveState();
      toast("Inputs reset");
    });
  });

  // ---------- tabs ----------
  const tabs = Array.from(document.querySelectorAll(".tabs button"));
  function showTab(name, push) {
    if (!tabs.some((b) => b.dataset.tab === name)) name = "transfer";
    tabs.forEach((b) => {
      const on = b.dataset.tab === name;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      $(b.dataset.tab).hidden = !on;
    });
    if (push) history.replaceState(null, "", "#" + name);
    redrawCharts();
  }
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => showTab(b.dataset.tab, true));
    b.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      tabs[j].focus();
      showTab(tabs[j].dataset.tab, true);
    });
  });

  function parseHash() {
    const h = location.hash.replace(/^#/, "");
    const [tab, query] = h.split("?");
    const params = {};
    if (query) new URLSearchParams(query).forEach((v, k) => { params[k] = v; });
    return { tab: tab || "transfer", params };
  }

  function redrawCharts() { drawPurnell(); drawVisc(); }
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(redrawCharts, 120); });
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", redrawCharts);
  }

  // ---------- init ----------
  const stored = loadStored();
  if (stored) applyState(stored);
  const { tab, params } = parseHash();
  if (Object.keys(params).length) {
    applyState(params);
    history.replaceState(null, "", "#" + tab); // keep the address bar tidy
  }
  syncColumnType();
  renderGradInputs();
  recalcAll();
  showTab(tab, false);
  if (location.hash) requestAnimationFrame(() => window.scrollTo(0, 0));
  window.addEventListener("hashchange", () => {
    const h = parseHash();
    if (Object.keys(h.params).length) {
      applyState(h.params); syncColumnType(); renderGradInputs(); recalcAll(); saveState();
      history.replaceState(null, "", "#" + h.tab);
    }
    showTab(h.tab, false);
    window.scrollTo(0, 0);
  });
})();
