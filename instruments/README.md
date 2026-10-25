# Instruments

Every instrument in the lab lives in its own folder here, and its look is one file: `model.js`. The site loads those
files exactly as they are, so you can change one instrument without touching the others: work on it offline, check it
in the viewer, then upload the file to GitHub.

```
instruments/
  index.html               gallery of every instrument (open it from your disk)
  lab-hplc/
    model.js               the HPLC: the site's own code, the file you edit
    index.html             the HPLC on its own, offline
  lab-nexera-ic/ …         one folder per instrument (23 in all)
  viewer/                  the offline viewer (three.js copy, pictures); the site doesn't use it
js/core/helpers.js         the building blocks every model uses (box, cyl, plane, mat, tex, …)
```

## Get a copy to work on

- **Download:** on [the repository page](https://github.com/kogason2010/kogason2010.github.io) choose
  **Code → Download ZIP**, unzip it, and in VS Code choose **File → Open Folder…** and pick the folder.
- **Or clone it in VS Code:** **Clone Git Repository…** on the welcome page, then paste
  `https://github.com/kogason2010/kogason2010.github.io`. You can then send changes back from VS Code (see below).

Download again (or **Pull** in VS Code) before starting new work, so you edit the latest version.

## Look at an instrument

Open `instruments/index.html` in your browser: in VS Code right-click it and choose **Reveal in File Explorer**
(**Reveal in Finder** on a Mac), then double-click it. Click an instrument. Drag to turn it, right-drag to pan,
scroll to zoom. Nothing here needs the internet.

**Click any part** to see its shape, size, position and colour, and the line of `model.js` that makes it.
**Open this line in VS Code** jumps straight there. **This only** hides the bench around an instrument,
**Wireframe** shows its triangles, and **‹ ›** (or ← →) step through the instruments.

## Change one

1. Open `instruments/<name>/model.js` in VS Code, change something and save (**Ctrl+S**, or **Cmd+S** on a Mac).
2. Refresh the instrument's page in the browser (**F5**, or **Cmd+R**).

A first change to try: in `instruments/lab-hplc/model.js`, change a colour such as `0x2b3136` to `0xc23a3a`.

Things to know:

- Sizes and positions are in **metres**. **+x** is right, **+y** is up, **+z** is toward the front of the room.
  Instruments on the left wall face **+x**.
- Colours are hex numbers, `0xRRGGBB`, the same as `#RRGGBB` in a colour picker.
- The building blocks are in `js/core/helpers.js`: `box(width, height, depth, colour, x, y, z, parent)`,
  `cyl(radiusTop, radiusBottom, height, colour, x, y, z, parent, segments)`,
  `plane(width, height, material, x, y, z, rotationY, parent)`, `mat(colour, { roughness, metalness })`, and more.
  Every instrument uses them, so a change there changes all of them.
- Put new parts in the instrument's group (the `parent`, for example `gHPLC`) so they stay with it.
- Keep the line that makes the group, such as `const gHPLC = hotGroup("hplc", "HPLC", …)`: the site uses it for the
  instrument's tag. Other names other files use (for example `rotor` on the TOC, or `carriage` on the SFC) are
  mentioned in comments; keep those names too.
- NCA's instruments are written as a function (for example `function buildUhplc() { … }`), because NCA builds them
  the first time you walk in. Edit inside the function.
- A few instruments sit on something built elsewhere: the TOC on the island bench (`js/lab/island.js`), the IC
  workstation on the IC's bench, the CO₂ line meeting the SFC's pump. The top of each of those files says so; move
  both together if you move one.
- `index.html` and `view.js` in a folder are for the viewer only. You don't need to change them.

If a red box appears at the bottom of the page, something in the code stopped the model from building. When the
page was opened from disk, press **F12** and open the **Console** tab to see the message and its line number.
(VS Code's **Live Server** extension shows the line right on the page and refreshes on every save; install it once
while online and it works offline after that.)

## Put it on the site

Check the instrument in the viewer first: if the red box is showing, a mistake in `model.js` can stop the lab from
loading on the live site too.

**On github.com:** open the instrument's folder, for example
[instruments/lab-hplc](https://github.com/kogason2010/kogason2010.github.io/tree/main/instruments/lab-hplc), choose
**Add file → Upload files**, drag your `model.js` in, and choose **Commit changes**. The site updates a minute or two
later (the **Actions** tab shows it building). To be safe, choose **Create a new branch for this commit and start a
pull request** instead, and ask Claude to check it before you merge.

**From VS Code** (if you cloned): open **Source Control**, write a short message, **Commit**, then **Sync Changes**.

Upload only the `model.js` files you changed. Everything else in `instruments/` is for the offline viewer.

## The instruments

| Folder | Instrument | Where |
| --- | --- | --- |
| `lab-hplc` | HPLC (Nexera) | Kogason Lab, back bench |
| `lab-nexera-ic` | Nexera IC, with its bench | Kogason Lab, left wall |
| `lab-ic-workstation` | IC workstation PC | Kogason Lab, IC bench |
| `lab-toc` | TOC analyzer, autosampler and gas cylinder | Kogason Lab, island |
| `lab-fume-hood` | Fume hood and distillation | Kogason Lab, back wall |
| `lab-projects-pc` | Projects workstation monitor | Kogason Lab, back bench |
| `lab-balance` | Analytical balance | Kogason Lab, back bench |
| `lab-about-cabinet` | Reagent cabinet (About) | Kogason Lab, left wall |
| `lab-contact-board` | Whiteboard (Contact) | Kogason Lab, back wall |
| `lab-robot-vacuum` | Robot vacuum and dock (its brain is `js/lab/robot.js`) | Kogason Lab, floor |
| `basement-sfc` | SFC, chiller and tubing | Basement bench |
| `basement-sfc-pc` | SFC workstation (`js/basement/sfc.js` draws its screen) | Basement bench |
| `basement-co2` | CO₂ cylinders, line and monitor | Basement, left wall |
| `nca-uhplc` | UHPLC | NCA, back bench |
| `nca-lc-pc` | LC workstation (`js/chemistry/lc.js` draws its screen) | NCA, back bench |
| `nca-integrated-lc` | Integrated LC | NCA, back bench |
| `nca-lcms` | LC-MS/MS | NCA, back bench |
| `nca-solvent-cabinet` | Solvent cabinet | NCA, left wall |
| `nca-columns` | Column storage | NCA, left wall |
| `nca-prep-lc` | Prep LC | NCA, left wall |
| `nca-sample-prep` | Sample prep island | NCA, island |
| `nca-hplc-modules` | The HPLC modules the robots stack | NCA assembly line |
| `nca-robot-arm` | Assembly robot arm (`js/chemistry/assembly.js` runs the line) | NCA assembly line |

To add an instrument, copy a folder, rename it, add a `<script src="instruments/<name>/model.js">` line to the site's
`index.html` where it should load, and add a line for it to `viewer/list.js`.
