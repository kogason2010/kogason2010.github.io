/* Showcase (the portfolio's front page, styled like an app store) and Photos (screenshot viewer). */
(function () {
  'use strict';
  const OS = window.OS;
  const { el, glyph, icon, appIcon, fmtDate, prettyUrl, plural, CFG, APPS, GROUPS } = OS;
  const owner = CFG.owner || {};

  const groupOf = (a) => (a.group && GROUPS.get(a.group)) || null;
  const metaLine = (a) => [groupOf(a) ? groupOf(a).title : a.typeLabel, a.updated ? 'Updated ' + fmtDate(a.updated) : null].filter(Boolean).join(' · ');
  const img = (src, cls) => el('img', { class: cls || null, src, alt: '', loading: 'lazy', draggable: 'false' });

  /* =====================================================================
     Showcase
     ===================================================================== */
  OS.APPDEFS.showcase = {
    size: [1140, 760],
    mount(w, spec) {
      w.setTitle('Showcase');
      w.setIcon(() => icon('showcase'));
      const scroller = el('div', { class: 'sc' });
      w.body.append(scroller);
      let page = spec.project || null;
      const show = (id) => { page = id; render(); scroller.scrollTop = 0; };
      w.onRelaunch = (s) => { if (s.project) show(s.project); };

      function card(a) {
        const b = el('button', { class: 'sc-card', 'aria-label': a.title, onclick: () => show(a.id) },
          a.cover ? el('span', { class: 'sc-cover' }, img(a.cover)) : el('span', { class: 'sc-cover sc-cover-empty' }, appIcon(a)),
          el('span', { class: 'sc-body' },
            el('span', { class: 'sc-name' }, appIcon(a), el('b', {}, a.title)),
            el('small', {}, metaLine(a)),
            a.description ? el('span', { class: 'sc-desc' }, a.description) : null));
        b.addEventListener('contextmenu', (e) => { e.preventDefault(); OS.contextMenu(e.clientX, e.clientY, OS.itemMenu(a.id, () => OS.launch(a.id))); });
        return b;
      }
      function section(title, desc, note, apps) {
        if (!apps.length) return null;
        return el('section', { class: 'sc-sec' },
          el('div', { class: 'sc-sec-h' }, el('h3', {}, title), el('span', { class: 'sc-count' }, plural(apps.length, 'project'))),
          desc ? el('p', { class: 'sc-sec-d' }, desc) : null,
          el('div', { class: 'sc-grid' }, apps.map(card)),
          note ? el('p', { class: 'sc-note' }, note) : null);
      }

      function renderHome() {
        const sites = OS.sites();
        const featured = sites.filter((a) => a.cover).sort(OS.byUpdated)[0] || sites[0];
        w.thumb = featured && featured.cover;
        const intro = el('header', { class: 'sc-intro' },
          el('div', { class: 'sc-intro-t' },
            el('div', { class: 'eyebrow' }, 'Portfolio'),
            el('h1', {}, owner.name || ''),
            owner.tagline ? el('p', {}, owner.tagline) : null,
            owner.tools && owner.tools.length ? OS.chips(owner.tools) : null),
          el('div', { class: 'btns' },
            owner.github ? el('a', { class: 'btn', href: owner.github, target: '_blank', rel: 'noopener' }, glyph('code'), 'GitHub') : null,
            el('button', { class: 'btn', onclick: () => OS.launch('about') }, glyph('info'), 'About me')));
        const hero = featured ? el('section', { class: 'sc-hero' },
          el('div', { class: 'sc-hero-t' },
            el('div', { class: 'eyebrow' }, 'Latest update' + (featured.updated ? ' · ' + fmtDate(featured.updated) : '')),
            el('h2', {}, featured.title),
            featured.description ? el('p', {}, featured.description) : null,
            el('div', { class: 'btns' },
              el('button', { class: 'btn primary', onclick: () => OS.launch(featured.id) }, glyph('play'), 'Open app'),
              el('button', { class: 'btn ghost', onclick: () => show(featured.id) }, 'Details'))),
          featured.cover ? el('div', { class: 'sc-hero-pic' }, img(featured.cover)) : null) : null;

        const groups = [...GROUPS.values()].map((g) => section(g.title, g.description, g.note, OS.groupMembers(g.id).filter((a) => a.kind === 'site')));
        const loose = sites.filter((a) => !groupOf(a));
        scroller.replaceChildren(el('div', { class: 'sc-wrap' },
          intro, hero, groups,
          section(groups.some(Boolean) ? 'More projects' : 'Projects', null, null, loose),
          el('p', { class: 'sc-foot' }, 'Every project here runs as an app on this desktop. The live versions are on GitHub Pages.')));
      }

      function renderProduct(a) {
        if (!a) return renderHome();
        w.thumb = a.cover;
        const g = groupOf(a);
        const siblings = g ? OS.groupMembers(g.id).filter((x) => x.id !== a.id && x.kind === 'site') : [];
        const details = [
          ['Updated', a.updated ? fmtDate(a.updated) : ''],
          ['Folder', g ? g.title : ''],
          ['Live site', a.url ? OS.link(a.url, prettyUrl(a.url)) : ''],
          ['Source', a.source ? OS.link(a.source, a.repo || prettyUrl(a.source)) : ''],
          ['Runs', a.run ? 'Bundled with this portfolio' : 'From the live site'],
        ].filter(([, v]) => v);
        scroller.replaceChildren(el('div', { class: 'sc-wrap' },
          el('div', { class: 'sc-crumbs' }, el('button', { class: 'pill', onclick: () => show(null) }, glyph('chevL'), el('span', {}, 'Showcase'))),
          a.cover ? el('div', { class: 'sc-banner' }, img(a.cover)) : null,
          el('div', { class: 'sc-head' },
            el('div', { class: 'sc-head-ic' }, appIcon(a)),
            el('div', { class: 'sc-head-t' },
              el('h1', {}, a.title),
              el('div', { class: 'sc-meta' }, metaLine(a)),
              el('div', { class: 'btns' },
                el('button', { class: 'btn primary', onclick: () => OS.launch(a.id) }, glyph('play'), 'Open app'),
                a.url ? el('a', { class: 'btn', href: a.url, target: '_blank', rel: 'noopener' }, glyph('external'), 'Live site') : null,
                a.source ? el('a', { class: 'btn', href: a.source, target: '_blank', rel: 'noopener' }, glyph('code'), 'Source') : null))),
          a.shots.length ? el('section', { class: 'sc-sec' },
            el('div', { class: 'sc-sec-h' }, el('h3', {}, 'Screenshots'), el('span', { class: 'sc-count' }, plural(a.shots.length, 'image'))),
            el('div', { class: 'sc-shots' }, a.shots.map((s, i) => el('button', { class: 'sc-shot', onclick: () => OS.openPhotos(a.id, i), 'aria-label': `Open screenshot ${i + 1}: ${s.caption}` },
              img(s.src), el('span', {}, s.caption))))) : null,
          el('div', { class: 'sc-cols' },
            el('section', { class: 'sc-about' },
              el('h3', {}, 'About this project'),
              a.description ? el('p', {}, a.description) : null,
              a.tip ? el('p', { class: 'dt-tip' }, glyph('info'), el('span', {}, a.tip)) : null,
              a.stack && a.stack.length ? el('div', {}, el('h4', {}, 'Built with'), OS.chips(a.stack)) : null,
              g && g.note ? el('p', { class: 'sc-note' }, g.note) : null),
            el('section', { class: 'sc-facts' },
              el('h3', {}, 'Details'),
              el('dl', { class: 'kv' }, details.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))))),
          siblings.length ? el('section', { class: 'sc-sec' },
            el('div', { class: 'sc-sec-h' }, el('h3', {}, 'More in ' + g.title)),
            el('div', { class: 'sc-grid' }, siblings.map(card))) : null));
      }

      function render() { if (page) renderProduct(APPS.get(page)); else renderHome(); OS.emit('windows'); }
      w.onClose = OS.on('registry', render);
      render();
    },
  };

  /* =====================================================================
     Photos
     ===================================================================== */
  OS.APPDEFS.photos = {
    size: [1040, 700],
    mount(w, spec) {
      w.setIcon(() => icon('photos'));
      const root = el('div', { class: 'ph', tabindex: '-1' });
      w.body.append(root);
      let album = spec.album || null;
      let idx = spec.index || 0;
      const albums = () => OS.sites().filter((a) => a.shots && a.shots.length);
      w.onRelaunch = (s) => { if (s.album) { album = s.album; idx = s.index || 0; render(); } };

      function renderGallery() {
        w.setTitle('Photos');
        const list = albums();
        w.thumb = list[0] && list[0].cover;
        root.replaceChildren(el('div', { class: 'ph-gallery' },
          el('div', { class: 'ph-top' }, el('h1', {}, 'Gallery'), el('span', { class: 'sc-count' }, plural(list.reduce((n, a) => n + a.shots.length, 0), 'screenshot'))),
          list.length ? list.map((a) => el('section', { class: 'ph-album' },
            el('div', { class: 'sc-sec-h' }, el('h3', {}, appIcon(a), el('span', {}, a.title)),
              el('button', { class: 'pill', onclick: () => OS.launch(a.id) }, el('span', {}, 'Open app'), glyph('chevR'))),
            el('div', { class: 'ph-grid' }, a.shots.map((s, i) => el('button', { class: 'ph-th', 'aria-label': s.caption, title: s.caption, onclick: () => { album = a.id; idx = i; render(); } }, img(s.src))))))
            : el('p', { class: 'empty' }, 'No screenshots yet.')));
      }
      function renderViewer() {
        const a = APPS.get(album);
        if (!a || !a.shots.length) { album = null; return renderGallery(); }
        idx = (idx + a.shots.length) % a.shots.length;
        const s = a.shots[idx];
        w.setTitle(`${a.title} - Photos`);
        w.thumb = s.src;
        const go = (d) => { idx += d; render(); };
        root.replaceChildren(el('div', { class: 'ph-view' },
          el('div', { class: 'ph-bar' },
            el('button', { class: 'pill', onclick: () => { album = null; render(); } }, glyph('chevL'), el('span', {}, 'Gallery')),
            el('span', { class: 'ph-title' }, appIcon(a), el('b', {}, a.title), el('span', { class: 'ph-n' }, `${idx + 1} of ${a.shots.length}`)),
            el('button', { class: 'btn', onclick: () => OS.launch(a.id) }, glyph('play'), 'Open app')),
          el('div', { class: 'ph-stage' },
            el('img', { src: s.src, alt: s.caption, draggable: 'false' }),
            a.shots.length > 1 ? el('button', { class: 'ph-nav prev', 'aria-label': 'Previous photo', onclick: () => go(-1) }, glyph('chevL')) : null,
            a.shots.length > 1 ? el('button', { class: 'ph-nav next', 'aria-label': 'Next photo', onclick: () => go(1) }, glyph('chevR')) : null),
          el('p', { class: 'ph-cap' }, s.caption),
          el('div', { class: 'ph-film' }, a.shots.map((x, i) => el('button', { class: 'ph-fi' + (i === idx ? ' on' : ''), 'aria-label': x.caption, 'aria-current': i === idx ? 'true' : null, onclick: () => { idx = i; render(); } }, img(x.src))))));
      }
      function render() {
        if (album) renderViewer(); else renderGallery();
        if (OS.WM.active === w && !root.contains(document.activeElement)) root.focus({ preventScroll: true });
        OS.emit('windows');
      }
      w.node.addEventListener('keydown', (e) => {
        if (!album || e.target.closest('input, textarea')) return;
        if (e.key === 'ArrowLeft') { idx--; render(); }
        else if (e.key === 'ArrowRight') { idx++; render(); }
        else if (e.key === 'Escape') { album = null; render(); }
        else return;
        e.preventDefault();
      });
      render();
      setTimeout(() => root.focus({ preventScroll: true }), 50);
    },
  };
})();
