# 🛷 Elvis: Snow Run — Sled Dog Racing

A 3D sled-dog **racing / adventure** game starring **Elvis**, the small wooly pure-white
Siberian husky with bright blue eyes. Draft a team of huskies, harness up, and race a leg of
the legendary **1925 serum run** — delivering medicine from **Nenana toward Nome** across the
Alaskan night while you dodge fallen trees, ford an icy river at the right spot, and outrun a
wolf pack.

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

### Controls

| Action | Keys | Touch |
|---|---|---|
| Steer left / right | `←` `→` or `A` `D` | ◀ ▶ buttons |
| Mush faster (boost) | `Shift` / `Space` / `W` / `↑` | BOOST button |

Boosting is faster but burns **stamina**. Cruise to recover it.

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
  main.js           # bootstrap + screen manager + results
  screens.js        # title screen + team-draft screen (rotating husky showcase)
  race.js           # Level 1 "The Serum Run": physics, obstacles, river, win/lose
  world.js          # aurora sky, snow, mountains, scrolling pines & trail markers
  husky.js          # the procedural Siberian husky (matched to Elvis) + run gait
  teamRig.js        # sled + musher + gangline + dog team formation
  props.js          # low-poly winter props (logs, rocks, moose, wolves, cabins…)
  hud.js            # in-race heads-up display
  input.js          # keyboard + touch
  config.js         # stats, coat/eye palettes, Elvis spec, Level 1 data
  util.js           # seeded RNG + helpers
assets/reference/   # drop the real Elvis photos here (see ELVIS.md)
```

## Roadmap

Level 1 is the start. Planned next legs: more serum-run stages (Shaktoolik, Golovin), blizzards
and whiteout visibility, overflow ice, a day/dusk cycle, ranked time trials, and per-dog
fatigue. The course generator and stat system are already built to extend.

## Credits

Starring **Elvis** 🐺. Inspired by the 1925 serum run to Nome (Balto & Togo). Made with Three.js.
