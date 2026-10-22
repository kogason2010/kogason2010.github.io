/* js/library/reader.js — Reading the app notes: each alcove's panel lists its notes, the central desk holds a searchable
   catalogue, and the reader shows a note's details beside the live site.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const libEsc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function noteCard(n) {
  return `<article class="lib-note" style="--cover:${n.cover}" data-search="${libEsc((n.title + " " + n.subtitle + " " + n.summary + " " + n.sources.join(" ")).toLowerCase())}">
    <i aria-hidden="true"></i><div><h4>${libEsc(n.title)}</h4><p class="lib-sub">${libEsc(n.subtitle)}</p><p>${libEsc(n.summary)}</p>
    ${n.sources.length ? `<p class="lib-src">${n.sources.map(esc).join(" · ")}</p>` : ""}
    <button class="btn primary" type="button" data-note="${libEsc(n.id)}">Read</button></div></article>`;
}
LIB_SHELVES.forEach(s => {
  const notes = notesOn(s.id);
  SECTIONS["lib_" + s.id] = {
    kicker: "Library · " + s.name.toLowerCase(), title: s.name,
    html: notes.length ? `<p>${notes.length === 1 ? "One app note" : notes.length + " app notes"} on this shelf.</p><div class="lib-notes">${notes.map(noteCard).join("")}</div>`
      : `<p>No app notes on this shelf yet. New ones will appear on the lectern in front of the alcove.</p>`,
  };
});
SECTIONS.libCatalog = {
  kicker: "Library · central desk", title: "Catalogue",
  html: `<p>Every app note in the library. Search, or browse by shelf.</p>
    <label class="lib-search"><span>Search</span><input id="libSearch" type="search" placeholder="Title, technique, note number…" autocomplete="off"></label>
    ${LIB_SHELVES.map(s => { const n = notesOn(s.id); return n.length ? `<h3 class="lib-shelf">${libEsc(s.name)}</h3><div class="lib-notes">${n.map(noteCard).join("")}</div>` : ""; }).join("")}
    <p class="lib-empty" id="libEmpty" hidden>Nothing matches that search.</p>`,
};
sheetBody.addEventListener("input", e => {
  if (e.target.id !== "libSearch") return;
  const q = e.target.value.trim().toLowerCase(); let shown = 0;
  sheetBody.querySelectorAll(".lib-note").forEach(c => { const on = !q || c.dataset.search.includes(q); c.hidden = !on; shown += on; });
  sheetBody.querySelectorAll(".lib-shelf").forEach(h => { const list = h.nextElementSibling; h.hidden = list.hidden = !list.querySelector(".lib-note:not([hidden])"); });
  document.getElementById("libEmpty").hidden = shown > 0;
});
sheetBody.addEventListener("click", e => { const b = e.target.closest("[data-note]"); if (b) openReader(b.dataset.note); });

// the reader: details on the left, the site itself on the right
let readerOpen = false;
const readerEl = document.getElementById("libReader");
function openReader(id) {
  const n = APP_NOTES.find(x => x.id === id); if (!n) return;
  const shelf = LIB_SHELVES.find(s => s.id === n.shelf);
  document.getElementById("libReaderTitle").textContent = n.title;
  document.getElementById("libReaderMeta").innerHTML = [shelf ? shelf.name : "", ...n.sources.slice(0, 2)].filter(Boolean).map(x => `<span>${libEsc(x)}</span>`).join("");
  document.getElementById("libReaderOpen").href = n.url;
  document.getElementById("libReaderCard").innerHTML = `<i class="lib-cover" style="--cover:${n.cover}"><b>${libEsc(n.title)}</b></i>
    <h3>${libEsc(n.subtitle)}</h3><p>${libEsc(n.summary)}</p>
    ${n.sources.length ? `<h4>Based on</h4><ul>${n.sources.map(s => `<li>${libEsc(s)}</li>`).join("")}</ul>` : ""}
    <a class="btn primary" href="${libEsc(n.url)}" target="_blank" rel="noopener">Open the site</a>`;
  const fr = document.getElementById("libReaderFrame"); if (fr.dataset.src !== n.url) { fr.src = n.url; fr.dataset.src = n.url; }
  readerEl.hidden = false; readerOpen = true; document.body.classList.add("os-mode");
  requestAnimationFrame(() => readerEl.classList.add("show"));
  document.getElementById("libReaderClose").focus({ preventScroll: true });
}
function closeReader() {
  if (!readerOpen) return;
  readerOpen = false; readerEl.classList.remove("show"); document.body.classList.remove("os-mode");
  setTimeout(() => { if (!readerOpen) readerEl.hidden = true; }, reduce ? 0 : 250);
}
document.getElementById("libReaderClose").addEventListener("click", closeReader);
