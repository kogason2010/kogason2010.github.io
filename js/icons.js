/* Icon set. App illustrations are 48×48; UI glyphs are 16×16 line icons that use currentColor. */
window.ICONS = (() => {
  const g = (d, vb = 16, sw = 1.2) =>
    `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const folderBackPath = `<path d="M5 12.5A3.5 3.5 0 0 1 8.5 9h10.3c.9 0 1.8.4 2.4 1l2.3 2.4h16A3.5 3.5 0 0 1 43 15.9V36a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36z" fill="#DC9417"/>`;
  const folderFrontPath = (y) =>
    `<path d="M5 ${y + 3.5}A3.5 3.5 0 0 1 8.5 ${y}h31a3.5 3.5 0 0 1 3.5 3.5V36a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36z" fill="#FFC23A"/><path d="M8.5 ${y + 0.8}h31" stroke="#FFDD85" stroke-width="1.2" stroke-linecap="round"/>`;

  return {
    /* ---------- App illustrations ---------- */
    folder: `<svg viewBox="0 0 48 48">${folderBackPath}${folderFrontPath(15)}</svg>`,
    folderBack: `<svg viewBox="0 0 48 48">${folderBackPath}<rect x="10" y="13" width="28" height="14" rx="1.5" fill="#FBFCFD"/></svg>`,
    folderFront: `<svg viewBox="0 0 48 48">${folderFrontPath(23)}</svg>`,
    explorer: `<svg viewBox="0 0 48 48">${folderBackPath}${folderFrontPath(15)}<path d="M5 29h38v7a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36z" fill="#1E9BD7"/></svg>`,
    notepad: `<svg viewBox="0 0 48 48"><rect x="9" y="7" width="30" height="35" rx="3.5" fill="#F3F6FA" stroke="#B4C2D0"/><path d="M12.5 7h23A3.5 3.5 0 0 1 39 10.5V14H9v-3.5A3.5 3.5 0 0 1 12.5 7z" fill="#3E86C9"/><path d="M15 21h18M15 26.5h18M15 32h12" stroke="#8FA2B6" stroke-width="2" stroke-linecap="round"/></svg>`,
    terminal: `<svg viewBox="0 0 48 48"><rect x="5" y="8" width="38" height="32" rx="4" fill="#1D2127" stroke="#3A414A"/><path d="M9 8h30a4 4 0 0 1 4 4v3H5v-3a4 4 0 0 1 4-4z" fill="#2B3139"/><path d="m13 23 6 5-6 5" fill="none" stroke="#63D3FF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 33h11" stroke="#E9EEF4" stroke-width="2.6" stroke-linecap="round"/></svg>`,
    settings: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15.5" fill="none" stroke="#5E6B79" stroke-width="7" stroke-dasharray="5.2 4.53"/><circle cx="24" cy="24" r="13" fill="#7B8A9A"/><circle cx="24" cy="24" r="5.5" fill="#E3E9EF"/></svg>`,
    recycle: `<svg viewBox="0 0 48 48"><path d="M12 15h24l-2.2 24.2A3 3 0 0 1 30.8 42H17.2a3 3 0 0 1-3-2.8z" fill="#BFD9EE" fill-opacity=".6" stroke="#8FB6D4" stroke-width="1.4"/><rect x="9.5" y="10.5" width="29" height="5" rx="2" fill="#DCEBF6" stroke="#8FB6D4" stroke-width="1.4"/><path d="M20 21v15M24 21v15M28 21v15" stroke="#8FB6D4" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    recycleFull: `<svg viewBox="0 0 48 48"><path d="M14.5 17 18 4.5l9.5 2.6L24.5 17z" fill="#FFF3C4" stroke="#B59A3A" stroke-width="1.2" stroke-linejoin="round"/><path d="M19.5 8.6l5 1.4M18.7 11.6l5 1.4" stroke="#C9AE55" stroke-width="1.1" stroke-linecap="round"/><path d="M23 17l7.5-11 8 5.4L33 17z" fill="#D6EBFF" stroke="#4F86BD" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 15h24l-2.2 24.2A3 3 0 0 1 30.8 42H17.2a3 3 0 0 1-3-2.8z" fill="#BFD9EE" fill-opacity=".75" stroke="#8FB6D4" stroke-width="1.4"/><rect x="9.5" y="13.5" width="29" height="4" rx="2" fill="#DCEBF6" stroke="#8FB6D4" stroke-width="1.4"/><path d="M20 22v14M24 22v14M28 22v14" stroke="#8FB6D4" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    pc: `<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="24" rx="3" fill="#2F8FDA"/><rect x="9" y="11" width="30" height="18" rx="1.5" fill="#8FD0FF"/><path d="M19 32h10l1.5 5h-13z" fill="#7A8796"/><rect x="14" y="37" width="20" height="2.5" rx="1.25" fill="#7A8796"/></svg>`,
    driveIc: `<svg viewBox="0 0 48 48"><rect x="5" y="14" width="38" height="22" rx="4" fill="#C9D3DD" stroke="#8C9BAA"/><rect x="5" y="27" width="38" height="9" rx="3" fill="#A9B6C3"/><circle cx="36.5" cy="31.5" r="1.8" fill="#38D27A"/><rect x="9" y="17.5" width="10" height="6" rx="1" fill="#0B6FBF"/><path d="M11 19.5h2.6v1.2H11zm3.4 0H17v1.2h-2.6zM11 21.5h2.6v1.2H11zm3.4 0H17v1.2h-2.6z" fill="#fff"/></svg>`,
    pictures: `<svg viewBox="0 0 48 48"><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9h10.3c.9 0 1.8.4 2.4 1l2.3 2.4h16A3.5 3.5 0 0 1 43 15.9V36a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36z" fill="#2C7BC4"/><path d="M5 18.5A3.5 3.5 0 0 1 8.5 15h31a3.5 3.5 0 0 1 3.5 3.5V36a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36z" fill="#58A6F0"/><path d="m14 34 7-8 5 5 3-3 6 6z" fill="#E9F4FF"/><circle cx="30" cy="23" r="2.4" fill="#FFD25A"/></svg>`,
    textfile: `<svg viewBox="0 0 48 48"><path d="M12.5 5.5H29l9 9V40a2.5 2.5 0 0 1-2.5 2.5h-23A2.5 2.5 0 0 1 10 40V8a2.5 2.5 0 0 1 2.5-2.5z" fill="#FAFBFC" stroke="#AEBBC8"/><path d="M29 5.5V12a2.5 2.5 0 0 0 2.5 2.5H38" fill="#E3E9EF" stroke="#AEBBC8"/><path d="M16 21h16M16 26h16M16 31h10" stroke="#8C9BAA" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    globe: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="#2E86D1"/><g fill="none" stroke="#DDF0FF" stroke-width="1.6"><ellipse cx="24" cy="24" rx="7.5" ry="17"/><path d="M7 24h34M9.5 15h29M9.5 33h29"/></g></svg>`,
    home: `<svg viewBox="0 0 48 48"><path d="M8 22 24 9l16 13v16a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="#4B9BE0"/><path d="M19 41V29h10v12z" fill="#D8ECFB"/></svg>`,
    desktop: `<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="25" rx="3" fill="#2F8FDA"/><rect x="8" y="12" width="32" height="19" rx="1.5" fill="#8FD0FF"/><path d="M19 34h10l1.5 5h-13z" fill="#7A8796"/><rect x="14" y="39" width="20" height="2.5" rx="1.25" fill="#7A8796"/></svg>`,
    documents: `<svg viewBox="0 0 48 48"><rect x="13" y="6" width="26" height="32" rx="2.5" fill="#CFE3F5" stroke="#8DB3D6"/><rect x="9" y="10" width="26" height="32" rx="2.5" fill="#FAFBFC" stroke="#8DB3D6"/><path d="M14 19h16M14 24h16M14 29h11" stroke="#5E9BD2" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    start: `<svg viewBox="0 0 32 32"><defs><linearGradient id="kos-start-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FC3F7"/><stop offset="1" stop-color="#9B7BFF"/></linearGradient></defs><rect x="2" y="2" width="28" height="28" rx="7" fill="url(#kos-start-g)"/><path d="M6.5 21.5h4c1.2 0 1.7-.5 2.3-2.6.9-3.3 1.6-9.4 3.2-9.4s2.3 6.1 3.2 9.4c.6 2.1 1.1 2.6 2.3 2.6h4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

    showcase: `<svg viewBox="0 0 48 48"><rect x="12" y="6" width="30" height="22" rx="3" fill="#6E56CF" opacity=".55"/><rect x="6" y="12" width="32" height="24" rx="3.5" fill="#1C2533"/><path d="M6 30.5 15 23l6 5 7-7 10 9v2.5a3.5 3.5 0 0 1-3.5 3.5h-25A3.5 3.5 0 0 1 6 32.5z" fill="#2FA8D8"/><path d="m15 23 6 5 7-7 10 9" fill="none" stroke="#8FE3FF" stroke-width="1.6" stroke-linejoin="round"/><circle cx="14" cy="18.5" r="2.6" fill="#FFC23A"/><rect x="6" y="38.5" width="20" height="3" rx="1.5" fill="#8A97A8"/></svg>`,
    photos: `<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="30" rx="4" fill="#E9F1FA" stroke="#9CB4CC"/><path d="M5 33 17 21l9 9 6-6 11 11v1a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36z" fill="#3D8BD6"/><path d="m26 30 6-6 11 11v1a3.5 3.5 0 0 1-3.5 3.5H35z" fill="#2667A8"/><circle cx="33" cy="17" r="3.4" fill="#FFB547"/></svg>`,

    /* ---------- UI glyphs ---------- */
    search: g(`<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/>`),
    chevR: g(`<path d="m6 3.5 4.5 4.5L6 12.5"/>`),
    chevL: g(`<path d="M10 3.5 5.5 8l4.5 4.5"/>`),
    chevU: g(`<path d="M3.5 10 8 5.5l4.5 4.5"/>`),
    chevD: g(`<path d="M3.5 6 8 10.5 12.5 6"/>`),
    arrowL: g(`<path d="M13 8H3m4-4.5L2.5 8 7 12.5"/>`),
    arrowR: g(`<path d="M3 8h10M9 3.5 13.5 8 9 12.5"/>`),
    arrowU: g(`<path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/>`),
    refresh: g(`<path d="M13 8a5 5 0 1 1-1.5-3.6"/><path d="M13 2.5v3h-3"/>`),
    external: g(`<path d="M9 3h4v4M13 3 7.5 8.5"/><path d="M11.5 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1h2.5"/>`),
    code: g(`<path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/>`),
    info: g(`<circle cx="8" cy="8" r="6"/><path d="M8 7.5V11"/><circle cx="8" cy="5" r=".6" fill="currentColor" stroke="none"/>`),
    lock: g(`<rect x="3.5" y="7" width="9" height="6.5" rx="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>`),
    power: g(`<path d="M8 2v5.5"/><path d="M4.6 4.2a5 5 0 1 0 6.8 0"/>`),
    wifi: g(`<path d="M2 6.2a8.5 8.5 0 0 1 12 0M4 8.4a5.7 5.7 0 0 1 8 0M6 10.6a2.8 2.8 0 0 1 4 0"/><circle cx="8" cy="12.8" r=".7" fill="currentColor" stroke="none"/>`),
    volume: g(`<path d="M2.5 6h2.5L8.5 3v10L5 10H2.5z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4"/>`),
    battery: g(`<rect x="1.5" y="5" width="11.5" height="6" rx="1.3"/><path d="M14.5 7v2"/><rect x="3" y="6.5" width="8.5" height="3" rx=".5" fill="currentColor" stroke="none"/>`),
    bluetooth: g(`<path d="m4.5 5 7 6L8 14V2l3.5 3-7 6"/>`),
    moon: g(`<path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z"/>`),
    sun: g(`<circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9"/>`),
    gear: g(`<circle cx="8" cy="8" r="2.2"/><path d="M6.8 1.8h2.4l.4 1.8 1.5.9 1.8-.6 1.2 2.1-1.4 1.2v1.6l1.4 1.2-1.2 2.1-1.8-.6-1.5.9-.4 1.8H6.8l-.4-1.8-1.5-.9-1.8.6-1.2-2.1 1.4-1.2V7.2L1.9 6l1.2-2.1 1.8.6 1.5-.9z"/>`),
    apps: g(`<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1"/><rect x="9" y="9" width="4.5" height="4.5" rx="1"/>`),
    close: g(`<path d="m4 4 8 8m0-8-8 8"/>`),
    copy: g(`<rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 5.5V3.7a1.2 1.2 0 0 0-1.2-1.2H3.7a1.2 1.2 0 0 0-1.2 1.2v5.6a1.2 1.2 0 0 0 1.2 1.2h1.8"/>`),
    sleep: g(`<path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z"/>`),
    plane: g(`<path d="M14 8 2 3.5l2.5 4.5L2 12.5z"/>`),

    taskview: g(`<rect x="2" y="3.5" width="8" height="9" rx="1.3"/><path d="M12 5v6M14 6.5v3"/>`),
    fullscreen: g(`<path d="M2.5 6V3.5a1 1 0 0 1 1-1H6M10 2.5h2.5a1 1 0 0 1 1 1V6M13.5 10v2.5a1 1 0 0 1-1 1H10M6 13.5H3.5a1 1 0 0 1-1-1V10"/>`),
    viewTiles: g(`<rect x="2" y="2.5" width="4" height="4" rx=".8"/><path d="M8 3.5h6M8 5.5h4"/><rect x="2" y="9.5" width="4" height="4" rx=".8"/><path d="M8 10.5h6M8 12.5h4"/>`),
    viewLarge: g(`<rect x="2" y="2" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="2" width="5.5" height="5.5" rx="1"/><rect x="2" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/>`),
    viewDetails: g(`<path d="M2 3.5h12M2 6.5h12M2 9.5h12M2 12.5h12"/>`),
    bell: g(`<path d="M4 11V7a4 4 0 0 1 8 0v4l1.2 1.5H2.8z"/><path d="M6.5 14a1.6 1.6 0 0 0 3 0"/>`),
    image: g(`<rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="m2.5 12 3.5-3.5 2.5 2.5 2-2 3.5 3.5"/>`),
    play: g(`<path d="M5 3.2v9.6L12.5 8z"/>`),
    sort: g(`<path d="M5 3v10M2.5 10.5 5 13l2.5-2.5M11 13V3M8.5 5.5 11 3l2.5 2.5"/>`),
    share: g(`<path d="M9.5 2.5H13.5V6.5M13.5 2.5 7.5 8.5"/><path d="M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/>`),
    trash: g(`<path d="M2.5 4h11M6 4V2.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8V4M4 4l.7 9.2a1 1 0 0 0 1 .8h4.6a1 1 0 0 0 1-.8L12 4M6.5 6.5v5M9.5 6.5v5"/>`),
    pin: g(`<path d="M9.8 2.2 13.8 6.2 11.6 7.4 9.3 9.7 9 12.6 3.4 7 6.3 6.7 8.6 4.4z"/><path d="m5.8 10.2-3.3 3.3"/>`),
    props: g(`<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3"/>`),
    display: g(`<rect x="1.8" y="2.8" width="12.4" height="8.4" rx="1.2"/><path d="M6 13.5h4M8 11.2v2.3"/>`),
    newfile: g(`<path d="M9 2.5H4.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V6z"/><path d="M9 2.5V6h3.5M8 8v4M6 10h4"/>`),
    restore: g(`<path d="M3 7a5 5 0 1 1 1.5 3.6"/><path d="M3 3v4h4"/>`),
    drive: g(`<rect x="1.8" y="4" width="12.4" height="8" rx="1.5"/><path d="M4.5 9.5h4"/><circle cx="11.5" cy="9.5" r=".7" fill="currentColor" stroke="none"/>`),
    langs: g(`<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c1.8 1.7 2.6 3.7 2.6 6S9.8 12.3 8 14c-1.8-1.7-2.6-3.7-2.6-6S6.2 3.7 8 2z"/>`),
    shortcut: `<svg viewBox="0 0 16 16"><rect x=".5" y=".5" width="15" height="15" rx="2" fill="#fff" stroke="#8a96a3"/><path d="M5 11.5c0-3.3 2-5 5.2-5" fill="none" stroke="#1d6fd6" stroke-width="1.8" stroke-linecap="round"/><path d="M8.6 4.2 11 6.5 8.6 8.8" fill="none" stroke="#1d6fd6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

    /* Window controls (10×10) */
    wmin: g(`<path d="M0 5h10"/>`, 10, 1),
    wmax: g(`<rect x=".5" y=".5" width="9" height="9" rx="1.5"/>`, 10, 1),
    wrestore: g(`<rect x=".5" y="2.5" width="7" height="7" rx="1.3"/><path d="M2.5 2.5v-.5A1.5 1.5 0 0 1 4 .5h4A1.5 1.5 0 0 1 9.5 2v4A1.5 1.5 0 0 1 8 7.5h-.5"/>`, 10, 1),
    wclose: g(`<path d="m.5.5 9 9m0-9-9 9"/>`, 10, 1),
  };
})();
