/* Resolve: a method-development game, and Restore Desktop.
   The chemistry lives in js/resolve-engine.js; this file is the window. */
(function () {
  'use strict';
  const OS = window.OS;
  const E = window.ResolveEngine;
  const { el, glyph, icon, store } = OS;
  if (!E) return;

  const fmt = (n, d = 2) => (isFinite(n) ? n.toFixed(d) : '—');
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function setupCanvas(cv) {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* =====================================================================
     Resolve
     ===================================================================== */
  OS.APPDEFS.resolve = {
    size: [1100, 720],
    mount(w) {
      w.setTitle('Resolve');
      w.setIcon(() => icon('resolve'));
      const saved = store.get('resolve', { stars: {} });
      const save = () => store.set('resolve', saved);
      const unlocked = (i) => i === 0 || (saved.stars[E.LEVELS[i - 1].id] || 0) > 0;
      let li = Math.max(0, E.LEVELS.findIndex((L, i) => unlocked(i) && !saved.stars[L.id]));
      if (li < 0) li = 0;
      let L, method, left, runs, last, ghost, anim = 0, outcome = null;

      const root = el('div', { class: 'rv' });
      w.body.append(root);
      const tabs = el('nav', { class: 'rv-levels', 'aria-label': 'Levels' });
      const side = el('aside', { class: 'rv-side' });
      const plot = el('canvas', { class: 'rv-plot', 'aria-label': 'Chromatogram' });
      const plotWrap = el('div', { class: 'rv-plotwrap' }, plot);
      const status = el('div', { class: 'rv-status', role: 'status', 'aria-live': 'polite' });
      const table = el('div', { class: 'rv-table' });
      const overlay = el('div', { class: 'rv-overlay', hidden: true });
      const mainCol = el('section', { class: 'rv-main' }, el('div', { class: 'rv-plothead' }, el('span', {}, 'Detector: UV 254 nm'), el('span', {}, E.COLUMN.name), el('span', {}, `${E.COLUMN.flow} mL/min`)), plotWrap, status, table);
      root.append(tabs, el('div', { class: 'rv-body' }, side, mainCol), overlay);

      function renderTabs() {
        tabs.replaceChildren(...E.LEVELS.map((lv, i) => {
          const st = saved.stars[lv.id] || 0;
          const b = el('button', { class: 'rv-tab' + (i === li ? ' on' : ''), disabled: !unlocked(i), 'aria-current': i === li ? 'true' : null, onclick: () => load(i) },
            el('span', { class: 'rv-n' }, String(i + 1)), el('span', { class: 'rv-t' }, lv.title),
            el('span', { class: 'rv-st', 'aria-label': `${st} of 3 stars` }, '★★★'.slice(0, st), el('i', {}, '★★★'.slice(st))));
          if (!unlocked(i)) b.title = 'Pass the previous level to unlock';
          return b;
        }), el('span', { class: 'rv-fill' }),
        el('button', { class: 'rv-help', onclick: showHelp }, glyph('info'), el('span', {}, 'How to play')));
      }

      function slider(key) {
        const R = E.RANGES[key];
        const out = el('output', { class: 'rv-val' });
        const inp = el('input', { type: 'range', id: `rv-${key}-${w.id}`, min: R.min, max: R.max, step: R.step, value: method[key], 'aria-label': R.label });
        const sync = () => {
          method[key] = Number(inp.value);
          if (key === 'start' && method.end <= method.start + 5) { method.end = Math.min(100, method.start + 5); const e = side.querySelector(`#rv-end-${w.id}`); if (e) { e.value = method.end; e.dispatchEvent(new Event('input')); } }
          if (key === 'end' && method.end <= method.start + 5) { method.start = Math.max(0, method.end - 5); const s = side.querySelector(`#rv-start-${w.id}`); if (s) { s.value = method.start; s.dispatchEvent(new Event('input')); } }
          out.textContent = `${method[key]} ${R.unit}`;
          drawProgram();
        };
        inp.addEventListener('input', sync);
        out.textContent = `${method[key]} ${R.unit}`;
        return el('label', { class: 'rv-ctl', for: inp.id }, el('span', { class: 'rv-lab' }, R.label, out), inp);
      }
      const progCv = el('canvas', { class: 'rv-prog', 'aria-label': 'Gradient program' });
      const injBtn = el('button', { class: 'btn primary rv-inject', onclick: () => inject() }, glyph('play'), el('span', {}, 'Inject'));
      const leftEl = el('span', { class: 'rv-left' });

      function renderSide() {
        side.replaceChildren(
          el('div', { class: 'eyebrow' }, `Level ${li + 1} of ${E.LEVELS.length}`),
          el('h2', {}, L.title),
          el('p', { class: 'rv-brief' }, L.brief),
          el('ul', { class: 'rv-goals' },
            el('li', {}, 'Every pair resolved: Rs ≥ 1.5'),
            el('li', {}, `Run time ≤ ${L.limit} min`, el('small', {}, ` · par ${L.par} min for ★★`)),
            el('li', {}, 'First peak past the void: k ≥ 1')),
          el('h3', {}, 'Method'),
          ...L.controls.map(slider),
          progCv,
          el('div', { class: 'rv-actions' }, injBtn, leftEl),
          el('button', { class: 'rv-link', onclick: () => load(li) }, glyph('refresh'), el('span', {}, 'Start this level over')));
        syncLeft();
        requestAnimationFrame(drawProgram);
      }
      function syncLeft() {
        leftEl.textContent = `${left} of ${L.injections} injections left`;
        injBtn.disabled = left <= 0 || !!anim || (outcome && outcome.pass);
      }

      function load(i) {
        cancelAnimationFrame(anim); anim = 0;
        li = i; L = E.LEVELS[i];
        method = { ...L.start };
        left = L.injections; runs = 0; last = null; ghost = null; outcome = null;
        overlay.hidden = true;
        renderTabs(); renderSide();
        status.className = 'rv-status';
        status.textContent = 'This is the lab\'s generic method. Inject it to see the problem, then adjust.';
        table.replaceChildren();
        drawPlot(0);
      }

      /* ---------- drawing ---------- */
      /* Fit the axis to the run: at least the par time, at most the run plus a margin. */
      function axisMax() {
        const r = last && isFinite(last.runTime) ? Math.min(30, last.runTime) : 0;
        const want = Math.max(L.par, r * 1.2, 1.5);
        return Math.max(1, Math.ceil(want * 2) / 2);
      }
      function drawProgram() {
        const { ctx, w: W, h: H } = setupCanvas(progCv);
        ctx.clearRect(0, 0, W, H);
        const T = axisMax(), pad = { l: 30, r: 8, t: 8, b: 18 };
        const X = (t) => pad.l + (t / T) * (W - pad.l - pad.r), Y = (b) => H - pad.b - (b / 100) * (H - pad.t - pad.b);
        ctx.strokeStyle = css('--stroke-2'); ctx.lineWidth = 1;
        ctx.fillStyle = css('--fg-3'); ctx.font = '10px ' + css('--ui');
        [0, 50, 100].forEach((b) => { ctx.beginPath(); ctx.moveTo(pad.l, Y(b)); ctx.lineTo(W - pad.r, Y(b)); ctx.globalAlpha = .5; ctx.stroke(); ctx.globalAlpha = 1; ctx.fillText(b + '%', 2, Y(b) + 3); });
        ctx.fillText('%B', W - 22, pad.t + 8);
        ctx.strokeStyle = css('--accent'); ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 200; i++) { const t = (i / 200) * T; const b = E.phiAt(method, t) * 100; i ? ctx.lineTo(X(t), Y(b)) : ctx.moveTo(X(t), Y(b)); }
        ctx.stroke();
        ctx.fillStyle = css('--fg-3'); ctx.fillText('0', pad.l - 3, H - 4); ctx.fillText(T + ' min', W - pad.r - 30, H - 4);
      }
      function drawPlot(progress) {
        const { ctx, w: W, h: H } = setupCanvas(plot);
        ctx.clearRect(0, 0, W, H);
        const T = axisMax(), pad = { l: 44, r: 16, t: 26, b: 34 };
        const X = (t) => pad.l + (t / T) * (W - pad.l - pad.r);
        const fg2 = css('--fg-2'), fg3 = css('--fg-3'), stroke = css('--stroke'), accent = css('--accent'), bad = css('--close');
        ctx.font = '11px ' + css('--ui');
        // grid + axis
        ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.fillStyle = fg3;
        const step = T > 20 ? 5 : T > 8 ? 2 : T > 3 ? 1 : 0.5;
        for (let t = 0; t <= T + 1e-9; t += step) { ctx.beginPath(); ctx.moveTo(X(t), pad.t); ctx.lineTo(X(t), H - pad.b); ctx.stroke(); ctx.fillText(String(+t.toFixed(1)), X(t) - 3, H - pad.b + 16); }
        ctx.fillText('min', W - pad.r - 22, H - 6);
        ctx.save(); ctx.translate(12, H / 2 + 14); ctx.rotate(-Math.PI / 2); ctx.fillText('mAU', 0, 0); ctx.restore();
        // run-time limit (and par), drawn where they fall; an arrow if the limit is off to the right
        const marker = (t, label, color, dash) => {
          if (t > T) return;
          ctx.strokeStyle = color; ctx.setLineDash(dash); ctx.globalAlpha = .75;
          ctx.beginPath(); ctx.moveTo(X(t), pad.t - 8); ctx.lineTo(X(t), H - pad.b); ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = color; ctx.fillText(label, Math.min(X(t) + 4, W - 74), pad.t - 10);
        };
        marker(L.par, `par ${L.par}`, fg3, [2, 4]);
        if (L.limit <= T) marker(L.limit, `limit ${L.limit} min`, bad, [5, 4]);
        else { ctx.fillStyle = bad; ctx.fillText(`limit ${L.limit} min →`, W - pad.r - 84, pad.t + 8); }
        // void marker
        ctx.strokeStyle = fg3; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(X(E.COLUMN.t0), H - pad.b); ctx.lineTo(X(E.COLUMN.t0), H - pad.b - 6); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = fg3; ctx.fillText('void', X(E.COLUMN.t0) - 10, H - pad.b - 9);
        if (!last) {
          ctx.fillStyle = fg2; ctx.font = '13px ' + css('--ui');
          ctx.fillText('Press Inject to run the method.', pad.l + 16, pad.t + 30);
          return;
        }
        const ymax = Math.max(...last.eluted.map((p) => p.area / (p.sigma * 2.5066)), 1) * 1.12;
        const Y = (v) => H - pad.b - (v / ymax) * (H - pad.t - pad.b);
        const trace = (res, m, upTo, color, width, alpha) => {
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.beginPath();
          const n = Math.max(400, Math.round(W * 1.5));
          for (let i = 0; i <= n; i++) {
            const t = (i / n) * T; if (t > upTo) break;
            const y = Y(E.signal(res, m, t)); i ? ctx.lineTo(X(t), y) : ctx.moveTo(X(t), y);
          }
          ctx.stroke(); ctx.globalAlpha = 1;
        };
        if (ghost) trace(ghost.res, ghost.m, T, fg3, 1.2, .45);
        const upTo = progress * T;
        trace(last, last.m, upTo, accent, 1.8, 1);
        if (progress < 1) {
          ctx.strokeStyle = accent; ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(X(upTo), pad.t); ctx.lineTo(X(upTo), H - pad.b); ctx.stroke(); ctx.globalAlpha = 1;
          return;
        }
        // labels and failing pairs
        ctx.font = '600 11px ' + css('--ui');
        last.eluted.forEach((p, k) => {
          if (p.tR > T) return;
          const top = Y(p.area / (p.sigma * 2.5066)) - 8;
          ctx.fillStyle = fg2; ctx.fillText(String(k + 1), X(p.tR) - 3, Math.max(pad.t + 2, top));
        });
        last.pairs.forEach((pr, k) => {
          if (pr.rs >= 1.5) return;
          const a = last.eluted[k], b = last.eluted[k + 1];
          if (b.tR > T) return;
          const x1 = X(a.tR), x2 = X(b.tR), y = H - pad.b - 12;
          ctx.strokeStyle = bad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y); ctx.lineTo(x2, y); ctx.lineTo(x2, y - 4); ctx.stroke();
          ctx.fillStyle = bad; ctx.font = '600 10px ' + css('--ui'); ctx.fillText(`Rs ${fmt(pr.rs, 2)}`, (x1 + x2) / 2 - 18, y + 12);
        });
      }

      function renderTable() {
        const rows = last.eluted.map((p, k) => {
          const pr = last.pairs[k];
          const c = L.compounds[p.i];
          return el('tr', {},
            el('td', { class: 'n' }, String(k + 1)),
            el('td', {}, c.name),
            el('td', { class: 'num' }, fmt(p.tR, 2)),
            el('td', { class: 'num' }, fmt(p.tR / E.COLUMN.t0 - 1, 1)),
            el('td', { class: 'num' + (pr && pr.rs < 1.5 ? ' bad' : pr ? ' ok' : '') }, pr ? fmt(pr.rs, 2) : ''));
        });
        table.replaceChildren(el('table', {},
          el('thead', {}, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Compound'), el('th', { class: 'num' }, 'tR (min)'), el('th', { class: 'num' }, 'k'), el('th', { class: 'num' }, 'Rs to next'))),
          el('tbody', {}, rows)));
      }

      /* ---------- injecting ---------- */
      function inject() {
        if (anim || left <= 0 || (outcome && outcome.pass)) return;
        if (last) ghost = { res: last, m: last.m };
        const res = E.run(L, method, { maxT: 30 });
        res.m = { ...method };
        last = res; left--; runs++;
        syncLeft();
        status.className = 'rv-status';
        status.textContent = 'Acquiring…';
        table.replaceChildren();
        drawProgram();
        const T = axisMax();
        const dur = OS.reduced() ? 1 : Math.min(2600, 900 + T * 140);
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          drawPlot(p);
          status.textContent = `Acquiring… ${(p * T).toFixed(1)} min`;
          if (p < 1) { anim = requestAnimationFrame(step); return; }
          anim = 0;
          finish(res);
        };
        anim = requestAnimationFrame(step);
      }
      function finish(res) {
        renderTable();
        const bad = res.pairs.filter((p) => p.rs < 1.5).length;
        const msgs = [];
        if (!res.allEluted) msgs.push(`${res.peaks.length - res.eluted.length} compound${res.peaks.length - res.eluted.length > 1 ? 's' : ''} never came off the column. Raise the final %B.`);
        if (!res.retained) msgs.push(`The first peak elutes too close to the void (k = ${fmt(res.kFirst, 2)}). Start at a lower %B.`);
        if (bad) msgs.push(`${bad} pair${bad > 1 ? 's' : ''} below Rs 1.5 (worst ${fmt(res.minRs, 2)}). A shallower gradient spreads peaks out.`);
        if (res.allEluted && res.runTime > L.limit) msgs.push(`Run time ${fmt(res.runTime, 1)} min is over the ${L.limit} min limit. Steepen the gradient or raise the start %B.`);
        const st = E.stars(res, L, runs);
        outcome = res;
        if (res.pass) {
          status.className = 'rv-status good';
          status.textContent = `Passed: every pair at Rs ≥ 1.5 (worst ${fmt(res.minRs, 2)}) in ${fmt(res.runTime, 1)} min.`;
          const prev = saved.stars[L.id] || 0;
          if (st > prev) { saved.stars[L.id] = st; save(); }
          renderTabs();
          showWin(res, st);
        } else {
          status.className = 'rv-status bad';
          status.textContent = msgs.join(' ') || 'Not quite.';
          if (left <= 0) showLose();
        }
        syncLeft();
      }

      function card(...kids) {
        overlay.replaceChildren(el('div', { class: 'rv-card', role: 'dialog', 'aria-modal': 'true' }, ...kids));
        overlay.hidden = false;
        const b = overlay.querySelector('.btn.primary');
        if (b) b.focus();
      }
      function showWin(res, st) {
        const next = li + 1 < E.LEVELS.length ? li + 1 : null;
        const note = st === 3 ? 'Under par in two injections or fewer. That is a validated method.'
          : st === 2 ? `Under par. Try it in two injections or fewer for the third star.`
          : `It passes. Get the run under ${L.par} min for the second star.`;
        card(
          el('div', { class: 'rv-stars big', 'aria-label': `${st} of 3 stars` }, '★★★'.slice(0, st), el('i', {}, '★★★'.slice(st))),
          el('h2', {}, next == null ? 'Every method validated' : 'Method validated'),
          el('p', {}, note),
          el('dl', { class: 'rv-stats' },
            el('div', {}, el('dt', {}, 'Run time'), el('dd', {}, fmt(res.runTime, 1) + ' min')),
            el('div', {}, el('dt', {}, 'Worst Rs'), el('dd', {}, fmt(res.minRs, 2))),
            el('div', {}, el('dt', {}, 'Injections'), el('dd', {}, String(runs)))),
          el('div', { class: 'btns' },
            next != null ? el('button', { class: 'btn primary', onclick: () => load(next) }, 'Next sample') : el('button', { class: 'btn primary', onclick: () => { overlay.hidden = true; } }, 'Done'),
            el('button', { class: 'btn', onclick: () => load(li) }, 'Replay for more stars'),
            el('button', { class: 'btn', onclick: () => { overlay.hidden = true; } }, 'Look at the chromatogram')));
      }
      function showLose() {
        card(
          el('h2', {}, 'Out of injections'),
          el('p', {}, 'The sample vial is empty. Start the level over with a fresh vial; your last chromatogram stays on screen as a guide until you inject again.'),
          el('div', { class: 'btns' },
            el('button', { class: 'btn primary', onclick: () => { const g = last; load(li); ghost = g ? { res: g, m: g.m } : null; drawPlot(1); } }, 'Fresh vial'),
            el('button', { class: 'btn', onclick: () => { overlay.hidden = true; } }, 'Look at the chromatogram')));
      }
      function showHelp() {
        card(
          el('h2', {}, 'How to play'),
          el('p', {}, 'Each level is a sample whose peaks overlap with the lab\'s generic method. Change the gradient, inject, and read the chromatogram. You pass when every neighbouring pair of peaks has a resolution (Rs) of at least 1.5, the run fits the time limit, and the first peak is retained past the void.'),
          el('ul', { class: 'rv-tips' },
            el('li', {}, el('b', {}, 'Gradient time: '), 'longer is shallower. Peaks spread out and resolution goes up, but the run gets longer.'),
            el('li', {}, el('b', {}, 'Start %B: '), 'raising it makes everything elute sooner. Too high and the first peak lands in the void.'),
            el('li', {}, el('b', {}, 'End %B: '), 'has to be strong enough to push the last compound off the column.'),
            el('li', {}, el('b', {}, 'Temperature: '), 'speeds things up, and compounds respond to it differently, so it can change the elution order.')),
          el('p', { class: 'rv-fine' }, `Retention follows the linear-solvent-strength model (log k = log kw − S·φ) with a temperature term, migrated numerically through the gradient and dwell volume. ${E.COLUMN.name}, t0 ${E.COLUMN.t0} min, ${E.COLUMN.N.toLocaleString()} plates. Compound parameters are illustrative.`),
          el('div', { class: 'btns' }, el('button', { class: 'btn primary', onclick: () => { overlay.hidden = true; } }, 'Got it')));
      }

      w.node.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.hidden) { overlay.hidden = true; e.stopPropagation(); }
        if (e.key === 'Enter' && overlay.hidden && !e.target.closest('button, input')) { e.preventDefault(); inject(); }
      });
      const ro = new ResizeObserver(() => { if (!anim) { drawPlot(last ? 1 : 0); drawProgram(); } });
      ro.observe(plotWrap);
      const offPrefs = OS.on('prefs', () => { if (!anim) { drawPlot(last ? 1 : 0); drawProgram(); } });
      w.onClose = () => { cancelAnimationFrame(anim); ro.disconnect(); offPrefs(); };
      load(li);
      if (!saved.seenHelp) { saved.seenHelp = true; save(); showHelp(); }
    },
  };

  /* =====================================================================
     Restore Desktop: puts everything back the way it was on first visit.
     ===================================================================== */
  OS.restoreEverything = function () {
    OS.WM.wins.slice().forEach((x) => OS.close(x));
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('kos:')).forEach((k) => localStorage.removeItem(k));
    } catch { /* storage unavailable */ }
    OS.prefs.night = false;
    OS.prefs.bright = 1;
    OS.setPref('theme', 'system');
    OS.setPref('accent', (OS.CFG.system && OS.CFG.system.accent) || 'ion');
    OS.setPref('wall', (OS.CFG.system && OS.CFG.system.wallpaper) || 'trace');
    OS.resetDesktop();
    setTimeout(() => {
      (OS.CFG.startup || []).forEach((t) => OS.launch(t));
      OS.toast({ title: 'Desktop restored', body: 'Icons, pins, the Recycle Bin, windows, personalization and Resolve progress are back to how they started.', iconName: 'restoreApp', timeout: 5000 });
    }, 220);
  };
  OS.APPDEFS.reset = {
    size: [420, 300],
    fixed: true,
    mount(w) {
      w.setTitle('Restore Desktop');
      w.setIcon(() => icon('restoreApp'));
      w.body.append(el('div', { class: 'rd' },
        el('div', { class: 'rd-top' }, icon('restoreApp'),
          el('div', {}, el('h2', {}, 'Restore the desktop?'),
            el('p', {}, 'This puts the icons, pins, Recycle Bin, theme and wallpaper back the way they were, closes every window, and resets your Resolve progress.'))),
        el('div', { class: 'pr-btns' },
          el('button', { class: 'btn primary', onclick: () => OS.restoreEverything() }, 'Restore'),
          el('button', { class: 'btn', onclick: () => OS.close(w) }, 'Cancel'))));
      setTimeout(() => { const b = w.body.querySelector('.btn.primary'); if (b) b.focus(); }, 50);
    },
  };
})();
