// Cinder Isle — static game data. Pure data, no DOM.

export const GRID_W = 4;

export const AREAS = [
  { id: 'beach',      name: 'Black Sand Beach', col: 0, row: 0, spawn: 0,
    pool: ['branch','branch','stone','rope','berries','berries','water','water','flint','fish'] },
  { id: 'forest',     name: 'Pine Forest', col: 1, row: 0,
    pool: ['branch','branch','branch','herb','herb','berries','berries','berries','water'] },
  { id: 'ridge',      name: 'Windward Ridge', col: 2, row: 0,
    pool: ['stone','stone','stone','iron','egg','water'] },
  { id: 'dock',       name: 'Ferry Dock', col: 3, row: 0, spawn: 1,
    pool: ['rope','rope','oil','wire','fish','fish','water','water','cannedfood','branch'] },
  { id: 'cliffs',     name: 'Gull Cliffs', col: 0, row: 1,
    pool: ['stone','stone','iron','egg','egg','flint','flint','water'] },
  { id: 'meadow',     name: 'Long Meadow', col: 1, row: 1,
    pool: ['herb','herb','berries','berries','potato','water','water','cloth'] },
  { id: 'pond',       name: 'Mirror Pond', col: 2, row: 1,
    pool: ['water','water','water','fish','fish','rope','herb','berries'] },
  { id: 'warehouse',  name: 'Supply Warehouse', col: 3, row: 1,
    pool: ['battery','iron','cloth','cloth','cannedfood','cannedfood','hammer'] },
  { id: 'village',    name: 'Old Village', col: 0, row: 2,
    pool: ['knife','radioparts','flint','cloth','cloth','matches','matches','pot','jerky','bandage','water'] },
  { id: 'farm',       name: 'Terrace Farm', col: 1, row: 2,
    pool: ['potato','potato','egg','egg','pitchfork','rope','cloth','berries'] },
  { id: 'lab',        name: 'Research Lab', col: 2, row: 2, lab: true,
    pool: ['medkit','bandage','bandage','battery','water','cannedfood'] },
  { id: 'quarry',     name: 'North Quarry', col: 3, row: 2,
    pool: ['iron','iron','iron','stone','stone','battery','oil'] },
  { id: 'campsite',   name: 'Ranger Campsite', col: 0, row: 3, spawn: 2,
    pool: ['matches','jerky','jerky','pot','cloth','branch','branch','water','water','berries'] },
  { id: 'chapel',     name: 'Hillside Chapel', col: 1, row: 3,
    pool: ['bandage','bandage','medkit','cloth','herb','water'] },
  { id: 'tunnel',     name: 'Service Tunnel', col: 2, row: 3,
    pool: ['iron','oil','oil','matches','stone'] },
  { id: 'lighthouse', name: 'Lighthouse', col: 3, row: 3, spawn: 3,
    pool: ['lens','wire','wire','oil','oil','matches','water','water','fish','cannedfood'] },
];

