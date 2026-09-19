// Cinder Isle — boot, main loop, saves.
import { createGame, tick, serialize } from './game.js';
import { aiDecide } from './ai.js';
import { ui, initUI, render, setOverlay, overlayOpen } from './ui.js';

const SAVE_KEY = 'cinder-isle-save-v1';
let g = null;

function newGame() {
  g = createGame(Math.floor(Math.random() * 2147483647));
  ui.selArea = null; ui.selItem = null; ui.track = null; ui.paused = false; ui.speed = 1;
  setOverlay('intro');
  save();
  render(g);
}

function save() {
  try { localStorage.setItem(SAVE_KEY, serialize(g)); } catch { /* private mode etc. — run on */ }
}
function load() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) { const st = JSON.parse(s); if (st && st.survivors && !st.over) return st; }
  } catch { /* ignore */ }
  return null;
}

function start(hotData) {
  initUI(() => g, newGame);
  let restored = null;
  try { if (hotData && hotData.save) restored = JSON.parse(hotData.save); } catch { /* ignore */ }
  if (!restored) restored = load();
  if (restored) { g = restored; setOverlay('intro'); render(g); } else { newGame(); }

  let acc = 0, last = performance.now();
  setInterval(() => {
    const now = performance.now();
    acc += ((now - last) / 1000) * ui.speed;
    last = now;
    if (ui.paused || overlayOpen() || g.over) { acc = 0; return; }
    let steps = 0;
    while (acc >= 1 && steps < 12) {
      acc -= 1; steps++;
      tick(g);
      if (g.t % 2 === 0) for (let i = 1; i < g.survivors.length; i++) aiDecide(g, g.survivors[i]);
      if (g.over) break;
    }
    if (steps) {
      render(g);
      if (g.t % 5 === 0 || g.over) save();
    }
  }, 250);
}

try { window.__cinder = { get g() { return g; } }; } catch { /* not a browser */ }
try { window.claude?.hot?.snapshot?.(() => ({ save: serialize(g) })); } catch { /* ignore */ }
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
