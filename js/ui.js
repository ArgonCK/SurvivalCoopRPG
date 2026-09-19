// Cinder Isle — render layer + input. Talks to the engine only through game.js exports.
import {
  AREAS, ITEMS, RECIPES, CREATURES, SURVIVOR_DEFS, BEACON_PARTS,
  COSTS, FIRE_AT, DEFEND_TIME, PURGE_AT, PHASES,
} from './data.js';
import * as G from './game.js';

const SHORT = {
  beach: 'Beach', forest: 'Forest', ridge: 'Ridge', dock: 'Dock',
  cliffs: 'Cliffs', meadow: 'Meadow', pond: 'Pond', warehouse: 'Depot',
  village: 'Village', farm: 'Farm', lab: 'LAB', quarry: 'Quarry',
  campsite: 'Camp', chapel: 'Chapel', tunnel: 'Tunnel', lighthouse: 'Lighthouse',
};
const HUES = {
  beach: ['#2e4a57', '#1a2a33'], forest: ['#24402a', '#152218'], ridge: ['#3d4147', '#22262b'],
  dock: ['#2f3d55', '#1b2433'], cliffs: ['#45413a', '#26241f'], meadow: ['#3c4a26', '#212a15'],
  pond: ['#274a4c', '#152a2c'], warehouse: ['#4a3d2e', '#2a2119'], village: ['#4a3227', '#281b15'],
  farm: ['#445226', '#252d15'], lab: ['#2c3f5a', '#18243a'], quarry: ['#43362e', '#251d19'],
  campsite: ['#4a3e20', '#292213'], chapel: ['#3d2f4a', '#211a2a'], tunnel: ['#33333b', '#1d1d22'],
  lighthouse: ['#4a4630', '#2a2719'],
};
const AREA_FLAVOR = {
  beach: 'Wreck debris in black sand.', forest: 'Old pines, herbs underfoot.',
  ridge: 'Bare stone, hard wind.', dock: 'Rotting pilings, fuel drums.',
  cliffs: 'Nesting gulls, loose scree.', meadow: 'Waist-high grass.',
  pond: 'Still water. Too still.', warehouse: 'AGLECORP supply cages.',
  village: 'Abandoned in a hurry.', farm: 'Terraces gone to seed.',
  lab: 'The extraction beacon is here.', quarry: 'Cut stone and old machines.',
  campsite: 'Ranger gear, cold ashes.', chapel: 'Candles and gauze.',
  tunnel: 'Echoes. Dripping.', lighthouse: 'The lamp still turns.',
};

const recipeFor = Object.fromEntries(RECIPES.map(r => [r.out, r]));

// where an item can be found (static source index, BS "Navigate" homage)
const SOURCES = {};
for (const a of AREAS) for (const id of new Set(a.pool)) (SOURCES[id] ??= new Set()).add(SHORT[a.id]);
for (const [cid, c] of Object.entries(CREATURES)) {
  for (const d of new Set([...(c.drops || []), c.rare].filter(Boolean))) (SOURCES[d] ??= new Set()).add(c.name);
}
function sourceText(id) {
  const s = SOURCES[id];
  return s ? [...s].slice(0, 4).join(', ') : 'craft only';
}

export const ui = { selArea: null, selItem: null, selTarget: null, track: null, speed: 1, paused: false };

let getG = () => null;
let onNewGame = () => {};

export function initUI(getGame, newGameFn) {
  getG = getGame; onNewGame = newGameFn;
  document.addEventListener('click', onClick);
}

function player(g) { return g.survivors[0]; }

// track target → what base items the player is hunting (biases their searches)
function updatePlayerWants(g) {
  const p = player(g);
  if (!ui.track || (recipeFor[ui.track] ? false : G.hasItem(p, ui.track))) { p.ai.wants = null; return; }
  const wants = new Set();
  (function walk(id, depth) {
    if (depth > 5) return;
    const r = recipeFor[id];
    if (!r) { if (!G.hasItem(p, id)) wants.add(id); return; }
    for (const ing of [r.a, r.b]) if (!G.hasItem(p, ing)) walk(ing, depth + 1);
  })(ui.track, 0);
  p.ai.wants = wants.size ? wants : null;
}

