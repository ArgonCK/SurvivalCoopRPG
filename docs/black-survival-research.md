# Black Survival: Immortal Soul — Design Research Reference

> Compiled research on the original 2D game **Black Survival** (rebranded **Immortal Soul: Black Survival** on Feb 1, 2021) by Archbears / Nimble Neuron. This document is the knowledge base for building a browser-playable prototype of a similar game. It deliberately excludes **Eternal Return** (the 3D successor) mechanics except where the comparison is explicitly noted.
>
> **Sourcing caveat:** primary sources (the official Fandom wiki `blacksurvival.fandom.com`, Steam, NamuWiki, TV Tropes, official Medium patch notes, the Project Lumia fan-revival wiki) were assembled via web-search extracts; the game's servers shut down Dec 8, 2022 so no live verification is possible. Facts that conflict between sources or eras are flagged inline and collected in §17.

---

## 1. What the game is (executive summary)

- A **10-player, real-time, last-one-standing battle royale** played entirely through **taps/clicks on menus and illustrated panels** — no avatar movement, no aiming, no execution skill. Matches last **~15–20 minutes**.
- Players are kidnapped "**Test Subjects**" on **Lumia Island**, a closed experiment site run by the corporation **AGLAIA**, forced into repeating death games researching immortality via an energy called **VF (Vital Force)**. Explosive collars kill anyone caught in a "restricted area."
- The skill ceiling is **knowledge, planning, routing, and nerve**: memorizing ~600 crafting recipes, 22 areas' finite loot pools, and animal/boss spawn timers, then improvising when your farming route gets contested.
- Fans call it "the most Battle Royale game out of the genre" — closer to the *Battle Royale* film / Hunger Games fantasy than shooter BRs. Ran on any phone, one-handed, low APM but real-time tension.
- Reception: Steam **Very Positive (~81–82%)**, ~1M+ Google Play downloads, primarily KR/JP mobile playerbase. Shut down after 7 years as the studio consolidated behind Eternal Return.

**The elevator pitch of its design DNA:** *a real-time roguelike deckbuilder's brain in a battle royale's body* — search, craft, route, and gamble on encounters while the map burns down around you.

## 2. Product history & timeline

| Date | Event |
|---|---|
| Nov 12, 2015 | Original Korean mobile launch (Archbears). Global English rollout ~2016. *(Some sources say early 2015/2016 — flagged.)* |
| Dec 2017 | Steam version / Early Access (dates conflict: Nov 23 vs Dec 6, 2017). |
| May 9, 2018 | Tech Lab (cosmetic gacha), lobby housing/Deco system, Live2D character art. |
| Feb 2019 | Team Match mode (3v3, Seoul map). |
| 2019 | Archbears merges into Nimble Neuron. |
| Mar 19–20, 2019 | Free-to-play Steam release (app 690510). |
| Oct 14, 2020 | Eternal Return enters Steam Early Access. |
| Feb 1, 2021 | Rebrand to "Immortal Soul: Black Survival"; renewal update (day/night cycle likely added here — flagged). |
| ~2021 | Global publishing to Boltrend Games. |
| Oct 13, 2022 | Shutdown notice ("Dear Researcher…"); all characters unlocked for the farewell period. |
| **Dec 8, 2022** | **End of service.** *(One source said "the 8th" of November — Dec 8 is corroborated by multiple sources.)* |
| Jul 20, 2023 | Eternal Return 1.0 releases; fan revival project "Black Survival: Project Lumia" (wiki.projectlumia.com) preserves the game. |

## 3. Lore & setting

- **AGLAIA**, founded 1999 around research director **Dr. Angelika**, faked undersea volcanic activity to evacuate Lumia Island's residents and converted it into a closed lab. Funding comes from international investors shown partial results.
- The battle royale is diegetically an **experiment iteration**; the player is addressed as a **researcher** directing a test subject (**Dr. Nadja** is the tutorial guide/announcer voice).
- In-match hostile NPCs: **Dr. Wickeline** (roaming boss researcher) and **Mr. Meiji** (guardian of the Research Center).
- Characters carry subject IDs (Jackie `06M-RFT01`, Fiora `14M-RFT02`, …). Each character has **Research Journals** — lore chapters unlocked by hidden in-match objectives (reward: 400 Bear Points, cosmetic only).
- Named researchers: Angelika, Nadja, Wickeline, Meiji. ("Aelred" does not exist in BS; "Arda Evren" is a playable subject, not a researcher.)

