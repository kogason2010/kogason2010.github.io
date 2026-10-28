/* js/ui/sound.js — Ambient sound, off until the visitor turns it on (the Sound button; remembered in this browser).
   Everything is synthesised here with the Web Audio API, no sound files: a room tone and instrument hum indoors, a
   breeze, birds and the fountain on the campus by day (the fountain louder as you drive up to it), crickets at night,
   the odd page turning in the library, a low drone in the maths building and in orbit. Each layer fades to the level the
   current place asks for.
   Part of the kogason2010 lab. Scripts load in order from index.html and share one scope. */
"use strict";

const soundBtn = document.getElementById("soundBtn");
const SND = { ctx: null, on: false, layers: {}, timer: 0, nextBird: 0, nextPage: 0 };
let soundWanted = false;
try { soundWanted = localStorage.getItem("labSound") === "on"; } catch (e) { /* off */ }

// a few seconds of noise: white, or "brown" (each sample a small step from the last: deep and soft, like air or a room)
function noiseBuffer(ctx, brown) {
  const n = ctx.sampleRate * 4, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return b;
}
// a layer: a looping source through a filter into its own gain, which fades toward the level set each update
function layer(ctx, out, src, type, freq, q) {
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
  const g = ctx.createGain(); g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(out); if (src.start) src.start();
  return { g, f, src };
}
function loopNoise(ctx, brown) { const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx, brown); s.loop = true; return s; }
function tone(ctx, freq, type) { const o = ctx.createOscillator(); o.type = type || "sine"; o.frequency.value = freq; return o; }

function startSound() {
  if (!SND.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    const ctx = SND.ctx = new AC(), master = SND.master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    const brown = loopNoise(ctx, true), white = loopNoise(ctx, false), white2 = loopNoise(ctx, false);
    SND.layers = {
      room: layer(ctx, master, brown, "lowpass", 380),                 // air handling, a room full of instruments
      hum: layer(ctx, master, tone(ctx, 120, "sine"), "lowpass", 400),  // a pump or a transformer somewhere
      wind: layer(ctx, master, white, "bandpass", 500, 0.6),            // a breeze outside
      fountain: layer(ctx, master, white2, "bandpass", 1800, 0.5),      // falling water
      drone: layer(ctx, master, tone(ctx, 55, "triangle"), "lowpass", 220),
    };
    // crickets: a high tone, chopped into pulses by a fast tremolo, in bursts from a slow one
    const ck = tone(ctx, 4600), trem = ctx.createGain(), lfo = tone(ctx, 28, "square"), lfoAmt = ctx.createGain(), burst = tone(ctx, 0.9, "sine"), burstAmt = ctx.createGain();
    trem.gain.value = 0.25; lfoAmt.gain.value = 0.25; burstAmt.gain.value = 0.25;
    lfo.connect(lfoAmt); lfoAmt.connect(trem.gain); burst.connect(burstAmt); burstAmt.connect(trem.gain);
    ck.connect(trem); lfo.start(); burst.start();
    SND.layers.crickets = layer(ctx, master, trem, "highpass", 3000); ck.start();
  }
  SND.ctx.resume(); SND.on = true;
  clearInterval(SND.timer); SND.timer = setInterval(updateSound, 250); updateSound();
  return true;
}
function stopSound() {
  SND.on = false; clearInterval(SND.timer);
  if (SND.ctx) { Object.values(SND.layers).forEach(l => l.g.gain.setTargetAtTime(0, SND.ctx.currentTime, 0.2)); setTimeout(() => { if (!SND.on) SND.ctx.suspend(); }, 900); }
}
// a bird: two to five quick whistles sweeping between notes
function chirp() {
  const ctx = SND.ctx, t0 = ctx.currentTime + 0.02, n = 2 + Math.floor(Math.random() * 4), base = 2400 + Math.random() * 2200, pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const g = ctx.createGain(); g.gain.value = 0; if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(SND.master); } else g.connect(SND.master);
  const o = tone(ctx, base); o.connect(g);
  for (let i = 0; i < n; i++) {
    const t = t0 + i * (0.09 + Math.random() * 0.05), up = Math.random() < 0.5;
    o.frequency.setValueAtTime(base * (up ? 0.8 : 1.25), t); o.frequency.exponentialRampToValueAtTime(base * (up ? 1.3 : 0.75), t + 0.07);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.01); g.gain.linearRampToValueAtTime(0, t + 0.075);
  }
  o.start(t0); o.stop(t0 + n * 0.15 + 0.1);
}
// a page turning: a short brush of filtered noise
function pageTurn() {
  const ctx = SND.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime + 0.02;
  s.buffer = noiseBuffer(ctx, false); f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 0.8;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);
  s.connect(f); f.connect(g); g.connect(SND.master); s.start(t); s.stop(t + 0.5);
}
// set every layer's level for where you are now
function updateSound() {
  if (!SND.on || !SND.ctx) return;
  const here = herePlace(), now = SND.ctx.currentTime, out = !!worldOn && !spaceOn, L = { room: 0, hum: 0, wind: 0, fountain: 0, drone: 0, crickets: 0 };
  if (here === "lab" || here === "basement" || here === "chem") { L.room = 0.05; L.hum = 0.012; }
  else if (here === "library") L.room = 0.025;
  else if (here === "math") { L.room = 0.02; L.drone = 0.02; }
  else if (here === "space") L.drone = 0.035;
  else if (out) {
    const d = typeof DRV !== "undefined" ? Math.hypot(DRV.x, DRV.z) : 30, nearF = Math.max(0, 1 - d / 28);
    L.fountain = 0.012 + 0.11 * nearF * nearF;
    L.wind = night ? 0.012 : 0.03; L.crickets = night ? 0.018 : 0;
    if (!night && performance.now() > SND.nextBird) { chirp(); SND.nextBird = performance.now() + 1500 + Math.random() * 5000; }
  }
  if (here === "library" && performance.now() > SND.nextPage) { if (SND.nextPage) pageTurn(); SND.nextPage = performance.now() + 7000 + Math.random() * 12000; }
  Object.keys(L).forEach(k => SND.layers[k].g.gain.setTargetAtTime(L[k], now, 0.6));
}
function setSound(on) {
  soundWanted = on;
  try { localStorage.setItem("labSound", on ? "on" : "off"); } catch (e) { /* this visit only */ }
  const ok = on ? startSound() : (stopSound(), true);
  soundBtn.setAttribute("aria-pressed", String(on && ok)); soundBtn.classList.toggle("on", on && ok);
  soundBtn.setAttribute("aria-label", on && ok ? "Turn sound off" : "Turn sound on");
}
soundBtn.addEventListener("click", () => setSound(!SND.on));
// a visitor who left it on last time hears it again after their first touch or click (browsers need one before playing)
if (soundWanted) {
  soundBtn.setAttribute("aria-pressed", "true"); soundBtn.classList.add("on");
  const first = () => { window.removeEventListener("pointerdown", first, true); window.removeEventListener("keydown", first, true); if (soundWanted && !SND.on) setSound(true); };
  window.addEventListener("pointerdown", first, true); window.addEventListener("keydown", first, true);
}
// quiet while the tab is hidden
document.addEventListener("visibilitychange", () => { if (!SND.ctx || !SND.on) return; if (document.hidden) SND.ctx.suspend(); else SND.ctx.resume(); });
