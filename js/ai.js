// Cinder Isle — companion AI. One decision per free moment (call ~every 2s per survivor).
// Also drives the player in headless autopilot sims.
import { AREAS, ITEMS, RECIPES, CREATURES, SURVIVOR_DEFS, BEACON_PARTS, INV_SLOTS, LOCKDOWN_AT } from './data.js';
import {
  neighbors, bfsNext, distTo, invCount, hasItem, atk, canFire,
  doSearch, doMove, doCraft, doEat, doGive, doRevive, doFlee, doInstall, doStartBeacon,
  removeItem, log, rnd, areaDef,
} from './game.js';
import { FIRE_AT } from './data.js';

const recipeFor = Object.fromEntries(RECIPES.map(r => [r.out, r]));
function pendingPartMats(g) {
  const set = new Set();
  for (const p of BEACON_PARTS) {
    if (g.beacon.installed.includes(p)) continue;
    set.add(recipeFor[p].a); set.add(recipeFor[p].b);
  }
  return set;
}

function wishlist(g, s) {
  const d = SURVIVOR_DEFS[s.i];
  const [t1, t2, t3] = d.weaponLine;
  const list = [];
  if (d.part) list.push(d.part); // the shared goal comes first — a branch will do for now
  list.push(t1);
  // adopt beacon parts whose assigned crafter is dead (or that nobody is on)
  for (const p of BEACON_PARTS) {
    if (list.includes(p) || g.beacon.installed.includes(p)) continue;
    const ownerDef = SURVIVOR_DEFS.findIndex(x => x.part === p);
    const owner = ownerDef >= 0 ? g.survivors[ownerDef] : null;
    const carried = g.survivors.some(x => !x.dead && invCount(x, p) > 0);
    if (!carried && (!owner || owner.dead)) list.push(p);
  }
  list.push('clothvest', t2, 'leathercoat', t3, 'scrapmail');
  return list;
}

function owned(g, s, id) {
  if (BEACON_PARTS.includes(id) && g.beacon.installed.includes(id)) return true;
  if (ITEMS[id].cat === 'weapon') return atk(s) - 1 >= ITEMS[id].atk; // any equal/better weapon counts
  if (ITEMS[id].cat === 'armor' && s.armor) return ITEMS[s.armor].arm >= ITEMS[id].arm;
  return hasItem(s, id);
}

// What base material should I chase to eventually get `id`? Returns
// {craft: out} | {find: baseId} | null (unobtainable right now).
function nextStep(g, s, id, depth = 0) {
  if (depth > 5) return null;
  const r = recipeFor[id];
  if (!r) {
    // base material: findable in some unlocked pool?
    const anywhere = AREAS.some(a => !g.areas[a.id].locked && g.areas[a.id].pool.includes(id));
    return anywhere ? { find: id } : null;
  }
  if (hasItem(s, r.a) && hasItem(s, r.b)) return { craft: id };
  for (const ing of [r.a, r.b]) {
    if (hasItem(s, ing)) continue;
    const step = nextStep(g, s, ing, depth + 1);
    if (step) return step;
  }
  return null;
}

function nearestAreaWith(g, from, id) {
  let best = null, bestD = Infinity;
  for (const a of AREAS) {
    if (g.areas[a.id].locked || !g.areas[a.id].pool.includes(id)) continue;
    const d = distTo(g, from, a.id);
    if (d < bestD) { bestD = d; best = a.id; }
  }
  return best;
}

function bestHeal(s) {
  let best = null, v = 0;
  for (const e of s.inv) {
    const d = ITEMS[e.id];
    if ((d.cat === 'food' || d.cat === 'med') && (d.hp || 0) > v) { v = d.hp; best = e.id; }
  }
  return best;
}
function bestSp(s) {
  let best = null, v = 0;
  for (const e of s.inv) {
    const d = ITEMS[e.id];
    if (d.cat === 'food' && (d.sp || 0) > v) { v = d.sp; best = e.id; }
  }
  return best;
}