// ---------------------------------------------------------------- render
// Panels re-render only when their HTML actually changed, and scrollable
// children ([data-keep-scroll]) keep their scroll position — so the field
// guide doesn't jump while the clock ticks.
function setHtml(id, html) {
  const el = document.getElementById(id);
  if (!el || el.__html === html) return;
  const keep = [];
  for (const n of el.querySelectorAll('[data-keep-scroll]')) {
    keep.push({ id: n.id, top: n.scrollTop, atBottom: n.scrollTop + n.clientHeight >= n.scrollHeight - 24 });
  }
  const selfKeep = el.hasAttribute('data-keep-scroll')
    ? { top: el.scrollTop, atBottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 24 }
    : null;
  el.__html = html;
  el.innerHTML = html;
  for (const k of keep) {
    const n = document.getElementById(k.id);
    if (n) n.scrollTop = k.atBottom && n.id === 'log' ? n.scrollHeight : k.top;
  }
  if (selfKeep) el.scrollTop = (selfKeep.atBottom && el.id === 'log') ? el.scrollHeight : selfKeep.top;
}

let firstRender = true;
export function render(g) {
  updatePlayerWants(g);
  setHtml('topbar', topbarHtml(g));
  setHtml('objectives', objectivesHtml(g));
  setHtml('map-panel', mapHtml(g));
  setHtml('area-wrap', areaHtml(g));
  setHtml('log', g.log.slice(-90).map(e =>
    `<div class="log-${e.type}"><span class="t">${G.fmtT(e.t)}</span>${esc(e.msg)}</div>`).join(''));
  setHtml('party-panel', partyPanelHtml(g));
  setHtml('pack-panel', packPanelHtml(g));
  setHtml('craft-panel', craftPanelHtml(g));
  if (firstRender) { firstRender = false; const l = document.getElementById('log'); if (l) l.scrollTop = l.scrollHeight; }
  renderOverlay(g);
}

function topbarHtml(g) {
  const p = G.phase(g);
  const next = p.until - g.t;
  return `
    <div class="wordmark">CINDER ISLE<small>CO-OP SURVIVAL PROTOTYPE</small></div>
    <div class="phase-chip ${p.night ? 'night' : ''}">
      <span class="phase-name">${p.night ? '🌙 ' : ''}${p.name}</span>
      <span class="clock">${G.fmtT(g.t)} · next ${G.fmtT(Math.max(0, next))}</span>
    </div>
    <div class="threat">${threatText(g)}</div>
    <div id="controls">
      ${[1, 2, 4].map(x => `<button class="ctl ${ui.speed === x && !ui.paused ? 'on' : ''}" data-action="speed" data-x="${x}">${x}×</button>`).join('')}
      <button class="ctl ${ui.paused ? 'on' : ''}" data-action="pause">${ui.paused ? '▶ resume' : '❚❚ pause'}</button>
      <button class="ctl" data-action="newrun">new run</button>
      <button class="ctl" data-action="help">?</button>
    </div>`;
}

function threatText(g) {
  if (g.beacon.started) return `<b>HOLD THE LAB</b> — ${DEFEND_TIME - g.beacon.charge}s`;
  if (g.t >= PURGE_AT - 300 && !g.beacon.started) return `<b>PURGE in ${G.fmtT(PURGE_AT - g.t)}</b>`;
  const w = g.creatures.find(c => c.type === 'warden');
  if (w) return `warden: <b>${SHORT[w.area]}</b>`;
  return `${g.creatures.length} creatures roaming`;
}

