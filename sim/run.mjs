// Headless balance sim: all four survivors on autopilot AI.
// Usage: node sim/run.mjs [numSeeds] [--verbose seed]
import { createGame, tick, fmtT, phase } from '../js/game.js';
import { aiDecide } from '../js/ai.js';
import { PURGE_AT, DEFEND_TIME } from '../js/data.js';

const n = parseInt(process.argv[2] || '20', 10);
const verboseSeed = process.argv.includes('--verbose') ? parseInt(process.argv[process.argv.indexOf('--verbose') + 1], 10) : null;

function run(seed, verbose = false) {
  const g = createGame(seed);
  g.autopilot = true;
  for (const s of g.survivors) s.met = true; // sim: full visibility for logs/behavior parity
  const maxT = PURGE_AT + DEFEND_TIME + 120;
  let printed = 0;
  const fullLog = [];
  while (!g.over && g.t < maxT) {
    tick(g);
    if (g.t % 2 === 0) for (const s of g.survivors) aiDecide(g, s);
    if (verbose) {
      for (const e of g.log) if (!e._seen) { e._seen = true; console.log(`[${fmtT(e.t)}] (${e.type}) ${e.msg}`); }
      if (g.t % 60 === 0) {
        for (const s of g.survivors) {
          const inv = s.inv.map(e => `${e.id}x${e.qty}`).join(',');
          console.log(`[${fmtT(g.t)}] >> ${s.name} @${s.area} hp=${s.hp}/${s.maxHp} sp=${s.sp} w=${s.weapon} a=${s.armor} ${s.dead ? 'DEAD' : s.downed ? 'DOWNED' : s.resting ? 'resting' : s.busy ? s.busy.kind : 'idle'} inv=[${inv}]`);
        }
      }
    }
  }
  const alive = g.survivors.filter(s => !s.dead).length;
  return {
    seed,
    win: g.over?.win ?? false,
    t: g.t,
    detail: g.over?.detail ?? 'TIMEOUT (bug?)',
    alive,
    reunion: g.reunion,
    reunionAt: g.log.find(e => e.msg.startsWith('REUNITED'))?.t ?? null,
    parts: g.beacon.installed.length,
    kills: g.stats.kills,
    crafts: g.stats.crafts,
    downs: g.stats.downs,
  };
}

if (verboseSeed != null) {
  const r = run(verboseSeed, true);
  console.log(JSON.stringify(r, null, 2));
} else {
  const results = [];
  for (let i = 1; i <= n; i++) results.push(run(i * 1337));
  let wins = 0;
  for (const r of results) {
    if (r.win) wins++;
    console.log(
      `seed=${String(r.seed).padStart(6)} ${r.win ? 'WIN ' : 'LOSS'} t=${fmtT(r.t)} alive=${r.alive} ` +
      `reunion=${r.reunionAt != null ? fmtT(r.reunionAt) : '--'} parts=${r.parts} kills=${r.kills} crafts=${r.crafts} downs=${r.downs} :: ${r.detail}`
    );
  }
  console.log(`\n${wins}/${results.length} wins`);
}
