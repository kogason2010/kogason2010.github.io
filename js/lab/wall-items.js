/* js/lab/wall-items.js — Lab coat on its hook and the waste bin. The whiteboard and the reagent cabinet are instruments:
   instruments/lab-contact-board and instruments/lab-about-cabinet.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

// Lab coat + waste bin (decor)
box(0.08, 0.06, 0.12, C.steel, 3.5, 2.35, -4.14);
box(0.55, 1.1, 0.12, C.coat, 3.5, 1.75, -4.08);
box(0.13, 0.9, 0.11, C.coat, 3.2, 1.8, -4.06).rotation.z = 0.06;
box(0.13, 0.9, 0.11, C.coat, 3.8, 1.8, -4.06).rotation.z = -0.06;
cyl(0.24, 0.2, 0.6, C.yellow, 2.75, 0.3, -3.95);
cyl(0.25, 0.25, 0.05, 0x2a2f33, 2.75, 0.62, -3.95);