function objectivesHtml(g) {
  const objs = [];
  const living = g.survivors.filter(s => s.i !== 0 && !s.dead);
  const metCount = living.filter(s => s.met).length;
  const allMet = living.every(s => s.met);
  objs.push(`<span class="obj ${allMet ? 'done' : 'active'}">${allMet ? '✓' : '1.'} Find your team (${metCount}/${living.length || 3})</span>`);
  const n = g.beacon.installed.length;
  objs.push(`<span class="obj ${n >= 3 ? 'done' : g.reunion ? 'active' : ''}">${n >= 3 ? '✓' : '2.'} Beacon parts ${n}/3 at the Lab</span>`);
  if (g.beacon.started) objs.push(`<span class="obj active">3. HOLD ${DEFEND_TIME - g.beacon.charge}s</span>`);
  else if (G.canFire(g)) objs.push(`<span class="obj active">3. Gather at the Lab and FIRE THE BEACON</span>`);
  else objs.push(`<span class="obj">3. Beacon power online at ${G.fmtT(FIRE_AT)}</span>`);
  if (g.t >= PURGE_AT - 600 && !g.beacon.started) objs.push(`<span class="obj active">☠ Island purge at ${G.fmtT(PURGE_AT)}</span>`);
  return objs.join('');
}

// ---------------------------------------------------------------- map
function nodePos(a) {
  const jx = ((a.col * 7 + a.row * 13) % 11) - 5;
  const jy = ((a.col * 5 + a.row * 11) % 9) - 4;
  return { x: 22 + a.col * 96 + jx, y: 26 + a.row * 86 + jy };
}
function mapHtml(g) {
  const edges = [];
  for (const a of AREAS) for (const nId of G.neighbors(a.id)) {
    const b = AREAS.find(x => x.id === nId);
    if (a.id < nId) {
      const pa = nodePos(a), pb = nodePos(b);
      edges.push(`<line class="map-edge" x1="${pa.x + 41}" y1="${pa.y + 22}" x2="${pb.x + 41}" y2="${pb.y + 22}"/>`);
    }
  }
  const me = player(g);
  const nodes = AREAS.map(a => {
    const st = g.areas[a.id];
    const { x, y } = nodePos(a);
    const cls = [
      'map-node',
      st.locked ? 'locked' : '',
      g.warned[a.id] && !st.locked ? 'warn' : '',
      me.area === a.id ? 'here' : '',
      ui.selArea === a.id ? 'sel' : '',
    ].join(' ');
    const dots = g.survivors.filter(s => !s.dead && s.area === a.id && G.met(s))
      .map((s, i) => `<circle cx="${x + 10 + i * 11}" cy="${y + 34}" r="4" fill="${s.color}"/>`).join('');
    const cs = g.creatures.filter(c => c.area === a.id);
    const cMark = cs.length
      ? `<text x="${x + 74}" y="${y + 38}" text-anchor="end" fill="${cs.some(c => CREATURES[c.type].boss) ? '#ff8f6b' : '#c4573c'}" font-size="10">${cs.some(c => CREATURES[c.type].boss) ? '☠' : '⚠'}${cs.length}</text>`
      : '';
    const rally = g.rally === a.id ? `<text class="rally-flag" x="${x + 4}" y="${y + 12}">⚑</text>` : '';
    const star = a.lab ? `<text x="${x + 72}" y="${y + 14}" fill="#e0a458" font-size="10">★</text>` : '';
    return `<g class="${cls}" data-action="selarea" data-area="${a.id}">
      <rect x="${x}" y="${y}" width="82" height="44" rx="7"/>
      <text x="${x + 8}" y="${y + 17}" fill="${a.lab ? '#e0a458' : ''}">${SHORT[a.id]}</text>
      <text class="loot-count" x="${x + 8}" y="${y + 29}">${st.locked ? 'SEALED' : st.pool.length + ' items'}</text>
      ${dots}${cMark}${rally}${star}
    </g>`;
  }).join('');
  return `<h2>Lumen Ridge Island</h2>
    <svg id="map-svg" viewBox="0 0 420 384">
      <rect class="map-water" x="0" y="0" width="420" height="384" rx="14"/>
      <ellipse class="map-island" cx="210" cy="192" rx="204" ry="184"/>
      ${edges}${nodes}
    </svg>
    <div id="map-actions">${mapActionsHtml(g)}</div>`;
}

