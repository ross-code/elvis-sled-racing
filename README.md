# 🛷 Elvis: Snow Run — Sled Dog Racing

A 3D sled-dog **racing / adventure** game starring **Elvis**, the small wooly pure-white
Siberian husky with bright blue eyes. Draft a team of huskies, harness up, and race the
legendary **1925 serum run** across **three escalating legs** — the trail bends and climbs,
cuts through **canyons with steep valley walls on either side**, and gets faster and busier the
deeper you go. Dodge fallen trees, ford icy rivers at the right spot, and outrun the wolves.

Built with [Three.js](https://threejs.org/) — runs entirely in the browser, no build step, no
install. Just open it.

**▶ Play:** _(enable GitHub Pages on this repo — see below)_

---

## How to play

1. **Title → Start the Run.**
2. **Draft your team.** Elvis is your locked lead dog (matched to the real Elvis). Recruit up to
   four more huskies — name each one, choose its **coat** (black & white, gray & white, red &
   white, agouti, sable, pure white) and **eye color**, and spend **100 points** across five
   characteristics.
3. **Race.** Auto-mush forward, steer to thread the obstacles, and deliver the serum to Nome with
   as much of it intact — and as fast — as you can. Three stars for a fast, clean, full-serum run.

> **It escalates.** Within each leg the trail gets **progressively faster and busier** — the
> team's pace ramps up (watch the **PACE** gauge) and obstacles thicken from a sparse opening into a
> dense final push. A guaranteed clear lane always exists, but it tightens.

### The journey — three legs

Win a leg and your team carries over to the next, harder one:

| Leg | Route | Terrain | Weather |
|---|---|---|---|
| 1 · The Serum Run | Nenana → Nome | Gentle sweeping bends, a river crossing | Aurora night |
| 2 · Rainy Pass | Rohn → Nikolai | S-curves, a climb, a **gorge** with towering rock walls | Dawn alpenglow |
| 3 · The Gorge | Shaktoolik → Koyuk | Sharp chicanes, a **ridge** with valleys falling away both sides, a deep gorge | Blizzard night |

The track turns, climbs and threads canyons via a "course path" transform — gameplay stays in
trail-relative lanes (so dodging is always fair) while the world bends and the camera banks into
the turns.

### Controls

| Action | Keys | Touch |
|---|---|---|
| Steer left / right | `←` `→` or `A` `D` | ◀ ▶ buttons |
| Mush faster (boost) | `Shift` / `Space` / `W` / `↑` | BOOST button |
| Mute / unmute | `M` | 🔊 button |

Boosting is faster but burns **stamina**. Cruise to recover it.

**Sound** is fully procedural (Web Audio, no audio files): a smooth runner-on-snow glide that
brightens with speed, paw-fall patter synced to the team's gait, and crash thuds. It starts when
you begin a run; mute with `M` or the 🔊 button (your choice is remembered).

### The five characteristics

Each dog gets **100 points** to distribute (5–40 per stat). Your sled is driven by the **team
average**, so a balanced roster matters.

- **Speed** — raises the team's top speed.
- **Acceleration** — reach top speed faster and recover quicker after a crash.
- **Endurance** — bigger stamina pool, tires more slowly.
- **Leadership** — sharper, more responsive steering.
- **Decision-Making** — earlier hazard warnings and a wider safe window at the river.

### Hazards

- 🪵 **Fallen logs** & 🪨 **rocks** — steer around them.
- 🫎 **Moose** — a big immovable hazard parked on the trail.
- 🐺 **Wolves** — they angle toward you as they close in; break away laterally.
- 🧊 **River crossing** — only the **ice bridge** (between the green flags) is safe. Miss it and
  the serum takes cold-water damage.

---

## Run it locally

No dependencies are required to play — it's static files. Any static server works:

```bash
# option A: zero-install (Python)
npm run dev          # -> http://localhost:5173

# option B: anything else
npx serve .
```

Then open the printed URL. (Opening `index.html` directly via `file://` will **not** work because
ES modules need to be served over HTTP.)

## Deploy (GitHub Pages)

1. Push to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`,
   folder `/ (root)`.
3. The game will be live at `https://<user>.github.io/elvis-sled-racing/`.

---

## Project layout

```
index.html          # shell + Three.js importmap (via unpkg CDN)
css/style.css       # all UI (title, draft, HUD, results)
src/
  main.js           # bootstrap + screen manager + results + leg progression
  screens.js        # title screen + team-draft screen (rotating husky showcase)
  race.js           # a race leg: physics, obstacles, river, camera, win/lose
  path.js           # the course path: bends, elevation, headings, canyon zones
  track.js          # segmented terrain that follows the path (trail, gorge walls, ridges)
  world.js          # themed atmosphere: sky, aurora/sun/moon, stars, mountains, snow
  husky.js          # the procedural Siberian husky (matched to Elvis) + run gait
  teamRig.js        # sled + musher + gangline + dog team formation
  props.js          # low-poly winter props (logs, rocks, moose, wolves, cabins…)
  hud.js            # in-race heads-up display
  input.js          # keyboard + touch
  config.js         # stats, coat/eye palettes, Elvis spec, THEMES + LEVELS
  util.js           # seeded RNG + helpers
assets/reference/   # drop the real Elvis photos here (see ELVIS.md)
```

## Roadmap

Three legs ship today (turning tracks, gorges/ridges, biome themes, escalating pace & density).
Adding a new leg is just another entry in `LEVELS` (route, `curve`, `canyons`, `theme`) in
[config.js](src/config.js). Planned next: overflow-ice hazards, whiteout visibility spikes,
avalanches in the gorge, ranked time trials, and per-dog fatigue across the journey.

## Credits

Starring **Elvis** 🐺. Inspired by the 1925 serum run to Nome (Balto & Togo). Made with Three.js.
