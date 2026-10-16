/* Built-in apps: File Explorer, project app windows, Notepad, Terminal and Settings.
   Showcase and Photos live in js/showcase.js.
   To add a new kind of app, register OS.APPDEFS.<name> = { size, mount(win, spec) }
   and list it in config.js as { type: "builtin", id: "...", app: "<name>" }. */
(function () {
  'use strict';
  const OS = window.OS;
  const { el, glyph, icon, appIcon, groupIcon, fmtDate, prettyUrl, link, plural, store, CFG, APPS, GROUPS } = OS;
  const ibtn = (g, label, fn, disabled) =>
    el('button', { class: 'ibtn', title: label, 'aria-label': label, disabled: !!disabled, onclick: fn }, glyph(g));
  const owner = CFG.owner || {};
  OS.ibtn = ibtn;

  /* ---------- shared detail views ---------- */
  function chips(list) {
    return el('div', { class: 'chips' }, list.map((s) => el('span', { class: 'chip' }, s)));
  }
  function shotStrip(a, limit = 4) {
    if (!a.shots || !a.shots.length) return null;
    return el('div', { class: 'strip' }, a.shots.slice(0, limit).map((s, i) =>
      el('button', { class: 'strip-i', title: s.caption, 'aria-label': `Screenshot ${i + 1}: ${s.caption}`, onclick: () => OS.openPhotos(a.id, i) },
        el('img', { src: s.src, alt: '', loading: 'lazy', draggable: 'false' }))));
  }
  function appDetails(a, { onOpen, showOpen = true, showCover = true } = {}) {
    const box = el('div', { class: 'dt' });
    if (showCover && a.cover) box.append(el('button', { class: 'dt-cover', 'aria-label': 'View screenshots', onclick: () => OS.openPhotos(a.id, 0) }, el('img', { src: a.cover, alt: '', loading: 'lazy', draggable: 'false' })));
    else box.append(el('div', { class: 'dt-ic' }, appIcon(a)));
    box.append(el('h3', { class: 'dt-title' }, a.title), el('div', { class: 'dt-type' }, a.typeLabel));
    if (a.description) box.append(el('p', { class: 'dt-desc' }, a.description));
    if (a.tip) box.append(el('p', { class: 'dt-tip' }, glyph('info'), el('span', {}, a.tip)));
    if (a.stack && a.stack.length) box.append(chips(a.stack));
    const kv = [];
    if (a.kind === 'site') kv.push(['Live site', link(a.url, prettyUrl(a.url))]);
    if (a.source) kv.push(['Source', link(a.source, a.repo || prettyUrl(a.source))]);
    if (a.updated) kv.push(['Updated', fmtDate(a.updated)]);
    if (a.stars) kv.push(['Stars', String(a.stars)]);
    const g = a.group && GROUPS.get(a.group);
    if (g) kv.push(['Folder', g.title]);
    if (kv.length) box.append(el('dl', { class: 'kv' }, kv.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))));
    const strip = showCover ? shotStrip(a) : null;
    if (strip) box.append(strip);
    if (g && g.note) box.append(el('p', { class: 'dt-note' }, g.note));
    const btns = el('div', { class: 'btns' });
    if (showOpen) btns.append(el('button', { class: 'btn primary', onclick: onOpen || (() => OS.launch(a.id)) }, 'Open'));
    if (a.kind === 'site') btns.append(el('a', { class: 'btn', href: a.url, target: '_blank', rel: 'noopener' }, glyph('external'), 'Live site'));
    if (btns.childNodes.length) box.append(btns);
    return box;
  }
  function groupDetails(g, onOpen) {
    const n = OS.groupMembers(g.id).length;
    return el('div', { class: 'dt' },
      el('div', { class: 'dt-ic' }, groupIcon(g)),
      el('h3', { class: 'dt-title' }, g.title),
      el('div', { class: 'dt-type' }, 'File folder · ' + plural(n, 'item')),
      g.description ? el('p', { class: 'dt-desc' }, g.description) : null,
      g.note ? el('p', { class: 'dt-note' }, g.note) : null,
      onOpen ? el('div', { class: 'btns' }, el('button', { class: 'btn primary', onclick: onOpen }, 'Open')) : null
    );
  }
  Object.assign(OS, { chips, shotStrip, appDetails, groupDetails });

  /* =====================================================================
     File Explorer
     ===================================================================== */
  const LOCS = {
    home: { title: 'Home', icon: 'home' },
    desktop: { title: 'Desktop', icon: 'desktop' },
    documents: { title: 'Documents', icon: 'documents' },
    pictures: { title: 'Pictures', icon: 'pictures' },
    projects: { title: 'Projects', icon: 'folder' },
    thispc: { title: 'This PC', icon: 'pc' },
    recycle: { title: 'Recycle Bin', icon: 'recycle' },
  };
  const USER = owner.handle || 'user';
  /* Where things "live", for the address bar tooltip and Properties. */
  function pathOf(loc) {
    if (loc && loc.startsWith('group:')) { const g = GROUPS.get(loc.slice(6)); return `C:\\Users\\${USER}\\Projects\\${g ? g.title : ''}`; }
    return {
      home: 'Home', thispc: 'This PC', recycle: 'Recycle Bin',
      desktop: `C:\\Users\\${USER}\\Desktop`, documents: `C:\\Users\\${USER}\\Documents`,
      pictures: `C:\\Users\\${USER}\\Pictures`, projects: `C:\\Users\\${USER}\\Projects`,
    }[loc] || '';
  }
  OS.pathOf = pathOf;
  function locInfo(loc) {
    if (loc.startsWith('group:')) {
      const g = GROUPS.get(loc.slice(6));
      return g ? { title: g.title, group: g, path: ['home', 'projects', loc] } : null;
    }
    const L = LOCS[loc];
    if (!L) return null;
    const path = loc === 'home' || loc === 'thispc' || loc === 'recycle' ? [loc] : loc === 'projects' || loc === 'pictures' || loc === 'documents' || loc === 'desktop' ? ['thispc', loc] : ['home', loc];
    return { ...L, path };
  }
  const parentOf = (loc) => (loc.startsWith('group:') ? 'projects' : loc === 'home' || loc === 'thispc' ? 'home' : 'thispc');
  const ungroupedSites = () => OS.sites().filter((a) => !a.group || !GROUPS.has(a.group));
  function locItems(loc) {
    if (loc === 'home') {
      return [
        { h: 'Quick access', items: ['loc:desktop', 'loc:documents', 'loc:projects', ...[...GROUPS.keys()].map((id) => 'group:' + id)] },
        { h: 'Recently updated', items: OS.sites().sort(OS.byUpdated).slice(0, 6).map((a) => a.id) },
      ];
    }
    if (loc === 'projects') {
      return [
        { h: 'Folders', items: [...GROUPS.keys()].map((id) => 'group:' + id) },
        { h: 'Apps', items: ungroupedSites().map((a) => a.id) },
      ];
    }
    if (loc.startsWith('group:')) return [{ h: null, items: OS.groupMembers(loc.slice(6)).map((a) => a.id) }];
    if (loc === 'desktop') return [{ h: null, items: OS.desktopList() }];
    if (loc === 'documents') return [{ h: null, items: OS.docs().map((a) => a.id) }];
    if (loc === 'pictures') {
      return OS.sites().filter((a) => a.shots && a.shots.length)
        .map((a) => ({ h: 'Screenshots · ' + a.title, items: a.shots.map((_, i) => `pic:${a.id}:${i}`) }));
    }
    if (loc === 'thispc') {
      return [
        { h: 'Folders', items: ['loc:desktop', 'loc:documents', 'loc:pictures', 'loc:projects'] },
        { h: 'Devices and drives', items: ['drive:c'] },
      ];
    }
    if (loc === 'recycle') return [{ h: null, items: OS.recycledList() }];
    return [];
  }
  const countIn = (loc) => locItems(loc).reduce((n, s) => n + s.items.length, 0);
  function newest(list) {
    return list.map((a) => a.updated || '').sort().pop() || '';
  }
  function describe(t) {
    if (t.startsWith('pic:')) {
      const [, id, i] = t.split(':');
      const a = APPS.get(id);
      const shot = a && a.shots[+i];
      if (!shot) return null;
      const name = `${id}-${+i + 1}.${(shot.src.split('.').pop() || 'png')}`;
      return { t, title: name, pic: shot, app: null, picApp: a, picIndex: +i, icon: () => icon('photos'), type: (name.split('.').pop() || '').toUpperCase() + ' File', sub: shot.caption, date: a.updated || '', open: () => OS.openPhotos(id, +i) };
    }
    if (t === 'drive:c') {
      return { t, title: 'Local Disk (C:)', drive: true, loc: 'projects', folder: true, icon: () => icon('driveIc'), type: 'Local Disk', sub: '' };
    }
    if (t.startsWith('loc:')) {
      const loc = t.slice(4);
      const info = locInfo(loc);
      return info && { t, title: info.title, folder: true, loc, icon: () => icon(info.icon), type: 'Folder', sub: plural(countIn(loc), 'item'), date: loc === 'projects' ? newest(OS.sites()) : '' };
    }
    if (t.startsWith('group:')) {
      const g = GROUPS.get(t.slice(6));
      if (!g) return null;
      const m = OS.groupMembers(g.id);
      return { t, title: g.title, folder: true, loc: t, group: g, icon: () => groupIcon(g), type: 'File folder', sub: plural(m.length, 'item'), date: newest(m) };
    }
    const a = APPS.get(t);
    if (!a) return null;
    if (a.app === 'explorer') return { t, title: a.title, folder: true, loc: a.location || 'home', app: a, icon: () => appIcon(a), type: 'System folder', sub: '', date: '' };
    const sub = a.kind === 'site' ? (a.updated ? 'Updated ' + fmtDate(a.updated) : '') : '';
    return { t, title: a.title, app: a, icon: () => appIcon(a), type: a.typeLabel, sub, date: a.updated || '' };
  }
  function searchAll(q) {
    const s = q.toLowerCase();
    const hit = (x) => [x.title, x.id, x.description, ...(x.stack || [])].some((v) => v && String(v).toLowerCase().includes(s));
    return [
      ...[...GROUPS.values()].filter(hit).map((g) => 'group:' + g.id),
      ...[...APPS.values()].filter(hit).map((a) => a.id),
    ];
  }
  const VIEWS = [['large', 'viewLarge', 'Large icons'], ['tiles', 'viewTiles', 'Tiles'], ['details', 'viewDetails', 'Details']];
  const defaultView = (loc) => (loc === 'projects' || loc === 'pictures' || loc.startsWith('group:') ? 'large' : loc === 'recycle' ? 'details' : 'tiles');
  /* A pretend disk: 476 GB, mostly free, with the portfolio's real size counted in. */
  function driveUsage() {
    const real = Object.values(OS.manifest || {}).reduce((n, m) => n + (m.bytes || 0), 0);
    const total = 476 * 1024 ** 3, used = 131.4 * 1024 ** 3 + real;
    return { total, used, free: total - used };
  }

  OS.APPDEFS.explorer = {
    size: [1000, 620],
    mount(w, spec) {
      const st = { loc: locInfo(spec.location || 'home') ? spec.location || 'home' : 'home', back: [], fwd: [], sel: null, q: '', sort: null };
      const root = el('div', { class: 'ex' });
      w.body.append(root);
      let filesEl, detailsEl, statusEl, viewBtns;
      const viewOf = () => store.get('exview:' + st.loc, defaultView(st.loc));

      const go = (loc, push = true) => {
        if (!locInfo(loc)) return;
        if (push && loc !== st.loc) { st.back.push(st.loc); st.fwd = []; }
        st.loc = loc;
        st.sel = null;
        st.q = '';
        w.key = 'loc:' + loc;
        render();
      };
      w.onRelaunch = (s) => { if (s.location && s.location !== st.loc) go(s.location); };
      const openItem = (d) => (d.open ? d.open() : st.loc === 'recycle' ? OS.properties(d.t) : d.folder ? go(d.loc) : OS.launch(d.t));
      const menuFor = (d) => {
        if (st.loc === 'recycle') {
          return [{ label: 'Restore', icon: 'restore', bold: true, action: () => OS.restoreItem(d.t) }, { sep: true }, { label: 'Properties', icon: 'props', action: () => OS.properties(d.t) }];
        }
        if (d.pic) return [{ label: 'Open', icon: 'chevR', bold: true, action: d.open }, { label: 'Open app', icon: 'play', action: () => OS.launch(d.picApp.id) }];
        if (d.drive) return [{ label: 'Open', icon: 'chevR', bold: true, action: () => go('projects') }, { sep: true }, { label: 'Properties', icon: 'props', action: () => OS.properties('drive:c') }];
        if (d.t.startsWith('loc:')) return [{ label: 'Open', icon: 'chevR', bold: true, action: () => openItem(d) }, { label: 'Open in new window', icon: 'external', action: () => OS.openWindow({ key: 'loc:' + d.loc + ':' + Date.now(), app: 'explorer', location: d.loc }) }];
        return OS.itemMenu(d.t, () => openItem(d));
      };
      const select = (t) => {
        st.sel = t;
        filesEl.querySelectorAll('[data-t]').forEach((n) => n.classList.toggle('sel', n.dataset.t === t));
        renderDetails();
        renderStatus();
      };

      function render() {
        const info = locInfo(st.loc);
        w.setTitle(info.title);
        w.setIcon(() => (info.group ? groupIcon(info.group) : icon(info.icon)));

        const crumbs = el('div', { class: 'addr', role: 'navigation', 'aria-label': 'Location' });
        info.path.forEach((p, i) => {
          const pi = locInfo(p);
          if (i) crumbs.append(glyph('chevR', 'sep'));
          crumbs.append(el('button', { class: 'crumb', onclick: () => go(p) }, pi.title));
        });
        const search = el('label', { class: 'ex-search' }, glyph('search'),
          el('input', { id: 'ex-q-' + w.id, type: 'search', placeholder: 'Search', 'aria-label': 'Search', value: st.q, autocomplete: 'off',
            oninput: (e) => { st.q = e.target.value.trim(); st.sel = null; renderFiles(); renderDetails(); renderStatus(); } }));
        viewBtns = el('div', { class: 'ex-views', role: 'group', 'aria-label': 'View' });
        const cmd = (g, label, fn, extra = {}) => {
          const b = el('button', { class: 'cmd' + (extra.cls ? ' ' + extra.cls : ''), disabled: !!extra.disabled, title: extra.title || null }, glyph(g), label ? el('span', {}, label) : null, extra.drop ? glyph('chevD', 'sm') : null);
          b.addEventListener('click', (e) => fn(b, e));
          return b;
        };
        const dropAt = (b, items) => { const r = b.getBoundingClientRect(); OS.contextMenu(r.left, r.bottom + 4, items); };
        const sortMenu = (b) => dropAt(b, [['name', 'Name'], ['date', 'Date modified'], ['type', 'Type'], ['size', 'Size']].map(([k, l]) => ({
          label: l, check: !!(st.sort && st.sort.key === k), action: () => { st.sort = { key: k, dir: st.sort && st.sort.key === k ? -st.sort.dir : k === 'date' || k === 'size' ? -1 : 1 }; renderFiles(); },
        })));
        const viewMenu = (b) => dropAt(b, VIEWS.map(([id, g, l]) => ({ label: l, icon: g, check: viewOf() === id, action: () => { store.set('exview:' + st.loc, id); syncViewBtns(); renderFiles(); } })));
        const isBin = st.loc === 'recycle';
        const sel = () => (st.sel ? describe(st.sel) : null);
        const cmdbar = el('div', { class: 'ex-cmd', role: 'toolbar', 'aria-label': 'Commands' },
          isBin
            ? [cmd('trash', 'Empty Recycle Bin', () => OS.emptyBin(), { disabled: !OS.recycledList().length }),
               cmd('restore', 'Restore all items', () => OS.recycledList().forEach(OS.restoreItem), { disabled: !OS.recycledList().length }),
               el('span', { class: 'cmd-sep' })]
            : [cmd('newfile', 'New', (b) => dropAt(b, [{ label: 'Text Document', icon: 'newfile', action: () => OS.openWindow({ key: 'notepad:' + Date.now(), app: 'notepad' }) }]), { drop: true }),
               el('span', { class: 'cmd-sep' }),
               cmd('copy', '', () => { const d = sel(); if (d && d.app && d.app.url) OS.copyText(d.app.url, 'Link'); }, { title: 'Copy link', disabled: false }),
               cmd('share', '', () => { const d = sel(); if (d && d.app && d.app.url) OS.copyText(d.app.url, 'Link'); }, { title: 'Share' }),
               cmd('trash', '', () => { const d = sel(); if (d) OS.recycle(d.t); }, { title: 'Delete' }),
               el('span', { class: 'cmd-sep' })],
          cmd('sort', 'Sort', sortMenu, { drop: true }),
          cmd('viewLarge', 'View', viewMenu, { drop: true }),
          el('span', { class: 'cmd-fill' }),
          cmd('props', 'Details', () => { const on = !root.classList.contains('no-details'); root.classList.toggle('no-details', on); store.set('exdetails', !on); }, { cls: 'details-toggle' }));
        if (store.get('exdetails', true) === false) root.classList.add('no-details');
        const toolbar = el('div', { class: 'ex-toolbar' },
          ibtn('arrowL', 'Back', () => { if (st.back.length) { st.fwd.push(st.loc); go(st.back.pop(), false); } }, !st.back.length),
          ibtn('arrowR', 'Forward', () => { if (st.fwd.length) { st.back.push(st.loc); go(st.fwd.pop(), false); } }, !st.fwd.length),
          ibtn('arrowU', 'Up', () => go(parentOf(st.loc)), st.loc === 'home'),
          ibtn('refresh', 'Refresh', () => render()),
          crumbs, search);
        crumbs.title = pathOf(st.loc);

        const nav = el('nav', { class: 'ex-nav', 'aria-label': 'Folders' });
        const navItem = (loc, sub) => {
          const i = locInfo(loc);
          return el('button', { class: 'nav-i' + (sub ? ' sub' : '') + (st.loc === loc ? ' on' : ''), onclick: () => go(loc) },
            i.group ? groupIcon(i.group) : icon(i.icon), el('span', {}, i.title));
        };
        nav.append(navItem('home'), el('hr'), navItem('desktop'), navItem('documents'), navItem('pictures'), navItem('projects'));
        GROUPS.forEach((g) => nav.append(navItem('group:' + g.id, true)));
        nav.append(el('hr'), navItem('thispc'), navItem('recycle'));

        filesEl = el('div', { class: 'ex-files', onclick: (e) => { if (e.target === filesEl || e.target.classList.contains('tiles') || e.target.classList.contains('thumbs')) select(null); } });
        detailsEl = el('aside', { class: 'ex-details', 'aria-label': 'Details' });
        statusEl = el('div', { class: 'ex-status' });
        root.replaceChildren(toolbar, cmdbar, el('div', { class: 'ex-main' }, nav, filesEl, detailsEl), statusEl);
        syncViewBtns();
        renderFiles();
        renderDetails();
        renderStatus();
      }
      function syncViewBtns() { /* views are chosen from the View menu */ }

      function sections() {
        return st.q ? [{ h: `Search results for “${st.q}”`, items: searchAll(st.q) }] : locItems(st.loc);
      }
      function wire(b, d) {
        b.addEventListener('click', () => { select(d.t); if (OS.coarse()) openItem(d); });
        b.addEventListener('dblclick', () => openItem(d));
        b.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); openItem(d); } });
        b.addEventListener('contextmenu', (e) => { e.preventDefault(); select(d.t); OS.contextMenu(e.clientX, e.clientY, menuFor(d)); });
        b.addEventListener('keydown', (e) => { if (e.key === 'Delete' && st.loc !== 'recycle') { e.preventDefault(); OS.recycle(d.t); } });
        return b;
      }
      function tile(d) {
        if (d.drive) {
          const u = driveUsage();
          return wire(el('button', { class: 'tile drive' + (st.sel === d.t ? ' sel' : ''), dataset: { t: d.t }, 'aria-label': d.title },
            d.icon(), el('span', { class: 'meta' }, el('b', {}, d.title),
              el('span', { class: 'bar', role: 'meter', 'aria-valuenow': Math.round((u.used / u.total) * 100), 'aria-valuemin': '0', 'aria-valuemax': '100' }, el('i', { style: { width: (u.used / u.total) * 100 + '%' } })),
              el('small', {}, `${OS.fmtBytes(u.free)} free of ${OS.fmtBytes(u.total)}`))), d);
        }
        return wire(el('button', { class: 'tile' + (st.sel === d.t ? ' sel' : ''), dataset: { t: d.t }, 'aria-label': d.title },
          d.icon(), el('span', { class: 'meta' }, el('b', {}, d.title), el('small', {}, d.type), d.sub ? el('small', {}, d.sub) : null)), d);
      }
      function thumb(d) {
        if (d.drive) return tile(d);
        const a = d.app;
        if (d.pic) {
          return wire(el('button', { class: 'thumb' + (st.sel === d.t ? ' sel' : ''), dataset: { t: d.t }, 'aria-label': d.title },
            el('span', { class: 'th-pic' }, el('img', { src: d.pic.src, alt: '', loading: 'lazy', draggable: 'false' })),
            el('span', { class: 'th-label' }, el('b', {}, d.title))), d);
        }
        const pic = a && a.cover
          ? el('span', { class: 'th-pic' }, el('img', { src: a.cover, alt: '', loading: 'lazy', draggable: 'false' }))
          : el('span', { class: 'th-pic th-ic' }, d.icon());
        return wire(el('button', { class: 'thumb' + (st.sel === d.t ? ' sel' : ''), dataset: { t: d.t }, 'aria-label': d.title },
          pic, el('span', { class: 'th-label' }, a && a.cover ? d.icon() : null, el('b', {}, d.title))), d);
      }
      function sortBy(key) {
        st.sort = st.sort && st.sort.key === key ? { key, dir: -st.sort.dir } : { key, dir: key === 'date' ? -1 : 1 };
        renderFiles();
      }
      function detailsTable(items) {
        let rows = items.slice();
        if (st.sort) {
          const { key, dir } = st.sort;
          const val = (d) => (key === 'name' ? d.title.toLowerCase() : key === 'date' ? d.date || '' : key === 'size' ? sizeBytes(d) : d.type.toLowerCase());
          rows.sort((x, y) => (val(x) < val(y) ? -1 : val(x) > val(y) ? 1 : 0) * dir);
        }
        const hcell = (key, label) => {
          const on = st.sort && st.sort.key === key;
          return el('button', { class: 'dh' + (on ? ' on' : ''), onclick: () => sortBy(key), 'aria-sort': on ? (st.sort.dir > 0 ? 'ascending' : 'descending') : 'none' },
            el('span', {}, label), on ? glyph(st.sort.dir > 0 ? 'chevU' : 'chevD') : null);
        };
        return el('div', { class: 'dlist', role: 'table' },
          el('div', { class: 'drow head', role: 'row' }, hcell('name', 'Name'), hcell('date', 'Date modified'), hcell('type', 'Type'), hcell('size', 'Size')),
          rows.map((d) => wire(el('button', { class: 'drow' + (st.sel === d.t ? ' sel' : ''), role: 'row', dataset: { t: d.t }, 'aria-label': d.title },
            el('span', { class: 'dn' }, d.icon(), el('span', {}, d.title)),
            el('span', { class: 'dd' }, d.date ? fmtDate(d.date) : ''),
            el('span', { class: 'dd' }, d.type),
            el('span', { class: 'dd num' }, sizeBytes(d) >= 0 ? sizeLabel(d) : '')), d)));
      }
      function sizeBytes(d) {
        const m = d.app ? OS.sizeOf(d.app) : null;
        return m ? m.bytes : -1;
      }
      /* Explorer shows sizes in whole KB. */
      const sizeLabel = (d) => Math.max(1, Math.ceil(sizeBytes(d) / 1024)).toLocaleString() + ' KB';
      function renderFiles() {
        filesEl.replaceChildren();
        if (st.sel && !sections().some((x) => x.items.includes(st.sel))) st.sel = null;
        if (st.sort && viewOf() !== 'details') {
          /* Sorting also applies to icon views. */
        }
        const secs = sections().map((s) => ({ ...s, items: s.items.map(describe).filter(Boolean) })).filter((s) => s.items.length);
        if (!secs.length) {
          const msg = st.q ? 'No items match your search.' : st.loc === 'recycle' ? 'Recycle Bin is empty. Every project shipped.' : 'This folder is empty.';
          filesEl.append(el('div', { class: 'empty' }, st.loc === 'recycle' && !st.q ? icon('recycle') : null, el('p', {}, msg)));
          return;
        }
        const view = viewOf();
        if (view === 'details') {
          filesEl.append(detailsTable(secs.flatMap((s) => s.items)));
          return;
        }
        if (st.sort) {
          const { key, dir } = st.sort;
          const val = (d) => (key === 'name' ? d.title.toLowerCase() : key === 'date' ? d.date || '' : key === 'size' ? sizeBytes(d) : d.type.toLowerCase());
          secs.forEach((x) => x.items.sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * dir));
        }
        for (const s of secs) {
          if (s.h) filesEl.append(el('h4', { class: 'ex-h' }, s.h));
          filesEl.append(view === 'large'
            ? el('div', { class: 'thumbs' }, s.items.map(thumb))
            : el('div', { class: 'tiles' }, s.items.map(tile)));
        }
      }
      function renderDetails() {
        detailsEl.replaceChildren();
        const d = st.sel && describe(st.sel);
        if (d && d.pic) {
          detailsEl.append(el('div', { class: 'dt' },
            el('button', { class: 'dt-cover', 'aria-label': 'Open in Photos', onclick: d.open }, el('img', { src: d.pic.src, alt: '', draggable: 'false' })),
            el('h3', { class: 'dt-title' }, d.title), el('div', { class: 'dt-type' }, d.type),
            el('p', { class: 'dt-desc' }, d.pic.caption),
            el('dl', { class: 'kv' }, el('div', {}, el('dt', {}, 'Dimensions'), el('dd', {}, '1280 × 800')), el('div', {}, el('dt', {}, 'From'), el('dd', {}, d.picApp.title))),
            el('div', { class: 'btns' }, el('button', { class: 'btn primary', onclick: d.open }, 'Open in Photos'), el('button', { class: 'btn', onclick: () => OS.launch(d.picApp.id) }, 'Open app'))));
          return;
        }
        if (d && d.drive) {
          const u = driveUsage();
          detailsEl.append(el('div', { class: 'dt' }, el('div', { class: 'dt-ic' }, d.icon()), el('h3', { class: 'dt-title' }, d.title), el('div', { class: 'dt-type' }, 'Local Disk · NTFS'),
            el('span', { class: 'bar wide' }, el('i', { style: { width: (u.used / u.total) * 100 + '%' } })),
            el('dl', { class: 'kv' }, el('div', {}, el('dt', {}, 'Used'), el('dd', {}, OS.fmtBytes(u.used))), el('div', {}, el('dt', {}, 'Free'), el('dd', {}, OS.fmtBytes(u.free))), el('div', {}, el('dt', {}, 'Capacity'), el('dd', {}, OS.fmtBytes(u.total))))));
          return;
        }
        if (d) {
          if (d.group) detailsEl.append(groupDetails(d.group, () => openItem(d)));
          else if (d.app && d.app.kind !== 'builtin') detailsEl.append(appDetails(d.app, { onOpen: () => openItem(d) }));
          else detailsEl.append(el('div', { class: 'dt' }, el('div', { class: 'dt-ic' }, d.icon()), el('h3', { class: 'dt-title' }, d.title), el('div', { class: 'dt-type' }, d.type),
            el('div', { class: 'btns' }, el('button', { class: 'btn primary', onclick: () => openItem(d) }, 'Open'))));
          return;
        }
        const info = locInfo(st.loc);
        if (info.group) { detailsEl.append(groupDetails(info.group)); return; }
        const n = countIn(st.loc);
        detailsEl.append(el('div', { class: 'dt' },
          el('div', { class: 'dt-ic' }, icon(info.icon)),
          el('h3', { class: 'dt-title' }, info.title),
          el('div', { class: 'dt-type' }, plural(n, 'item')),
          st.loc === 'home' ? el('p', { class: 'dt-desc' }, owner.tagline || '') : null,
          el('p', { class: 'dt-note' }, 'Select an item to see its details. Double-click to open it.')));
      }
      function renderStatus() {
        const n = sections().reduce((k, s) => k + s.items.filter((t) => describe(t)).length, 0);
        statusEl.replaceChildren(...[el('span', {}, plural(n, 'item')), st.sel ? el('span', {}, '1 item selected') : null].filter(Boolean));
      }

      w.navigate = go;
      const offs = [OS.on('registry', render), OS.on('desktop', render), OS.on('manifest', () => { if (viewOf() === 'details' || st.loc === 'thispc') renderFiles(); })];
      w.onClose = () => offs.forEach((f) => f());
      render();
    },
  };

  /* =====================================================================
     Project app window (bundled app, or a live website)
     ===================================================================== */
  function spinner() {
    return el('span', { class: 'spin', 'aria-hidden': 'true', html: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>' });
  }
  const NOTES = {
    preview: 'Live view is switched off in this preview. On GitHub Pages the site loads right here in the window.',
    external: 'This site opens in a new tab.',
    blocked: "This app couldn't start inside this page. The live site works in a new tab.",
  };
  function launchCard(a, reason) {
    return el('div', { class: 'launch' }, el('div', { class: 'launch-card' },
      a.cover ? el('div', { class: 'launch-cover' }, el('img', { src: a.cover, alt: '', draggable: 'false' })) : appIcon(a),
      el('div', { class: 'eyebrow' }, a.typeLabel + (a.group && GROUPS.get(a.group) ? ' · ' + GROUPS.get(a.group).title : '')),
      el('h2', {}, a.title),
      a.description ? el('p', {}, a.description) : null,
      a.stack && a.stack.length ? chips(a.stack) : null,
      el('div', { class: 'btns' },
        el('a', { class: 'btn primary', href: a.url, target: '_blank', rel: 'noopener' }, glyph('external'), 'Open live site'),
        a.source ? el('a', { class: 'btn', href: a.source, target: '_blank', rel: 'noopener' }, glyph('code'), 'View source') : null),
      el('p', { class: 'note' }, NOTES[reason] || '')));
  }
  /* Inside a bundled app: links to another project open that project's window;
     links to other websites open in a new tab instead of replacing the app. */
  function wireFrame(frame, a) {
    let doc;
    try { doc = frame.contentDocument; } catch { return; }
    if (!doc) return;
    doc.addEventListener('click', (e) => {
      const lk = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!lk) return;
      const raw = lk.getAttribute('href') || '';
      if (raw.startsWith('#') || /^(javascript|mailto|tel):/i.test(raw)) return;
      const other = OS.findAppByUrl(lk.href);
      if (other && other.id !== a.id) {
        e.preventDefault();
        e.stopPropagation();
        OS.launch(other.id);
        return;
      }
      try {
        if (/^https?:/i.test(lk.href) && new URL(lk.href).origin !== frame.contentWindow.location.origin) {
          lk.target = '_blank';
          lk.rel = 'noopener';
        }
      } catch { /* ignore */ }
    }, true);
  }
  function frameState(frame) {
    try {
      const href = frame.contentWindow.location.href;
      return !href || href === 'about:blank' ? 'loading' : 'ok';
    } catch { return 'blocked'; }
  }

  OS.APPDEFS.site = {
    size: [1180, 740],
    mount(w, spec) {
      const a = spec.ref;
      w.setTitle(a.title);
      w.setIcon(() => appIcon(a));
      w.thumb = a.cover;
      const view = el('div', { class: 'br-view' });
      const info = el('aside', { class: 'br-info', 'aria-label': 'About this app' }, appDetails(a, { showOpen: false }));
      const src = a.run || (a.embed !== false && !OS.PREVIEW ? a.url : null);
      let frame = null, loader = null;

      const fail = (reason) => {
        if (frame) { frame.remove(); frame = null; }
        if (loader) { loader.remove(); loader = null; }
        view.prepend(launchCard(a, reason));
        w.actions.querySelectorAll('[data-needs-frame]').forEach((b) => b.remove());
      };
      if (src) {
        loader = el('div', { class: 'br-load' }, appIcon(a), spinner(), el('span', {}, 'Starting ' + a.title));
        frame = el('iframe', { src, title: a.title, allow: 'fullscreen; autoplay; clipboard-write; xr-spatial-tracking', allowfullscreen: true });
        frame.addEventListener('load', () => {
          if (!frame) return;
          if (a.run) {
            const s = frameState(frame);
            if (s === 'blocked') return fail('blocked');
            if (s === 'loading') return;
            wireFrame(frame, a);
          }
          loader.classList.add('done');
        });
        if (a.run) setTimeout(() => { if (frame && loader && !loader.classList.contains('done') && frameState(frame) === 'blocked') fail('blocked'); }, 12000);
        view.append(frame, loader);
      } else {
        view.append(launchCard(a, OS.PREVIEW ? 'preview' : 'external'));
      }
      view.append(info);

      const infoBtn = w.addAction('info', 'About this app', () => {
        const open = info.classList.toggle('open');
        infoBtn.classList.toggle('on', open);
        infoBtn.setAttribute('aria-pressed', String(open));
      });
      if (frame) {
        w.addAction('refresh', 'Reload', () => {
          if (!frame) return;
          loader.classList.remove('done');
          try { frame.contentWindow.location.reload(); } catch { frame.src = src; }
        }).dataset.needsFrame = '';
        w.addAction('fullscreen', 'Full screen', () => {
          let p = null;
          try { p = frame && frame.requestFullscreen ? frame.requestFullscreen() : null; } catch { p = null; }
          if (p && p.catch) p.catch(() => OS.setMax(w, true));
          else if (!p) OS.setMax(w, true);
        }).dataset.needsFrame = '';
      }
      w.addAction('external', 'Open live site in new tab', null, { href: a.url });
      w.body.append(view);
    },
  };

  /* =====================================================================
     Properties dialog (right-click → Properties)
     ===================================================================== */
  OS.APPDEFS.properties = {
    size: [380, 520],
    fixed: true,
    mount(w, spec) {
      const t = spec.target;
      const r = OS.resolve(t);
      const isDrive = t === 'drive:c';
      const name = isDrive ? 'Local Disk (C:)' : r ? r.title : t;
      w.setTitle(name + ' Properties');
      w.setIcon(() => icon('props'));
      const a = r && r.type === 'app' ? r.app : null;
      const g = r && r.type === 'group' ? r.group : null;
      const desk = OS.desktopList().includes(t);
      const binned = OS.recycledList().includes(t);
      const shortcut = a && a.kind !== 'doc' && a.id !== 'recycle' && desk;
      let type, loc;
      if (isDrive) type = 'Local Disk';
      else if (g) type = 'File folder';
      else if (!a) type = '';
      else if (a.kind === 'doc') type = 'Text Document (.txt)';
      else if (a.id === 'recycle') type = 'System folder';
      else if (shortcut || binned) type = 'Shortcut (.lnk)';
      else type = a.kind === 'site' ? 'Application' : 'App';
      if (binned) loc = 'Recycle Bin';
      else if (desk) loc = pathOf('desktop');
      else if (a && a.group && GROUPS.has(a.group)) loc = pathOf('group:' + a.group);
      else if (a && a.kind === 'site') loc = pathOf('projects');
      else if (a && a.kind === 'doc') loc = pathOf('documents');
      else loc = 'C:\\Windows\\System32';
      const m = a ? OS.sizeOf(a) : null;
      let size = m ? `${OS.fmtBytes(m.bytes)} (${m.bytes.toLocaleString()} bytes)` : '';
      let contains = m && m.files > 1 ? `${m.files} files` : '';
      if (g) {
        const members = OS.groupMembers(g.id);
        const total = members.reduce((n, x) => n + ((OS.sizeOf(x) || {}).bytes || 0), 0);
        size = total ? `${OS.fmtBytes(total)} (${total.toLocaleString()} bytes)` : '';
        contains = OS.plural(members.length, 'app');
      }
      const date = a && a.updated ? OS.toDate(a.updated).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : '';
      const field = (label, value) => (value ? el('div', { class: 'pr-row' }, el('span', {}, label), el('span', { class: 'pr-v' }, value)) : null);
      const tabs = el('div', { class: 'pr-tabs', role: 'tablist' }, el('button', { class: 'on', role: 'tab', 'aria-selected': 'true' }, 'General'),
        shortcut ? el('button', { role: 'tab', 'aria-selected': 'false', disabled: true }, 'Shortcut') : null,
        el('button', { role: 'tab', 'aria-selected': 'false', disabled: true }, 'Details'));
      let top;
      if (isDrive) {
        const used = 131.4 * 1024 ** 3 + Object.values(OS.manifest || {}).reduce((n, x) => n + (x.bytes || 0), 0), total = 476 * 1024 ** 3;
        const pct = used / total;
        top = [el('div', { class: 'pr-head' }, icon('driveIc'), el('input', { class: 'pr-name', id: 'pr-n-' + w.id, value: 'Local Disk', readonly: true, 'aria-label': 'Name' })),
          el('hr'), field('Type:', 'Local Disk'), field('File system:', 'NTFS'), el('hr'),
          field('Used space:', OS.fmtBytes(used)), field('Free space:', OS.fmtBytes(total - used)), el('hr'), field('Capacity:', OS.fmtBytes(total)),
          el('div', { class: 'pr-pie', style: { '--p': pct * 360 + 'deg' }, 'aria-hidden': 'true' }), el('div', { class: 'pr-c' }, 'Drive C:')];
      } else {
        const ic = r ? (r.type === 'group' ? OS.groupIcon(r.group) : t === 'recycle' ? icon(OS.recycledList().length ? 'recycleFull' : 'recycle') : appIcon(a)) : icon('textfile');
        top = [el('div', { class: 'pr-head' }, ic, el('input', { class: 'pr-name', id: 'pr-n-' + w.id, value: name, readonly: true, 'aria-label': 'Name' })),
          el('hr'),
          field('Type:', type),
          a && a.kind === 'site' ? field('Description:', a.typeLabel === 'Application' ? a.title : a.typeLabel) : null,
          field('Location:', loc),
          a && a.url ? field(a.run ? 'Source:' : 'Target:', el('a', { href: a.source || a.url, target: '_blank', rel: 'noopener' }, OS.prettyUrl(a.source || a.url))) : null,
          a && a.url && a.run ? field('Live site:', el('a', { href: a.url, target: '_blank', rel: 'noopener' }, OS.prettyUrl(a.url))) : null,
          (size || contains) ? el('hr') : null,
          field('Size:', size),
          field('Contains:', contains),
          date ? el('hr') : null,
          field('Modified:', date),
          a && a.stack && a.stack.length ? field('Built with:', a.stack.join(', ')) : null,
          el('hr'),
          el('div', { class: 'pr-row' }, el('span', {}, 'Attributes:'), el('span', { class: 'pr-v pr-attr' },
            el('label', {}, el('input', { type: 'checkbox', id: 'pr-ro-' + w.id, checked: true, disabled: true }), ' Read-only'),
            el('label', {}, el('input', { type: 'checkbox', id: 'pr-h-' + w.id, disabled: true }), ' Hidden')))];
      }
      const btns = el('div', { class: 'pr-btns' },
        el('button', { class: 'btn primary', onclick: () => OS.close(w) }, 'OK'),
        el('button', { class: 'btn', onclick: () => OS.close(w) }, 'Cancel'),
        el('button', { class: 'btn', disabled: true }, 'Apply'));
      w.body.append(el('div', { class: 'pr' }, tabs, el('div', { class: 'pr-body' }, top.filter(Boolean)), btns));
      w.node.addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); OS.close(w); } });
      const off = OS.on('manifest', () => { OS.close(w); OS.properties(t); });
      w.onClose = off;
    },
  };

  /* =====================================================================
     Notepad
     ===================================================================== */
  OS.APPDEFS.notepad = {
    size: [720, 540],
    mount(w, spec) {
      const doc = spec.ref && spec.ref.kind === 'doc' ? spec.ref : null;
      let name = doc ? doc.title : 'Untitled';
      let zoom = 100;
      let wrap = true;
      w.setTitle(name + ' - Notepad');
      w.setIcon(() => icon('notepad'));

      const ta = el('textarea', { class: 'np-text', id: 'np-' + w.id, spellcheck: 'false', 'aria-label': 'Text' });
      ta.value = doc ? doc.text : '';
      const pos = el('span', {}, 'Ln 1, Col 1');
      const zoomEl = el('span', {}, '100%');
      const update = () => {
        const lines = ta.value.slice(0, ta.selectionStart).split('\n');
        pos.textContent = `Ln ${lines.length}, Col ${lines[lines.length - 1].length + 1}`;
      };
      const setZoom = (z) => { zoom = Math.max(50, Math.min(300, z)); ta.style.fontSize = (14 * zoom) / 100 + 'px'; zoomEl.textContent = zoom + '%'; };
      ['input', 'click', 'keyup', 'select'].forEach((ev) => ta.addEventListener(ev, update));
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'F5') { e.preventDefault(); insertDate(); }
        if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(zoom + 10); }
        if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); setZoom(zoom - 10); }
      });
      function insertDate() {
        const now = new Date();
        const s = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' ' + now.toLocaleDateString();
        ta.setRangeText(s, ta.selectionStart, ta.selectionEnd, 'end');
        update();
      }
      async function copySel() {
        const s = ta.value.slice(ta.selectionStart, ta.selectionEnd) || ta.value;
        try { await navigator.clipboard.writeText(s); OS.toast({ title: 'Copied', body: 'Text copied to the clipboard.', iconName: 'notepad' }); }
        catch { ta.focus(); ta.select(); }
      }
      const menu = (label, items) => {
        const b = el('button', { class: 'np-m' }, label);
        b.addEventListener('click', () => { const r = b.getBoundingClientRect(); OS.contextMenu(r.left, r.bottom + 4, items()); });
        return b;
      };
      const bar = el('div', { class: 'np-menu' },
        menu('File', () => [
          { label: 'New', action: () => { ta.value = ''; name = 'Untitled'; w.setTitle(name + ' - Notepad'); update(); ta.focus(); } },
          { sep: true },
          { label: 'Close', action: () => OS.close(w) },
        ]),
        menu('Edit', () => [
          { label: 'Select all', action: () => { ta.focus(); ta.select(); } },
          { label: 'Copy', icon: 'copy', action: copySel },
          { label: 'Time/Date  (F5)', action: () => { ta.focus(); insertDate(); } },
        ]),
        menu('View', () => [
          { label: 'Zoom in', action: () => setZoom(zoom + 10) },
          { label: 'Zoom out', action: () => setZoom(zoom - 10) },
          { label: 'Restore default zoom', action: () => setZoom(100) },
          { sep: true },
          { label: (wrap ? '✓ ' : '') + 'Word wrap', action: () => { wrap = !wrap; ta.classList.toggle('nowrap', !wrap); } },
        ]));
      const status = el('div', { class: 'np-status' }, pos, zoomEl, el('span', {}, 'Windows (CRLF)'), el('span', {}, 'UTF-8'));
      w.body.append(el('div', { class: 'np' }, bar, ta, status));
      setTimeout(() => { ta.setSelectionRange(0, 0); }, 0);
    },
  };

  /* =====================================================================
     Terminal
     ===================================================================== */
  OS.APPDEFS.terminal = {
    size: [780, 480],
    mount(w) {
      w.setTitle('Terminal');
      w.setIcon(() => icon('terminal'));
      const user = owner.handle || 'guest';
      const psText = `PS C:\\Users\\${user}> `;
      const out = el('div', { class: 'tm-out', role: 'log', 'aria-live': 'polite' });
      const input = el('input', { class: 'tm-in', id: 'tm-' + w.id, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Command' });
      const scroller = el('div', { class: 'tm-scroll' }, out, el('div', { class: 'tm-line' }, el('span', { class: 'tm-ps' }, psText), input));
      const tabs = el('div', { class: 'tm-tabs' }, el('div', { class: 'tm-tab' }, icon('terminal'), el('span', {}, 'PowerShell')));
      w.body.append(el('div', { class: 'tm' }, tabs, scroller));
      scroller.addEventListener('mouseup', () => { if (!getSelection().toString()) input.focus(); });

      const print = (text, cls) => { out.append(el('div', { class: 'tm-l' + (cls ? ' ' + cls : '') }, text)); scroller.scrollTop = scroller.scrollHeight; };
      const history = [];
      let hi = 0;
      const sysName = (CFG.system && CFG.system.name) || 'Portfolio';
      const version = (CFG.system && CFG.system.version) || '';
      print(`${sysName} Terminal\nType "help" to see what you can do here.\n`, 'dim');

      function findTarget(q) {
        const s = q.toLowerCase().trim().replace(/^["']|["']$/g, '');
        if (!s) return null;
        const all = [
          ...[...GROUPS.values()].map((g) => ({ t: 'group:' + g.id, id: g.id, title: g.title })),
          ...[...APPS.values()].map((a) => ({ t: a.id, id: a.id, title: a.title })),
        ];
        return all.find((x) => x.id.toLowerCase() === s || x.title.toLowerCase() === s)
          || all.find((x) => x.title.toLowerCase().startsWith(s) || x.id.toLowerCase().startsWith(s))
          || all.find((x) => x.title.toLowerCase().includes(s));
      }
      function dateCol(iso) {
        if (!iso) return ''.padStart(10);
        return OS.toDate(iso).toLocaleDateString('en-US').padStart(10);
      }
      function ls(arg) {
        let title = 'Projects';
        let rows = [];
        const g = arg ? findTarget(arg) : null;
        if (g && g.t.startsWith('group:')) {
          title = 'Projects\\' + g.title;
          rows = OS.groupMembers(g.id).map((a) => ['-a---', dateCol(a.updated), a.title]);
        } else {
          rows = [
            ...[...GROUPS.values()].map((x) => ['d----', dateCol(newest(OS.groupMembers(x.id))), x.title]),
            ...ungroupedSites().map((a) => ['-a---', dateCol(a.updated), a.title]),
          ];
        }
        print(`\n    Directory: C:\\Users\\${user}\\${title}\n\nMode          LastWriteTime  Name\n----          -------------  ----\n` +
          rows.map((r) => `${r[0]}           ${r[1]}   ${r[2]}`).join('\n') + '\n');
      }
      const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7); };
      const cmds = {
        help: () => print(
`Commands
  ls, dir [folder]   List projects, or the contents of a folder
  open <name>        Open an app, project or folder (also: start)
  cat <name>         Show a document, or a project's description
  git log            Recent project updates
  neofetch           System information
  theme <mode>       light, dark or system
  whoami, date, echo, history
  clear, cls         Clear the screen
  exit               Close this window`),
        ls: (arg) => ls(arg),
        dir: (arg) => ls(arg),
        projects: () => ls(''),
        open: (arg) => {
          const t = findTarget(arg);
          if (!t) return print(`Nothing called "${arg}" was found. Try "ls".`, 'err');
          print(`Opening ${t.title}…`, 'hi');
          OS.launch(t.t);
        },
        start: (arg) => cmds.open(arg),
        cat: (arg) => {
          const t = findTarget(arg);
          const a = t && APPS.get(t.t);
          if (!a) return print(`cat : Cannot find path '${arg}' because it does not exist.`, 'err');
          if (a.kind === 'doc') return print(a.text);
          print([a.title, a.description || '', a.stack ? 'Built with ' + a.stack.join(', ') : '', a.url ? a.url : ''].filter(Boolean).join('\n'));
        },
        type: (arg) => cmds.cat(arg),
        git: (arg) => {
          if (!/^log\b/.test(arg || '')) return print('Only "git log" works here.', 'err');
          const rows = OS.sites().filter((a) => a.updated).sort(OS.byUpdated);
          print(rows.map((a) => `${hash(a.id + a.updated)}  ${OS.fmtDate(a.updated).padEnd(13)} ${a.id}`).join('\n'));
        },
        neofetch: () => {
          const logo = [
            '   .-----------.  ',
            '   |     /\\     |  ',
            '   |    /  \\    |  ',
            '   |___/    \\___|  ',
            "   '-----------'  ",
            '                  ',
            '                  ',
          ];
          const info = [
            `${user}@${sysName}`,
            '-'.repeat(user.length + sysName.length + 1),
            `OS        ${sysName} ${version}`,
            `Apps      ${plural(OS.sites().length, 'project')}, ${plural([...APPS.values()].filter((a) => a.kind === 'builtin').length, 'built-in app')}`,
            `Theme     ${OS.isDark() ? 'Dark' : 'Light'}, ${(OS.ACCENTS.find((x) => x.id === OS.prefs.accent) || {}).name || ''}`,
            `Tools     ${(owner.tools || []).slice(0, 4).join(', ')}`,
            `GitHub    ${prettyUrl(owner.github || '')}`,
          ];
          print(info.map((l, i) => (logo[i] || ''.padEnd(18)) + l).join('\n'), 'hi');
        },
        about: () => cmds.neofetch(),
        whoami: () => print(`portfolio\\${user}`),
        theme: (arg) => {
          const m = (arg || '').toLowerCase();
          if (!['light', 'dark', 'system'].includes(m)) return print('Usage: theme light | dark | system', 'err');
          OS.setPref('theme', m);
          print(`Theme set to ${m}.`, 'hi');
        },
        date: () => print(new Date().toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })),
        'get-date': () => cmds.date(),
        echo: (arg) => print(arg || ''),
        history: () => print(history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n') || ''),
        sudo: () => print(`${user} is not in the sudoers file. This incident will be reported.`, 'err'),
        clear: () => out.replaceChildren(),
        cls: () => out.replaceChildren(),
        exit: () => OS.close(w),
      };
      function run(line) {
        print(psText + line);
        const trimmed = line.trim();
        if (!trimmed) return;
        history.push(trimmed);
        hi = history.length;
        const [cmd, ...rest] = trimmed.split(/\s+/);
        const fn = cmds[cmd.toLowerCase()];
        if (fn) fn(rest.join(' '));
        else print(`${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.\nType "help" to see the available commands.`, 'err');
      }
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { const v = input.value; input.value = ''; run(v); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) { hi--; input.value = history[hi]; } }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (hi < history.length) { hi++; input.value = history[hi] || ''; } }
        else if (e.key === 'Tab') {
          e.preventDefault();
          const [c, ...r] = input.value.split(' ');
          if (!r.length) {
            const m = Object.keys(cmds).find((k) => k.startsWith(c.toLowerCase()));
            if (m) input.value = m + ' ';
          } else {
            const t = findTarget(r.join(' '));
            if (t) input.value = c + ' ' + t.id;
          }
        }
        else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.replaceChildren(); }
      });
      setTimeout(() => input.focus({ preventScroll: true }), 60);
    },
  };

  /* =====================================================================
     Settings
     ===================================================================== */
  OS.APPDEFS.settings = {
    size: [960, 640],
    mount(w, spec) {
      w.setTitle('Settings');
      w.setIcon(() => icon('settings'));
      let section = (spec && spec.section) || 'personalization';
      const sysName = (CFG.system && CFG.system.name) || 'Portfolio';
      const nav = el('nav', { class: 'set-nav', 'aria-label': 'Settings' });
      const content = el('div', { class: 'set-content' });
      w.body.append(el('div', { class: 'set' }, nav, content));
      w.onRelaunch = (s) => { if (s.section && s.section !== section) { section = s.section; renderNav(); renderContent(); } };

      const SECTIONS = [
        ['personalization', 'Personalization', 'sun'],
        ['apps', 'Apps', 'apps'],
        ['about', 'About', 'info'],
      ];
      function renderNav() {
        nav.replaceChildren(
          el('div', { class: 'set-me' }, el('span', { class: 'avatar' }, (owner.name || '?').slice(0, 1).toUpperCase()),
            el('span', { class: 'meta' }, el('b', {}, owner.name || ''), el('small', {}, 'Portfolio owner'))),
          ...SECTIONS.map(([id, label, g]) => el('button', { class: 'nav-i' + (section === id ? ' on' : ''), onclick: () => { section = id; renderNav(); renderContent(); } }, glyph(g), el('span', {}, label))));
      }
      const row = (title, desc, control) => el('div', { class: 'set-row' }, el('div', { class: 'set-label' }, el('b', {}, title), desc ? el('small', {}, desc) : null), control);
      const wallThumb = (id, cls) => el('span', { class: cls + ' wallbg fixed-wall', dataset: { wall: id }, html: OS.traceSVG() });

      function renderContent() {
        const P = OS.prefs;
        if (section === 'personalization') {
          const modes = el('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Mode' },
            [['light', 'Light'], ['dark', 'Dark'], ['system', 'Match system']].map(([v, l]) =>
              el('button', { class: P.theme === v ? 'on' : '', role: 'radio', 'aria-checked': String(P.theme === v), onclick: () => OS.setPref('theme', v) }, l)));
          const sw = el('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'Accent color' },
            OS.ACCENTS.map((a) => el('button', { class: 'swatch' + (P.accent === a.id ? ' on' : ''), role: 'radio', 'aria-checked': String(P.accent === a.id), title: a.name, 'aria-label': a.name,
              style: { '--sw-l': a.light, '--sw-d': a.dark }, onclick: () => OS.setPref('accent', a.id) })));
          const walls = el('div', { class: 'walls', role: 'radiogroup', 'aria-label': 'Background' },
            OS.WALLS.map((x) => el('button', { class: 'wall-pick' + (P.wall === x.id ? ' on' : ''), role: 'radio', 'aria-checked': String(P.wall === x.id), onclick: () => OS.setPref('wall', x.id) },
              wallThumb(x.id, 'wthumb'), el('span', {}, x.name))));
          const preview = wallThumb(P.wall, 'set-preview');
          preview.append(el('div', { class: 'mini-win' }, el('i'), el('i'), el('i')));
          content.replaceChildren(
            el('h1', {}, 'Personalization'),
            el('div', { class: 'set-hero' }, preview,
              el('div', {}, el('b', {}, sysName), el('small', {}, 'Changes apply right away and are remembered in this browser.'))),
            el('div', { class: 'set-card' },
              row('Choose your mode', 'Light or dark windows, taskbar and menus', modes),
              row('Accent color', 'Used for highlights, buttons and the taskbar', sw)),
            el('div', { class: 'set-card' }, row('Background', 'Desktop wallpaper', null), walls),
            el('div', { class: 'set-card' }, row('Desktop', 'Puts icons, pins and anything you deleted back the way they were.',
              el('button', { class: 'btn', onclick: () => OS.resetDesktop() }, 'Reset desktop'))));
        } else if (section === 'apps') {
          const all = [...APPS.values()].sort((a, b) => a.title.localeCompare(b.title));
          const label = (a) => [a.run ? 'Runs from this site' : a.typeLabel, a.group && GROUPS.get(a.group) ? GROUPS.get(a.group).title : null, a.discovered ? 'Found on GitHub' : null].filter(Boolean).join(' · ');
          content.replaceChildren(
            el('h1', {}, 'Installed apps'),
            el('p', { class: 'set-sub' }, `${plural(all.length, 'app')} · ${plural(OS.sites().length, 'project')}`),
            el('div', { class: 'set-card list' }, all.map((a) => el('div', { class: 'set-app' },
              appIcon(a),
              el('div', { class: 'set-label' }, el('b', {}, a.title), el('small', {}, label(a))),
              el('button', { class: 'btn', onclick: () => OS.launch(a.id) }, 'Open')))));
        } else {
          const kv = [
            ['Device name', `${owner.handle || owner.name || ''}-PC`],
            ['Edition', `${sysName} Portfolio`],
            ['Version', version()],
            ['Projects', String(OS.sites().length)],
            ['Built with', 'HTML, CSS and JavaScript. No framework, no build step.'],
          ];
          content.replaceChildren(
            el('h1', {}, 'About'),
            el('div', { class: 'set-card' }, el('h4', { class: 'set-h' }, 'Device specifications'),
              el('dl', { class: 'kv wide' }, kv.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v))))),
            el('div', { class: 'set-card' }, el('h4', { class: 'set-h' }, 'Links'),
              el('div', { class: 'btns' },
                owner.github ? el('a', { class: 'btn', href: owner.github, target: '_blank', rel: 'noopener' }, glyph('code'), 'GitHub profile') : null,
                CFG.system && CFG.system.source ? el('a', { class: 'btn', href: CFG.system.source, target: '_blank', rel: 'noopener' }, glyph('code'), 'Source for this site') : null)));
        }
      }
      function version() { return (CFG.system && CFG.system.version) || '1.0'; }
      renderNav();
      renderContent();
      let lastPrefs = '';
      const off1 = OS.on('prefs', () => {
        const key = [OS.prefs.theme, OS.prefs.accent, OS.prefs.wall].join();
        if (section === 'personalization' && key !== lastPrefs) renderContent();
        lastPrefs = key;
      });
      const off2 = OS.on('registry', () => { if (section !== 'personalization') renderContent(); });
      w.onClose = () => { off1(); off2(); };
    },
  };
})();