function dropJunk(g, s, needs) {
  if (s.inv.length < INV_SLOTS) return;
  for (const e of [...s.inv]) {
    const d = ITEMS[e.id];
    if (d.cat === 'food' || d.cat === 'med' || d.cat === 'part') continue;
    if (needs.has(e.id)) continue;
    removeItem(s, e.id);
    g.areas[s.area].pool.push(e.id);
    return;
  }
  // still full: keep at most 2 kinds of food, ditch the weakest stack
  const foods = s.inv
    .filter(e => ITEMS[e.id].cat === 'food')
    .sort((a, b) => ((ITEMS[a.id].hp || 0) + (ITEMS[a.id].sp || 0)) - ((ITEMS[b.id].hp || 0) + (ITEMS[b.id].sp || 0)));
  if (foods.length > 2) {
    const e = foods[0];
    while (invCount(s, e.id) > 0) { removeItem(s, e.id); g.areas[s.area].pool.push(e.id); }
  }
}

function collectNeeds(s, id, needs, depth = 0) {
  if (depth > 5) return;
  const r = recipeFor[id];
  if (!r) { needs.add(id); return; }
  for (const ing of [r.a, r.b]) {
    if (hasItem(s, ing)) { needs.add(ing); continue; } // protect what we already hold
    collectNeeds(s, ing, needs, depth + 1);
  }
}
function neededMaterials(g, s) {
  // only the next few goals count — hoarding for the whole future wishlist
  // deadlocks the 6-slot pack
  // one goal at a time — a 6-slot pack can't hoard for three crafts at once
  const needs = new Set(['bandage', 'matches']);
  for (const id of wishlist(g, s)) {
    if (owned(g, s, id)) continue;
    collectNeeds(s, id, needs);
    break;
  }
  return needs;
}

function stepToward(g, s, dest) {
  if (s.area === dest) return false;
  const hop = bfsNext(g, s.area, dest);
  return hop ? doMove(g, s, hop) : false;
}

function chatter(g, s, topic) {
  const d = SURVIVOR_DEFS[s.i];
  if (!d.lines || g.t - s.ai.lastTalk < 60 || rnd(g) > 0.3) return;
  s.ai.lastTalk = g.t;
  log(g, 'coop', `${s.name}: "${d.lines[topic % d.lines.length]}"`);
}