function mapActionsHtml(g) {
  const sel = ui.selArea;
  if (!sel) return `<span class="map-hint">Select an area — travel if it's next door, or rally your team to it.</span>`;
  const me = player(g);
  const st = g.areas[sel];
  const bits = [];
  const adj = G.neighbors(me.area).includes(sel);
  if (sel !== me.area && adj && !st.locked) {
    bits.push(`<button class="btn" data-action="move" data-area="${sel}">Travel to ${SHORT[sel]} <span class="cost">−${COSTS.move} SP</span></button>`);
  }
  if (!st.locked) {
    bits.push(g.rally === sel
      ? `<button class="btn" data-action="rally" data-area="">Clear rally</button>`
      : `<button class="btn" data-action="rally" data-area="${sel}">⚑ Rally team here</button>`);
  }
  bits.push(`<span class="map-hint">${G.areaDef(sel).name}${st.locked ? ' — SEALED' : ` — ${st.pool.length} items left`}</span>`);
  return bits.join('');
}

// ---------------------------------------------------------------- center
function areaHtml(g) {
  const me = player(g);
  const a = G.areaDef(me.area);
  const [c1, c2] = HUES[me.area];
  const p = G.phase(g);
  const creatures = g.creatures.filter(c => c.area === me.area);
  const inBattle = creatures.length > 0 && !me.dead;
  const downedHere = g.survivors.find(s => s.downed && !s.dead && s.area === me.area);
  const here = g.survivors.filter(s => !s.dead && s.area === me.area);

  let actions = '';
  if (me.dead) {
    actions = `<span class="busy-label">You didn't make it. Your team fights on — watch, or start a new run.</span>`;
  } else if (me.downed) {
    actions = `<span class="busy-label" style="color:var(--ember)">YOU ARE DOWN — bleeding out in ${me.bleed}s. An ally can revive you.</span>`;
  } else if (me.busy) {
    const pct = Math.min(100, Math.round(100 * (1 - (me.busy.until - g.t) / (me.busy.dur || 1))));
    actions = `<div style="flex:1">
      <div class="busy-label">${busyLabel(me.busy)} — ${Math.max(0, me.busy.until - g.t)}s</div>
      <div class="busybar"><div style="width:${pct}%"></div></div></div>`;
  } else if (!inBattle) {
    const searchable = !g.areas[me.area].locked;
    actions = `
      <button class="btn primary big" data-action="search" ${searchable ? '' : 'disabled'}>Search <span class="cost">−${COSTS.search} SP · 2s</span></button>
      <button class="btn ${me.resting ? 'primary' : ''}" data-action="rest">${me.resting ? 'Resting… (tap to stop)' : 'Rest'}</button>
      ${downedHere && downedHere !== me ? `<button class="btn danger" data-action="revive">Revive ${downedHere.name}${G.invCount(me, 'bandage') ? ' (bandage, 3s)' : ' (6s)'}</button>` : ''}
    `;
  }

  const allies = here.map(s => `<div class="occ-row"><span class="dot" style="background:${s.color}"></span>
      ${s.name}${s.i === 0 ? ' (you)' : ''}${s.downed ? ' — DOWN' : ''}${s.i === 0 && s.guarding ? ' 🛡' : ''}
      <div class="hpbar"><div style="width:${(100 * s.hp / s.maxHp)}%"></div></div></div>`).join('');

  return `
    <div id="area-card" class="${inBattle ? 'battle' : ''}">
      <div id="area-art" style="background:linear-gradient(135deg, ${c1}, ${c2})${p.night ? ',#000' : ''}">
        <h1>${a.name}</h1>
        <div class="sub">${AREA_FLAVOR[me.area]}${p.night ? ' · night' : ''}</div>
      </div>
      <div id="area-body">
        ${inBattle ? battleHtml(g, me, creatures) : ''}
        <div id="area-actions">${actions}</div>
        ${me.area === 'lab' ? beaconHtml(g, me) : ''}
        <div class="occupants">${allies || '<span class="busy-label">Nobody else here.</span>'}</div>
      </div>
    </div>`;
}