## 4. Match structure

- **10 players FFA**, real time, ~15–20 min. Pick 1 of ~40–48 characters pre-match (each: stat spread, 2 skills, weapon-mastery affinities).
- **Spawn: the Underground Path** — an off-map starting room. No searching, no encounters, skills unusable. Pre-purchased **Supply Box** items appear in inventory here; you pick a crude starting weapon (defaults to your highest-mastery type). Once you leave you can never return.
- **Starting inventory:** sources conflict — "2 Bread" (Bread wiki page), "2 Bread + 3 Water" (another extract), "empty-handed" (characters research). Best reading: a token bread/water ration plus any Supply Box items. **Flagged.**
- **Item spawns are fixed and area-specific every game** — unlike loot-RNG battle royales, optimal routes can be planned in advance; the metagame is route knowledge vs. contest risk.
- **Win conditions:**
  1. **Last survivor standing.**
  2. **Hacking victory:** craft the **System Shutdown Code** (Blueprint + CD Player) plus a Network PC, get into the **Research Center control room**, channel "System Control" ~5–7 s immobile (interrupted by death); success **instantly kills all other survivors**. A comeback fantasy and endgame pressure valve.
- Emergent pacing: **early = looting/routing, mid = crafting + animal farming, late = forced convergence and fights** (driven by the restriction cadence, animal spawn clock, and everyone's builds coming online).

## 5. The map: Lumia Island

### 5.1 The 22 areas

Alley, Archery Range, Beach, Cemetery, Chapel, Dock, Factory, Fire Station, Forest, Hospital, Hotel, Lighthouse, Pond, Research Center, School, Slums, Temple, Town Hall, Trail, Tunnel, Uptown, Well — plus the unmapped **Underground Path** spawn.

- Each area has a **unique, finite loot pool** (fixed copies per item, e.g. Hospital: Bandage ×4, Band-Aid ×3, Doctor's Gown ×8; Beach: Turtle Shell ×4, Bullets ×8; Forest: Oriental Grass). Themed identities: Hospital = medical, Chapel = holy items, Beach/Dock = water gear, Forest = herbs.
- **Depletion:** found items leave the pool; a stripped area signals "someone farmed here" — loot state is information warfare.
- **Water Areas** (Beach, Dock, Pond, Lighthouse; explicitly *not* Well): enable water-conditional content (Wizard's Fishing Pole, Leon's Human Torpedo, Lenox's Fishing).
- **Research Center** starts permanently restricted; only accessible via Hacking; guarded by **Mr. Meiji**; contains the Main Computer (hacking victory).

### 5.2 Adjacency graph (partial, reconstructed — verify before hard-coding)

- Alley: Archery Range, Dock, School, Town Hall (± Fire Station)
- Archery Range: Alley, School, Hospital
- Beach: Forest, Trail, Cemetery, Well
- Cemetery: Trail, Beach, Tunnel, Well, Research Center
- Chapel: Hotel, Uptown
- Dock: Alley, Town Hall, Factory
- Fire Station: Town Hall, Dock, Factory, School, Alley *(older extract; partial conflicts)*
- Forest: Hospital, School, Trail, Beach
- Hotel: Slums, Pond, Tunnel, Uptown, Chapel
- Research Center: Cemetery, Tunnel, Pond, Trail, Fire Station
- Slums: Factory, Fire Station, Pond, Hotel
- Temple: Well, Tunnel, Uptown, Lighthouse
- Town Hall: Dock, Factory, Fire Station, School, Alley
- Tunnel: Pond, Uptown, Hotel, Temple, Well, Cemetery, Research Center
- Uptown: Chapel, Hotel, Tunnel, Temple, Lighthouse
- Well: Beach, Cemetery, Tunnel, Temple
- Derived by symmetry: School (Alley, Archery Range, Forest, Fire Station, Town Hall); Hospital (Archery Range, Forest, +?); Trail (Forest, Beach, Cemetery, Research Center); Factory (Dock, Slums, Fire Station, Town Hall); Pond (Hotel, Slums, Tunnel, Research Center); Lighthouse (Temple, Uptown)

**Movement-model conflict (flagged):** one report says you tap **any** open area on the minimap to travel; another says movement is between **adjacent ("Nearby") areas** only, with a river breaking adjacency. The existence of a curated adjacency graph and "Nearby Areas" mechanics (detection, scouting items) favors **adjacency-based movement**; either way every move costs **5 Stamina** and no separate movement cooldown was documented. No hyperloop/fast travel (that's ER).

### 5.3 Restricted areas (the shrink)

- Fiction: your **explosive collar** detonates. Being inside an area when it locks = **instant death**; restricted areas cannot be entered or searched and are darkened on the map.
- New restrictions are picked **at random** each round when the round timer hits 0:00; the **count per round is fixed** across games (exact counts not recovered — flagged).
- Forecast UI: areas closing next round get a **yellow caution + red label**; 10 s before restriction, areas staying safe **flash green**; searching inside a closing area adds a **red siren** to the timer.
- Early restrictions are **temporary** (reopen at the end of the following round); from **round 4 or 5** (source conflict) all restrictions become **permanent**.
- **Round durations — two era-schemes (present both, pick one for the prototype):**
  - Classic: rounds 1–3 = 3:00, rounds 4–6 = 2:30, rounds 7–9 = 2:00 (~22 min max).
  - Immortal Soul era: round 1 = 2:30, rounds 2–3 = 2:00, later rounds = 1:00 (sharply accelerating).
  - Reliable spawn anchors regardless of scheme: Bat/Meteorite ~3:00, Gorilla ~4:30 (round 3), Bear ~5:30 (round 4), Wickeline ~6:30 (round 5), Mr. Meiji 9:00.

### 5.4 Day/night

- Tied to rounds: Day 1 ≈ start through the 2nd restriction round; **night** ≈ rounds 3–5 (one FAQ pegs night start at 9:00 game time under the classic scheme). **Flagged: era-dependent.**
- Confirmed night effects: hacking attempts hide the hacker's identity/location for **35 s**; a second Bear spawns during the first night round; Wickeline is a night-time terror. (Vision/detection modifiers at night: not confirmed.)

### 5.5 Hacking (map counterplay)

- Use a **Network PC** item: costs **30 Stamina + 3 s channel**, then remain in the same area **70 s** (searching/resting allowed) to succeed. Failure → 30 s lockout.
- Success **reopens ALL restricted areas (including Research Center and permanent ones) for 2 rounds (~6 min)**.
- Attempts are **broadcast to everyone instantly** (except the 35 s night cloak) — painting a target on the hacker.

## 6. The action loop (all real-time, stamina-gated)

| Action | Cost | Notes |
|---|---|---|
| **Search** | 3 Stamina, ~1.5 s | Tap the area's background art. Resolves through **sequential phases**, each skipped if impossible: corpses → traps → wild animals/enemy players → items *(order partially confirmed)*. If all phases fail: "nothing happens." Corpse-find: base **5%**, **+30%** for your first corpse, **+5%** for corpses of players you killed. Repeated searching raises the odds of finding remaining pool items. |
| **Move** | 5 Stamina | Via map tap (see §5.2). |
| **Rest** | free, in place | 3 modes: **Heal +2 HP/s · Sleep +4 Stamina/s · First Aid: treats 1 injury per 12 s** (most recent injury first). |
| **Craft** | free (no timer documented) | Combine exactly 2 items per recipe (§10). Grants EXP and weapon mastery. |
| **Consume** | — | Foods/drinks have a **5 s shared item cooldown** ("eat every 5 seconds" is a combat rhythm). |
| **Stance toggle** | free | **Offensive**: +Attack, +chance to find enemies, +chance to be found. **Stealth**: −Attack, +Armor, −find, −found (found-modifier −30% → −20% in Feb 2018). Encounter odds are literally percentage-modified by stance. |

## 7. Survival stats

- **HP** — per-character, grows with level. Death at 0. Notably **no low-HP penalty**: at 1 HP you deal full damage.
- **Stamina (SP)** — the action currency (Search 3, Move 5, Network PC 30, some skills). At 0 you are **Exhausted**: actions drain **HP at double the stamina cost** (6 HP/search, 10 HP/move). Restored by Sleep or Stamina Foods. **Ice Water** eases exhaustion.
- **No hunger/thirst gauges.** "Food" is simply split into **Health Foods** (HP) and **Stamina Foods** (SP). The only starvation analogue is exhaustion converting actions to HP loss. *(Any source quoting hunger/thirst drain rates is contamination from other games.)*
- **Injuries:** ~**2% chance per hit** to suffer a random body-part injury (debuff, e.g. Bleeding). Treated by **First Aid Kit** (heals latest wound) or the First Aid rest action. Armor/damage-reduction does **not** reduce trap or exhaustion damage.
- Sample restore values (Mar 2018 patch era, flagged as version-dependent): First Aid Kit 110 HP, Herb Medicine 150 HP, Holy Water 70 HP. Bread/Water = small starter restores (exact values unverified).

## 8. Combat

Encountering someone (via the Search enemy phase — either party can roll the encounter) opens a real-time battle view: both characters' illustrated portraits, HP/SP bars, buttons for **Attack / Combat Skill / item / stance / flee**, resolved by stat rolls while both players act.

- **Accuracy roll first:** base **80% at mastery D**, rising with mastery rank (table below).
- **Damage formula (community/wiki consensus):**
  `damage = (StatAttack + WeaponAttack) × MasteryModifier × 100 / (TargetStatArmor + TargetGearArmor + 100)`
- **Crit:** 5% chance, **+50%** damage (one source says +40% — flagged).
- **Guard:** −50% damage taken while guarding.
- **Weapon durability ("defection"):** per attack, **2% melee / 1% ranged** chance to defect (×10 firing an unloaded gun/bow, which then swings as a blunt). First defection = cracked, **−20% attack**; a second = **destroyed**. Blades also "dull" separately; carrying repair items (Whetstone) or a backup weapon matters.
- **Fleeing:** a "running man" option exits the encounter (recommended vs. animals). Exact resolution (free hits? destination?) undocumented. Strategic flight = moving areas before being burst; pursuers can follow.
- **Death & loot:** the dead leave a **corpse holding everything** (equipment + inventory), looted by other players via the corpse phase of Search; corpse contents deplete as taken. Kills are **broadcast globally** in the event log.
- **Attack cadence:** manual taps ("press and hold to tap continuously"); per-attack cooldown exists but the number is undocumented.

### 8.1 Weapon mastery (the damage engine)

7 weapon types = 7 per-character masteries: **Blade, Blunt, Hand, Stab, Thrown, Gun, Bow**. Characters start **D/D+ in 2–4 signature types, F elsewhere**. Mastery rises in-match by attacking with the type *and by crafting weapons of the type*. Guns need Bullets, bows need Arrows (stack to 80); thrown weapons are consumed on use.

| Rank | Stat-Atk multiplier | Accuracy | Extras |
|---|---|---|---|
| F | 55% | 66→70% | |
| E | 60% | 72→74% | |
| E+ | 70% | 76% | |
| D | 80% | 80% | typical start |
| D+ | 90% | 82% | |
| C | 110% | 85% | |
| C+ | 125% | 87% | |
| B | 150% | 90% | |
| B+ | 170% | 92% | |
| A | 195% | 93% | |
| A+ | 215% | 95% | |
| S | 240% | 96% | +7% armor piercing |
| SS | 265% | 97% | +15% armor piercing; "Superhuman Path": every 3rd hit permanently +1 Attack |

(Table from patch 4.1.00/4.2.00.) Per-character mastery perks exist (e.g. **Rio** gets armor piercing at rank A); rank-ups also grant small per-character stat bonuses (fan-guide claim, medium confidence).

### 8.2 Traps

Filed under Weapons but set in your current area rather than swung; trigger on another player's Search (phase 2), dealing one-time **skill damage that ignores armor** (except EOD Suit/Boots). You can trigger your own traps (except Smart Bomb). Dedicated trap builds ("Trap Isol") exist but eat inventory slots.

## 9. In-match progression

- Start **level 1, cap 18**; **EXP to next level = 5 + current level**. Levels raise HP/Attack/Armor along per-character curves.
- EXP (and mastery-EXP) sources: **Search +1 · landed attack +1 · crafting Uncommon +1 / Rare +2 / Epic +3 / Legendary +4 · Crow/Bat +1 · Hunting Dog/Bloodhound +2 · Gorilla/Bear +3 · Dr. Wickeline +5 · Mr. Meiji +15 · player kill ≈ 3 + enemyLevel/2** (exact kill formula garbled in sources — flagged).
- Chain-crafting is the out-leveling engine: crafting is safe EXP plus power plus inventory compression.

## 10. Items & crafting

### 10.1 Categories, rarity, slots

- **4 categories:** Weapons · Armor Gear · Food (Health / Stamina) · Normal (materials, enhancers, special tools).
- **5 rarity grades:** **Common (White) → Uncommon (Green) → Rare (Blue) → Epic (Purple) → Legendary (Orange)**. Commons are found-only; most Uncommon+ equipment is **craft-only** ("crafted weapons are much more effective in combat").
- **6 inventory slots + 6 equipment slots** (1 weapon + 5 armor: **Head, Chest/Clothes, Arm, Leg, Accessory**). One item *type* per inventory slot (stackables share). This is the defining constraint: ammo, food, ingredients, and traps constantly fight for 6 slots; crafting 2→1 doubles as inventory compression.
- ~**600+ craftable items** from hundreds of base ingredients.

### 10.2 The combining system

- **Always exactly 2 components → 1 product**, recursively: a Legendary is the root of a binary recipe tree typically 3–5 combines deep over 4–8 base items.
- **Only one of each precursor is consumed regardless of stack size**, and some recipes output multiples — e.g. `Water + Lighter → 3 Boiling Water`, `Boiling Water + Oriental Grass → 3 Oriental Concoction` (the classic budget-sustain line; Oriental Grass farms in Forest, the Lighter comes from the Hunting Dog).
- **Recipe knowledge tools:** an in-game crafting index opening on your **Bookmark pages** (pre-favorited targets), and **Navigate / "Set Your Target"** — pick a target item and the game lists required materials *and the areas they spawn in*, effectively a route planner (ancestor of ER's Item Road).
- Crafting grants EXP by product rarity (§9) and weapon-type mastery for weapons.

### 10.3 Rare catalysts & legendary gating

- **Meteorite** — uncraftable; **first drops into a random area's search pool at 3:00**, with a global announcement. Feeds: Force Core, Meteor Claymore, Meteor Gauntlet, Moonstone, Kabana, Wonderful Tonight, Fragarach, Auto-Arms. As "Meteorsteel/Starsteel" it enhances blades with a **20% destruction risk**.
- **Mithril** — uncraftable; also seeds at ~3:00; branches into the Mithril Armor/Helm/Boots/Shield/String epic family.
- **Tree of Life** — randomly-found health-food catalyst; **Tree of Life + Meteorite → Force Core** (keystone epic component). *(Spawn timing unverified.)*
- **Holy Blood / "VF Blood Sample"** — the rarest catalyst; **killing Dr. Wickeline is the only reliable source** *(naming conflict flagged: BS-era sources say "Holy Blood," the ER-era name is "VF Blood Sample"; treat as the same design slot)*. Gates the legendaries: **Dáinsleif, Chinese Opera Mask, Queen of Hearts, Red Shoes, Spear of Longinus, Whip of Nine Bloody Tails, Failnaught**. Gear made from it is worth +45 post-match credits.
- **Blueprint** (green material) → Icebox, Cell Phone, Monohoshizao, Polaris, Racing Helmet, Radar, Searing Palm Scroll, **System Shutdown Code** (the hacking-victory key item).
- Legendary flavor examples: **Dáinsleif** ("Hungry Blade": +3 damage per stack, +1 stack per kill), **Spear of Longinus** ("Sanguine Miracle": recover 40% max HP on kill, 60 s CD), **Failnaught** (craft-only sniping bow), **Moon Stone** (+3 attack jewel), Gleipnir, Fang Mace, Saint's Relic, Holy Grail (found-only).
- **Enhancement:** Nail (+1 blunt damage, capped at 30 attack), Whetstone (refines + one repair for blades/stabs), Meteorsteel (blade +, 20% destruction risk). **Armor cannot be enhanced** (except via Mai's skill).
- Item special effects exist per item: poison-on-hit (Bloody Chakram, Poison Glass Knuckle), every-3rd-attack bonuses (High Explosive Grenade +10 skill damage), durability-on-kill (Headsman's Axe), typed damage reduction on armor (Bulletproof Vest −7% gun damage, Creed of the Knight −10% blunt).

### 10.4 Where rare loot comes from (no airdrops)

Original BS has **no mid-match airdrop crates** (that's ER). Rare items enter via:
1. **Timed random spawns** into area search pools (Meteorite/Mithril at 3:00, announced).
2. **Wild animal drops** (below) — every animal drops Supply-Box-tier items plus signature materials.
3. **Pre-match Supply Boxes** (meta purchase: 1 Gem, free in Herbivore League; Type A = random weapon, Type D = random armor, Icebox = random food; contents mostly White/Green) delivered at spawn.
4. Some items exist **only** from boxes/animal drops and never appear in searches unless dropped by a player.

## 11. Wild animals & NPCs (the PvE clock)

Animals occupy areas, are met via the Search animal phase, fight back, and their corpses hold loot. Respawn timers: Crow/Bat 110 s, Hunting Dog/Bloodhound 140 s, Bear/Gorilla 170 s after death.

| Creature | EXP | Spawn | Drops / behavior |
|---|---|---|---|
| **Bat / Crow (Osprey later)** | +1 | Bat at match start / ~3:00; Tunnel, Temple, Chapel, Forest, Beach | Bat: Clang Clatter, Bread. Osprey: Bird Eggs, Feather, supply items |
| **Hunting Dog → Bloodhound** | +2 | first ~3:00, Alley/School/Slums/Town Hall/Hotel/Uptown | the **Lighter** (key crafting material), Leather |
| **Gorilla** | +3 | round 3 (~4:30), Archery Range/Fire Station/Factory; **migrates areas each round while alive** | Burdock, Fertilizer, supply items |
| **Bear** | +3 | round 4 (~5:30) at Hospital/Cemetery/Well; second one first night round | Garlic, Flower, weapon+armor supply items; rare Holy Blood/VF sample. **Enrage: at 70% and 30% HP, AoE ~50 damage to everyone in the area** (30% adds Bleeding) |
| **Dr. Wickeline** (boss) | +5 | round 5 (~6:30), random open area; **migrates each round until killed** | Guaranteed: **Holy Blood/VF Blood Sample, Force Core, First Aid Kit** + chance of Moonstone/Mithril/Cell Phone; kill grants team-wide **"Unstoppable"** buff (40 s; Bear/Gorilla kills grant "Stimuli" 40 s). At 70% HP: area AoE 50 + 7 Poison stacks; at 30%: AoE 50 + Deadly Poison |
| **Mr. Meiji** | +15 | 9:00, Research Center only (post-hack); no respawn; absent in Team Match | Highest EXP/mastery reward in the game |

*(Older/other-era rosters mention chicken/wolf/boar/tiger — not confirmed for the final game; likely pre-rework or ER conflation.)*

## 12. Characters (Test Subjects)

- Roster grew from a small launch cast to **40 confirmed (Oct 2019)** and roughly **44–48 by end of service**. Nearly the entire cast carried into Eternal Return (ER's 18-character EA launch roster was 100% BS veterans).
- **Four core stats** per character (tabulated at Lv1/Lv18 on the wiki): **Attack, Defense/Armor, HP, Stamina** — with per-character growth curves. Examples: Jackie = top-tier Attack, <50 Defense even at 18; Magnus = best defensive stats, high base Stamina with poor scaling; Hyunwoo = Stamina 88→156 (among the lowest).
- **Weapon-mastery affinities:** D/D+ starting grades in 2–4 signature types (Jackie: 3 masteries at D), F elsewhere.
- **Two skills each**, across three categories:
  - **Combat Skills** — used in place of the Attack button (some player-only, some also hit animals).
  - **Field Skills** — bottom-right button, may channel a few seconds.
  - **Passives** — auto-trigger. Cooldowns commonly ~30 s. Effects grouped as Buffs / Debuffs / Area effects. Skill values appear fixed (no in-match skill leveling, unlike ER).
- Verified skill examples (great reference for prototype kit design):
  - **Jackie — Bloodfest (passive):** kill a player or 2 animals → +22 Attack for 35 s (snowball).
  - **Aya — Justice (passive):** blocks an incoming hit with a shield film; her attacks reduce its cooldown.
  - **Hyunwoo — Brawler:** restores HP+SP while fighting (CD 30→40 s in 2021).
  - **Li Dailin — Drunken Master (field):** drinks grant stacks; spend 4 stacks to dodge an attack within 3 s.
  - **Chiara — Stigma (passive):** attacks stack +1 bonus damage on the target up to 11; at max, *everyone* hitting that target gains the +11.
  - **Leon — Rapacious Collecting** (faster crafting) + **Human Torpedo** (huge attack, Water Areas only).
  - **Eleven — MUKBANG (field, 30 s CD):** during it, each HP food eaten permanently gives +3 max HP.
  - **Isol** — trap-planting kit; damage scales with traps placed.
- Character identities are strong and occupation-driven (serial killer, fencer, chef, shaman, mukbang streamer, magician, arsonist, drunken-fist master…), reinforced by their weapon affinities and kits.
- **No per-character starting items** — differentiation is stats + masteries + skills only (plus contested-area win odds from high Lv1 stats).
- ("Another Self" variant characters: **not a BS system** — misremembered/ER-era. Closest: alternate-persona cosmetic skins and annual skin votes.)

## 13. Information warfare & atmosphere

- **No live player positions.** You know: map open/restricted state, restriction forecasts, global broadcasts, and what you personally scout.
- **Global broadcasts:** player kills, hacking attempts, meteorite falls, boss spawns — narrated in a rolling **text event/combat log** (the log is theater: fans loved reading fights and deaths unfold).
- **Encounter scouting:** finding/being found reveals presence; stances trade combat stats against ±find/found odds; corpses mark where fights happened; stripped loot pools mark farming routes. Audio cues (footsteps/gunshots from adjacent fights) added dread.

## 14. UI/UX of the original (browser-prototype relevant)

- Entirely **tap/click panels**: no avatar walking, no camera. Commands only: search, move, attack, skill, craft, rest, stance.
- **Map screen:** stylized island with 22 tappable area nodes; restriction markings; persistent top-bar round countdown.
- **Area screen:** painted background illustration of the current area — **tapping the art itself is the Search action**; found items pop into the 6-slot inventory bar; crafting via a recipe index + Navigate target planner overlay.
- **Combat screen:** cut-in view with both characters' (Live2D-animated) portraits, HP/SP bars, action buttons, real-time hit/miss/crit rolls, rolling text log.
- **Lobby:** your decorated "Research Center" room (housing/Deco system) with Shop / Tech Lab / Quests / Characters / League tabs.
- This UI model is **near-perfectly suited to a browser game**: it's panels, timers, lists, and probability rolls — no realtime rendering demands.

## 15. Modes, ranked & meta economy

- **Modes:** Single (vs AI) · Normal (PvP) · Ranked (Carnivore League only) · Private (room-code lobbies, spectators) · **Team Match** (3v3 team deathmatch, first to 20 kills, separate 12-area **Seoul map**, ~10 min, respawns at Underground Path with scaling respawn timers, "Killer" streak marks). No duo-BR mode on Lumia.
- **Ranked ladder (animal tiers, not metal tiers):**
  - **Herbivore League** (starter, EXP-based, never decreases): Mouse → Rabbit → higher herbivores; perks: free revives and free Supply Boxes; can't queue Ranked. Graduating grants **"Caged Beast"** and unlocks Ranked.
  - **Carnivore League** (RP-based): **Fox → Wolf → Lion → Bear → Dragon**, 5 divisions each; +100% gold from matches. Quarterly-ish seasons; reset to Caged Beast + 10 placements.
- **Economy:** **Gold** (soft) · **Gems** (premium) · **Bear Points** (daily-quest loyalty currency) · Tech Lab Credits/Mileage. Characters cost 900 Gems or 122,000 Gold. **Character revival meta:** characters get knocked out of service after matches — Herbivores revive free; Carnivores pay 100 Gold or wait 1 hour; the 30-day **"Assistant Researcher"** subscription auto-revives (the VIP lever). **Aptitudes:** rentable pre-match passive loadout abilities. **Supply Boxes:** 1 Gem each (free for Herbivores) — mild pay-for-convenience. Cosmetics: skin gacha, Live2D skins, voice packs, lobby housing/Deco. Consensus: F2P and largely skill-rewarding, not hard P2W. **Star grades** on owned characters raise base stats, but sub-Master queues **cap effective stars** (a power-equalizer worth studying).

## 16. Design DNA — what to preserve in a prototype

The load-bearing pillars, per fan sentiment and mechanical analysis:

1. **Knowledge as the skill axis.** Fixed area loot + deterministic recipes + published spawn timers = mastery is learnable and feels earned. RNG only in search rolls and encounters.
2. **The 2-item recipe tree.** Simple rule, enormous depth; doubles as inventory compression and the EXP engine; makes route planning the strategy layer.
3. **Brutal inventory pressure.** 6 slots forces real decisions every minute.
4. **Stamina as the universal action currency** with the exhaustion HP-bleed valve — no hunger/thirst micromanagement.
5. **The restriction roulette + collar-death.** Random-but-forecast area closures create planning under pressure and hard convergence, escalating cadence late.
6. **The PvE clock.** Animal/boss spawns at known times give the mid-game structure and optional risk/reward objectives (Wickeline as roaming terror + legendary gate).
7. **Stat-driven, no-aim combat** modulated by mastery ranks, stances, accuracy/crit rolls, durability risk, and item usage rhythm (5 s food CD) — real-time tension without execution skill.
8. **Information warfare through absence:** no map dots; broadcasts, logs, corpses, and stripped loot pools are the sensor suite.
9. **The text log as theater** and heavy atmosphere (dark experiment lore wrapped around anime portraits).
10. **An alternate win condition** (hacking) as comeback valve and endgame timer.
11. **Short (~15–20 min), low-APM, one-hand playable** — perfect for browser.

Known weaknesses to design around: the newcomer knowledge cliff (600 recipes), search RNG frustration, and dated meta-monetization (revival fees, supply boxes).

## 17. Open questions / source conflicts

| # | Item | Status |
|---|---|---|
| 1 | Round durations & restricted-count per round | Two era schemes; counts unrecovered. Pick one scheme for the prototype. |
| 2 | Movement: any-area vs adjacent-only | Conflict; adjacency-based favored. |
| 3 | Search phase order & base probabilities | Only corpse rates confirmed (5% / +30% / +5%). |
| 4 | Starting inventory (2 Bread? +3 Water? empty?) | Conflict. |
| 5 | Crit bonus +50% vs +40% | Conflict. |
| 6 | Holy Blood vs VF Blood Sample naming | Same design slot; era naming differs. |
| 7 | Permanent restriction from round 4 vs 5 | Conflict (possibly solo vs team). |
| 8 | 5th armor slot name (Accessory) | Strongly implied, unverified. |
| 9 | Exact legendary recipes; per-item stat numbers; per-character stat tables | Exist on the wiki (recipes stored as images); need direct access — mirror: `wiki.projectlumia.com`. |
| 10 | Attack cooldown length; flee resolution; simultaneous-final-death rule; night detection modifiers; craft timing | Undocumented in recovered sources. |
| 11 | Bread/Water restore values | Unverified. |
| 12 | Steam 2017 launch exact date; KR launch date variants | Minor conflicts. |

## 18. Sources

- **Official Immortal Soul: Black Survival Wiki** (blacksurvival.fandom.com): Rulebook, Search, Restricted Area (and Hacking), Areas + individual area pages, Nearby Areas, Move/Rest/Stance, Encounters & Combat, EXP./Mastery/Dmg Reduction, Skills, Skill Effects, Items, Supply Boxes, Traps, Health/Stamina Foods, Characters, Character Stats (+ Graphs), Leagues, Game Modes, Team Match, Underground Path, Research Background, and item/NPC pages (Dr. Wickeline, Mr. Meiji, Meteorite, Mithril, Blueprint, System Shutdown Code, Dáinsleif, Failnaught, Spear of Longinus, …)
- **Official patch notes** (Medium @cs_90978): 3.6.00, 4.1.00 (mastery table), 4.2.00 (heal values), Mastery Overhaul Preview, Character Price Adjustment, Team Match Preview; May 9 2018 / Aug 29 2018 / Mar 3 2021 patch pages
- **Steam**: app 690510 store/community; guides "The Complete Survival Game Guide", "Item specials/buffs", "All Playable Characters"; damage-formula forum thread
- **NamuWiki** (KR launch/history) · **TV Tropes** (Immortal Soul page) · **Archbears Helpshift FAQ** (animal roster) · **Boltrend official site** (roster names) · **Project Lumia** fan-revival wiki (wiki.projectlumia.com)
- Shutdown coverage: official Facebook notice (Oct 2022), r/gachagaming thread; **Wikipedia** (Eternal Return) for ER dates
- Guides/reviews: Level Winner "12 Tips", MrGuider, HYPEcrumbs, Lorenzo Dante (Medium), Steemit review, soyouplay ("Who is Wickeline?"), MMOHuts (ER comparison)

*All facts gathered via web-search extracts of the above (the game's primary sources are partially offline post-shutdown); items in §17 should be re-verified against the Project Lumia mirror before being treated as canon for cloned numbers.*
