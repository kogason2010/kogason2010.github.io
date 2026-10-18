/* KogasonOS core: helpers, app registry, preferences and the window manager.
   You normally edit js/config.js, not this file. */
(function () {
  'use strict';
  const CFG = window.PORTFOLIO || {};
  const ICONS = window.ICONS || {};
  const PREVIEW = !!window.PORTFOLIO_PREVIEW;
  const OS = (window.OS = { CFG, ICONS, PREVIEW });
  /* True when KogasonOS is running on the 3D lab's monitor (same-origin frame). */
  OS.embedded = (() => { try { return window.parent !== window && window.parent.location.origin === location.origin; } catch (e) { return false; } })();

  /* ---------- helpers ---------- */
  function el(tag, props, ...kids) {
    const n = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') {
          for (const [sk, sv] of Object.entries(v)) {
            if (sk.startsWith('--')) n.style.setProperty(sk, sv); else n.style[sk] = sv;
          }
        }
        else if (k === 'dataset') Object.assign(n.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) n.setAttribute(k, '');
        else n.setAttribute(k, v);
      }
    }
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      n.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return n;
  }
  const glyph = (name, cls = '') => el('span', { class: ('g ' + cls).trim(), 'aria-hidden': 'true', html: ICONS[name] || '' });
  const coarse = () => matchMedia('(pointer: coarse)').matches;
  const compact = () => matchMedia('(max-width: 640px)').matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toDate(iso) {
    return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T12:00:00' : iso);
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const d = toDate(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const prettyUrl = (u) => String(u).replace(/^https?:\/\//, '').replace(/\/$/, '');
  const slug = (s) => String(s || '').toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const link = (href, text) => el('a', { href, target: '_blank', rel: 'noopener' }, text);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('kos:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('kos:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem('kos:' + k); } catch { /* ignore */ } },
  };
  Object.assign(OS, { el, glyph, coarse, compact, reduced, toDate, fmtDate, prettyUrl, slug, link, plural, store });

  /* ---------- events ---------- */
  const bus = {};
  OS.on = (evt, fn) => { (bus[evt] ||= new Set()).add(fn); return () => bus[evt].delete(fn); };
  OS.emit = (evt, data) => { [...(bus[evt] || [])].forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- registry ---------- */
  const APPS = new Map();
  const GROUPS = new Map();
  const titleFromSlug = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  function addApp(raw, { discovered = false } = {}) {
    const a = { ...raw };
    if (a.type === 'github') {
      const [owner, name] = String(a.repo || '').split('/');
      if (!owner || !name) return null;
      a.id = a.id || name;
      a.title = a.title || titleFromSlug(name);
      const userSite = name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
      a.url = a.url || (userSite ? `https://${owner}.github.io/` : `https://${owner}.github.io/${name}/`);
      a.source = a.source || `https://github.com/${owner}/${name}`;
      a.kind = 'site';
    } else if (a.type === 'website') {
      a.id = a.id || slug(a.title || a.url);
      a.title = a.title || prettyUrl(a.url);
      a.kind = 'site';
    } else if (a.type === 'document') {
      a.kind = 'doc';
      a.app = 'notepad';
      a.icon = a.icon || 'textfile';
      a.typeLabel = 'Text document';
    } else {
      a.kind = 'builtin';
      a.typeLabel = a.app === 'explorer' ? 'System folder' : 'App';
    }
    if (a.kind === 'site') {
      if (a.bundle === true) a.run = `apps/${a.id}/index.html`;
      else if (typeof a.bundle === 'string') a.run = a.bundle;
      if (a.embed == null) a.embed = true;
      if (!a.icon) a.icon = a.url.replace(/\/?$/, '/') + 'favicon.svg';
      a.typeLabel = a.run ? 'Application' : a.type === 'github' ? 'GitHub Pages site' : 'Website';
      a.shots = (a.shots || []).map((s) => (Array.isArray(s) ? { src: s[0], caption: s[1] || '' } : s));
      a.cover = a.cover || (a.shots[0] && a.shots[0].src) || null;
    }
    if (!a.id || APPS.has(a.id)) return null;
    a.discovered = discovered;
    APPS.set(a.id, a);
    return a;
  }
  (CFG.groups || []).forEach((g) => GROUPS.set(g.id, { ...g }));
  (CFG.apps || []).forEach((a) => addApp(a));

  const groupMembers = (gid) => [...APPS.values()].filter((a) => a.group === gid);
  const sites = () => [...APPS.values()].filter((a) => a.kind === 'site');
  const docs = () => [...APPS.values()].filter((a) => a.kind === 'doc');
  const byUpdated = (a, b) => String(b.updated || '').localeCompare(String(a.updated || ''));
  function resolve(t) {
    if (typeof t !== 'string') return null;
    if (t.startsWith('group:')) {
      const g = GROUPS.get(t.slice(6));
      return g ? { type: 'group', group: g, id: t, title: g.title } : null;
    }
    const a = APPS.get(t);
    return a ? { type: 'app', app: a, id: t, title: a.title } : null;
  }
  function keyFor(t) {
    const r = resolve(t);
    if (!r) return t;
    if (r.type === 'group') return 'loc:' + t;
    if (r.app.app === 'explorer') return 'loc:' + (r.app.location || 'home');
    return r.app.id;
  }
  /* Which project does a URL belong to? Used so links between projects open as app windows. */
  function findAppByUrl(href) {
    let u;
    try { u = new URL(href, location.href); } catch { return null; }
    const clean = u.origin + u.pathname;
    for (const a of sites()) {
      if (a.url && clean.startsWith(a.url.replace(/\/?$/, '/'))) return a;
      if (a.url && clean === a.url.replace(/\/$/, '')) return a;
      if (a.run) {
        const dir = new URL(a.run, location.href).href.replace(/[^/]*$/, '');
        if (clean.startsWith(dir)) return a;
      }
    }
    return null;
  }
  Object.assign(OS, { APPS, GROUPS, addApp, groupMembers, sites, docs, byUpdated, resolve, keyFor, findAppByUrl });

  /* ---------- what the visitor changed: pins and the Recycle Bin (kept in this browser) ---------- */
  const UNDELETABLE = new Set(['recycle', 'restore-desktop']);
  let recycled = store.get('recycled', []);
  let purged = store.get('purged', []);
  let taskPins = store.get('taskPins', null);
  let startPins = store.get('startPins', null);
  const valid = (list) => list.filter((t) => resolve(t));
  const desktopList = () => valid(CFG.desktop || []).filter((t) => !recycled.includes(t) && !purged.includes(t));
  const taskbarList = () => valid(taskPins || CFG.taskbar || []);
  const startList = () => valid(startPins || CFG.pinned || []);
  const recycledList = () => valid(recycled);
  const isPinned = (where, t) => (where === 'taskbar' ? taskbarList() : startList()).includes(t);
  function togglePin(where, t) {
    const list = (where === 'taskbar' ? taskbarList() : startList()).slice();
    const i = list.indexOf(t);
    if (i >= 0) list.splice(i, 1); else list.push(t);
    if (where === 'taskbar') { taskPins = list; store.set('taskPins', list); }
    else { startPins = list; store.set('startPins', list); }
    OS.emit('desktop');
  }
  const canDelete = (t) => desktopList().includes(t) && !UNDELETABLE.has(t);
  function recycle(t) {
    if (!canDelete(t)) return;
    recycled = [...recycled.filter((x) => x !== t), t];
    store.set('recycled', recycled);
    OS.emit('desktop');
  }
  function restoreItem(t) {
    recycled = recycled.filter((x) => x !== t);
    store.set('recycled', recycled);
    OS.emit('desktop');
  }
  function emptyBin() {
    purged = [...new Set([...purged, ...recycled])];
    recycled = [];
    store.set('purged', purged);
    store.set('recycled', recycled);
    OS.emit('desktop');
  }
  function resetDesktop() {
    recycled = []; purged = []; taskPins = null; startPins = null;
    ['recycled', 'purged', 'taskPins', 'startPins', 'icons', 'iconOrder', 'iconSize'].forEach(store.del);
    OS.emit('desktop');
  }
  Object.assign(OS, { desktopList, taskbarList, startList, recycledList, isPinned, togglePin, canDelete, recycle, restoreItem, emptyBin, resetDesktop });

  /* Bundle sizes for Properties and File Explorer (written by tools/sync-apps.mjs). */
  OS.manifest = {};
  fetch('apps/manifest.json').then((r) => (r.ok ? r.json() : {})).then((m) => { OS.manifest = m || {}; OS.emit('manifest'); }).catch(() => {});
  function sizeOf(a) {
    if (!a) return null;
    if (a.run) {
      const dir = (a.run.match(/^apps\/([^/]+)\//) || [])[1];
      return dir ? OS.manifest[dir] || null : null;
    }
    if (a.kind === 'doc') return { bytes: new Blob([a.text || '']).size, files: 1 };
    return null;
  }
  function fmtBytes(n) {
    if (n == null) return '';
    if (n < 1024) return n + ' bytes';
    const u = ['KB', 'MB', 'GB'];
    let v = n / 1024, i = 0;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return (v >= 100 ? Math.round(v) : v.toFixed(v >= 10 ? 1 : 2)) + ' ' + u[i];
  }
  Object.assign(OS, { sizeOf, fmtBytes });

  /* ---------- icons ---------- */
  function monogram(title) {
    const words = String(title || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/);
    const letters = (words.slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();
    return el('span', { class: 'ic mono', 'aria-hidden': 'true' }, el('i', {}, letters));
  }
  function icon(spec, title) {
    if (spec && ICONS[spec]) return el('span', { class: 'ic', 'aria-hidden': 'true', html: ICONS[spec] });
    if (spec && /[./]/.test(spec)) {
      const wrap = el('span', { class: 'ic', 'aria-hidden': 'true' });
      const img = el('img', { src: spec, alt: '', draggable: 'false' });
      img.addEventListener('error', () => {
        const m = monogram(title);
        wrap.className = m.className;
        wrap.replaceChildren(...m.childNodes);
      }, { once: true });
      wrap.append(img);
      return wrap;
    }
    return monogram(title);
  }
  const appIcon = (a) => icon(a.icon, a.title);
  function groupIcon(g) {
    const w = el('span', { class: 'ic folder-ic', 'aria-hidden': 'true', html: ICONS.folderBack });
    w.append(
      el('span', { class: 'fprev' }, groupMembers(g.id).slice(0, 2).map(appIcon)),
      el('span', { class: 'ffront', html: ICONS.folderFront })
    );
    return w;
  }
  function targetIcon(t) {
    const r = resolve(t);
    if (!r) return monogram(t);
    return r.type === 'group' ? groupIcon(r.group) : appIcon(r.app);
  }
  function cover(a, cls = 'cover') {
    if (!a.cover) return el('div', { class: cls + ' cover-empty' }, appIcon(a));
    return el('div', { class: cls }, el('img', { src: a.cover, alt: '', loading: 'lazy', draggable: 'false' }));
  }
  Object.assign(OS, { icon, appIcon, groupIcon, targetIcon, monogram, cover });

  /* Chromatogram traces for the wallpaper (drawn, not stored as path data). */
  function tracePath(base, peaks, drift) {
    let d = '';
    for (let x = -60; x <= 1660; x += 5) {
      let y = base + Math.sin(x / 230) * drift;
      for (const [c, h, s] of peaks) y -= h * Math.exp(-((x - c) ** 2) / (2 * s * s));
      d += (x === -60 ? 'M' : 'L') + x + ' ' + y.toFixed(1);
    }
    return d;
  }
  OS.traceSVG = function () {
    const p1 = [[190, 70, 15], [300, 210, 12], [395, 110, 17], [585, 380, 14], [672, 150, 19], [860, 290, 13], [990, 80, 21], [1135, 470, 15], [1228, 190, 13], [1385, 130, 22], [1495, 280, 14]];
    const p2 = p1.map(([c, h, s]) => [c + 34, h * 0.42, s * 1.3]);
    const d1 = tracePath(770, p1, 6);
    const d2 = tracePath(812, p2, 4);
    let ticks = '';
    for (let x = 40; x < 1600; x += 80) ticks += `M${x} 836v${x % 400 === 40 ? 10 : 5}`;
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="${d1}L1660 900L-60 900Z" style="fill:var(--trace-fill)"/>
      <path d="${d2}" fill="none" style="stroke:var(--trace-2)" stroke-width="1.4"/>
      <path d="${d1}" fill="none" style="stroke:var(--trace-1)" stroke-width="7" opacity=".16"/>
      <path d="${d1}" fill="none" style="stroke:var(--trace-1)" stroke-width="1.8"/>
      <path d="M0 836H1600${ticks}" fill="none" style="stroke:var(--trace-2)" stroke-width="1" opacity=".55"/>
    </svg>`;
  };

  /* ---------- preferences ---------- */
  const ACCENTS = [
    { id: 'ion', name: 'Ion cyan', light: '#0b6f9a', dark: '#63d3ff' },
    { id: 'uv', name: 'UV violet', light: '#6a46c4', dark: '#c39bff' },
    { id: 'amber', name: 'Amber', light: '#975600', dark: '#ffb24a' },
    { id: 'blue', name: 'Classic blue', light: '#005fb8', dark: '#60cdff' },
    { id: 'teal', name: 'Teal', light: '#0a7564', dark: '#4fd1b8' },
    { id: 'rose', name: 'Rose', light: '#ad2459', dark: '#ff8fb6' },
  ];
  const WALLS = [
    { id: 'trace', name: 'Chromatogram' },
    { id: 'molecular', name: 'Molecular field' },
    { id: 'gradient', name: 'Gradient' },
    { id: 'solid', name: 'Solid color' },
  ];
  const hostTheme = document.documentElement.getAttribute('data-theme');
  const prefs = {
    theme: store.get('theme', 'system'),
    accent: store.get('accent', (CFG.system && CFG.system.accent) || 'ion'),
    wall: store.get('wall', (CFG.system && CFG.system.wallpaper) || 'trace'),
    bright: 1,
    night: false,
  };
  if (!WALLS.some((w) => w.id === prefs.wall)) prefs.wall = 'trace';
  function applyPrefs() {
    const r = document.documentElement;
    if (prefs.theme === 'system') {
      if (hostTheme) r.setAttribute('data-theme', hostTheme);
      else r.removeAttribute('data-theme');
    } else r.setAttribute('data-theme', prefs.theme);
    const a = ACCENTS.find((x) => x.id === prefs.accent) || ACCENTS[0];
    r.style.setProperty('--accent-light', a.light);
    r.style.setProperty('--accent-dark', a.dark);
    document.querySelectorAll('.wallbg:not(.fixed-wall)').forEach((w) => (w.dataset.wall = prefs.wall));
    const dim = document.getElementById('dim');
    if (dim) dim.style.opacity = String((1 - prefs.bright) * 0.8);
    const nl = document.getElementById('nightlight');
    if (nl) nl.classList.toggle('on', prefs.night);
    OS.emit('prefs');
  }
  function setPref(k, v) {
    prefs[k] = v;
    if (k === 'theme' || k === 'accent' || k === 'wall') store.set(k, v);
    applyPrefs();
  }
  function isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => OS.emit('prefs'));
  Object.assign(OS, { ACCENTS, WALLS, prefs, applyPrefs, setPref, isDark });

  /* ---------- window manager ---------- */
  const WM = { wins: [], z: 100, seq: 0, active: null };
  const APPDEFS = {};
  let layer = null;
  let snapEl = null;
  OS.WM = WM;
  OS.APPDEFS = APPDEFS;
  OS.setLayer = (l, s) => { layer = l; snapEl = s; };
  const changed = () => OS.emit('windows');
  const area = () => layer.getBoundingClientRect();
  OS.area = area;

  /* Snap zones as fractions of the desktop: [x, y, w, h] */
  const ZONES = {
    max: [0, 0, 1, 1], left: [0, 0, 0.5, 1], right: [0.5, 0, 0.5, 1],
    tl: [0, 0, 0.5, 0.5], tr: [0.5, 0, 0.5, 0.5], bl: [0, 0.5, 0.5, 0.5], br: [0.5, 0.5, 0.5, 0.5],
  };
  const LAYOUTS = [
    [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]],
    [[0, 0, 2 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
    [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
    [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
    [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  ];

  function setRect(w, r) {
    w.rect = { ...r };
    Object.assign(w.node.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  }
  function animate(w) {
    if (reduced()) return;
    w.node.classList.add('anim');
    clearTimeout(w._anim);
    w._anim = setTimeout(() => w.node.classList.remove('anim'), 260);
  }
  const rectKey = (w) => 'rect:' + (w.spec.app === 'explorer' ? 'explorer' : w.key);
  function rememberRect(w) {
    if (w.max || w.snapPrev || compact()) return;
    store.set(rectKey(w), w.rect);
  }

  function openWindow(spec) {
    const existing = WM.wins.find((w) => w.key === spec.key);
    if (existing) {
      if (existing.min) restore(existing);
      else focus(existing);
      if (existing.onRelaunch) existing.onRelaunch(spec);
      return existing;
    }
    const def = APPDEFS[spec.app];
    if (!def) { console.warn('Unknown app type:', spec.app); return null; }

    const w = { id: 'w' + ++WM.seq, key: spec.key, spec, def, min: false, max: false, prev: null, snapPrev: null, title: '', live: false, thumb: null };
    w.iconFactory = () => monogram(w.title);

    const titleEl = el('span', { class: 't' });
    const iconSlot = el('span', { class: 'ti' });
    const actions = el('div', { class: 'tact' });
    const bMin = el('button', { class: 'm', title: 'Minimize', 'aria-label': 'Minimize', onclick: () => minimize(w) }, glyph('wmin'));
    const bMax = el('button', { class: 'mx', title: 'Maximize', 'aria-label': 'Maximize', onclick: () => toggleMax(w) }, glyph('wmax'));
    const bX = el('button', { class: 'x', title: 'Close', 'aria-label': 'Close', onclick: () => close(w) }, glyph('wclose'));
    const bar = el('div', { class: 'titlebar' }, iconSlot, titleEl, actions, el('div', { class: 'wctl' }, bMin, bMax, bX));
    const body = el('div', { class: 'wbody' });
    const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => el('div', { class: 'rz rz-' + d, dataset: { dir: d } }));
    const node = el('section', { class: 'win opening' + (def.fixed ? ' fixed' : ''), role: 'dialog', 'aria-label': '', tabindex: '-1', dataset: { app: spec.app } }, bar, body, handles);
    Object.assign(w, { node, bar, body, bMax, actions });

    w.setTitle = (t) => { w.title = t; titleEl.textContent = t; node.setAttribute('aria-label', t); if (w.live) changed(); };
    w.setIcon = (factory) => { w.iconFactory = factory; iconSlot.replaceChildren(factory()); if (w.live) changed(); };
    w.addAction = (g, label, fn, extra = {}) => {
      const b = extra.href
        ? el('a', { class: 'ta', href: extra.href, target: '_blank', rel: 'noopener', title: label, 'aria-label': label }, glyph(g))
        : el('button', { class: 'ta', title: label, 'aria-label': label, onclick: fn }, glyph(g));
      actions.append(b);
      return b;
    };

    const A = area();
    let [ww, hh] = spec.size || def.size || [880, 560];
    const saved = store.get(rectKey(w), null);
    if (saved && saved.w && saved.h) { ww = saved.w; hh = saved.h; }
    ww = Math.max(360, Math.min(ww, A.width - 24));
    hh = Math.max(240, Math.min(hh, A.height - 24));
    const off = (WM.wins.length % 6) * 30;
    let x = Math.max(8, Math.round((A.width - ww) / 2 - 70 + off));
    let y = Math.max(8, Math.round((A.height - hh) / 2 - 30 + off));
    if (saved && Number.isFinite(saved.x)) {
      x = Math.max(0, Math.min(saved.x, A.width - ww));
      y = Math.max(0, Math.min(saved.y, A.height - hh));
      while (WM.wins.some((o) => !o.max && Math.abs(o.rect.x - x) < 8 && Math.abs(o.rect.y - y) < 8)) { x += 30; y += 30; }
    }
    setRect(w, { x, y, w: ww, h: hh });

    layer.append(node);
    def.mount(w, spec);
    WM.wins.push(w);
    w.live = true;

    w.ro = new ResizeObserver(([en]) => {
      const W = en.contentRect.width;
      node.dataset.size = W < 560 ? 's' : W < 880 ? 'm' : 'l';
    });
    w.ro.observe(node);

    node.addEventListener('pointerdown', () => { if (WM.active !== w) focus(w); }, true);
    bar.addEventListener('dblclick', (e) => { if (!e.target.closest('.wctl, .tact') && !def.fixed) toggleMax(w); });
    wireDrag(w);
    wireResize(w, handles);
    wireLayouts(w);

    if ((compact() && !def.fixed) || spec.max) setMax(w, true, false);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove('opening')));
    focus(w);
    return w;
  }

  function focus(w) {
    if (!w) return;
    w.node.style.zIndex = String(++WM.z);
    WM.active = w;
    WM.wins.forEach((x) => x.node.classList.toggle('active', x === w));
    changed();
  }
  function topWindow() {
    return WM.wins.filter((w) => !w.min).sort((a, b) => Number(b.node.style.zIndex) - Number(a.node.style.zIndex))[0];
  }
  function blurAll() {
    WM.active = null;
    WM.wins.forEach((x) => x.node.classList.remove('active'));
  }
  /* Point the minimize animation at the window's taskbar button, like Windows does. */
  function aimAtTaskbar(w) {
    const btn = document.querySelector(`.tbb[data-w="${w.id}"]`);
    if (!btn) return;
    const b = btn.getBoundingClientRect(), n = w.node.getBoundingClientRect();
    w.node.style.setProperty('--min-x', Math.round(b.left + b.width / 2 - (n.left + n.width / 2)) + 'px');
    w.node.style.setProperty('--min-y', Math.round(b.top + b.height / 2 - (n.top + n.height / 2)) + 'px');
  }
  OS.aimAtTaskbar = aimAtTaskbar;
  function minimize(w) {
    aimAtTaskbar(w);
    w.min = true;
    w.node.classList.add('min');
    if (WM.active === w) {
      const t = topWindow();
      if (t) return focus(t);
      blurAll();
    }
    changed();
  }
  function restore(w) {
    w.min = false;
    w.node.classList.remove('min');
    focus(w);
  }
  function setMaxButton(w, on) {
    w.bMax.replaceChildren(glyph(on ? 'wrestore' : 'wmax'));
    w.bMax.title = on ? 'Restore down' : 'Maximize';
    w.bMax.setAttribute('aria-label', w.bMax.title);
  }
  function setMax(w, on, anim = true) {
    if (anim) animate(w);
    if (on) {
      if (!w.max) w.prev = w.snapPrev || { ...w.rect };
      w.snapPrev = null;
      w.max = true;
      w.node.classList.add('max');
      Object.assign(w.node.style, { left: '0px', top: '0px', width: '100%', height: '100%' });
    } else {
      w.max = false;
      w.node.classList.remove('max');
      setRect(w, w.prev || w.rect);
    }
    setMaxButton(w, on);
  }
  const toggleMax = (w) => { if (!compact() && !w.def.fixed) setMax(w, !w.max); };
  /* Place a window in a fraction of the desktop, remembering where it was. */
  function snapTo(w, f) {
    const A = area();
    animate(w);
    if (w.max) {
      w.snapPrev = w.prev;
      w.max = false;
      w.node.classList.remove('max');
      setMaxButton(w, false);
    } else if (!w.snapPrev) w.snapPrev = { ...w.rect };
    setRect(w, { x: Math.round(A.width * f[0]), y: Math.round(A.height * f[1]), w: Math.round(A.width * f[2]), h: Math.round(A.height * f[3]) });
    focus(w);
  }
  function close(w) {
    if (w.onClose) try { w.onClose(); } catch (e) { console.error(e); }
    rememberRect(w);
    if (w.ro) w.ro.disconnect();
    w.node.classList.add('closing');
    WM.wins = WM.wins.filter((x) => x !== w);
    if (WM.active === w) {
      const t = topWindow();
      if (t) focus(t); else blurAll();
    }
    changed();
    setTimeout(() => w.node.remove(), reduced() ? 0 : 160);
  }
  function minimizeAll() {
    const anyOpen = WM.wins.some((w) => !w.min);
    if (anyOpen) {
      WM.wins.forEach((w) => { aimAtTaskbar(w); w.min = true; w.node.classList.add('min'); });
      blurAll();
      changed();
    } else if (WM.wins.length) {
      WM.wins.forEach((w) => { w.min = false; w.node.classList.remove('min'); });
      focus(topWindow());
    }
  }

  function showSnap(f) {
    if (!snapEl) return;
    if (!f) { snapEl.classList.remove('on'); return; }
    const A = area();
    Object.assign(snapEl.style, {
      left: A.width * f[0] + 8 + 'px', top: A.height * f[1] + 8 + 'px',
      width: A.width * f[2] - 16 + 'px', height: A.height * f[3] - 16 + 'px',
    });
    snapEl.classList.add('on');
  }
  function zoneAt(lx, ly, A) {
    const E = 6, C = 48;
    const left = lx < A.width / 2;
    const atSide = lx <= E || lx >= A.width - E;
    if (ly <= 3) {
      if (lx <= C) return 'tl';
      if (lx >= A.width - C) return 'tr';
      return 'max';
    }
    if (!atSide) return null;
    if (ly <= C) return left ? 'tl' : 'tr';
    if (ly >= A.height - C) return left ? 'bl' : 'br';
    return left ? 'left' : 'right';
  }

  function wireDrag(w) {
    const bar = w.bar;
    bar.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.wctl, .tact') || compact()) return;
      const A = area();
      const sx = e.clientX, sy = e.clientY;
      let moved = false, base = null, zone = null;
      bar.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moved) {
          if (Math.hypot(dx, dy) < 4) return;
          moved = true;
          hideLayouts();
          document.body.classList.add('dragging');
          if (w.max || w.snapPrev) {
            const from = w.max ? { x: 0, w: A.width } : w.rect;
            const ratio = Math.min(1, Math.max(0, (sx - A.left - from.x) / from.w));
            const p = w.max ? w.prev : w.snapPrev;
            if (w.max) { w.max = false; w.node.classList.remove('max'); setMaxButton(w, false); }
            w.snapPrev = null;
            setRect(w, { ...p, x: sx - A.left - p.w * ratio, y: Math.max(0, sy - A.top - 16) });
          }
          base = { ...w.rect };
        }
        const nx = Math.max(-base.w + 96, Math.min(base.x + dx, A.width - 96));
        const ny = Math.max(0, Math.min(base.y + dy, A.height - 32));
        setRect(w, { ...base, x: nx, y: ny });
        zone = zoneAt(ev.clientX - A.left, ev.clientY - A.top, A);
        showSnap(zone && ZONES[zone]);
      };
      const up = () => {
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
        bar.removeEventListener('pointercancel', up);
        document.body.classList.remove('dragging');
        showSnap(null);
        if (!moved) return;
        if (zone === 'max') { w.rect = base; setMax(w, true); }
        else if (zone) { w.snapPrev = base; snapTo(w, ZONES[zone]); }
        else rememberRect(w);
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
      bar.addEventListener('pointercancel', up);
    });
  }

  function wireResize(w, handles) {
    handles.forEach((h) => h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || w.max) return;
      e.preventDefault();
      e.stopPropagation();
      focus(w);
      h.setPointerCapture(e.pointerId);
      document.body.classList.add('dragging');
      const dir = h.dataset.dir, r0 = { ...w.rect }, sx = e.clientX, sy = e.clientY, minW = 360, minH = 240;
      w.snapPrev = null;
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        let { x, y, w: W, h: H } = r0;
        if (dir.includes('e')) W = Math.max(minW, r0.w + dx);
        if (dir.includes('s')) H = Math.max(minH, r0.h + dy);
        if (dir.includes('w')) { W = Math.max(minW, r0.w - dx); x = r0.x + (r0.w - W); }
        if (dir.includes('n')) { H = Math.max(minH, r0.h - dy); y = r0.y + (r0.h - H); if (y < 0) { H += y; y = 0; } }
        setRect(w, { x, y, w: W, h: H });
      };
      const up = () => {
        h.removeEventListener('pointermove', move);
        h.removeEventListener('pointerup', up);
        h.removeEventListener('pointercancel', up);
        document.body.classList.remove('dragging');
        rememberRect(w);
      };
      h.addEventListener('pointermove', move);
      h.addEventListener('pointerup', up);
      h.addEventListener('pointercancel', up);
    }));
  }

  /* Snap layouts: hover the maximize button to pick a zone. */
  let layoutsEl = null, layoutsFor = null, layoutsTimer = 0, hideTimer = 0;
  function hideLayouts() {
    clearTimeout(layoutsTimer);
    if (layoutsEl) layoutsEl.classList.remove('open');
    layoutsFor = null;
  }
  function showLayouts(w) {
    if (!layoutsEl) {
      layoutsEl = el('div', { class: 'layouts', role: 'menu', 'aria-label': 'Snap layouts' });
      layoutsEl.addEventListener('pointerenter', () => clearTimeout(hideTimer));
      layoutsEl.addEventListener('pointerleave', () => { hideTimer = setTimeout(hideLayouts, 220); });
      document.getElementById('screen').append(layoutsEl);
    }
    layoutsFor = w;
    layoutsEl.replaceChildren(...LAYOUTS.map((zones) => el('div', { class: 'lay' }, zones.map((f) =>
      el('button', {
        class: 'zone', role: 'menuitem', 'aria-label': `Snap to ${Math.round(f[2] * 100)}% by ${Math.round(f[3] * 100)}%`,
        style: { left: `calc(${f[0] * 100}% + 2px)`, top: `calc(${f[1] * 100}% + 2px)`, width: `calc(${f[2] * 100}% - 4px)`, height: `calc(${f[3] * 100}% - 4px)` },
        onclick: () => { const t = layoutsFor; hideLayouts(); if (t) snapTo(t, f); },
      })))));
    const r = w.bMax.getBoundingClientRect();
    const W = 300;
    layoutsEl.style.left = Math.max(8, Math.min(r.right - W, innerWidth - W - 8)) + 'px';
    layoutsEl.style.top = r.bottom + 6 + 'px';
    layoutsEl.classList.add('open');
  }
  function wireLayouts(w) {
    w.bMax.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || compact() || w.def.fixed) return;
      clearTimeout(hideTimer);
      clearTimeout(layoutsTimer);
      layoutsTimer = setTimeout(() => showLayouts(w), 420);
    });
    w.bMax.addEventListener('pointerleave', () => {
      clearTimeout(layoutsTimer);
      hideTimer = setTimeout(hideLayouts, 220);
    });
    w.bMax.addEventListener('pointerdown', hideLayouts);
  }
  OS.hideLayouts = hideLayouts;

  window.addEventListener('resize', () => {
    if (!layer) return;
    const A = area();
    hideLayouts();
    WM.wins.forEach((w) => {
      if (compact() && !w.def.fixed) { if (!w.max) setMax(w, true, false); return; }
      if (w.max) return;
      const r = { ...w.rect };
      r.w = Math.min(r.w, A.width);
      r.h = Math.min(r.h, A.height);
      r.x = Math.max(-r.w + 96, Math.min(r.x, A.width - 96));
      r.y = Math.max(0, Math.min(r.y, A.height - 32));
      setRect(w, r);
    });
  });

  /* ---------- launching ---------- */
  const LOCATIONS = ['home', 'desktop', 'documents', 'pictures', 'projects', 'thispc', 'recycle'];
  function launch(t, extra = {}) {
    if (LOCATIONS.includes(t)) return openWindow({ key: 'loc:' + t, app: 'explorer', location: t });
    const r = resolve(t);
    if (!r) {
      if (OS.toast) OS.toast({ title: "Couldn't open that", body: `Nothing called “${t}” is installed.` });
      return null;
    }
    if (r.type === 'group') return openWindow({ key: 'loc:' + t, app: 'explorer', location: t });
    const a = r.app;
    /* Entries marked open: "top" replace KogasonOS in this tab instead of opening a window (the 3D lab). */
    if (a.open === 'top' && a.url) {
      // Running on the lab's monitor: ask the lab to zoom back out instead of loading a new page.
      if (OS.embedded) { try { window.parent.postMessage({ type: 'kogasonos:exit' }, location.origin); return null; } catch (e) {} }
      location.assign(a.url.replace(/#.*$/, '') + (a.hash || ''));
      return null;
    }
    if (a.kind === 'site') return openWindow({ key: a.id, app: 'site', ref: a, ...extra });
    if (a.kind === 'doc') return openWindow({ key: a.id, app: 'notepad', ref: a });
    if (a.app === 'explorer') {
      const loc = a.location || 'home';
      return openWindow({ key: 'loc:' + loc, app: 'explorer', location: loc });
    }
    return openWindow({ key: a.id, app: a.app, ref: a, ...extra });
  }
  OS.properties = (t) => openWindow({ key: 'props:' + t, app: 'properties', target: t });
  /* Open the Photos viewer on one project's screenshots. */
  OS.openPhotos = (appId, index = 0) => launch('photos', { album: appId, index });

  /* Right-click menu for an item, laid out like Windows 11: an icon row on top
     (Copy, Share, Delete), then the commands, then Properties. */
  async function copyText(text, what) {
    try { await navigator.clipboard.writeText(text); OS.toast && OS.toast({ title: what + ' copied', body: text, iconName: 'start', timeout: 3500 }); }
    catch { OS.toast && OS.toast({ title: "Couldn't copy", body: text, timeout: 6000 }); }
  }
  OS.copyText = copyText;
  function itemMenu(t, openFn) {
    const r = resolve(t);
    if (!r) return [];
    const a = r.type === 'app' ? r.app : null;
    const link = a && a.url ? a.url : null;
    const row = [
      { icon: 'copy', label: 'Copy link', disabled: !link, action: () => copyText(link, 'Link') },
      { icon: 'share', label: 'Share', disabled: !link, action: () => {
        if (navigator.share) navigator.share({ title: a.title, url: link }).catch(() => {});
        else copyText(link, 'Link');
      } },
      { icon: 'trash', label: 'Delete', disabled: !canDelete(t), action: () => recycle(t) },
    ];
    const pinnable = r.type === 'group' || (a && a.app !== 'explorer') || (a && a.app === 'explorer');
    return [
      { row },
      { label: 'Open', icon: 'chevR', action: openFn || (() => launch(t)), bold: true },
      a && a.kind === 'site' ? { label: 'Open live site in new tab', icon: 'external', href: a.url } : null,
      a && a.shots && a.shots.length ? { label: 'View screenshots', icon: 'image', action: () => OS.openPhotos(a.id, 0) } : null,
      { sep: true },
      pinnable ? { label: isPinned('start', t) ? 'Unpin from Start' : 'Pin to Start', icon: 'pin', action: () => togglePin('start', t) } : null,
      pinnable && r.type !== 'group' ? { label: isPinned('taskbar', t) ? 'Unpin from taskbar' : 'Pin to taskbar', icon: 'pin', action: () => togglePin('taskbar', t) } : null,
      a && a.source ? { label: 'View source on GitHub', icon: 'code', href: a.source } : null,
      { sep: true },
      { label: 'Properties', icon: 'props', action: () => OS.properties(t) },
    ].filter(Boolean);
  }

  Object.assign(OS, { openWindow, focus, minimize, restore, setMax, toggleMax, snapTo, close, minimizeAll, launch, itemMenu, LOCATIONS });

  /* ---------- live data from GitHub (only on the deployed site) ---------- */
  OS.enrichFromGitHub = async function () {
    const gh = CFG.github || {};
    if (PREVIEW || !gh.user) return;
    const cacheKey = 'kos:gh:' + gh.user;
    let repos = null;
    try { repos = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch { /* ignore */ }
    try {
      if (!repos) {
        const res = await fetch(`https://api.github.com/users/${gh.user}/repos?per_page=100&sort=pushed`);
        if (!res.ok) return;
        repos = (await res.json()).map((r) => ({
          full_name: r.full_name, name: r.name, description: r.description, has_pages: r.has_pages,
          pushed_at: r.pushed_at, stargazers_count: r.stargazers_count, language: r.language, fork: r.fork, archived: r.archived,
        }));
        try { sessionStorage.setItem(cacheKey, JSON.stringify(repos)); } catch { /* ignore */ }
      }
      const byName = new Map(repos.map((r) => [r.full_name.toLowerCase(), r]));
      for (const a of APPS.values()) {
        if (a.type !== 'github') continue;
        const r = byName.get(a.repo.toLowerCase());
        if (!r) continue;
        if (r.pushed_at) a.updated = r.pushed_at;
        a.stars = r.stargazers_count;
        if (!a.description && r.description) a.description = r.description;
        if (!a.stack && r.language) a.stack = [r.language];
      }
      if (gh.autoDiscover) {
        const exclude = new Set((gh.exclude || []).map((s) => s.toLowerCase()));
        const known = new Set([...APPS.values()].filter((a) => a.repo).map((a) => a.repo.toLowerCase()));
        for (const r of repos) {
          if (!r.has_pages || r.fork || r.archived) continue;
          if (exclude.has(r.name.toLowerCase()) || known.has(r.full_name.toLowerCase())) continue;
          addApp({ type: 'github', repo: r.full_name, description: r.description || '', updated: r.pushed_at, stack: r.language ? [r.language] : undefined, group: gh.discoveredGroup || undefined }, { discovered: true });
        }
      }
      OS.emit('registry');
    } catch { /* offline or rate limited: keep the values from config.js */ }
  };
})();
