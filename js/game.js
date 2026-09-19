// Cinder Isle — core game engine. Pure logic, no DOM. Driven by tick(g) once per game-second.
import {
  AREAS, ITEMS, RECIPES, CREATURES, PHASES, SURVIVOR_DEFS, BEACON_PARTS,
  MAX_HP, MAX_SP, INV_SLOTS, COSTS, TIMES, BLEEDOUT, EAT_COOLDOWN,
  LOCKDOWN_AT, WARDEN_AT, PURGE_AT, FIRE_AT, LOCK_EVERY, LOCK_WARN, LOCK_DAMAGE,
  DEFEND_TIME, WAVE_EVERY, CREATURE_CAP,
} from './data.js';

// --- rng ---------------------------------------------------------------
function mulberry(seed) { return { s: seed >>> 0 }; }
export function rnd(g) {
  let t = (g.rng.s += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function pick(g, arr) { return arr[Math.floor(rnd(g) * arr.length)]; }

// --- map helpers -------------------------------------------------------
const byId = Object.fromEntries(AREAS.map(a => [a.id, a]));
export function areaDef(id) { return byId[id]; }
export function neighbors(id) {
  const a = byId[id];
  return AREAS.filter(b =>
    (Math.abs(b.col - a.col) === 1 && b.row === a.row) ||
    (Math.abs(b.row - a.row) === 1 && b.col === a.col)
  ).map(b => b.id);
}
export function bfsNext(g, from, to) {
  // next hop from -> to through unlocked areas; null if unreachable/same
  if (from === to) return null;
  const prev = { [from]: from };
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const n of neighbors(cur)) {
      if (prev[n] !== undefined || g.areas[n].locked) continue;
      prev[n] = cur;
      if (n === to) {
        let step = to;
        while (prev[step] !== from) step = prev[step];
        return step;
      }
      q.push(n);
    }
  }
  return null;
}
export function distTo(g, from, to) {
  if (from === to) return 0;
  const seen = { [from]: 0 };
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const n of neighbors(cur)) {
      if (seen[n] !== undefined || g.areas[n].locked) continue;
      seen[n] = seen[cur] + 1;
      if (n === to) return seen[n];
      q.push(n);
    }
  }
  return Infinity;
}

// --- setup -------------------------------------------------------------
export function createGame(seed = Date.now() % 2147483647) {
  const g = {
    seed, rng: mulberry(seed), t: 0, over: null,
    areas: {}, creatures: [], nextCreatureId: 1,
    survivors: [], rally: null, reunion: false,
    beacon: { installed: [], started: false, charge: 0, nextWave: 0 },
    lockOrder: null, lockIdx: 0, nextLockAt: null, warned: {},
    lastAmbient: 0, wardenSpawned: false,
    log: [], stats: { kills: 0, crafts: 0, searches: 0, downs: 0 },
  };
  for (const a of AREAS) g.areas[a.id] = { pool: [...a.pool], locked: false, searched: 0 };
  SURVIVOR_DEFS.forEach((d, i) => {
    g.survivors.push({
      i, name: d.name, color: d.color, isPlayer: i === 0,
      area: d.spawn, hp: MAX_HP, maxHp: MAX_HP, sp: MAX_SP, maxSp: MAX_SP,
      weapon: null, armor: null, inv: [],
      downed: false, bleed: 0, dead: false,
      busy: null, resting: false, eatCd: 0, atkCd: 0, guarding: false,
      ai: { mode: 'free', lastTalk: 0 },
    });
  });
  // everyone crawls out of the wreck with a crude weapon and a day's rations
  for (const s of g.survivors) {
    s.weapon = 'branch';
    addItem(g, s, 'berries');
    addItem(g, s, 'water');
  }
  log(g, 'sys', 'The transport went down over Cinder Isle. Four of you made it out — scattered to the corners of the island.');
  log(g, 'sys', 'Regroup. Repair the extraction beacon at the Research Lab. Get out together.');
  return g;
}

