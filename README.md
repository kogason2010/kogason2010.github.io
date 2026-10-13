# KogasonOS

**Live at [kogason2010.github.io](https://kogason2010.github.io/)**

This is my portfolio, built to look and behave like a Windows 11 desktop. Instead of a page of links, each of my projects is an app you can open, move around, snap side by side or go full screen with. Showcase, the app that opens first, has screenshots and details for every project if you'd rather browse.

It's plain HTML, CSS and JavaScript, with no framework and no build step. GitHub Pages serves this folder exactly as it is.

## The projects

- **[Nexera IC](https://github.com/kogason2010/nexera-ic)**: a cinematic, interactive explainer of ion chromatography.
- **[Nexera IC Applications](https://github.com/kogason2010/nexera-ic-applications)**: published IC methods told through 3D ions, with an ion atlas and a methods table.
- **[Exposed: EPSA by SFC](https://github.com/kogason2010/nexera-uc-epsa)**: a scroll-driven journey through measuring polar surface area with supercritical fluid chromatography.
- **[Solvane](https://github.com/kogason2010/solvane)**: a design study for a fictional analytical-science company.
- **[Inside the HPLC Detector](https://github.com/kogason2010/hplc-detectors)**: how five HPLC detectors (UV / PDA / DAD, fluorescence, RI, ELSD and single / triple quad MS) turn chemistry into a peak, as live animated schematics.

The first three live together in a *Nexera App Notes* folder on the desktop. They're independent, unofficial projects and aren't affiliated with Shimadzu.

## What's on the desktop

Besides the projects there's a File Explorer, Photos, Notepad, Settings and a Terminal (try `help`, `neofetch` or `git log`). I also wanted the small Windows details to work: windows snap to the sides and corners, hovering the maximize button gives you snap layouts, and there's Task view, Start menu search, a notification center, quick settings, light and dark mode, and desktop icons you can drag around.

## How it works

Everything on the desktop comes from one file, `js/config.js`. Each project is a single entry there, and the desktop, Start menu, taskbar, File Explorer and Showcase all build themselves from that list. Adding a GitHub project takes one line:

```js
{ type: "github", repo: "kogason2010/my-new-site", bundle: true },
```

The live URL, source link and icon are worked out from the repo name. You can also give it a `title`, `description`, `stack`, `group` (to put it in a folder) or `shots` (screenshots). Without `bundle: true`, the window loads the live GitHub Pages site instead of a local copy.

### Projects as standalone apps

Rather than embedding each project from its own URL, I keep a copy of each one's built site in `apps/`, so every project runs straight from this site as its own app. Links between projects are caught and open the other project in a new window instead of navigating away.

To keep those copies current, `tools/sync-apps.mjs` pulls the latest build of each bundled project from its repo. A GitHub Action (`.github/workflows/sync-apps.yml`) runs it every Monday, whenever `config.js` changes, and on demand from the Actions tab. It commits any changes it finds.

### Screenshots

`tools/capture-shots.mjs` opens a project's live site in a headless browser and saves four screenshots for Showcase and Photos. It also prints the lines to paste into the config.

```bash
npm install --no-save playwright
npx playwright install chromium
node tools/capture-shots.mjs my-new-site
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
| `js/config.js` | Projects, folders, screenshots, and what appears on the desktop, Start menu and taskbar |
| `js/core.js` | App registry, settings, window manager and snapping |
| `js/apps.js` | File Explorer, project windows, Notepad, Terminal, Settings |
| `js/showcase.js` | Showcase and Photos |
| `js/shell.js` | Desktop, taskbar, Start menu, Task view, notifications |
| `css/` | All styling, light and dark |
| `apps/` | Bundled copies of each project's built site |
| `media/`, `icons/`, `wallpapers/` | Screenshots, project icons and wallpaper art |
| `tools/` | The sync and screenshot scripts |