// cat: mat | food | med | weapon | armor | part | special
export const ITEMS = {
  branch:     { name: 'Branch', cat: 'weapon', atk: 1, desc: 'Better than bare hands. Barely.' },
  stone:      { name: 'Stone', cat: 'mat', desc: 'Craft material.' },
  flint:      { name: 'Flint', cat: 'mat', desc: 'Sharp edge. Sparks, too.' },
  rope:       { name: 'Rope', cat: 'mat', desc: 'Ties things together.' },
  cloth:      { name: 'Cloth', cat: 'mat', desc: 'Torn but usable.' },
  herb:       { name: 'Wild Herb', cat: 'mat', desc: 'Smells like medicine.' },
  iron:       { name: 'Iron Scrap', cat: 'mat', desc: 'Heavy. Upgrades weapons and armor.' },
  wire:       { name: 'Copper Wire', cat: 'mat', desc: 'Conducts. Beacon material.' },
  oil:        { name: 'Lamp Oil', cat: 'mat', desc: 'Burns well. Beacon material.' },
  lens:       { name: 'Fresnel Lens', cat: 'mat', desc: 'From the lighthouse lamp. Beacon material.' },
  battery:    { name: 'Battery Pack', cat: 'mat', desc: 'Still holds charge. Beacon material.' },
  radioparts: { name: 'Radio Parts', cat: 'mat', desc: 'Circuit boards and dials. Beacon material.' },
  matches:    { name: 'Matches', cat: 'mat', desc: 'Cooks raw food.' },
  pot:        { name: 'Iron Pot', cat: 'mat', desc: 'For stew.' },
  hide:       { name: 'Animal Hide', cat: 'mat', desc: 'Tough leather. From beasts.' },
  fang:       { name: 'Beast Fang', cat: 'mat', desc: 'Trophy from a strong beast. Tier-3 weapon material.' },
  wardencore: { name: 'Prototype Core', cat: 'part', desc: 'Torn from the Warden. Substitutes for any beacon part.' },

  berries:    { name: 'Berries', cat: 'food', hp: 3, desc: '+3 HP' },
  fish:       { name: 'Raw Fish', cat: 'food', hp: 2, desc: '+2 HP (cook it!)' },
  meat:       { name: 'Raw Meat', cat: 'food', hp: 2, desc: '+2 HP (cook it!)' },
  egg:        { name: 'Bird Egg', cat: 'food', hp: 2, sp: 2, desc: '+2 HP +2 SP' },
  potato:     { name: 'Potato', cat: 'food', hp: 2, desc: '+2 HP (stew it!)' },
  jerky:      { name: 'Jerky', cat: 'food', hp: 5, desc: '+5 HP' },
  cannedfood: { name: 'Canned Food', cat: 'food', hp: 6, desc: '+6 HP' },
  water:      { name: 'Fresh Water', cat: 'food', sp: 4, desc: '+4 SP' },
  cookedfish: { name: 'Grilled Fish', cat: 'food', hp: 5, desc: '+5 HP' },
  cookedmeat: { name: 'Roast Meat', cat: 'food', hp: 5, desc: '+5 HP' },
  stew:       { name: 'Camp Stew', cat: 'food', hp: 9, desc: '+9 HP' },
  tea:        { name: 'Herbal Tea', cat: 'food', sp: 7, desc: '+7 SP' },

  bandage:    { name: 'Bandage', cat: 'med', hp: 3, desc: '+3 HP. Makes revives faster and stronger.' },
  salve:      { name: 'Herb Salve', cat: 'med', hp: 6, desc: '+6 HP' },
  medkit:     { name: 'Med Kit', cat: 'med', hp: 10, desc: '+10 HP' },

  knife:      { name: 'Field Knife', cat: 'weapon', atk: 2, desc: '+2 ATK' },
  hammer:     { name: 'Claw Hammer', cat: 'weapon', atk: 2, desc: '+2 ATK' },
  pitchfork:  { name: 'Pitchfork', cat: 'weapon', atk: 2, desc: '+2 ATK' },
  spear:      { name: 'Flint Spear', cat: 'weapon', atk: 3, desc: '+3 ATK' },
  club:       { name: 'Stone Club', cat: 'weapon', atk: 3, desc: '+3 ATK' },
  huntingbow: { name: 'Hunting Bow', cat: 'weapon', atk: 3, desc: '+3 ATK' },
  ironspear:  { name: 'Iron Spear', cat: 'weapon', atk: 5, desc: '+5 ATK' },
  warhammer:  { name: 'War Hammer', cat: 'weapon', atk: 5, desc: '+5 ATK' },
  longbow:    { name: 'Wired Longbow', cat: 'weapon', atk: 5, desc: '+5 ATK' },
  beastpike:  { name: 'Beast Pike', cat: 'weapon', atk: 7, desc: '+7 ATK' },
  fangmaul:   { name: 'Fang Maul', cat: 'weapon', atk: 7, desc: '+7 ATK' },
  stormbow:   { name: 'Storm Bow', cat: 'weapon', atk: 7, desc: '+7 ATK' },

  clothvest:  { name: 'Cloth Vest', cat: 'armor', arm: 1, desc: '+1 armor' },
  leathercoat:{ name: 'Leather Coat', cat: 'armor', arm: 2, desc: '+2 armor' },
  scrapmail:  { name: 'Scrap Mail', cat: 'armor', arm: 3, desc: '+3 armor' },

  torch:      { name: 'Torch', cat: 'special', desc: 'Carried: better search odds at night.' },
  powercell:  { name: 'Power Cell', cat: 'part', desc: 'Beacon part 1 of 3. Install at the Lab.' },
  transmitter:{ name: 'Transmitter', cat: 'part', desc: 'Beacon part 2 of 3. Install at the Lab.' },
  ignition:   { name: 'Ignition Rig', cat: 'part', desc: 'Beacon part 3 of 3. Install at the Lab.' },
};

export const RECIPES = [
  { out: 'spear',      a: 'branch', b: 'flint' },
  { out: 'club',       a: 'branch', b: 'stone' },
  { out: 'huntingbow', a: 'branch', b: 'rope' },
  { out: 'ironspear',  a: 'spear', b: 'iron' },
  { out: 'warhammer',  a: 'club', b: 'iron' },
  { out: 'longbow',    a: 'huntingbow', b: 'wire' },
  { out: 'beastpike',  a: 'ironspear', b: 'fang' },
  { out: 'fangmaul',   a: 'warhammer', b: 'fang' },
  { out: 'stormbow',   a: 'longbow', b: 'fang' },
  { out: 'clothvest',  a: 'cloth', b: 'rope' },
  { out: 'leathercoat',a: 'hide', b: 'cloth' },
  { out: 'scrapmail',  a: 'leathercoat', b: 'iron' },
  { out: 'cookedfish', a: 'fish', b: 'matches' },
  { out: 'cookedmeat', a: 'meat', b: 'matches' },
  { out: 'stew',       a: 'pot', b: 'potato' },
  { out: 'tea',        a: 'herb', b: 'water' },
  { out: 'salve',      a: 'herb', b: 'cloth' },
  { out: 'torch',      a: 'branch', b: 'oil' },
  { out: 'powercell',  a: 'battery', b: 'wire' },
  { out: 'transmitter',a: 'lens', b: 'radioparts' },
  { out: 'ignition',   a: 'flint', b: 'oil' },
];

