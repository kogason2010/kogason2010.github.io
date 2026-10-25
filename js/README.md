# How the lab's code is organised

`index.html` loads these scripts in order. They share one scope, so a name defined in an earlier file can be used by any later one.

| To change… | Edit |
|---|---|
| Words in the info panels (lab, basement) | `content.js` |
| Words in NCA's panels | `chemistry/content.js` |
| **App notes in the library** (add one here) | `library/catalog.js` |
| Renderer, camera, colours (`C`), modelling helpers (`box`, `cyl`, `mat`, `module`…) | `core/scene.js` |
| Lights and the Lights on/off switch | `core/lights.js` |
| Floating molecules behind the dioramas | `core/background.js` |
| Going up and down stairs | `core/levels.js` |
| **Kogason lab** room, window, exit door | `lab/room.js` |
| Fume hood and distillation | `lab/fume-hood.js` |
| Back bench, monitor, balance | `lab/workstation.js` |
| Nexera HPLC model (shapes and colours) | `lab/hplc.js` |
| Nexera IC model and bench | `lab/ic.js` |
| Island bench and TOC analyzer | `lab/island-toc.js` |
| Whiteboard and reagent cabinet | `lab/wall-items.js` |
| Robot vacuum (model, mapping, cleaning) | `lab/robot.js` |
| Desktop portfolio, live KogasonOS on the monitor | `lab/desktop.js`, `lab/os-monitor.js` |
| IC workstation app | `lab/ic-workstation.js` |
| Particle mode, distillation vapour | `lab/effects.js` |
| **Basement**: stair, room, SFC instrument | `basement/basement.js` |
| SFC chemistry and its workstation app | `basement/sfc.js` |
| Tags, hovering, clicking, the info sheet | `ui/labels.js` |
| **Campus** constants and toolkit | `campus/setup.js` |
| Sky, ground and paths, water, plaza, buildings, cars | `campus/sky.js`, `ground.js`, `water.js`, `plaza.js`, `buildings.js`, `cars.js` |
| Trees (EZ-Tree port), shrubs, hedge | `campus/plants.js` |
| Lamps, grass, wildlife | `campus/lamps.js`, `grass.js`, `life.js` |
| Messes and lost items outside | `campus/gameplay.js` |
| Build order and mesh merging | `campus/build.js` |
| Day/night outside, culling, adaptive resolution | `campus/atmosphere.js` |
| Driving and flying, camera, HUD, minimap, going in and out | `campus/drive.js` |
| **Space** (hold Space for 10 s outside): Earth, Moon, rings, satellite, asteroids, free flight | `space/space.js` |
| Intro panel folding away | `ui/intro.js` |
| The Places menu and travelling between rooms | `ui/places-menu.js` |
| Merging the lab's static meshes (fewer draw calls) | `lab/merge.js` |
| **Mathematics** hall: the Yang–Mills exhibits | `math/room.js` |
| Its live SU(2) lattice simulation | `math/lattice.js` |
| Its panels (problem, evidence, prize rules) | `math/content.js` |
| Entering it, camera and lattice controls | `math/visit.js` |
| Indoor places you drive into (shared enter/leave) | `core/places.js` |
| **NCA** (chemistry building) LC lab room | `chemistry/room.js` |
| Its instruments (UHPLC, LC-MS/MS, prep LC…) | `chemistry/instruments.js` |
| The LC model and LC workstation app | `chemistry/lc.js` |
| Entering and leaving it | `chemistry/visit.js` |
| **Library** reading room (rotunda, alcoves, desks, dome) | `library/rotunda.js` |
| Shelf panels, catalogue search, the note reader | `library/reader.js` |
| Entering the library, its camera and lighting | `library/visit.js` |
| Main loop, resize, camera easing, start-up | `main.js` |

Styles are in `css/style.css`; textures for trees and grass are in `assets/` (credits in `assets/CREDITS.md`).

## Adding an app note to the library

Copy one entry in `APP_NOTES` in `library/catalog.js` and change its fields: `id` (unique), `shelf` (one of the `LIB_SHELVES` ids), `cover` (book colour), `title`, `subtitle`, `summary`, `sources` (the application-note numbers it is based on) and `url`. The note appears on its alcove's lectern, in that alcove's panel, in the catalogue at the central desk, and in the reader. A shelf with no notes shows "Coming soon". To add a shelf, add it to `LIB_SHELVES` (seven fit; the eighth arch is the entrance).