// --- logging -----------------------------------------------------------
export function log(g, type, msg) {
  g.log.push({ t: g.t, type, msg });
  if (g.log.length > 250) g.log.splice(0, g.log.length - 250);
}
export function fmtT(t) {
  const m = Math.floor(t / 60), s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- phase -------------------------------------------------------------
export function phase(g) {
  for (const p of PHASES) if (g.t < p.until) return p;
  return PHASES[PHASES.length - 1];
}

// --- inventory ---------------------------------------------------------
export function invCount(s, id) { const e = s.inv.find(x => x.id === id); return e ? e.qty : 0; }
export function hasItem(s, id) { return invCount(s, id) > 0 || s.weapon === id || s.armor === id; }
export function addItem(g, s, id) {
  const e = s.inv.find(x => x.id === id);
  if (e) { e.qty++; return true; }
  const def = ITEMS[id];
  // auto-equip upgrades without using a slot
  if (def.cat === 'weapon' && (!s.weapon || ITEMS[s.weapon].atk < def.atk)) {
    const old = s.weapon; s.weapon = id;
    if (old) return addItem(g, s, old) || (g.areas[s.area].pool.push(old), true);
    return true;
  }
  if (def.cat === 'armor' && (!s.armor || ITEMS[s.armor].arm < def.arm)) {
    const old = s.armor; s.armor = id;
    if (old) return addItem(g, s, old) || (g.areas[s.area].pool.push(old), true);
    return true;
  }
  if (s.inv.length >= INV_SLOTS) return false;
  s.inv.push({ id, qty: 1 });
  return true;
}
export function removeItem(s, id) {
  const idx = s.inv.findIndex(x => x.id === id);
  if (idx < 0) return false;
  if (--s.inv[idx].qty <= 0) s.inv.splice(idx, 1);
  return true;
}
export function atk(s) { return 1 + (s.weapon ? ITEMS[s.weapon].atk : 0); }
export function armor(s) { return s.armor ? ITEMS[s.armor].arm : 0; }

function paySp(g, s, cost) {
  if (s.sp >= cost) { s.sp -= cost; return; }
  s.sp = 0;
  s.hp -= cost;
  if (s.isPlayer) log(g, 'warn', 'You are exhausted — pushing on costs health.');
  checkDown(g, s, 'exhaustion');
}

// --- actions (used by both UI and AI) ---------------------------------
function canAct(g, s) { return !g.over && !s.dead && !s.downed && !s.busy; }

export function doSearch(g, s) {
  if (!canAct(g, s)) return false;
  s.resting = false; s.guarding = false;
  paySp(g, s, COSTS.search);
  s.busy = { kind: 'search', until: g.t + TIMES.search, dur: TIMES.search };
  return true;
}
export function doMove(g, s, dest) {
  if (!canAct(g, s)) return false;
  if (!neighbors(s.area).includes(dest) || g.areas[dest].locked) return false;
  s.resting = false; s.guarding = false;
  paySp(g, s, COSTS.move);
  s.busy = { kind: 'move', until: g.t + TIMES.move, dur: TIMES.move, dest };
  return true;
}
export function doCraft(g, s, out) {
  if (!canAct(g, s)) return false;
  const r = RECIPES.find(x => x.out === out);
  if (!r || !hasItem(s, r.a) || !hasItem(s, r.b)) return false;
  for (const ing of [r.a, r.b]) {
    if (!removeItem(s, ing)) { // ingredient is equipped (upgrading equipped weapon)
      if (s.weapon === ing) s.weapon = null;
      else if (s.armor === ing) s.armor = null;
    }
  }
  if (!addItem(g, s, out)) { g.areas[s.area].pool.push(out); log(g, 'warn', `${s.name} crafted ${ITEMS[out].name} but had no room — left it here.`); }
  else log(g, 'craft', `${s.name} crafted ${ITEMS[out].name}.`);
  g.stats.crafts++;
  return true;
}
export function doEat(g, s, id) {
  if (g.over || s.dead || s.downed) return false;
  if (g.t < s.eatCd) return false;
  const def = ITEMS[id];
  if (!def || (def.cat !== 'food' && def.cat !== 'med') || !removeItem(s, id)) return false;
  if (def.hp) s.hp = Math.min(s.maxHp, s.hp + def.hp);
  if (def.sp) s.sp = Math.min(s.maxSp, s.sp + def.sp);
  s.eatCd = g.t + EAT_COOLDOWN;
  return true;
}
export function doGive(g, s, targetIdx, id) {
  const t = g.survivors[targetIdx];
  if (!t || t.dead || t.area !== s.area || invCount(s, id) < 1) return false;
  if (!addItem(g, t, id)) return false;
  removeItem(s, id);
  log(g, 'coop', `${s.name} gave ${ITEMS[id].name} to ${t.name}.`);
  return true;
}
export function doRevive(g, s) {
  if (!canAct(g, s)) return false;
  const target = g.survivors.find(x => x.downed && !x.dead && x.area === s.area);
  if (!target) return false;
  s.resting = false;
  const fast = invCount(s, 'bandage') > 0;
  const dur = fast ? TIMES.reviveBandage : TIMES.revive;
  s.busy = { kind: 'revive', until: g.t + dur, dur, target: target.i, fast };
  return true;
}
export function doFlee(g, s) {
  if (!canAct(g, s)) return false;
  s.resting = false; s.guarding = false;
  paySp(g, s, 1);
  const exits = neighbors(s.area).filter(n => !g.areas[n].locked);
  if (exits.length && rnd(g) < 0.75) {
    const dest = pick(g, exits);
    s.area = dest;
    log(g, 'fight', `${s.name} broke away and fled to ${areaDef(dest).name}.`);
  } else {
    s.busy = { kind: 'stumble', until: g.t + TIMES.flee, dur: TIMES.flee };
    log(g, 'fight', `${s.name} tried to flee but couldn't get away!`);
  }
  return true;
}
export function doInstall(g, s) {
  if (!canAct(g, s) || s.area !== 'lab') return false;
  const part = BEACON_PARTS.find(p => invCount(s, p) > 0 && !g.beacon.installed.includes(p));
  const core = invCount(s, 'wardencore') > 0;
  if (!part && !core) return false;
  s.resting = false;
  s.busy = { kind: 'install', until: g.t + TIMES.install, dur: TIMES.install, part: part || 'wardencore' };
  return true;
}
export function canFire(g) {
  return g.t >= FIRE_AT && g.beacon.installed.length >= BEACON_PARTS.length && !g.beacon.started;
}
export function doStartBeacon(g, s) {
  if (!canAct(g, s) || s.area !== 'lab') return false;
  if (!canFire(g)) return false;
  g.beacon.started = true;
  g.beacon.charge = 0;
  g.beacon.nextWave = g.t + 4;
  log(g, 'sys', `BEACON FIRED. Extraction in ${DEFEND_TIME} seconds — hold the Lab! Everything on the island is coming.`);
  return true;
}
// Player battle actions (JRPG encounter mode — companions swing automatically)
export function doAttack(g, s, creatureId) {
  if (!canAct(g, s) || g.t < s.atkCd) return false;
  let target = g.creatures.find(c => c.id === creatureId && c.area === s.area);
  if (!target) target = g.creatures.filter(c => c.area === s.area).reduce((m, c) => (!m || c.hp < m.hp ? c : m), null);
  if (!target) return false;
  s.resting = false; s.guarding = false;
  s.atkCd = g.t + 2;
  const def = CREATURES[target.type];
  if (rnd(g) < 0.85) {
    let dmg = Math.max(1, atk(s) - def.arm);
    const crit = rnd(g) < 0.05;
    if (crit) dmg *= 2;
    target.hp -= dmg;
    log(g, 'fight', `You ${crit ? 'CRIT' : 'hit'} the ${def.name} for ${dmg}.`);
    if (target.hp <= 0) creatureDeath(g, target, s);
  } else {
    log(g, 'fight', `You swing at the ${def.name} — miss!`);
  }
  return true;
}
export function doGuard(g, s) {
  if (!canAct(g, s)) return false;
  s.resting = false;
  s.guarding = true;
  log(g, 'fight', 'You brace behind your guard (damage halved until your next move).');
  return true;
}
export function doDrop(g, s, id) {
  if (g.over || s.dead || !removeItem(s, id)) return false;
  g.areas[s.area].pool.push(id);
  return true;
}
export function setRally(g, areaId) {
  g.rally = areaId;
  if (areaId) log(g, 'coop', `Rally point set: ${areaDef(areaId).name}.`);
  else log(g, 'coop', 'Rally cleared — companions are free-roaming.');
}
export function toggleRest(g, s) {
  if (!canAct(g, s)) return false;
  s.resting = !s.resting;
  return true;
}

// --- damage / downed ---------------------------------------------------
function checkDown(g, s, cause) {
  if (s.hp > 0 || s.downed || s.dead) return;
  s.hp = 0; s.downed = true; s.bleed = BLEEDOUT; s.busy = null; s.resting = false;
  g.stats.downs++;
  log(g, 'warn', `${s.name} is DOWN (${cause}). ${BLEEDOUT}s to bleed out — someone get there!`);
  if (g.survivors.every(x => x.dead || x.downed)) {
    end(g, false, 'No one left standing. The island keeps its secrets.');
  }
}
function kill(g, s, cause) {
  if (s.dead) return;
  s.dead = true; s.downed = false;
  // drop everything where they fell
  const pool = g.areas[s.area].pool;
  for (const e of s.inv) for (let k = 0; k < e.qty; k++) pool.push(e.id);
  if (s.weapon) pool.push(s.weapon);
  if (s.armor) pool.push(s.armor);
  s.inv = []; s.weapon = null; s.armor = null;
  log(g, 'warn', `${s.name} died — ${cause}. Their gear is at ${areaDef(s.area).name}.`);
  if (g.survivors.every(x => x.dead)) end(g, false, 'The whole team is gone.');
  else if (g.survivors.every(x => x.dead || x.downed)) end(g, false, 'No one left standing.');
}
function end(g, win, detail) {
  if (g.over) return;
  g.over = { win, detail, t: g.t };
  log(g, 'sys', win ? `EXTRACTION COMPLETE at ${fmtT(g.t)}. ${detail}` : `RUN OVER at ${fmtT(g.t)}. ${detail}`);
}

// --- creatures ---------------------------------------------------------
function spawnCreature(g, type, area, force = false) {
  if (!force && g.creatures.length >= CREATURE_CAP && !CREATURES[type].boss) return null;
  const c = { id: g.nextCreatureId++, type, area, hp: CREATURES[type].hp };
  g.creatures.push(c);
  return c;
}
function creatureDeath(g, c, killer) {
  g.creatures = g.creatures.filter(x => x.id !== c.id);
  g.stats.kills++;
  const def = CREATURES[c.type];
  const drops = [...def.drops];
  if (def.rare && rnd(g) < def.rareChance) drops.push(def.rare);
  for (const d of drops) {
    if (!killer || killer.dead || !addItem(g, killer, d)) g.areas[c.area].pool.push(d);
  }
  const who = killer ? killer.name : 'The party';
  log(g, 'fight', `${who} killed the ${def.name}${drops.length ? ` (${drops.map(d => ITEMS[d].name).join(', ')})` : ''}.`);
  if (def.boss) log(g, 'sys', 'The Warden is dead. Its Prototype Core can stand in for any beacon part.');
}

// --- per-second tick ---------------------------------------------------
export function tick(g) {
  if (g.over) return;
  g.t++;
  const p = phase(g);

  // finish busy actions
  for (const s of g.survivors) {
    if (s.dead || s.downed || !s.busy || g.t < s.busy.until) continue;
    const b = s.busy; s.busy = null;
    if (b.kind === 'move') {
      if (!g.areas[b.dest].locked) s.area = b.dest;
    } else if (b.kind === 'search') {
      resolveSearch(g, s, p);
    } else if (b.kind === 'revive') {
      const t = g.survivors[b.target];
      if (t && t.downed && !t.dead && t.area === s.area) {
        t.downed = false; t.hp = b.fast ? 8 : 4;
        if (b.fast) removeItem(s, 'bandage');
        log(g, 'coop', `${s.name} got ${t.name} back on their feet${b.fast ? ' (bandaged)' : ''}.`);
      }
    } else if (b.kind === 'install') {
      const partId = b.part === 'wardencore'
        ? BEACON_PARTS.find(x => !g.beacon.installed.includes(x))
        : b.part;
      if (partId && !g.beacon.installed.includes(partId) && removeItem(s, b.part)) {
        g.beacon.installed.push(partId);
        log(g, 'sys', `${s.name} installed the ${ITEMS[b.part].name} (${g.beacon.installed.length}/${BEACON_PARTS.length} beacon parts).`);
      }
    }
  }

  // resting regen
  for (const s of g.survivors) {
    if (s.dead || s.downed || !s.resting || s.busy) continue;
    if (g.creatures.some(c => c.area === s.area)) { s.resting = false; continue; }
    s.sp = Math.min(s.maxSp, s.sp + 1);
    if (g.t % 3 === 0) s.hp = Math.min(s.maxHp, s.hp + 1);
  }

  // bleedout
  for (const s of g.survivors) {
    if (!s.downed || s.dead) continue;
    if (--s.bleed <= 0) kill(g, s, 'bled out');
  }

  // reunion check
  if (!g.reunion) {
    const alive = g.survivors.filter(s => !s.dead);
    if (alive.length && alive.every(s => s.area === alive[0].area && !s.downed)) {
      g.reunion = true;
      for (const s of alive) { s.maxHp += 2; s.hp = Math.min(s.maxHp, s.hp + 2); }
      log(g, 'sys', 'REUNITED. The four of you stand together for the first time. (+2 max HP for everyone.)');
      log(g, 'coop', 'Brick: "Right. Now we get off this rock — Lab, beacon, home."');
    }
  }

  // ambient creature spawns
  if (g.t - g.lastAmbient >= p.ambient) {
    g.lastAmbient = g.t;
    const open = AREAS.filter(a => !g.areas[a.id].locked && !a.lab);
    if (open.length) {
      const type = pick(g, p.spawns);
      const area = pick(g, open).id;
      spawnCreature(g, type, area);
    }
  }

  if (g.t === FIRE_AT) {
    log(g, 'sys', g.beacon.installed.length >= BEACON_PARTS.length
      ? 'The grid is diverting power to the Lab. THE BEACON CAN FIRE — gather everyone there.'
      : 'The grid is diverting power to the Lab. The beacon can fire once all 3 parts are installed.');
  }

  // Warden
  if (!g.wardenSpawned && g.t >= WARDEN_AT) {
    g.wardenSpawned = true;
    const open = AREAS.filter(a => !g.areas[a.id].locked && !a.lab && !a.spawn);
    const area = pick(g, open).id;
    spawnCreature(g, 'warden', area);
    log(g, 'sys', `Something enormous is loose. The WARDEN was last seen at ${areaDef(area).name}.`);
  }
  if (g.t % 45 === 0) {
    const w = g.creatures.find(c => c.type === 'warden');
    if (w && !g.survivors.some(s => !s.dead && s.area === w.area)) {
      const exits = neighbors(w.area).filter(n => !g.areas[n].locked);
      if (exits.length) { w.area = pick(g, exits); log(g, 'warn', `The Warden is moving — now near ${areaDef(w.area).name}.`); }
    }
  }
  // creature wander (non-boss, unengaged)
  if (g.t % 20 === 0) {
    for (const c of g.creatures) {
      if (CREATURES[c.type].boss) continue;
      if (g.survivors.some(s => !s.dead && s.area === c.area)) continue;
      if (rnd(g) < 0.3) {
        const exits = neighbors(c.area).filter(n => !g.areas[n].locked);
        if (exits.length) c.area = pick(g, exits);
      }
    }
  }

  // combat every 2s
  if (g.t % 2 === 0) combatTick(g);

  // lockdown
  if (g.t >= LOCKDOWN_AT) {
    if (!g.lockOrder) {
      const rest = AREAS.filter(a => !a.lab).map(a => a.id);
      // farthest from lab first; shuffle ties by sorting with jitter
      rest.sort((a, b) => (distTo(g, b, 'lab') + rnd(g) * 0.9) - (distTo(g, a, 'lab') + rnd(g) * 0.9));
      g.lockOrder = rest;
      g.nextLockAt = g.t + LOCK_EVERY;
      log(g, 'sys', 'LOCKDOWN. The island security grid is sealing areas, outermost first. Converge on the Lab.');
    }
    const nxt = g.lockOrder[g.lockIdx];
    if (nxt && !g.warned[nxt] && g.t >= g.nextLockAt - LOCK_WARN) {
      g.warned[nxt] = true;
      log(g, 'warn', `${areaDef(nxt).name} seals in ${LOCK_WARN} seconds.`);
    }
    if (nxt && g.t >= g.nextLockAt) {
      g.areas[nxt].locked = true;
      g.creatures = g.creatures.filter(c => c.area !== nxt);
      log(g, 'sys', `${areaDef(nxt).name} is sealed.`);
      // don't let a needed beacon material be entombed — the seal sweep pushes debris out
      const pendingMats = new Set(
        BEACON_PARTS.filter(pt => !g.beacon.installed.includes(pt))
          .flatMap(pt => { const r = RECIPES.find(x => x.out === pt); return [r.a, r.b, pt]; })
      );
      const stuck = g.areas[nxt].pool.filter(id => pendingMats.has(id));
      if (stuck.length) {
        const dest = neighbors(nxt).find(n => !g.areas[n].locked) || 'lab';
        for (const id of stuck) {
          g.areas[nxt].pool.splice(g.areas[nxt].pool.indexOf(id), 1);
          g.areas[dest].pool.push(id);
        }
        log(g, 'info', `The seal sweep pushed debris into ${areaDef(dest).name}.`);
      }
      for (const s of g.survivors) {
        if (s.dead || s.area !== nxt) continue;
        if (s.downed) { kill(g, s, 'sealed inside ' + areaDef(nxt).name); continue; }
        const step = bfsNext(g, s.area, 'lab') || neighbors(s.area).find(n => !g.areas[n].locked);
        s.hp -= LOCK_DAMAGE; s.busy = null;
        if (step) s.area = step;
        log(g, 'warn', `${s.name} was caught in the seal — collar shock (-${LOCK_DAMAGE} HP), thrown to ${areaDef(s.area).name}.`);
        checkDown(g, s, 'collar shock');
      }
      g.lockIdx++;
      g.nextLockAt = g.t + LOCK_EVERY;
    }
  }

  // beacon defense
  if (g.beacon.started && !g.over) {
    g.beacon.charge++;
    if (g.t >= g.beacon.nextWave && g.beacon.charge < DEFEND_TIME - 4) {
      g.beacon.nextWave = g.t + WAVE_EVERY;
      const n = 2 + Math.floor(g.beacon.charge / 40);
      for (let k = 0; k < n; k++) spawnCreature(g, pick(g, ['wolf', 'dog', 'bear']), 'lab', true); // waves ignore the cap
      log(g, 'warn', `A wave crashes into the Lab! (${n} creatures)`);
    }
    if (g.beacon.charge >= DEFEND_TIME) {
      const standing = g.survivors.filter(s => !s.dead && !s.downed);
      const survivors = g.survivors.filter(s => !s.dead);
      end(g, true, `${survivors.length} of 4 made it to the extraction craft${standing.length < survivors.length ? ' (carrying the wounded)' : ''}.`);
    }
  }

  // purge deadline
  if (g.t >= PURGE_AT && !g.beacon.started) {
    end(g, false, 'The island purge protocol fired before the beacon did.');
  }
}

function resolveSearch(g, s, p) {
  g.stats.searches++;
  const areaState = g.areas[s.area];
  areaState.searched++;
  // encounter first, BS-style
  if (rnd(g) < p.encounter) {
    const type = pick(g, p.spawns);
    const c = spawnCreature(g, type, s.area);
    if (c) { log(g, 'fight', `${s.name} stumbled onto a ${CREATURES[type].name} at ${areaDef(s.area).name}!`); return; }
  }
  if (!areaState.pool.length) {
    if (s.isPlayer) log(g, 'info', `${areaDef(s.area).name} is picked clean.`);
    return;
  }
  let chance = p.night ? 0.55 : 0.7;
  if (p.night && hasItem(s, 'torch')) chance += 0.2;
  if (rnd(g) < chance) {
    // rummage with intent: something you're hunting for is easier to spot
    const wants = s.ai && s.ai.wants;
    const wanted = wants ? areaState.pool.filter(x => wants.has(x) && !hasItem(s, x)) : [];
    let idx;
    if (wanted.length && rnd(g) < 0.5) {
      const target = wanted[Math.floor(rnd(g) * wanted.length)];
      idx = areaState.pool.indexOf(target);
    } else {
      idx = Math.floor(rnd(g) * areaState.pool.length);
    }
    const id = areaState.pool[idx];
    if (addItem(g, s, id)) {
      areaState.pool.splice(idx, 1);
      log(g, s.isPlayer ? 'find' : 'info', `${s.name} found ${ITEMS[id].name} at ${areaDef(s.area).name}.`);
    } else if (s.isPlayer) {
      log(g, 'warn', `Found ${ITEMS[id].name}, but your pack is full (6 slots).`);
    }
  } else if (s.isPlayer) {
    log(g, 'info', 'Searched… nothing this time.');
  }
}

function combatTick(g) {
  // group by area
  for (const a of AREAS) {
    const cs = g.creatures.filter(c => c.area === a.id);
    if (!cs.length) continue;
    const here = g.survivors.filter(s => !s.dead && s.area === a.id);
    const standing = here.filter(s => !s.downed);
    if (!here.length) continue;
    // creatures attack (prefer standing targets)
    for (const c of cs) {
      const targets = standing.length ? standing : [];
      if (!targets.length) continue; // won't finish off the downed — revive window
      const t = pick(g, targets);
      if (rnd(g) < 0.85) {
        let dmg = Math.max(1, CREATURES[c.type].atk - armor(t));
        if (t.guarding) dmg = Math.max(1, Math.floor(dmg / 2));
        t.hp -= dmg;
        if (t.isPlayer) log(g, 'fight', `${CREATURES[c.type].name} hits you for ${dmg}${t.guarding ? ' (guarded)' : ''}.`);
        checkDown(g, t, CREATURES[c.type].name);
      } else if (t.isPlayer) {
        log(g, 'fight', `${CREATURES[c.type].name} lunges at you — misses.`);
      }
    }
    // companions strike back automatically; the player fights via battle actions
    const alive = () => g.creatures.filter(c => c.area === a.id);
    for (const s of standing) {
      if (s.hp <= 0 || s.busy?.kind === 'stumble') continue;
      if (s.isPlayer && !g.autopilot) continue;
      const pool2 = alive();
      if (!pool2.length) break;
      const target = pool2.reduce((m, c) => (c.hp < m.hp ? c : m));
      if (rnd(g) < 0.85) {
        let dmg = Math.max(1, atk(s) - CREATURES[target.type].arm);
        if (rnd(g) < 0.05) { dmg *= 2; if (s.isPlayer) log(g, 'fight', 'Critical hit!'); }
        target.hp -= dmg;
        if (target.hp <= 0) creatureDeath(g, target, s);
      }
    }
  }
}

// --- serialization for saves / hot-reload ------------------------------
export function serialize(g) { return JSON.stringify(g); }
export function deserialize(str) { return JSON.parse(str); }
