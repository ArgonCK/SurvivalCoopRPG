# Cinder Isle — Co-op PvE Prototype Design (v1)

The twist on the Black Survival formula (see `black-survival-research.md`): **no PvP**. Four survivors wake at the four corners of the island after the experiment goes wrong. They must **regroup, craft, and survive** the island's threats, then **escape together**. v1 is a browser prototype: one human player + three AI companions with simple cooperative behavior. Session target: **30–45 minutes**.

## Session arc (~35 min at 1× speed)

| Phase | Time | What happens |
|---|---|---|
| Day 1 | 0:00–7:00 | Calm. Loot corners, start moving inward. Rats/crows only. |
| Night 1 | 7:00–12:00 | Dogs roam. Ambient attacks begin. |
| Day 2 | 12:00–18:00 | Boars/wolves. Party should be regrouping and building tier-2 gear + beacon parts. |
| Night 2 | 18:00–23:00 | Bears; **the Warden** (roaming boss) spawns. |
| Lockdown | 23:00+ | Areas close one-by-one, farthest-from-Lab first (45 s cadence, 30 s warning) — the BS restriction system repurposed to force convergence on the Lab. |
| Purge | 38:00 | Hard deadline: beacon not fired → loss. |

Speed toggle (1×/2×/4×) for testing and pacing experiments.

## Goals (objective tracker in UI)

1. **Regroup** — first time all living survivors share an area: small permanent buff + story beat.
2. **Repair the beacon** — craft & install 3 parts at the central Lab: Power Cell (battery+wire), Transmitter (lens+radio parts), Ignition (flint+oil). Materials are scattered so routes must cross the island. The Warden drops a **Prototype Core** that substitutes for any one part (risk/reward).
3. **Fire the beacon & hold** — 90 s defense against creature waves at the Lab. Survive it with ≥1 survivor standing → extraction, **win**. All four dead at any point → **loss**.

## Kept from Black Survival / changed for co-op PvE

**Kept:** tap-to-search areas with finite themed loot pools · 2-item crafting trees (~20 recipes, 3 weapon tiers) · stamina as the action currency with exhaustion HP-bleed · restricted-area pressure with forecast warnings · the PvE spawn clock and roaming boss · text event log as theater · no-aim, stat-roll combat · 6-slot inventory pressure.

**Changed:** PvP removed — threat comes from creatures + the clock · restriction violation = 5 damage + forced move (not instant death; kinder for co-op) · party positions/creatures visible on map (allies have radios; info-warfare can return later) · **downed & revive** instead of instant death (90 s bleedout; ally revives in 6 s, faster/stronger with a bandage) · same-area allies auto-fight together · combat numbers tiny per request: base attack 1, weapons +2 found / +3 tier-1 / +5 tier-2 / +7 tier-3, armor +1..+3, HP 15, creatures hit for 1–5.

**Cut from v1** (candidates for later): character levels/EXP, weapon mastery, stances, hunger meters (BS didn't have them either), meta progression, hidden information, true multiplayer.

## The island (16 areas, grid adjacency)

```
Beach*    Forest    Ridge     Dock*
Cliffs    Meadow    Pond      Warehouse
Village   Farm      LAB       Quarry
Campsite* Chapel    Tunnel    Lighthouse*
```
`*` = the four spawn corners (player: Beach; Wren: Dock; Brick: Campsite; Juniper: Lighthouse). Each area has a fixed, finite, themed loot pool (e.g. Warehouse = battery/radio parts/iron; Lighthouse = lens/wire/oil; Chapel = medical). Single-source quest materials (lens, radio parts) make routing matter.

## AI companions

Three named survivors, each with a persona, a preferred weapon line, and a beacon-part responsibility. Decision loop every 2 s, priority order:

1. Fight creatures in area (flee if low HP and alone) → 2. revive downed ally in area → 3. eat/rest when low → 4. obey player rally ping → 5. work a **wishlist** (tier-1 weapon → assigned beacon part → armor → tier-2 weapon): craft when possible, else BFS to the nearest area whose pool holds the missing material and search → 6. deliver parts to the Lab in the late game → 7. share surplus food with hurt same-area allies.

Player coordination tools: tap any area → **rally party there**; **recall to me**; clear rally to release them to free-roam. Companions chatter in the log.

## Multiplayer path (not in v1)

All four survivor slots are controller-agnostic (`human | ai`) over a serializable state with a seeded RNG. A shared version can promote a slot to a second human via artifact shared-state (host-authoritative tick, ~2 s action granularity suits the design). v1 ships as a shareable link where a friend runs their own session.

## Tech

Plain HTML/CSS/JS, no build step. `js/game.js` + `js/ai.js` are DOM-free (headless simulation in `sim/` validates completability and balance); `js/ui.js` renders. Published as a claude.ai artifact for instant play/share; also runs from any static server.
