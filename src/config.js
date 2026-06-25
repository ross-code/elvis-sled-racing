// Game-wide constants, the stat system, coat palettes, and level data.

// ----- Dog stats -----------------------------------------------------------
// Each recruited dog gets a points budget to spend across these.
export const STAT_BUDGET = 100;
export const STAT_MIN = 5;
export const STAT_MAX = 40;

export const STATS = [
  { key: 'speed',        label: 'Speed',          blurb: 'Raises the team top speed.' },
  { key: 'acceleration', label: 'Acceleration',   blurb: 'Reach top speed faster, recover from hits quicker.' },
  { key: 'endurance',    label: 'Endurance',      blurb: 'Bigger stamina pool, slower to tire.' },
  { key: 'leadership',   label: 'Leadership',     blurb: 'Sharper, more responsive steering.' },
  { key: 'smarts',       label: 'Decision-Making', blurb: 'Earlier hazard warnings and a wider safe window at the river.' },
];

// ----- Coat & eye palettes -------------------------------------------------
// Each coat defines the husky materials. "under" is belly/legs/face blaze.
export const COATS = [
  { id: 'white',  name: 'Pure White',     main: 0xf2eee4, under: 0xffffff, mask: 0xeae2d3, earTip: 0xe7d8c2 },
  { id: 'bw',     name: 'Black & White',  main: 0x2c2c30, under: 0xf5f2ec, mask: 0x1c1c20, earTip: 0x242428 },
  { id: 'gray',   name: 'Gray & White',   main: 0x8b8f97, under: 0xf2f0ea, mask: 0x595d66, earTip: 0x6c7078 },
  { id: 'red',    name: 'Red & White',    main: 0xb06a3a, under: 0xf6ead8, mask: 0x8a4e26, earTip: 0xc98a55 },
  { id: 'agouti', name: 'Agouti (Wolf)',  main: 0x6b5d4a, under: 0xcdbfa6, mask: 0x3a3026, earTip: 0x564838 },
  { id: 'sable',  name: 'Sable',          main: 0x9a6b41, under: 0xead9c1, mask: 0x4c2f1a, earTip: 0xb98a59 },
];

export const EYES = [
  { id: 'blue',  name: 'Husky Blue', color: 0x73b7e6 },
  { id: 'brown', name: 'Brown',      color: 0x6b4326 },
  { id: 'amber', name: 'Amber',      color: 0xc8902f },
  { id: 'bi',    name: 'Bi-Eyed',    color: 0x73b7e6, color2: 0x6b4326 },
];

// Elvis — the fixed lead dog, matched to the real Elvis: small wooly pure-white
// Siberian, warm-cream coat, bright blue eyes, dark eye-liner, speckled nose.
export const ELVIS = {
  id: 'elvis',
  name: 'Elvis',
  isLead: true,
  coat: { id: 'elvis', name: 'Wooly White', main: 0xf3efe6, under: 0xffffff, mask: 0xefe7d8, earTip: 0xe9d8c0 },
  eye: { id: 'blue', name: 'Husky Blue', color: 0x6fb7e8 },
  wooly: true, // extra fluff tufts
  stats: { speed: 22, acceleration: 20, endurance: 18, leadership: 28, smarts: 12 },
};

export const MAX_TEAMMATES = 4; // Elvis + up to 4 = 5 dogs

// ----- Level 1 -------------------------------------------------------------
// Theme: a leg of the 1925 serum run — deliver diphtheria antitoxin toward Nome.
export const LEVEL1 = {
  id: 1,
  name: 'The Serum Run',
  from: 'Nenana',
  to: 'Nome',
  cargo: 'Diphtheria Serum',
  length: 1850,         // course length in metres
  trailHalfWidth: 9,    // how far left/right the sled can range
  par: 150,             // par time in seconds (for scoring)
  seed: 20250125,
};