// JRPG-style encounter panel: pick a target, then Attack / Guard / Item / Flee.
function battleHtml(g, me, creatures) {
  if (!creatures.some(c => c.id === ui.selTarget)) {
    ui.selTarget = creatures.reduce((m, c) => (c.hp < m.hp ? c : m)).id;
  }
  const targets = creatures.map(c => {
    const d = CREATURES[c.type];
    return `<button class="target-row ${c.id === ui.selTarget ? 'sel' : ''} ${d.boss ? 'boss' : ''}" data-action="target" data-cid="${c.id}">
      <span class="tname">${d.boss ? '☠' : '⚠'} ${d.name}</span>
      <span class="tstat">ATK ${d.atk}</span>
      <div class="hpbar big"><div style="width:${100 * c.hp / d.hp}%"></div></div>
      <span class="tstat">${c.hp}/${d.hp}</span>
    </button>`;
  }).join('');

  let controls = '';
  if (!me.downed && !me.dead && !me.busy) {
    const cd = Math.max(0, me.atkCd - g.t);
    const heal = me.inv.map(e => ITEMS[e.id]).filter(d => (d.cat === 'food' || d.cat === 'med') && d.hp)
      .sort((x, y) => y.hp - x.hp)[0];
    const healId = heal ? me.inv.find(e => ITEMS[e.id] === heal).id : null;
    const eatCd = Math.max(0, me.eatCd - g.t);
    controls = `<div class="battle-actions">
      <button class="btn danger big" data-action="attack" ${cd ? 'disabled' : ''}>⚔ Attack${cd ? ` (${cd}s)` : ''} <span class="cost">ATK ${1 + (me.weapon ? ITEMS[me.weapon].atk : 0)}</span></button>
      <button class="btn ${me.guarding ? 'primary' : ''}" data-action="guard">🛡 ${me.guarding ? 'Guarding' : 'Guard'}</button>
      ${healId ? `<button class="btn" data-action="use" data-item="${healId}" ${eatCd ? 'disabled' : ''}>${ITEMS[healId].name} +${ITEMS[healId].hp}${eatCd ? ` (${eatCd}s)` : ''}</button>` : ''}
      <button class="btn" data-action="flee">Flee <span class="cost">−1 SP · 75%</span></button>
    </div>`;
  }

  const feed = g.log.filter(e => e.type === 'fight').slice(-4)
    .map(e => `<div>${esc(e.msg)}</div>`).join('');

  return `<div id="battle-box">
    <div class="battle-title">⚠ ENGAGED — ${creatures.length} hostile${creatures.length > 1 ? 's' : ''}</div>
    <div class="targets">${targets}</div>
    ${controls}
    <div class="battle-feed">${feed}</div>
  </div>`;
}

function beaconHtml(g, me) {
  const pips = BEACON_PARTS.map(pt =>
    `<span class="part-pip ${g.beacon.installed.includes(pt) ? 'in' : ''}">${ITEMS[pt].name}</span>`).join('');
  const carrying = BEACON_PARTS.some(pt => G.invCount(me, pt) > 0) || G.invCount(me, 'wardencore') > 0;
  let action = '';
  if (g.beacon.started) {
    action = `<div class="busy-label">EXTRACTION IN ${DEFEND_TIME - g.beacon.charge}s — HOLD!</div>
      <div class="chargebar"><div style="width:${100 * g.beacon.charge / DEFEND_TIME}%"></div></div>`;
  } else if (carrying && g.beacon.installed.length < 3 && !me.busy && !me.downed && !me.dead) {
    action = `<button class="btn primary" data-action="install">Install part (2s)</button>`;
  } else if (G.canFire(g)) {
    const away = g.survivors.filter(s => !s.dead && s.area !== 'lab');
    action = `<button class="btn danger big" data-action="fire">FIRE THE BEACON</button>
      ${away.length ? `<div class="busy-label">Not here yet: ${away.map(s => s.name).join(', ')} — anyone left outside faces the waves alone.</div>` : ''}`;
  } else if (g.beacon.installed.length >= 3) {
    action = `<div class="busy-label">Beacon ready. Grid power comes online at ${G.fmtT(FIRE_AT)}.</div>`;
  }
  return `<div id="beacon-box"><b>Extraction Beacon</b><div class="parts">${pips}</div>${action}</div>`;
}

function busyLabel(b) {
  return { search: 'Searching', move: 'Moving', revive: 'Reviving', install: 'Installing', stumble: 'Recovering' }[b.kind] || b.kind;
}

