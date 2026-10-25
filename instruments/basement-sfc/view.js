/* instruments/basement-sfc/view.js — Viewer only (the site doesn't load this): sets the model up to be looked at on its own. */
"use strict";

// the bench it stands on, as js/basement/basement.js builds it on the site ("This only" hides it)
box(4.8, 1.22, 0.78, C.cab, 0.1, BY + 0.61, -3.81, basement);
for (let x = -2.1; x <= 2.3; x += 0.8) { box(0.76, 1.0, 0.014, C.cab, x + 0.4, BY + 0.6, -3.415, basement, { roughness: 0.55 }); box(0.12, 0.014, 0.03, C.steel, x + 0.4, BY + 1.02, -3.395, basement, { metalness: 0.6 }); }
box(4.9, 0.06, 0.82, C.epoxy, 0.1, BY + 1.31 - 0.03, -3.8, basement);
