/* Shell: wallpaper, desktop icons, taskbar, Start menu, Task view, quick settings,
   notification center and calendar, context menus and the lock screen. */
(function () {
  'use strict';
  const OS = window.OS;
  const { el, glyph, icon, appIcon, targetIcon, resolve, store, CFG, WM, GROUPS } = OS;
  const owner = CFG.owner || {};
  const sysName = (CFG.system && CFG.system.name) || 'Portfolio';
  const screen = document.getElementById('screen');

  /* ---------- layers ---------- */
  const wallpaper = el('div', { id: 'wallpaper', class: 'wallbg', html: OS.traceSVG() });
  const iconsEl = el('div', { id: 'icons', role: 'list', 'aria-label': 'Desktop' });
  const winLayer = el('div', { id: 'windows' });
  const snapEl = el('div', { id: 'snap', 'aria-hidden': 'true' });
  const desktop = el('main', { id: 'desktop', 'aria-label': sysName }, iconsEl, winLayer, snapEl);
  const nightlight = el('div', { id: 'nightlight', 'aria-hidden': 'true' });
  const dim = el('div', { id: 'dim', 'aria-hidden': 'true' });
  screen.append(wallpaper, desktop);
  OS.setLayer(winLayer, snapEl);

  /* ---------- flyouts ---------- */
  const FLY = {};
  let openFly = null;
  function toggleFly(name) {
    if (openFly === name) return closeFly();
    closeFly();
    hideCtx();
    closeTaskView();
    FLY[name].node.classList.add('open');
    openFly = name;
    if (FLY[name].onOpen) FLY[name].onOpen();
    document.querySelectorAll(`[data-fly="${name}"]`).forEach((b) => b.classList.add('pressed'));
  }
  function closeFly() {
    if (!openFly) return;
    FLY[openFly].node.classList.remove('open');
    document.querySelectorAll(`[data-fly="${openFly}"]`).forEach((b) => b.classList.remove('pressed'));
    openFly = null;
  }
  OS.closeFly = closeFly;

  /* ---------- context menu (Windows 11 style: icon row, submenus, checkmarks) ---------- */
  const ctx = el('div', { class: 'ctx', role: 'menu', hidden: true });
  const sub = el('div', { class: 'ctx sub', role: 'menu', hidden: true });
  let subTimer = 0;
  function hideCtx() { ctx.hidden = true; sub.hidden = true; }
  function place(menu, x, y, alt) {
    menu.hidden = false;
    const r = menu.getBoundingClientRect();
    let left = x, top = y;
    if (left + r.width > innerWidth - 4) left = alt != null ? alt - r.width : innerWidth - r.width - 4;
    if (top + r.height > innerHeight - 4) top = innerHeight - r.height - 4;
    menu.style.left = Math.max(4, left) + 'px';
    menu.style.top = Math.max(4, top) + 'px';
  }
  function buildItems(menu, items, isSub) {
    menu.replaceChildren(...items.filter(Boolean).map((it) => {
      if (it.sep) return el('div', { class: 'ctx-sep', role: 'separator' });
      if (it.row) {
        return el('div', { class: 'ctx-row' }, it.row.map((b) => {
          const btn = el('button', { class: 'ctx-ib', role: 'menuitem', title: b.label, 'aria-label': b.label, disabled: !!b.disabled }, glyph(b.icon));
          btn.addEventListener('click', () => { hideCtx(); if (b.action) b.action(); });
          return btn;
        }));
      }
      const lead = it.check != null ? el('span', { class: 'g ck' }, it.check ? '✓' : '') : it.icon ? glyph(it.icon) : el('span', { class: 'g' });
      const inner = [lead, el('span', { class: 'lbl' }, it.label), it.sub ? glyph('chevR', 'sm') : it.hint ? el('span', { class: 'hint' }, it.hint) : null];
      const n = it.href
        ? el('a', { class: 'ctx-i', role: 'menuitem', href: it.href, target: '_blank', rel: 'noopener' }, inner)
        : el('button', { class: 'ctx-i' + (it.bold ? ' bold' : ''), role: 'menuitem', disabled: !!it.disabled, 'aria-haspopup': it.sub ? 'menu' : null }, inner);
      if (it.sub) {
        const openSub = () => {
          clearTimeout(subTimer);
          buildItems(sub, it.sub, true);
          const r = n.getBoundingClientRect();
          place(sub, r.right + 2, r.top - 5, r.left - 2);
          menu.querySelectorAll('.ctx-i.open').forEach((x) => x.classList.remove('open'));
          n.classList.add('open');
        };
        n.addEventListener('pointerenter', () => { clearTimeout(subTimer); subTimer = setTimeout(openSub, 180); });
        n.addEventListener('click', (e) => { e.stopPropagation(); openSub(); const f = sub.querySelector('.ctx-i'); if (f && e.detail === 0) f.focus(); });
        n.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); openSub(); const f = sub.querySelector('.ctx-i'); if (f) f.focus(); } });
      } else {
        if (!isSub) n.addEventListener('pointerenter', () => { clearTimeout(subTimer); subTimer = setTimeout(() => { sub.hidden = true; menu.querySelectorAll('.ctx-i.open').forEach((x) => x.classList.remove('open')); }, 200); });
        n.addEventListener('click', () => { hideCtx(); if (it.action) it.action(); });
      }
      return n;
    }));
  }
  OS.contextMenu = function (x, y, items) {
    closeFly();
    OS.hideLayouts();
    sub.hidden = true;
    buildItems(ctx, items, false);
    place(ctx, x, y);
    const first = ctx.querySelector('.ctx-i:not([disabled])');
    if (first) first.focus({ preventScroll: true });
  };
  [ctx, sub].forEach((menu) => menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('.ctx-i:not([disabled])')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'ArrowLeft' && menu === sub) { e.preventDefault(); sub.hidden = true; const o = ctx.querySelector('.ctx-i.open'); if (o) o.focus(); }
  }));

  /* ---------- notifications ---------- */
  const toasts = el('div', { id: 'toasts', 'aria-live': 'polite' });
  const notes = [];
  let unread = 0;
  const badge = el('span', { class: 'badge', hidden: true });
  function syncBadge() {
    badge.hidden = unread === 0;
    badge.textContent = String(unread);
  }
  OS.toast = function ({ title, body, iconName, timeout = 6500 }) {
    const t = el('div', { class: 'toast' },
      el('div', { class: 'toast-h' }, icon(iconName || 'start'), el('span', { class: 'tn' }, sysName),
        el('button', { class: 'ibtn sm', 'aria-label': 'Dismiss', onclick: () => dismiss() }, glyph('close'))),
      el('b', {}, title), body ? el('p', {}, body) : null);
    const dismiss = () => { t.classList.add('out'); setTimeout(() => t.remove(), 220); };
    toasts.append(t);
    if (timeout) setTimeout(dismiss, timeout);
    notes.unshift({ title, body, iconName, time: new Date() });
    if (openFly === 'cal') renderCal(); else { unread++; syncBadge(); }
  };

  /* ---------- desktop icons (drag to rearrange; positions remembered) ---------- */
  const SIZES = { small: [76, 70, 32], medium: [88, 100, 44], large: [112, 128, 64] };
  let iconSize = store.get('iconSize', 'medium');
  if (!SIZES[iconSize]) iconSize = 'medium';
  let CELL_W = SIZES[iconSize][0], CELL_H = SIZES[iconSize][1];
  const PAD_X = 4, PAD_Y = 6;
  let iconPos = store.get('icons', {});
  let iconOrder = store.get('iconOrder', null);
  let suppressClick = false;
  const selected = new Set();
  function syncSel() { [...iconsEl.children].forEach((b) => b.classList.toggle('sel', selected.has(b.dataset.t))); }
  function selectIcon(b, add) {
    if (!add) selected.clear();
    if (b) selected.add(b.dataset.t);
    syncSel();
  }
  function grid() {
    return {
      rows: Math.max(1, Math.floor((iconsEl.clientHeight - PAD_Y) / CELL_H)),
      cols: Math.max(1, Math.floor((iconsEl.clientWidth - PAD_X) / CELL_W)),
    };
  }
  function layoutIcons() {
    const { rows, cols } = grid();
    const taken = new Set();
    const items = [...iconsEl.children];
    const placeAt = new Map();
    items.forEach((b) => {
      const pp = iconPos[b.dataset.t];
      if (pp && pp[0] < cols && pp[1] < rows && !taken.has(pp.join())) { placeAt.set(b, pp); taken.add(pp.join()); }
    });
    let c = 0, r = 0;
    items.forEach((b) => {
      if (placeAt.has(b)) return;
      while (taken.has(c + ',' + r)) { r++; if (r >= rows) { r = 0; c++; } }
      placeAt.set(b, [c, r]);
      taken.add(c + ',' + r);
    });
    items.forEach((b) => {
      const [cc, rr] = placeAt.get(b);
      b.cell = [cc, rr];
      b.style.left = PAD_X + cc * CELL_W + 'px';
      b.style.top = PAD_Y + rr * CELL_H + 'px';
    });
  }
  function desktopTargets() {
    const base = OS.desktopList();
    if (!iconOrder) return base;
    return [...iconOrder.filter((t) => base.includes(t)), ...base.filter((t) => !iconOrder.includes(t))];
  }
  /* Apps on the desktop are shortcuts, so they get the little arrow; folders, files and the Recycle Bin don't. */
  function isShortcut(t) {
    const r = resolve(t);
    return r && r.type === 'app' && r.app.kind !== 'doc' && r.app.id !== 'recycle';
  }
  function desktopIcon(t) {
    if (t === 'recycle') return icon(OS.recycledList().length ? 'recycleFull' : 'recycle');
    const ic = targetIcon(t);
    if (isShortcut(t)) ic.append(el('span', { class: 'sc-arrow', 'aria-hidden': 'true', html: OS.ICONS.shortcut }));
    return ic;
  }
  function wireIconDrag(b) {
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      e.stopPropagation();
      const sx = e.clientX, sy = e.clientY, x0 = b.offsetLeft, y0 = b.offsetTop;
      let dragging = false;
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!dragging) {
          if (Math.hypot(dx, dy) < 6) return;
          dragging = true;
          b.classList.add('dragging');
          if (!selected.has(b.dataset.t)) selectIcon(b);
        }
        b.style.left = x0 + dx + 'px';
        b.style.top = y0 + dy + 'px';
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (!dragging) return;
        b.classList.remove('dragging');
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
        const R = iconsEl.getBoundingClientRect();
        if (ev.clientX >= R.right || ev.clientY >= R.bottom) { layoutIcons(); return; }
        const { rows, cols } = grid();
        const c = Math.max(0, Math.min(cols - 1, Math.round((ev.clientX - R.left - PAD_X - CELL_W / 2) / CELL_W)));
        const r = Math.max(0, Math.min(rows - 1, Math.round((ev.clientY - R.top - PAD_Y - CELL_H / 2) / CELL_H)));
        const target = [...iconsEl.children].find((o) => o !== b && o.cell && o.cell[0] === c && o.cell[1] === r);
        /* Dropping on the Recycle Bin deletes, like Windows. */
        if (target && target.dataset.t === 'recycle' && OS.canDelete(b.dataset.t)) { OS.recycle(b.dataset.t); return; }
        const pos = {};
        [...iconsEl.children].forEach((o) => { pos[o.dataset.t] = o.cell; });
        if (target) pos[target.dataset.t] = b.cell;
        pos[b.dataset.t] = [c, r];
        iconPos = pos;
        store.set('icons', pos);
        layoutIcons();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }
  function renderDesktop() {
    iconsEl.dataset.size = iconSize;
    iconsEl.style.setProperty('--di', SIZES[iconSize][2] + 'px');
    iconsEl.style.setProperty('--dw', CELL_W - 4 + 'px');
    iconsEl.replaceChildren(...desktopTargets().map((t) => {
      const r = resolve(t);
      const b = el('button', { class: 'dicon', role: 'listitem', 'aria-label': r.title, dataset: { t } }, desktopIcon(t), el('span', {}, r.title));
      b.addEventListener('click', (e) => { e.stopPropagation(); if (suppressClick) return; selectIcon(b, e.ctrlKey || e.metaKey); if (OS.coarse()) OS.launch(t); });
      b.addEventListener('dblclick', () => { if (!suppressClick) OS.launch(t); });
      b.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); OS.launch(t); }
        if (e.key === 'Delete') { e.preventDefault(); deleteSelected(t); }
      });
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!selected.has(t)) selectIcon(b);
        const items = t === 'recycle'
          ? [{ label: 'Open', icon: 'chevR', bold: true, action: () => OS.launch('recycle') },
            { label: 'Empty Recycle Bin', icon: 'trash', disabled: !OS.recycledList().length, action: () => OS.emptyBin() },
            { sep: true }, { label: 'Properties', icon: 'props', action: () => OS.properties('recycle') }]
          : OS.itemMenu(t);
        OS.contextMenu(e.clientX, e.clientY, items);
      });
      wireIconDrag(b);
      return b;
    }));
    layoutIcons();
    syncSel();
  }
  function deleteSelected(fallback) {
    const list = selected.size ? [...selected] : [fallback];
    list.forEach((t) => OS.recycle(t));
    selected.clear();
  }
  function setIconSize(sz) {
    iconSize = sz;
    [CELL_W, CELL_H] = SIZES[sz];
    store.set('iconSize', sz);
    renderDesktop();
  }
  function sortIcons(by) {
    const key = (t) => {
      const r = resolve(t);
      if (by === 'type') return (r.type === 'group' ? '0' : r.app.kind === 'doc' ? '2' : '1') + r.title.toLowerCase();
      if (by === 'date') return String(9999999999999 - (r.type === 'app' && r.app.updated ? OS.toDate(r.app.updated).getTime() : 0)).padStart(14, '0');
      return r.title.toLowerCase();
    };
    const list = desktopTargets().filter((t) => t !== 'recycle').sort((a, b) => (key(a) < key(b) ? -1 : 1));
    iconOrder = ['recycle', ...list];
    iconPos = {};
    store.set('iconOrder', iconOrder);
    store.del('icons');
    renderDesktop();
  }
  OS.resetIcons = () => {
    iconPos = {};
    iconOrder = null;
    store.del('icons');
    store.del('iconOrder');
    renderDesktop();
  };
  new ResizeObserver(() => layoutIcons()).observe(iconsEl);

  /* Drag on empty desktop space to draw a selection box. */
  const band = el('div', { class: 'band', hidden: true });
  desktop.append(band);
  desktop.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType === 'touch' || !(e.target === desktop || e.target === iconsEl || e.target === winLayer)) return;
    const R = desktop.getBoundingClientRect();
    const sx = e.clientX - R.left, sy = e.clientY - R.top;
    const add = e.ctrlKey || e.metaKey;
    const base = add ? new Set(selected) : new Set();
    let active = false;
    const move = (ev) => {
      const x = ev.clientX - R.left, y = ev.clientY - R.top;
      if (!active) { if (Math.hypot(x - sx, y - sy) < 4) return; active = true; band.hidden = false; }
      const l = Math.min(sx, x), t = Math.min(sy, y), w = Math.abs(x - sx), h = Math.abs(y - sy);
      Object.assign(band.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
      selected.clear();
      base.forEach((v) => selected.add(v));
      [...iconsEl.children].forEach((b) => {
        const br = b.getBoundingClientRect();
        const bl = br.left - R.left, bt = br.top - R.top;
        if (bl < l + w && bl + br.width > l && bt < t + h && bt + br.height > t) selected.add(b.dataset.t);
      });
      syncSel();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      band.hidden = true;
      if (!active && !add) selectIcon(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  desktop.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.win') || e.target.closest('.dicon')) return;
    e.preventDefault();
    selectIcon(null);
    OS.contextMenu(e.clientX, e.clientY, [
      { label: 'View', icon: 'viewLarge', sub: [
        { label: 'Large icons', check: iconSize === 'large', action: () => setIconSize('large') },
        { label: 'Medium icons', check: iconSize === 'medium', action: () => setIconSize('medium') },
        { label: 'Small icons', check: iconSize === 'small', action: () => setIconSize('small') },
        { sep: true },
        { label: 'Reset icon layout', icon: 'refresh', action: OS.resetIcons },
      ] },
      { label: 'Sort by', icon: 'sort', sub: [
        { label: 'Name', action: () => sortIcons('name') },
        { label: 'Item type', action: () => sortIcons('type') },
        { label: 'Date modified', action: () => sortIcons('date') },
      ] },
      { label: 'Refresh', icon: 'refresh', action: () => { iconsEl.classList.remove('refresh'); void iconsEl.offsetWidth; iconsEl.classList.add('refresh'); } },
      { sep: true },
      { label: 'New', icon: 'newfile', sub: [
        { label: 'Text Document', icon: 'newfile', action: () => OS.openWindow({ key: 'notepad:' + Date.now(), app: 'notepad' }) },
      ] },
      { sep: true },
      { label: 'Display settings', icon: 'display', action: () => OS.launch('settings') },
      { label: 'Personalize', icon: 'sun', action: () => OS.launch('settings') },
      { sep: true },
      { label: 'Open in Terminal', icon: 'code', action: () => OS.launch('terminal') },
    ]);
  });

  /* ---------- taskbar ---------- */
  const startBtn = el('button', { class: 'tbb start-btn', 'data-fly': 'start', title: 'Start', 'aria-label': 'Start', onclick: () => toggleFly('start') }, icon('start'));
  const openSearch = () => { toggleFly('start'); if (openFly === 'start') startInput.focus(); };
  const searchBtn = el('button', { class: 'tbb search-ic', 'data-fly': 'start', title: 'Search', 'aria-label': 'Search', onclick: openSearch }, glyph('search', 'lg'));
  const searchPill = el('button', { class: 'tb-search', 'data-fly': 'start', 'aria-label': 'Search', onclick: openSearch }, glyph('search'), el('span', {}, 'Search'));
  const tvBtn = el('button', { class: 'tbb hide-s', title: 'Task view', 'aria-label': 'Task view', onclick: () => toggleTaskView() }, glyph('taskview', 'lg'));
  const appsEl = el('div', { class: 'tb-apps' });
  const timeEl = el('span', {});
  const dateEl = el('span', {});
  const clockBtn = el('button', { class: 'trayb clock', 'data-fly': 'cal', 'aria-label': 'Notifications and calendar', onclick: () => toggleFly('cal') }, timeEl, dateEl);
  const bellBtn = el('button', { class: 'trayb bell', 'data-fly': 'cal', title: 'Notifications', 'aria-label': 'Notifications', onclick: () => toggleFly('cal') }, glyph('bell'), badge);
  const tray = el('div', { id: 'tray' },
    el('button', { class: 'trayb chev hide-s', 'data-fly': 'over', title: 'Show hidden icons', 'aria-label': 'Show hidden icons', onclick: () => toggleFly('over') }, glyph('chevU')),
    el('button', { class: 'trayb lang hide-s', title: 'English (United States)\nUS keyboard', 'aria-label': 'Input language: English (United States)', onclick: () => OS.toast({ title: 'Input language', body: 'English (United States), US keyboard. This is the only one installed.', iconName: 'settings', timeout: 4000 }) },
      el('span', {}, 'ENG'), el('span', {}, 'US')),
    el('button', { class: 'trayb', 'data-fly': 'qs', title: 'Internet access\nSpeakers: 70%\nBattery: 100%', 'aria-label': 'Quick settings', onclick: () => toggleFly('qs') }, glyph('wifi'), glyph('volume'), glyph('battery', 'hide-s')),
    clockBtn,
    bellBtn,
    el('button', { class: 'showdesk', title: 'Show desktop', 'aria-label': 'Show desktop', onclick: () => OS.minimizeAll() }));
  const taskbar = el('footer', { id: 'taskbar' }, el('div', { class: 'tb-side' }), el('div', { id: 'tb-center' }, startBtn, searchPill, searchBtn, tvBtn, appsEl), tray);

  /* Hidden-icons overflow (the ^ in the tray). */
  const overNode = el('div', { class: 'fly over', id: 'over', role: 'dialog', 'aria-label': 'Hidden icons' },
    el('a', { class: 'ov-i', href: (CFG.owner && CFG.owner.github) || '#', target: '_blank', rel: 'noopener', title: 'GitHub' }, glyph('code')),
    el('button', { class: 'ov-i', title: 'Settings', onclick: () => { closeFly(); OS.launch('settings'); } }, glyph('gear')),
    el('button', { class: 'ov-i', title: 'Showcase', onclick: () => { closeFly(); OS.launch('showcase'); } }, glyph('image')));
  FLY.over = { node: overNode };

  /* Hovering a running app's button shows a preview of its window. */
  const peek = el('div', { class: 'peek', hidden: true, role: 'tooltip' });
  let peekTimer = 0, peekFor = null;
  function hidePeek() { clearTimeout(peekTimer); peek.hidden = true; peek.classList.remove('on'); peekFor = null; }
  function showPeek(btn, w, t) {
    if (openFly || !ctx.hidden) return;
    peekFor = btn;
    const title = w ? w.title : resolve(t).title;
    const pic = w && w.thumb
      ? el('img', { src: w.thumb, alt: '', draggable: 'false' })
      : el('span', { class: 'peek-ic' }, w ? w.iconFactory() : targetIcon(t));
    peek.replaceChildren(
      el('div', { class: 'peek-h' }, w ? w.iconFactory() : targetIcon(t), el('span', {}, title),
        w ? el('button', { class: 'ibtn sm', 'aria-label': 'Close ' + title, onclick: (e) => { e.stopPropagation(); hidePeek(); OS.close(w); } }, glyph('close')) : null),
      w ? el('button', { class: 'peek-pic', 'aria-label': 'Switch to ' + title, onclick: () => { hidePeek(); if (w.min) OS.restore(w); else OS.focus(w); } }, pic) : null);
    peek.classList.toggle('label-only', !w);
    peek.hidden = false;
    const r = btn.getBoundingClientRect(), p = peek.getBoundingClientRect();
    peek.style.left = Math.max(8, Math.min(r.left + r.width / 2 - p.width / 2, innerWidth - p.width - 8)) + 'px';
    peek.style.top = r.top - p.height - 10 + 'px';
    requestAnimationFrame(() => peek.classList.add('on'));
  }
  peek.addEventListener('pointerenter', () => clearTimeout(peekTimer));
  peek.addEventListener('pointerleave', () => { peekTimer = setTimeout(hidePeek, 200); });

  function renderTaskbar() {
    const used = new Set();
    const items = OS.taskbarList().map((t) => {
      const w = WM.wins.find((x) => x.key === OS.keyFor(t));
      if (w) used.add(w);
      return { t, w };
    });
    WM.wins.forEach((w) => { if (!used.has(w)) items.push({ t: null, w }); });
    appsEl.replaceChildren(...items.map(({ t, w }) => {
      const title = w ? w.title : resolve(t).title;
      const cls = 'tbb' + (w ? ' run' : '') + (w && WM.active === w && !w.min ? ' act' : '');
      const b = el('button', { class: cls, 'aria-label': title, dataset: w ? { w: w.id } : {} }, w ? w.iconFactory() : targetIcon(t));
      b.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(peekTimer);
        peekTimer = setTimeout(() => showPeek(b, w, t), peekFor ? 0 : 450);
      });
      b.addEventListener('pointerleave', () => { clearTimeout(peekTimer); peekTimer = setTimeout(hidePeek, 200); });
      b.addEventListener('click', () => {
        hidePeek();
        closeFly();
        closeTaskView();
        if (!w) return OS.launch(t);
        if (w.min) OS.restore(w);
        else if (WM.active === w) OS.minimize(w);
        else OS.focus(w);
      });
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        hidePeek();
        const r = b.getBoundingClientRect();
        const target = t || (w && w.spec && w.spec.ref && w.spec.ref.id) || null;
        const items = [
          { label: w ? w.title : resolve(t).title, iconEl: true, icon: null, action: () => (t ? OS.launch(t) : OS.focus(w)) },
          target && resolve(target) ? { label: OS.isPinned('taskbar', target) ? 'Unpin from taskbar' : 'Pin to taskbar', icon: 'pin', action: () => OS.togglePin('taskbar', target) } : null,
          w ? { label: 'Close window', icon: 'close', action: () => OS.close(w) } : null,
        ].filter(Boolean);
        OS.contextMenu(r.left, r.top - 8 - items.length * 36 - 10, items);
      });
      return b;
    }));
    if (!taskview.hidden) renderTaskView();
  }

  function tick() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' });
    if (!lock.hidden) paintLock();
  }

  /* ---------- Task view ---------- */
  const taskview = el('div', { id: 'taskview', hidden: true, role: 'dialog', 'aria-label': 'Task view' });
  taskview.addEventListener('click', (e) => { if (e.target === taskview || e.target.classList.contains('tv-grid')) closeTaskView(); });
  function renderTaskView() {
    const wins = WM.wins.slice().sort((a, b) => Number(b.node.style.zIndex) - Number(a.node.style.zIndex));
    if (!wins.length) {
      taskview.replaceChildren(el('div', { class: 'tv-empty' }, el('p', {}, 'No open windows'), el('small', {}, 'Open an app from the desktop, the taskbar or Start.')));
      return;
    }
    taskview.replaceChildren(el('div', { class: 'tv-grid' }, wins.map((w) => el('div', { class: 'tv-card' + (WM.active === w && !w.min ? ' act' : '') },
      el('button', { class: 'tv-main', 'aria-label': 'Switch to ' + w.title, onclick: () => { closeTaskView(); if (w.min) OS.restore(w); else OS.focus(w); } },
        el('span', { class: 'tv-head' }, w.iconFactory(), el('span', {}, w.title)),
        el('span', { class: 'tv-pic' }, w.thumb ? el('img', { src: w.thumb, alt: '', draggable: 'false' }) : el('span', { class: 'tv-ic' }, w.iconFactory()))),
      el('button', { class: 'ibtn sm tv-x', 'aria-label': 'Close ' + w.title, onclick: () => OS.close(w) }, glyph('close'))))));
  }
  function openTaskView() {
    closeFly();
    hideCtx();
    renderTaskView();
    taskview.hidden = false;
    requestAnimationFrame(() => taskview.classList.add('on'));
    tvBtn.classList.add('pressed');
    const first = taskview.querySelector('.tv-main, .tv-empty');
    if (first && first.focus) first.focus({ preventScroll: true });
  }
  function closeTaskView() {
    if (taskview.hidden) return;
    taskview.classList.remove('on');
    tvBtn.classList.remove('pressed');
    setTimeout(() => { if (!taskview.classList.contains('on')) taskview.hidden = true; }, OS.reduced() ? 0 : 180);
  }
  const toggleTaskView = () => (taskview.hidden || !taskview.classList.contains('on') ? openTaskView() : closeTaskView());

  /* ---------- Start menu ---------- */
  const startInput = el('input', { class: 'st-q', id: 'start-search', type: 'search', placeholder: 'Search for apps, projects and documents', 'aria-label': 'Search', autocomplete: 'off' });
  const startMain = el('div', { class: 'st-main' });
  const avatar = () => el('span', { class: 'avatar' }, (owner.name || '?').slice(0, 1).toUpperCase());
  const powerBtn = el('button', { class: 'ibtn', title: 'Power', 'aria-label': 'Power' }, glyph('power'));
  powerBtn.addEventListener('click', () => {
    const r = powerBtn.getBoundingClientRect();
    OS.contextMenu(r.left - 120, r.top - 96, [
      { label: 'Sleep', icon: 'sleep', action: showLock },
      { label: 'Restart', icon: 'refresh', action: () => location.reload() },
    ]);
  });
  const startNode = el('div', { class: 'fly start', id: 'start', role: 'dialog', 'aria-label': 'Start' },
    el('div', { class: 'st-top' }, el('label', { class: 'st-search' }, glyph('search'), startInput)),
    startMain,
    el('div', { class: 'st-foot' },
      el('button', { class: 'st-user', onclick: () => { closeFly(); OS.launch('about'); } }, avatar(), el('span', {}, owner.name || '')),
      powerBtn));
  FLY.start = { node: startNode, onOpen: () => { startInput.value = ''; renderStartHome(); startMain.scrollTop = 0; } };

  startInput.addEventListener('input', () => {
    const q = startInput.value.trim();
    if (q) renderStartSearch(q); else renderStartHome();
  });
  startInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const first = startMain.querySelector('[data-t]'); if (first) first.click(); }
  });

  const launchFromStart = (t) => { closeFly(); OS.launch(t); };
  const head = (title, btn) => el('div', { class: 'st-head' }, el('h2', {}, title), btn || null);
  const pill = (label, g, fn, before) => el('button', { class: 'pill', onclick: fn }, before ? glyph(g) : null, el('span', {}, label), before ? null : glyph(g));

  function pinTile(t) {
    const r = resolve(t);
    if (!r) return null;
    if (r.type === 'group') {
      const fold = el('span', { class: 'st-fold', 'aria-hidden': 'true' }, OS.groupMembers(r.group.id).slice(0, 4).map(appIcon));
      return el('button', { class: 'st-tile', dataset: { t }, onclick: () => renderStartFolder(r.group) }, fold, el('span', {}, r.title));
    }
    const b = el('button', { class: 'st-tile', dataset: { t }, onclick: () => launchFromStart(t) }, appIcon(r.app), el('span', {}, r.title));
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); OS.contextMenu(e.clientX, e.clientY, OS.itemMenu(t, () => launchFromStart(t))); });
    return b;
  }
  function row(t, sub) {
    const r = resolve(t);
    if (!r) return null;
    const ic = r.type === 'group' ? OS.groupIcon(r.group) : appIcon(r.app);
    return el('button', { class: 'rec', dataset: { t }, onclick: () => launchFromStart(t) }, ic,
      el('span', { class: 'meta' }, el('b', {}, r.title), sub ? el('small', {}, sub) : null));
  }
  function recommended() {
    const s = OS.sites().filter((a) => a.updated).sort(OS.byUpdated).slice(0, 4).map((a) => [a.id, 'Updated ' + OS.fmtDate(a.updated)]);
    const d = OS.docs().slice(0, 2).map((a) => [a.id, 'Text document']);
    return [...s, ...d];
  }
  function renderStartHome() {
    startMain.replaceChildren(
      head('Pinned', pill('All apps', 'chevR', renderStartAll)),
      el('div', { class: 'st-grid' }, OS.startList().map(pinTile)),
      head('Recommended'),
      el('div', { class: 'st-rec' }, recommended().map(([t, sub]) => row(t, sub))));
  }
  function renderStartFolder(g) {
    const members = OS.groupMembers(g.id);
    startMain.replaceChildren(
      head(g.title, pill('Back', 'chevL', renderStartHome, true)),
      g.description ? el('p', { class: 'st-desc' }, g.description) : null,
      el('div', { class: 'st-grid' }, members.map((a) => pinTile(a.id))),
      el('div', { class: 'st-folder-foot' },
        el('button', { class: 'pill', onclick: () => launchFromStart('group:' + g.id) }, el('span', {}, 'Open in File Explorer'), glyph('chevR')),
        g.note ? el('p', { class: 'st-note' }, g.note) : null));
  }
  function renderStartAll() {
    const items = [
      ...[...GROUPS.values()].map((g) => ({ t: 'group:' + g.id, title: g.title, sub: 'Folder' })),
      ...[...OS.APPS.values()].map((a) => ({ t: a.id, title: a.title, sub: a.typeLabel })),
    ].sort((a, b) => a.title.localeCompare(b.title));
    const list = el('div', { class: 'st-all' });
    let letter = '';
    items.forEach((it) => {
      const L = it.title[0].toUpperCase();
      if (L !== letter) { letter = L; list.append(el('div', { class: 'st-letter' }, L)); }
      list.append(row(it.t, it.sub));
    });
    startMain.replaceChildren(head('All apps', pill('Back', 'chevL', renderStartHome, true)), list);
  }
  function renderStartSearch(q) {
    const s = q.toLowerCase();
    const score = (x) => {
      const tt = x.title.toLowerCase();
      if (tt.startsWith(s)) return 3;
      if (tt.includes(s) || x.id.toLowerCase().includes(s)) return 2;
      if ([x.description, ...(x.stack || []), ...(x.shots || []).map((p) => p.caption)].some((v) => v && String(v).toLowerCase().includes(s))) return 1;
      return 0;
    };
    const hits = [
      ...[...GROUPS.values()].map((g) => ({ t: 'group:' + g.id, x: { ...g, id: g.id }, sub: 'Folder' })),
      ...[...OS.APPS.values()].map((a) => ({ t: a.id, x: a, sub: a.typeLabel })),
    ].map((h) => ({ ...h, s: score(h.x) })).filter((h) => h.s).sort((a, b) => b.s - a.s);
    if (!hits.length) {
      startMain.replaceChildren(el('div', { class: 'st-empty' }, el('p', {}, `No results for “${q}”.`), el('small', {}, 'Try a project name, a tool like three.js, or “terminal”.')));
      return;
    }
    const [best, ...rest] = hits;
    const r = resolve(best.t);
    const a = r.type === 'app' ? r.app : null;
    startMain.replaceChildren(
      head('Best match'),
      el('button', { class: 'st-best' + (a && a.cover ? ' has-cover' : ''), dataset: { t: best.t }, onclick: () => launchFromStart(best.t) },
        r.type === 'group' ? OS.groupIcon(r.group) : appIcon(r.app),
        el('span', { class: 'meta' }, el('b', {}, best.x.title), el('small', {}, best.sub), best.x.description ? el('p', {}, best.x.description) : null),
        a && a.cover ? el('span', { class: 'st-best-pic' }, el('img', { src: a.cover, alt: '', draggable: 'false' })) : null),
      rest.length ? head('More results') : null,
      rest.length ? el('div', { class: 'st-all' }, rest.map((h) => row(h.t, h.sub))) : null);
  }

  /* ---------- quick settings ---------- */
  const qsState = { wifi: true, bt: true, vol: 70 };
  const qsTiles = {};
  function qsTile(id, g, label, onClick) {
    const b = el('button', { class: 'qs-b', 'aria-label': label, onclick: onClick }, glyph(g));
    qsTiles[id] = b;
    return el('div', { class: 'qs-t' }, b, el('span', {}, label));
  }
  const brightInput = el('input', { type: 'range', id: 'qs-bright', min: '35', max: '100', value: '100', 'aria-label': 'Brightness',
    oninput: (e) => OS.setPref('bright', Number(e.target.value) / 100) });
  const volInput = el('input', { type: 'range', id: 'qs-vol', min: '0', max: '100', value: String(qsState.vol), 'aria-label': 'Volume',
    oninput: (e) => { qsState.vol = Number(e.target.value); } });
  const qsNode = el('div', { class: 'fly qs', id: 'qs', role: 'dialog', 'aria-label': 'Quick settings' },
    el('div', { class: 'qs-grid' },
      qsTile('wifi', 'wifi', 'Wi-Fi', () => { qsState.wifi = !qsState.wifi; syncQS(); }),
      qsTile('bt', 'bluetooth', 'Bluetooth', () => { qsState.bt = !qsState.bt; syncQS(); }),
      qsTile('dark', 'moon', 'Dark mode', () => OS.setPref('theme', OS.isDark() ? 'light' : 'dark')),
      qsTile('night', 'sun', 'Night light', () => OS.setPref('night', !OS.prefs.night))),
    el('label', { class: 'qs-slider' }, glyph('sun'), brightInput),
    el('label', { class: 'qs-slider' }, glyph('volume'), volInput),
    el('div', { class: 'qs-foot' }, el('span', { class: 'bat' }, glyph('battery'), '100%'),
      el('button', { class: 'ibtn', title: 'All settings', 'aria-label': 'All settings', onclick: () => { closeFly(); OS.launch('settings'); } }, glyph('gear'))));
  FLY.qs = { node: qsNode, onOpen: syncQS };
  function syncQS() {
    const st = { wifi: qsState.wifi, bt: qsState.bt, dark: OS.isDark(), night: OS.prefs.night };
    Object.entries(st).forEach(([k, on]) => { qsTiles[k].classList.toggle('on', on); qsTiles[k].setAttribute('aria-pressed', String(on)); });
  }

  /* ---------- notification center + calendar ---------- */
  const calNode = el('div', { class: 'fly cal stack', id: 'cal', role: 'dialog', 'aria-label': 'Notifications and calendar' });
  let calMonth = new Date();
  calMonth.setDate(1);
  function renderCal() {
    const now = new Date();
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    const startDay = new Date(first);
    startDay.setDate(1 - first.getDay());
    const wk = [...Array(7)].map((_, i) => new Date(2026, 1, 1 + i).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2));
    const days = [...Array(42)].map((_, i) => {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      const today = d.toDateString() === now.toDateString();
      const other = d.getMonth() !== calMonth.getMonth();
      return el('span', { class: 'cal-d' + (today ? ' today' : '') + (other ? ' other' : '') }, String(d.getDate()));
    });
    const shift = (n) => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + n, 1); renderCal(); };
    const fmtTime = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const nc = el('section', { class: 'panel nc', 'aria-label': 'Notifications' },
      el('div', { class: 'nc-h' }, el('b', {}, 'Notifications'),
        notes.length ? el('button', { class: 'pill', onclick: () => { notes.length = 0; renderCal(); } }, el('span', {}, 'Clear all')) : null),
      notes.length
        ? el('div', { class: 'nc-list' }, notes.slice(0, 6).map((n) => el('div', { class: 'nc-i' },
          icon(n.iconName || 'start'), el('div', {}, el('b', {}, n.title), n.body ? el('p', {}, n.body) : null), el('small', {}, fmtTime(n.time)))))
        : el('p', { class: 'nc-empty' }, 'No new notifications'));
    const cal = el('section', { class: 'panel', 'aria-label': 'Calendar' },
      el('div', { class: 'cal-top' }, el('b', {}, now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }))),
      el('div', { class: 'cal-nav' }, el('b', {}, calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })),
        el('span', {}, el('button', { class: 'ibtn', 'aria-label': 'Previous month', onclick: () => shift(-1) }, glyph('chevU')),
          el('button', { class: 'ibtn', 'aria-label': 'Next month', onclick: () => shift(1) }, glyph('chevD')))),
      el('div', { class: 'cal-grid' }, wk.map((w) => el('span', { class: 'cal-w' }, w)), days));
    calNode.replaceChildren(nc, cal);
  }
  FLY.cal = { node: calNode, onOpen: () => { calMonth = new Date(); calMonth.setDate(1); unread = 0; syncBadge(); renderCal(); } };

  /* ---------- lock screen ---------- */
  const lockTime = el('div', { class: 'lk-time' });
  const lockDate = el('div', { class: 'lk-date' });
  const lock = el('div', { id: 'lock', class: 'wallbg', hidden: true, tabindex: '-1', role: 'dialog', 'aria-label': 'Lock screen', html: OS.traceSVG() });
  lock.append(el('div', { class: 'lk-inner' }, lockTime, lockDate), el('div', { class: 'lk-hint' }, 'Click or press any key to unlock'));
  function paintLock() {
    const now = new Date();
    lockTime.textContent = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
    lockDate.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function showLock() {
    closeFly();
    closeTaskView();
    paintLock();
    lock.dataset.wall = OS.prefs.wall;
    lock.hidden = false;
    requestAnimationFrame(() => lock.classList.add('on'));
    lock.focus();
  }
  function unlock() {
    lock.classList.add('up');
    setTimeout(() => { lock.hidden = true; lock.classList.remove('on', 'up'); }, OS.reduced() ? 0 : 380);
  }
  lock.addEventListener('click', unlock);
  lock.addEventListener('keydown', unlock);

  /* ---------- touch: long-press opens the context menu ---------- */
  let lpTimer = 0, lpStart = null, lpFired = false;
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    lpFired = false;
    lpStart = { x: e.clientX, y: e.clientY, target: e.target };
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => {
      if (!lpStart) return;
      lpFired = true;
      lpStart.target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: lpStart.x, clientY: lpStart.y }));
    }, 560);
  }, true);
  const lpCancel = () => { clearTimeout(lpTimer); lpStart = null; };
  document.addEventListener('pointerup', lpCancel, true);
  document.addEventListener('pointercancel', lpCancel, true);
  document.addEventListener('pointermove', (e) => { if (lpStart && Math.hypot(e.clientX - lpStart.x, e.clientY - lpStart.y) > 10) lpCancel(); }, true);
  document.addEventListener('click', (e) => { if (lpFired) { lpFired = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', (e) => { if (lpFired && e.isTrusted) e.preventDefault(); }, true);

  /* ---------- global listeners ---------- */
  document.addEventListener('pointerdown', (e) => {
    if (!ctx.hidden && !e.target.closest('.ctx')) hideCtx();
    if (!peek.hidden && !e.target.closest('.peek')) hidePeek();
    if (openFly && !e.target.closest('.fly') && !e.target.closest('[data-fly]')) closeFly();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideCtx(); closeFly(); closeTaskView(); OS.hideLayouts(); hidePeek(); return; }
    /* Start typing on the desktop to search, like Windows. */
    if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const a = document.activeElement;
      const onDesktop = !a || a === document.body || a.classList.contains('dicon') || a === desktop;
      if (onDesktop && openFly !== 'start' && lock.hidden && taskview.hidden) {
        e.preventDefault();
        toggleFly('start');
        startInput.value = e.key;
        startInput.focus();
        renderStartSearch(e.key);
      }
    }
  });
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#taskbar') && !e.target.closest('.tbb')) e.preventDefault();
  });
  window.addEventListener('blur', () => setTimeout(() => {
    const a = document.activeElement;
    if (a && a.tagName === 'IFRAME') {
      const node = a.closest('.win');
      const w = WM.wins.find((x) => x.node === node);
      if (w && WM.active !== w) OS.focus(w);
      closeFly();
      hideCtx();
      OS.hideLayouts();
    }
  }, 0));

  /* ---------- boot ---------- */
  screen.append(taskview, taskbar, startNode, qsNode, calNode, overNode, peek, ctx, sub, toasts, nightlight, dim, lock);
  OS.applyPrefs();
  renderDesktop();
  renderTaskbar();
  tick();
  setInterval(tick, 10000);
  OS.on('windows', renderTaskbar);
  OS.on('prefs', () => { if (openFly === 'qs') syncQS(); lock.dataset.wall = OS.prefs.wall; });
  OS.on('registry', () => { renderDesktop(); renderTaskbar(); if (openFly === 'start') renderStartHome(); });
  OS.on('desktop', () => {
    if (!store.get('icons', null)) iconPos = {};
    if (!store.get('iconOrder', null)) iconOrder = null;
    const sz = store.get('iconSize', 'medium');
    if (sz !== iconSize && SIZES[sz]) { iconSize = sz; [CELL_W, CELL_H] = SIZES[sz]; }
    renderDesktop(); renderTaskbar(); if (openFly === 'start') renderStartHome();
  });

  /* On the lab's monitor, wait until the visitor zooms in before opening the startup apps. */
  const runStartup = () => (CFG.startup || []).forEach((t) => OS.launch(t));
  if (OS.embedded) {
    let started = false;
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'kogasonos:enter' || started) return;
      started = true; runStartup();
    });
  } else runStartup();
  setTimeout(() => OS.toast({
    title: 'Welcome to ' + sysName,
    body: 'Every project runs as an app here. Start with Showcase, or double-click any icon.',
    iconName: 'showcase',
  }), 700);
  OS.enrichFromGitHub();
})();