// ---------------------------------------------------------------- side
function partyPanelHtml(g) {
  return `<h2>Party</h2>${g.survivors.map(s => partyCard(g, s)).join('')}`;
}
function packPanelHtml(g) {
  return `<h2>Your pack (${player(g).inv.length}/6)</h2>
    ${gearHtml(player(g))}
    <div id="inv-grid">${invHtml(g)}</div>
    <div id="item-actions">${itemActionsHtml(g)}</div>`;
}
function craftPanelHtml(g) {
  return `<h2>Field guide — combine 2 items</h2>
    <div id="craft-list" data-keep-scroll>${craftHtml(g)}</div>
    <div id="track-hint">${trackHintHtml(g)}</div>`;
}

function partyCard(g, s) {
  if (!G.met(s)) {
    return `<div class="party-card unmet ${s.dead ? 'dead' : ''}">
      <div class="pc-head"><span class="dot" style="background:${s.color};opacity:.4"></span>
        <span class="nm">${s.name}</span>
        <span class="where">NO CONTACT</span></div>
      <div class="pc-status" style="color:var(--faint)">${s.dead ? 'Their flare went dark.' : `Last flare seen to the <b>${s.flareDir}</b>. Reach them to sync radios.`}</div>
    </div>`;
  }
  const cls = ['party-card', s.downed ? 'downed' : '', s.dead ? 'dead' : ''].join(' ');
  let status = '';
  if (s.dead) status = 'dead';
  else if (s.downed) status = `DOWN — bleeds out in ${s.bleed}s`;
  else if (s.busy) status = `${busyLabel(s.busy)}…`;
  else if (s.resting) status = 'resting';
  return `<div class="${cls}">
    <div class="pc-head"><span class="dot" style="background:${s.color}"></span>
      <span class="nm">${s.name}${s.i === 0 ? ' (you)' : ''}</span>
      <span class="where">${SHORT[s.area]}</span></div>
    <div class="pc-bars">
      <div class="bar hp"><div style="width:${100 * s.hp / s.maxHp}%"></div><span>${s.hp}/${s.maxHp}</span></div>
      <div class="bar sp"><div style="width:${100 * s.sp / s.maxSp}%"></div><span>${s.sp}</span></div>
    </div>
    <div class="pc-gear">
      <span class="gear-chip">⚔ <b>${s.weapon ? ITEMS[s.weapon].name : 'fists'}</b> +${s.weapon ? ITEMS[s.weapon].atk : 0}</span>
      <span class="gear-chip">🛡 <b>${s.armor ? ITEMS[s.armor].name : '—'}</b> ${s.armor ? '+' + ITEMS[s.armor].arm : ''}</span>
      ${s.i !== 0 && !s.dead ? `<span class="gear-chip">${s.inv.map(e => `${ITEMS[e.id].name}${e.qty > 1 ? '×' + e.qty : ''}`).join(', ') || 'empty pack'}</span>` : ''}
    </div>
    ${status ? `<div class="pc-status">${status}</div>` : ''}
  </div>`;
}

function gearHtml(me) {
  return `<div class="pc-gear" style="margin-bottom:6px">
    <span class="gear-chip">⚔ <b>${me.weapon ? ITEMS[me.weapon].name : 'fists'}</b> ATK ${1 + (me.weapon ? ITEMS[me.weapon].atk : 0)}</span>
    <span class="gear-chip">🛡 <b>${me.armor ? ITEMS[me.armor].name : 'no armor'}</b> ${me.armor ? '+' + ITEMS[me.armor].arm : ''}</span>
  </div>`;
}

function invHtml(g) {
  const me = player(g);
  const slots = me.inv.map(e => {
    const d = ITEMS[e.id];
    return `<button class="inv-slot ${ui.selItem === e.id ? 'sel' : ''}" data-action="selitem" data-item="${e.id}">
      ${d.name}${e.qty > 1 ? ` <span class="qty">×${e.qty}</span>` : ''}
      <span class="fx">${d.desc || ''}</span></button>`;
  });
  while (slots.length < 6) slots.push(`<div class="inv-slot empty">empty</div>`);
  return slots.join('');
}

