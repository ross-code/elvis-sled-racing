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
  wooly: true,      // extra fluff tufts
  snowNose: true,   // pink-speckled "snow nose"
  stats: { speed: 22, acceleration: 20, endurance: 18, leadership: 28, smarts: 12 },
};

export const MAX_TEAMMATES = 4; // Elvis + up to 4 = 5 dogs

// ----- Visual themes (per-level biome) -------------------------------------
export const THEMES = {
  'aurora-night': {
    skyTop: 0x07112b, skyMid: 0x123a5e, skyHor: 0x2f7e8c,
    fog: 0x153f57, fogNear: 34, fogFar: 178,
    aurora: true, moon: true, sun: null, stars: 600, snow: 1,
    hemiSky: 0xbcd6ff, hemiGround: 0xdfeaff, hemiInt: 0.65,
    ambient: 0x405a7a, ambInt: 0.4, dir: 0xdfeaff, dirInt: 1.15,
    ground: 0xeaf0ff, trail: 0xd5deee, berm: 0xf4f8ff,
    rock: 0x6f757e, rockSnow: 0xf3f6ff, pine: 0x2f5d44,
  },
  'dawn-alpenglow': {
    skyTop: 0x1c2f63, skyMid: 0x7f6aa2, skyHor: 0xf4a868,
    fog: 0xddb59a, fogNear: 34, fogFar: 172,
    aurora: false, moon: false, sun: { color: 0xffe1ad, int: 1.5, pos: [-34, 22, -30] }, stars: 160, snow: 0.55,
    hemiSky: 0xddc4dc, hemiGround: 0xf6ecde, hemiInt: 0.95,
    ambient: 0x8a7686, ambInt: 0.66, dir: 0xffe6bb, dirInt: 1.55,
    ground: 0xf3edf1, trail: 0xdfd6da, berm: 0xfaf2ee,
    rock: 0x9c8170, rockSnow: 0xf8f0e8, pine: 0x3c5a47,
  },
  'ice-canyon': {
    skyTop: 0x0a1830, skyMid: 0x274a6a, skyHor: 0x86abc2,
    fog: 0xb7d2dd, fogNear: 24, fogFar: 128,
    aurora: true, moon: true, sun: null, stars: 300, snow: 2.2,
    hemiSky: 0xaecadd, hemiGround: 0xe2edf6, hemiInt: 0.9,
    ambient: 0x46607a, ambInt: 0.66, dir: 0xdcebf6, dirInt: 1.15,
    ground: 0xeaf2ff, trail: 0xcdd9e8, berm: 0xf2f8ff,
    rock: 0x69727e, rockSnow: 0xeef4ff, pine: 0x2a4d3c,
  },
};

// ----- Levels (escalate: turns + canyons + pace as you advance) ------------
// Theme through-line: legs of the 1925 serum run toward Nome.
export const LEVELS = [
  {
    id: 1, name: 'The Serum Run', from: 'Nenana', to: 'Nome', cargo: 'Diphtheria Serum',
    length: 1850, trailHalfWidth: 7, par: 150, seed: 20250125, theme: 'aurora-night',
    paceRamp: 0.5, startSpacing: 92, endSpacing: 30, clearStart: 180, clearFinish: 75,
    river: { dist: 1010, depth: 8 },
    curve: { bendAmp: 8, bendFreq: 0.0052, elevAmp: 0, elevFreq: 0.004, climb: 0, rampStart: 320 },
    canyons: [],
  },
  {
    id: 2, name: 'Rainy Pass', from: 'Rohn', to: 'Nikolai', cargo: 'Relief Supplies',
    length: 2100, trailHalfWidth: 7, par: 172, seed: 19250131, theme: 'dawn-alpenglow',
    paceRamp: 0.62, startSpacing: 78, endSpacing: 24, clearStart: 150, clearFinish: 72,
    river: { dist: 600, depth: 8 },
    curve: { bendAmp: 17, bendFreq: 0.0072, elevAmp: 1.7, elevFreq: 0.0046, climb: 7, rampStart: 220 },
    canyons: [{ start: 880, end: 1420, mode: 'gorge', wall: 30 }],
  },
  {
    id: 3, name: 'The Gorge', from: 'Shaktoolik', to: 'Koyuk', cargo: 'The Antitoxin',
    length: 2500, trailHalfWidth: 6.6, par: 198, seed: 19250202, theme: 'ice-canyon',
    paceRamp: 0.78, startSpacing: 62, endSpacing: 20, clearStart: 140, clearFinish: 70,
    river: null,
    curve: { bendAmp: 26, bendFreq: 0.0108, elevAmp: 2.6, elevFreq: 0.006, climb: -3, rampStart: 170 },
    canyons: [{ start: 520, end: 1000, mode: 'ridge', wall: 22 }, { start: 1560, end: 2180, mode: 'gorge', wall: 40 }],
  },
];

export const LEVEL1 = LEVELS[0]; // back-compat
export const getLevel = (i) => LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i | 0))];