export const CREATURES = {
  rat:    { name: 'Grey Rat', hp: 3,  atk: 1, arm: 0, drops: ['meat'] },
  crow:   { name: 'Carrion Crow', hp: 2, atk: 1, arm: 0, drops: ['egg'] },
  dog:    { name: 'Feral Dog', hp: 5,  atk: 2, arm: 0, drops: ['meat', 'hide'] },
  boar:   { name: 'Tusked Boar', hp: 7, atk: 2, arm: 0, drops: ['meat', 'meat', 'hide'] },
  wolf:   { name: 'Ash Wolf', hp: 6,  atk: 2, arm: 0, drops: ['hide', 'meat'], rare: 'fang', rareChance: 0.25 },
  bear:   { name: 'Scarred Bear', hp: 10, atk: 3, arm: 1, drops: ['hide', 'hide', 'meat'], rare: 'fang', rareChance: 0.6 },
  warden: { name: 'The Warden', hp: 26, atk: 4, arm: 1, boss: true,
            drops: ['wardencore', 'fang', 'fang', 'medkit'] },
};

// Phase schedule (seconds at 1x). ambient = seconds between roaming spawns.
export const PHASES = [
  { id: 'day1',  name: 'Day 1',   until: 7 * 60,  night: false, ambient: 120, encounter: 0.04, spawns: ['rat', 'crow'] },
  { id: 'night1',name: 'Night 1', until: 12 * 60, night: true,  ambient: 70,  encounter: 0.08, spawns: ['dog', 'rat', 'dog'] },
  { id: 'day2',  name: 'Day 2',   until: 18 * 60, night: false, ambient: 80,  encounter: 0.06, spawns: ['boar', 'dog', 'wolf'] },
  { id: 'night2',name: 'Night 2', until: 23 * 60, night: true,  ambient: 70,  encounter: 0.10, spawns: ['wolf', 'bear', 'wolf'] },
  { id: 'lock',  name: 'Lockdown',until: 38 * 60, night: true,  ambient: 65,  encounter: 0.10, spawns: ['wolf', 'bear'] },
];
export const CREATURE_CAP = 6;
export const PURGE_AT = 38 * 60;
export const LOCKDOWN_AT = 23 * 60;
export const WARDEN_AT = 19 * 60;
export const FIRE_AT = 18 * 60;     // Lab grid power comes online at Night 2 — beacon can't fire before

export const BEACON_PARTS = ['powercell', 'transmitter', 'ignition'];
export const DEFEND_TIME = 90;      // seconds of beacon defense
export const WAVE_EVERY = 22;       // seconds between defense waves

export const SURVIVOR_DEFS = [
  { name: 'You',     color: '#e0a458', spawn: 'beach',      weaponLine: ['spear', 'ironspear', 'beastpike'], part: null },
  { name: 'Wren',    color: '#5fa8a0', spawn: 'dock',       weaponLine: ['huntingbow', 'longbow', 'stormbow'], part: 'ignition',
    lines: ['Eyes up. I hear something.', 'On my way.', 'Found a good haul here.', 'Keep moving, we can rest at the Lab.'] },
  { name: 'Brick',   color: '#c4573c', spawn: 'campsite',   weaponLine: ['club', 'warhammer', 'fangmaul'], part: 'powercell',
    lines: ['I’ll take point.', 'Something big out there.', 'Hold still, I’ve got you.', 'This’ll do as a weapon.'] },
  { name: 'Juniper', color: '#9b8fd4', spawn: 'lighthouse', weaponLine: ['spear', 'ironspear', 'beastpike'], part: 'transmitter',
    lines: ['Light’s still burning up here.', 'Patch up when you can.', 'Moving to you.', 'Almost have the parts.'] },
];

export const MAX_HP = 15;
export const MAX_SP = 15;
export const INV_SLOTS = 6;
export const COSTS = { search: 2, move: 3 };
export const TIMES = { search: 2, move: 4, revive: 6, reviveBandage: 3, install: 2, flee: 2 };
export const BLEEDOUT = 90;
export const EAT_COOLDOWN = 5;
export const LOCK_EVERY = 45;      // seconds between lockdown closures
export const LOCK_WARN = 30;       // warning before a closure
export const LOCK_DAMAGE = 5;      // collar shock when caught in a closing area
