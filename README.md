# KogasonOS

> **Layout:** the site's front door (`index.html` at the root) is a 3D analytical chemistry lab built with Three.js. KogasonOS lives in `os/` (kogason2010.github.io/os/) and runs live on the lab's monitor: zoom into the screen to use it, and click **Lab** to zoom back out.

**Live at [kogason2010.github.io](https://kogason2010.github.io/)**

This is my portfolio, built to look and behave like a Windows 11 desktop. Instead of a page of links, each of my projects is an app you can open, move around, snap side by side or go full screen with. Showcase, the app that opens first, has screenshots and details for every project if you'd rather browse.

It's plain HTML, CSS and JavaScript, with no framework and no build step. GitHub Pages serves this folder exactly as it is.

## The projects

The desktop sorts them into two folders, plus a couple of standalone apps.

**Application Notes**: published Shimadzu application notes, retold as interactive 3D.

- **[Strand by Strand](https://github.com/kogason2010/lcms-2050-oligos)**: four notes on confirming synthetic oligonucleotides with the LCMS-2050 single quadrupole mass spectrometer.
- **[Exposed: EPSA by SFC](https://github.com/kogason2010/nexera-uc-epsa)**: measuring experimental polar surface area with supercritical fluid chromatography.
- **[Nexera IC Applications](https://github.com/kogason2010/nexera-ic-applications)**: published IC methods told through 3D ions, with an ion atlas and a methods table.

**Instrument Explainers**: how the instruments themselves work.

- **[Inside the HPLC Detector](https://github.com/kogason2010/hplc-detectors)**: five HPLC detectors (UV / PDA / DAD, fluorescence, RI, ELSD and single / triple quad MS) as live animated schematics.
- **[Nexera IC](https://github.com/kogason2010/nexera-ic)**: a cinematic, interactive explainer of ion chromatography.

**On their own**

- **[HPLC Tools](https://github.com/kogason2010/HPLC-tools)**: calculators for everyday HPLC work: method transfer with USP <621> checks, gradients, buffers, system suitability, back-pressure.
- **[Solvane](https://github.com/kogason2010/solvane)**: a design study for a fictional analytical-science company.
- **Resolve** (built into the desktop): a method-development game. Each level is a sample whose peaks overlap; tune the gradient and column temperature until every pair hits Rs 1.5 inside the run-time limit. Retention follows the linear-solvent-strength model, migrated numerically through the gradient (`js/resolve-engine.js`).

The Shimadzu-related projects are independent and unofficial, and aren't affiliated with Shimadzu.

## What's on the desktop

Besides the projects there's a File Explorer, Photos, Notepad, Settings and a Terminal (try `help`, `neofetch` or `git log`). I wanted the small Windows details to work too:

- Right-click menus work like Windows 11's, with View and Sort by submenus, Pin to Start or taskbar, and Properties.
- Deleted desktop icons go to a working Recycle Bin, and Settings can put everything back.
- Windows snap to sides and corners, and hovering the maximize button shows snap layouts.
- Hovering a taskbar button previews its window, and minimizing shrinks the window into its button.
- There's Task view, a taskbar search box, a notification center, quick settings, and light and dark mode.
- File Explorer has Pictures (every screenshot), This PC and a Details view with real file sizes.
- Desktop icons can be dragged, box-selected and resized.
- **Restore Desktop** puts icons, pins, the Recycle Bin, theme and wallpaper back to how they started.

## How it works

Everything on the desktop comes from one file, `os/js/config.js`. Each project is a single entry there, and the desktop, Start menu, taskbar, File Explorer and Showcase all build themselves from that list. Adding a GitHub project takes one line:

```js
{ type: "github", repo: "kogason2010/my-new-site", bundle: true },
```

The live URL, source link and icon are worked out from the repo name. You can also give it a `title`, `description`, `stack`, `group` (to put it in a folder) or `shots` (screenshots). Without `bundle: true`, the window loads the live GitHub Pages site instead of a local copy.

### Projects as standalone apps

Rather than embedding each project from its own URL, I keep a copy of each one's built site in `os/apps/`, so every project runs straight from this site as its own app. Links between projects are caught and open the other project in a new window instead of navigating away.

To keep those copies current, `os/tools/sync-apps.mjs` pulls the latest build of each bundled project from its repo. Projects that only keep source code in their repo (like the HPLC detectors site) get a `build` entry in the config, and the script builds them before copying. It also writes `os/apps/manifest.json` with each bundle's size, which File Explorer and Properties show. A GitHub Action (`.github/workflows/sync-apps.yml`) runs it every Monday, whenever `config.js` changes, and on demand from the Actions tab. It commits any changes it finds.

### Screenshots

`os/tools/capture-shots.mjs` opens a project's live site in a headless browser and saves four screenshots for Showcase and Photos. It also prints the lines to paste into the config.

```bash
npm install --no-save playwright
npx playwright install chromium
node os/tools/capture-shots.mjs my-new-site
```

### Other kinds of apps

Websites that aren't on GitHub work too: `{ type: "website", id: "my-shop", title: "My Shop", url: "https://example.com/" }`. Add `embed: false` for sites that won't load inside another page; those open in a new tab. Text files that open in Notepad are `type: "document"`. A completely new built-in app is a small function registered in `js/apps.js`.

Any of my repos with GitHub Pages turned on that isn't listed in the config still shows up in Projects automatically, opening its live site.

## Running it locally

There's nothing to install. Serve the folder with any static server and open it in a browser:

```bash
python3 -m http.server
```

## Where things are

| Path | What's in it |
| --- | --- |
| `os/js/config.js` | Projects, folders, screenshots, and what appears on the desktop, Start menu and taskbar |
| `js/core.js` | App registry, settings, window manager and snapping |
| `js/apps.js` | File Explorer, project windows, Notepad, Terminal, Settings |
| `js/showcase.js` | Showcase and Photos |
| `js/shell.js` | Desktop, taskbar, Start menu, Task view, notifications |
| `os/css/` | All styling, light and dark |
| `os/apps/` | Bundled copies of each project's built site |
| `os/media/`, `os/icons/`, `os/wallpapers/` | Screenshots, project icons and wallpaper art |
| `os/tools/` | The sync and screenshot scripts |