function itemActionsHtml(g) {
  const me = player(g);
  const id = ui.selItem;
  if (!id || !G.invCount(me, id)) return '';
  const d = ITEMS[id];
  const bits = [];
  if (d.cat === 'food' || d.cat === 'med') {
    const cd = g.t < me.eatCd ? ` (${me.eatCd - g.t}s)` : '';
    bits.push(`<button class="btn" data-action="use" data-item="${id}" ${cd ? 'disabled' : ''}>Use${cd}</button>`);
  }
  for (const s of g.survivors) {
    if (s.i === 0 || s.dead || s.area !== me.area) continue;
    bits.push(`<button class="btn" data-action="give" data-item="${id}" data-target="${s.i}">Give → ${s.name}</button>`);
  }
  bits.push(`<button class="btn" data-action="drop" data-item="${id}">Drop</button>`);
  return bits.join('');
}

function craftHtml(g) {
  const me = player(g);
  const groups = { weapon: 'Weapons', armor: 'Armor', food: 'Food & medicine', med: 'Food & medicine', part: 'Beacon', special: 'Tools' };
  const byGroup = {};
  for (const r of RECIPES) {
    const gname = groups[ITEMS[r.out].cat] || 'Other';
    (byGroup[gname] ??= []).push(r);
  }
  let html = '';
  for (const [gname, rs] of Object.entries(byGroup)) {
    html += `<div class="craft-group">${gname}</div>`;
    for (const r of rs) {
      const d = ITEMS[r.out];
      const haveA = G.hasItem(me, r.a), haveB = G.hasItem(me, r.b);
      const ok = haveA && haveB && !me.busy && !me.downed && !me.dead;
      const stat = d.atk ? `+${d.atk} ATK` : d.arm ? `+${d.arm} armor` : d.hp ? `+${d.hp} HP` : d.sp ? `+${d.sp} SP` : '';
      html += `<div class="recipe ${ok ? 'ok' : ''}">
        <span class="out">${d.name}</span><span class="stat">${stat}</span>
        <span class="ing"><span class="${haveA ? 'have' : ''}">${ITEMS[r.a].name}</span> + <span class="${haveB ? 'have' : ''}">${ITEMS[r.b].name}</span></span>
        <button class="hint-btn" data-action="track" data-item="${r.out}" title="Track: where to find the materials">${ui.track === r.out ? '◉' : '◎'}</button>
        ${ok ? `<button class="btn craft-btn" data-action="craft" data-item="${r.out}">Craft</button>` : ''}
      </div>`;
    }
  }
  return html;
}

function trackHintHtml(g) {
  if (!ui.track) return 'Tap ◎ on a recipe to track it — your searches will favor its materials.';
  const me = player(g);
  const missing = [];
  (function walk(id, depth) {
    if (depth > 5) return;
    const r = recipeFor[id];
    if (!r) { if (!G.hasItem(me, id)) missing.push(id); return; }
    for (const ing of [r.a, r.b]) if (!G.hasItem(me, ing)) walk(ing, depth + 1);
  })(ui.track, 0);
  if (!missing.length) return `Tracking ${ITEMS[ui.track].name}: you have everything — craft it!`;
  return `Tracking ${ITEMS[ui.track].name} — find: ` +
    missing.map(id => `<b>${ITEMS[id].name}</b> (${sourceText(id)})`).join(' · ');
}

// ---------------------------------------------------------------- overlays
let overlayMode = 'intro'; // intro | none | over | help
export function setOverlay(mode) { overlayMode = mode; }
export function overlayOpen() { return overlayMode !== 'none'; }

