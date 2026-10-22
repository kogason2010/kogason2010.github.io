/* js/lab/os-monitor.js — Live KogasonOS shown on the monitor, and project links that open inside it.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

/* ---------- Live KogasonOS on the monitor (kogason2010.github.io, desktop browsers) ----------
   The real desktop runs in a same-origin frame placed on the screen with CSS3D. The WebGL screen
   punches a transparent hole so the frame shows through and anything in front still covers it. */
const ON_SITE = /(^|\.)kogason2010\.github\.io$/.test(location.hostname);
const EMBED = ON_SITE && typeof THREE.CSS3DRenderer === "function" && window.innerWidth >= 900 &&
  window.matchMedia && window.matchMedia("(pointer: fine)").matches;
const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending });
let cssRenderer = null, cssScene = null, osFrame = null, osObj = null, osLive = false, osFull = false, osSaved = null;
function placeOsFrame() {
  if (!osObj) return;
  const sb = new THREE.Box3().setFromObject(screenMesh), sz = new THREE.Vector3(); sb.getSize(sz);
  const IW = Math.max(1100, Math.round(stage.clientWidth || 1280)), IH = Math.round(IW * sz.y / sz.x);
  osFrame.style.width = IW + "px"; osFrame.style.height = IH + "px";
  screenMesh.getWorldPosition(osObj.position); screenMesh.getWorldQuaternion(osObj.quaternion);
  osObj.scale.setScalar(sz.x / IW);
}
if (EMBED) {
  cssScene = new THREE.Scene();
  cssRenderer = new THREE.CSS3DRenderer();
  const cd = cssRenderer.domElement;
  Object.assign(cd.style, { position: "absolute", left: "0", top: "0", pointerEvents: "none", zIndex: "0" });
  stage.insertBefore(cd, renderer.domElement);
  Object.assign(renderer.domElement.style, { position: "relative", zIndex: "1" });
  osFrame = document.createElement("iframe");
  osFrame.title = "KogasonOS"; osFrame.src = "/os/";
  Object.assign(osFrame.style, { border: "0", background: "#05080d", display: "block" });
  osObj = new THREE.CSS3DObject(osFrame); cssScene.add(osObj);
  placeOsFrame();
  osFrame.addEventListener("load", () => setTimeout(() => { screenMesh.material = holeMat; osLive = true; }, 300));
}
function enterOsFull() {
  osFull = true;
  const camEl = cssRenderer.domElement.firstChild;
  osSaved = { cam: camEl.style.transform, obj: osFrame.style.transform, w: osFrame.style.width, h: osFrame.style.height };
  camEl.style.transform = "none";
  Object.assign(osFrame.style, { transform: "none", left: "0px", top: "0px", width: stage.clientWidth + "px", height: stage.clientHeight + "px" });
  Object.assign(cssRenderer.domElement.style, { zIndex: "5", pointerEvents: "auto" });
  renderer.domElement.style.visibility = "hidden";
  try { history.pushState({ os: true }, "", "#os"); } catch (e) {}
  try { osFrame.contentWindow.postMessage({ type: "kogasonos:enter", launch: pendingLaunch || undefined }, location.origin); } catch (e) {}
  pendingLaunch = null;
  try { osFrame.focus(); } catch (e) {}
}
function exitOsFull() {
  if (!osFull) return;
  osFull = false;
  const camEl = cssRenderer.domElement.firstChild;
  camEl.style.transform = osSaved.cam;
  Object.assign(osFrame.style, { transform: osSaved.obj, left: "", top: "", width: osSaved.w, height: osSaved.h });
  Object.assign(cssRenderer.domElement.style, { zIndex: "0", pointerEvents: "none" });
  renderer.domElement.style.visibility = "";
  closeDesktop();
}
window.addEventListener("message", (e) => {
  if (e.origin !== location.origin || !e.data || e.data.type !== "kogasonos:exit") return;
  if (location.hash === "#os") history.back(); else exitOsFull();
});
window.addEventListener("popstate", () => { if (osFull && location.hash !== "#os") exitOsFull(); });

/* ---------- Project links: open the project inside KogasonOS on the monitor ---------- */
const PROJECT_URLS = {
  showcase: "https://kogason2010.github.io/os/",
  "hplc-tools": "https://kogason2010.github.io/HPLC-tools/",
  "hplc-detectors": "https://kogason2010.github.io/hplc-detectors/",
  "nexera-ic": "https://kogason2010.github.io/nexera-ic/",
  "nexera-ic-applications": "https://kogason2010.github.io/nexera-ic-applications/",
  "lcms-2050-oligos": "https://kogason2010.github.io/lcms-2050-oligos/",
  "nexera-uc-epsa": "https://kogason2010.github.io/nexera-uc-epsa/",
  solvane: "https://kogason2010.github.io/solvane/",
};
let pendingLaunch = null;
function openProjects(id) {
  if (EMBED && osLive && level === "up" && !worldOn) { pendingLaunch = id; openDesktop(); return; }   // the monitor is in the Kogason lab
  location.assign(PROJECT_URLS[id] || "https://kogason2010.github.io/os/");
}
if (ON_SITE) document.querySelectorAll("a[data-same]").forEach((a) => a.removeAttribute("target"));
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[data-launch]");
  if (!a || !ON_SITE) return;               // elsewhere (e.g. a preview), the link opens normally
  e.preventDefault(); openProjects(a.dataset.launch);
});