export function aiDecide(g, s) {
  if (g.over || s.dead || s.downed || s.busy) return;
  const inCombat = g.creatures.some(c => c.area === s.area);
  const standingAllies = g.survivors.filter(x => x !== s && !x.dead && !x.downed && x.area === s.area);
  // what this survivor is hunting for — the engine biases their searches toward it
  s.ai.wants = neededMaterials(g, s);

  // 0. emergency eating (instant) any time
  if (s.hp <= Math.ceil(s.maxHp * 0.45)) {
    const h = bestHeal(s);
    if (h && doEat(g, s, h)) { if (!inCombat) return; }
  }

  // 1. combat posture
  if (inCombat) {
    s.resting = false;
    const defending = g.beacon.started && s.area === 'lab';
    const dangerous = g.creatures.some(c => c.area === s.area && CREATURES[c.type].atk >= 3);
    const bossHere = g.creatures.some(c => c.area === s.area && CREATURES[c.type].boss);
    if (!defending && !standingAllies.length && (s.hp <= 5 || (dangerous && atk(s) < 6))) { doFlee(g, s); return; }
    if (!defending && bossHere && standingAllies.length < 2) { doFlee(g, s); return; }
    chatter(g, s, 1);
    return; // auto-combat swings for us; hold the line
  }

  // 2. revive downed ally here
  if (g.survivors.some(x => x.downed && !x.dead && x.area === s.area)) { doRevive(g, s); return; }

  // 3. head to a downed ally if reachable and close
  const downed = g.survivors.find(x => x.downed && !x.dead);
  if (downed && distTo(g, s.area, downed.area) <= 3) {
    chatter(g, s, 2);
    if (stepToward(g, s, downed.area)) return;
  }

  // 4. recover stamina
  if (s.sp <= 2) { s.resting = true; return; }
  if (s.resting) { if (s.sp < 10) return; s.resting = false; }

  // 5. beacon endgame: install, gather, defend
  const carryingPart = BEACON_PARTS.some(p => invCount(s, p) > 0) || invCount(s, 'wardencore') > 0;
  const allInstalled = g.beacon.installed.length >= BEACON_PARTS.length;
  if (s.area === 'lab' && carryingPart && !allInstalled) { doInstall(g, s); return; }
  if (g.beacon.started) { if (!stepToward(g, s, 'lab')) doSearch(g, s); return; }
  if (allInstalled && g.t >= FIRE_AT - 90) {
    // gather at the lab; autopilot player also fires the beacon when everyone's close
    if (s.area !== 'lab') { stepToward(g, s, 'lab'); return; }
    if (g.autopilot && canFire(g)) {
      const ready = g.survivors.filter(x => !x.dead).every(x => x.area === 'lab' || x.downed);
      if (ready) { doStartBeacon(g, s); return; }
    }
    if (g.areas.lab.pool.length && s.sp > 4) { doSearch(g, s); return; }
    s.resting = true; return;
  }
  if (carryingPart) { // deliver as soon as we have one — the Lab is central anyway
    chatter(g, s, 3);
    if (stepToward(g, s, 'lab')) return;
  }

  // 6. player rally
  if (g.rally && !s.isPlayer) {
    if (s.area !== g.rally) { chatter(g, s, 1); if (stepToward(g, s, g.rally)) return; }
    else {
      // at rally: make yourself useful, stay put
      if (g.areas[s.area].pool.length && s.sp > 3) { doSearch(g, s); return; }
      const h = g.survivors.find(x => x !== s && !x.dead && x.area === s.area && x.hp < x.maxHp * 0.4);
      if (h) shareWith(g, s, h);
      return;
    }
  }

  // 7. share surplus with hurt ally here; hand over materials a teammate needs
  const hurt = standingAllies.find(x => x.hp < x.maxHp * 0.4);
  if (hurt && shareWith(g, s, hurt)) return;
  const myNeeds = s.ai.wants;
  for (const ally of standingAllies) {
    const theirNeeds = neededMaterials(g, ally);
    for (const e of s.inv) {
      if (theirNeeds.has(e.id) && !myNeeds.has(e.id) && ITEMS[e.id].cat === 'mat' && invCount(ally, e.id) === 0) {
        if (doGive(g, s, ally.i, e.id)) return;
      }
    }
  }
  // release beacon-part materials we don't need, so the part's crafter can find them
  const partMats = pendingPartMats(g);
  for (const e of [...s.inv]) {
    if (!partMats.has(e.id) || myNeeds.has(e.id)) continue;
    removeItem(s, e.id);
    g.areas[s.area].pool.push(e.id);
  }

  // 8. work the wishlist — first bank anything that's ready to craft
  dropJunk(g, s, myNeeds);
  for (const goal of wishlist(g, s)) {
    if (owned(g, s, goal)) continue;
    const r = recipeFor[goal];
    if (r && hasItem(s, r.a) && hasItem(s, r.b)) { doCraft(g, s, goal); return; }
  }
  for (const goal of wishlist(g, s)) {
    if (owned(g, s, goal)) continue;
    const step = nextStep(g, s, goal);
    if (!step) continue;
    if (step.craft) { doCraft(g, s, step.craft); return; }
    if (step.find) {
      // a teammate holds it? go get it (they'll hand it over when we meet)
      const holder = g.survivors.find(x => x !== s && !x.dead && invCount(x, step.find) > 0);
      if (g.areas[s.area].pool.includes(step.find)) { doSearch(g, s); return; }
      const dest = nearestAreaWith(g, s.area, step.find) || (holder ? holder.area : null);
      if (dest && stepToward(g, s, dest)) return;
    }
  }

  // 9. lockdown: drift labward
  if (g.t >= LOCKDOWN_AT) { if (stepToward(g, s, 'lab')) return; }

  // 10. idle: top up stamina, then loot whatever's around
  if (s.sp < 8 && s.sp < s.maxSp) { s.resting = true; return; }
  const sp = bestSp(s);
  if (s.sp <= 5 && sp) { doEat(g, s, sp); return; }
  if (g.areas[s.area].pool.length) { doSearch(g, s); chatter(g, s, 2); return; }
  const opts = neighbors(s.area).filter(n => !g.areas[n].locked);
  if (opts.length) {
    const dest = opts.reduce((m, n) => (g.areas[n].pool.length > g.areas[m].pool.length ? n : m));
    doMove(g, s, dest);
  }
}

function shareWith(g, s, target) {
  const heals = s.inv.filter(e => {
    const d = ITEMS[e.id];
    return (d.cat === 'food' || d.cat === 'med') && d.hp >= 3;
  });
  const total = heals.reduce((n, e) => n + e.qty, 0);
  if (!total) return false;
  if (total < 2 && s.hp < s.maxHp * 0.8) return false; // keep the last one if we're hurt too
  return doGive(g, s, target.i, heals[0].id);
}