function renderOverlay(g) {
  const el = document.getElementById('overlay');
  if (g.over && overlayMode !== 'help') overlayMode = 'over';
  if (overlayMode === 'none') { el.hidden = true; return; }
  el.hidden = false;
  if (overlayMode === 'intro' || overlayMode === 'help') {
    el.innerHTML = `<div class="modal">
      <h1>Cinder Isle</h1>
      <p class="tagline">Four survivors. Opposite corners. One way off the island.</p>
      <p>The transport went down over an abandoned island experiment. You and three AI companions are scattered to its corners, and the island's security grid — and its wildlife — get meaner every phase.</p>
      <ul>
        <li><b>Search</b> your area (tap the big button) to find items. Every area holds different, limited loot.</li>
        <li><b>Combine any 2 items</b> in the field guide to craft better gear — weapons run +1 to +7.</li>
        <li><b>Find your teammates.</b> Their drop flares mark a rough direction; until you physically meet, you have no radio contact — no position, no vitals. Once met, they answer your rally (tap any map area), fight beside you, share food, and revive you when you fall.</li>
        <li><b>Escape:</b> install the 3 beacon parts at the central Lab, then — once grid power comes online at ${G.fmtT(FIRE_AT)} — gather everyone and fire it, and hold the Lab while it charges.</li>
        <li>Watch the clock: at ${G.fmtT(23 * 60)} the island starts sealing areas from the rim inward, and at ${G.fmtT(PURGE_AT)} the purge ends the run.</li>
      </ul>
      <p class="footnote">Stamina fuels every action — resting or drinks restore it. At 0 you burn health instead. If a companion goes down, someone has ${90}s to reach them.</p>
      <div class="btn-row">
        <button class="btn primary big" data-action="closeoverlay">${overlayMode === 'help' ? 'Back' : g.t > 5 ? 'Resume run' : 'Drop in'}</button>
        ${overlayMode === 'help' ? '' : `<button class="btn" data-action="newrun-seed">New run (fresh island)</button>`}
      </div>
    </div>`;
    return;
  }
  // game over
  const o = g.over;
  const alive = g.survivors.filter(s => !s.dead);
  el.innerHTML = `<div class="modal">
    <h1 class="${o.win ? 'win' : 'lose'}">${o.win ? 'EXTRACTED' : 'RUN OVER'}</h1>
    <p class="tagline">${esc(o.detail)}</p>
    <div class="stats">
      time <b>${G.fmtT(o.t)}</b> · survivors <b>${alive.length}/4</b> · reunion <b>${g.reunion ? 'yes' : 'never'}</b><br>
      creatures slain <b>${g.stats.kills}</b> · items crafted <b>${g.stats.crafts}</b> · searches <b>${g.stats.searches}</b> · knockdowns <b>${g.stats.downs}</b>
    </div>
    <div class="btn-row">
      <button class="btn primary big" data-action="newrun-seed">Run it again</button>
    </div>
  </div>`;
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// ---------------------------------------------------------------- input
function onClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const g = getG();
  if (!g) return;
  const me = player(g);
  const act = el.dataset.action;
  switch (act) {
    case 'speed': ui.speed = +el.dataset.x; ui.paused = false; break;
    case 'pause': ui.paused = !ui.paused; break;
    case 'help': setOverlay('help'); break;
    case 'closeoverlay': setOverlay('none'); break;
    case 'newrun': case 'newrun-seed':
      if (act === 'newrun' && !g.over && !confirm('Abandon this run and start fresh?')) break;
      onNewGame(); break;
    case 'selarea': ui.selArea = ui.selArea === el.dataset.area ? null : el.dataset.area; break;
    case 'move': G.doMove(g, me, el.dataset.area); ui.selArea = null; break;
    case 'rally': G.setRally(g, el.dataset.area || null); break;
    case 'search': G.doSearch(g, me); break;
    case 'rest': G.toggleRest(g, me); break;
    case 'flee': G.doFlee(g, me); break;
    case 'target': ui.selTarget = +el.dataset.cid; break;
    case 'attack': G.doAttack(g, me, ui.selTarget); break;
    case 'guard': G.doGuard(g, me); break;
    case 'revive': G.doRevive(g, me); break;
    case 'install': G.doInstall(g, me); break;
    case 'fire': G.doStartBeacon(g, me); break;
    case 'selitem': ui.selItem = ui.selItem === el.dataset.item ? null : el.dataset.item; break;
    case 'craft': G.doCraft(g, me, el.dataset.item); break;
    case 'use': G.doEat(g, me, el.dataset.item); break;
    case 'give': G.doGive(g, me, +el.dataset.target, el.dataset.item); break;
    case 'drop': G.doDrop(g, me, el.dataset.item); break;
    case 'track': ui.track = ui.track === el.dataset.item ? null : el.dataset.item; break;
  }
  render(g);
}
