// A race leg: the team runs the course while the world bends, climbs and cuts
// through canyons (path.js transform). Gameplay stays in trail-relative "lane"
// coordinates, so collisions/pace/passability are independent of the visuals.
import * as THREE from 'three';
import { input } from './input.js';
import { clamp, damp, lerp, makeRng, rand } from './util.js';
import { createWorld } from './world.js';
import { createTrailPath } from './path.js';
import { createTrack } from './track.js';
import { createTeamRig } from './teamRig.js';
import { createHud } from './hud.js';
import { makeLog, makeRock, makeMoose, makeWolf, makeFlag, makeCabin } from './props.js';
import { getLevel, THEMES } from './config.js';

const RIG_HALF = 0.85;
const moveToward = (a, b, step) => (Math.abs(b - a) <= step ? b : a + Math.sign(b - a) * step);

function aggregate(team) {
  const sum = { speed: 0, acceleration: 0, endurance: 0, leadership: 0, smarts: 0 };
  for (const d of team) for (const k in sum) sum[k] += d.stats[k];
  const n = team.length, avg = {};
  for (const k in sum) avg[k] = sum[k] / n;
  return avg;
}

function bannerTexture(top, bottom) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#7a1f1f'; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = '#ffd27a'; g.lineWidth = 8; g.strokeRect(14, 14, 484, 228);
  g.textAlign = 'center'; g.fillStyle = '#fff4e0';
  g.font = 'bold 88px Georgia'; g.fillText(top, 256, 118);
  g.font = 'bold 44px Georgia'; g.fillStyle = '#ffd27a'; g.fillText(bottom, 256, 186);
  return new THREE.CanvasTexture(c);
}

export function createRaceScreen({ onFinish }) {
  const screen = { scene: null, camera: null };
  let world, rig, hud, level, theme, avg, path, track, dirLight;
  let obstacles, river, finishGroup, startProps;
  let st, done = false, shake = 0, levelIndex = 0;

  screen.enter = function (team, idx = 0) {
    levelIndex = idx;
    level = getLevel(idx);
    theme = THEMES[level.theme] || THEMES['aurora-night'];
    avg = aggregate(team);
    const rng = makeRng(level.seed);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.skyTop);
    scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);
    screen.scene = scene;

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 800);
    camera.position.set(0, 4.4, 8);
    screen.camera = camera;

    // Lights (themed — warm sun for the alpenglow leg, cool moonlight otherwise)
    scene.add(new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiInt));
    scene.add(new THREE.AmbientLight(theme.ambient, theme.ambInt));
    dirLight = new THREE.DirectionalLight(theme.dir, theme.dirInt);
    dirLight.position.set(-18, 34, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 1; dirLight.shadow.camera.far = 130;
    Object.assign(dirLight.shadow.camera, { left: -18, right: 18, top: 20, bottom: -20 });
    dirLight.shadow.camera.updateProjectionMatrix();
    dirLight.shadow.bias = -0.0006;
    scene.add(dirLight, dirLight.target);

    // Path + atmosphere + terrain + rig
    path = createTrailPath(level);
    world = createWorld(rng, { theme, scroll: true, ground: false });
    scene.add(world.group);
    track = createTrack(rng, path, level, theme);
    scene.add(track.group);
    rig = createTeamRig(team);
    scene.add(rig.group);

    // Start-town cabins, positioned via the path each frame (behind the line)
    startProps = [];
    for (let i = 0; i < 4; i++) {
      const cb = makeCabin(rng); cb.scale.setScalar(1.2); scene.add(cb);
      startProps.push({ obj: cb, d: -8 - i * 5, lane: (i % 2 ? 1 : -1) * (level.trailHalfWidth + 5 + rng() * 4) });
    }

    // ---- Course layout (procedural, escalating) ---------------------------
    obstacles = [];
    const maxX = level.trailHalfWidth - 1.4;
    const addOb = (dist, type, obj, half, x) => {
      obj.position.set(x, 0, -999); obj.visible = false; scene.add(obj);
      obstacles.push({ dist, type, obj, half, x, passed: false, chase: type === 'wolf' });
    };
    const makeProp = (type) => {
      if (type === 'rock') { const s = rand(rng, 0.8, 1.4); return { obj: makeRock(rng, s), half: s, type }; }
      const o = makeLog(rng); return { obj: o, half: o.userData.halfWidth, type: 'log' };
    };

    const hasRiver = !!level.river;
    const riverDist = hasRiver ? level.river.dist : -1, riverDepth = hasRiver ? level.river.depth : 0;
    const moose1 = Math.round(level.length * 0.37), moose2 = Math.round(level.length * 0.82), wolfAt = Math.round(level.length * 0.62);
    const bands = [[moose1 - 15, moose1 + 15], [moose2 - 15, moose2 + 15], [wolfAt - 22, wolfAt + 26]];
    if (hasRiver) bands.push([riverDist - 26, riverDist + riverDepth + 16]);
    const inBand = (d) => bands.some(([lo, hi]) => d > lo && d < hi);

    let gapCenter = 0;
    for (let d = level.clearStart; d < level.length - level.clearFinish; ) {
      const p = clamp(d / level.length, 0, 1);
      const spacing = lerp(level.startSpacing, level.endSpacing, p);
      if (inBand(d)) { d += spacing; continue; }
      const gapHalf = lerp(2.9, 2.1, p);
      const drift = Math.min(2.6, spacing * 0.16);
      gapCenter = clamp(gapCenter + rand(rng, -drift, drift), -1.8, 1.8);
      const twoUp = p > 0.2 && rng() < 0.06 + 0.5 * p;
      if (twoUp) {
        for (const side of [-1, 1]) {
          const it = makeProp('rock');
          addOb(d, it.type, it.obj, it.half, clamp(gapCenter + side * (gapHalf + it.half), -(maxX - it.half), maxX - it.half));
        }
      } else {
        const it = makeProp(rng() < 0.32 + 0.12 * p ? 'rock' : 'log');
        const side = rng() < 0.5 ? -1 : 1;
        addOb(d, it.type, it.obj, it.half, clamp(gapCenter + side * (gapHalf + it.half), -(maxX - it.half), maxX - it.half));
      }
      d += spacing;
    }

    // Set-pieces (scaled along the leg): two moose and a wolf pack.
    { const o = makeMoose(rng); addOb(moose1, 'moose', o, o.userData.halfWidth, rand(rng, -3, 3)); }
    { const o = makeMoose(rng); addOb(moose2, 'moose', o, o.userData.halfWidth, rand(rng, -3, 3)); }
    for (let i = 0; i < 2; i++) { const o = makeWolf(rng); addOb(wolfAt + i * 8, 'wolf', o, o.userData.halfWidth, (i ? 1 : -1) * 3); }

    // ---- River crossing (optional per level) ------------------------------
    river = null;
    if (hasRiver) {
      const safeHalf = 1.8 + avg.smarts * 0.06;
      const safeX = rand(rng, -maxX + safeHalf, maxX - safeHalf);
      river = { dist: riverDist, depth: riverDepth, safeX, safeHalf, done: false, group: new THREE.Group() };
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(level.trailHalfWidth * 2 + 6, riverDepth).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x1f5d6b, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.9 })
      );
      water.position.y = 0.01; river.group.add(water); river._water = water;
      const bridge = new THREE.Mesh(
        new THREE.PlaneGeometry(safeHalf * 2, riverDepth + 1.4).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xdfeaff, roughness: 0.5, emissive: 0x223344, emissiveIntensity: 0.2 })
      );
      bridge.position.set(safeX, 0.06, 0); river.group.add(bridge);
      for (const s of [-1, 1]) {
        const f = makeFlag(0x39c66d); f.position.set(safeX + s * safeHalf, 0, -riverDepth / 2 - 0.3); river.group.add(f);
        const f2 = makeFlag(0x39c66d); f2.position.set(safeX + s * safeHalf, 0, riverDepth / 2 + 0.3); river.group.add(f2);
      }
      river.group.position.z = -999; scene.add(river.group);
    }

    // ---- Finish ----------------------------------------------------------
    finishGroup = new THREE.Group();
    const post = (x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2b })); p.position.set(x, 2.5, 0); p.castShadow = true; return p; };
    finishGroup.add(post(-level.trailHalfWidth), post(level.trailHalfWidth));
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(level.trailHalfWidth * 2, 2.2),
      new THREE.MeshStandardMaterial({ map: bannerTexture(level.to, '★ FINISH ★'), side: THREE.DoubleSide })
    );
    banner.position.set(0, 4.4, 0); finishGroup.add(banner);
    for (let i = 0; i < 6; i++) {
      const cb = makeCabin(rng);
      cb.position.set((i % 2 ? 1 : -1) * (level.trailHalfWidth + 4 + rng() * 6), 0, -4 - i * 4);
      finishGroup.add(cb);
    }
    finishGroup.position.z = -999; scene.add(finishGroup);

    // ---- Derived performance from team stats ------------------------------
    const perf = {
      topSpeed: 13 + avg.speed * 0.16,
      accelLambda: 0.7 + avg.acceleration * 0.045,
      staminaMax: 70 + avg.endurance * 1.5,
      boostDrain: clamp(20 - avg.endurance * 0.22, 8, 20),
      baseDrain: 2.4,
      regen: 5 + avg.endurance * 0.13,
      handling: 3 + avg.leadership * 0.13,
      steerRate: 8.2,
      warnDist: 26 + avg.smarts * 0.7,
    };

    st = {
      travelled: 0, speed: 0, x: 0, xVel: 0, steer: 0,
      stamina: perf.staminaMax, cargo: 1, time: 0, t: 0,
      topMph: 0, hits: 0, maxX, perf, started: false, countdown: 3,
    };
    done = false; shake = 0;

    hud = createHud(level);
    document.body.appendChild(hud.root);
    hud.setWarn('Leg ' + level.id + ': ' + level.from + ' → ' + level.to + '   (◀ ▶ steer · hold ⇧/Space to mush)');
  };

  screen.exit = function () {
    if (hud && hud.root.parentNode) hud.root.parentNode.removeChild(hud.root);
  };

  screen.update = function (dt) {
    if (!st) return;
    dt = Math.min(dt, 0.05);
    st.t += dt;

    if (!st.started) {
      st.countdown -= dt;
      if (st.countdown <= 0) { st.started = true; hud.setWarn(null); }
      else hud.setWarn('Get ready… ' + Math.ceil(st.countdown));
    }
    const racing = st.started && !done;
    const P = st.perf;
    const progress = clamp(st.travelled / level.length, 0, 1);
    const pace = 1 + level.paceRamp * progress;
    const warnDistDyn = P.warnDist + st.speed * 1.1;

    // Steering (trail-relative lane)
    st.steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const desiredVel = racing ? st.steer * P.steerRate : 0;
    st.xVel = damp(st.xVel, desiredVel, P.handling, dt);
    st.x = clamp(st.x + st.xVel * dt, -st.maxX, st.maxX);

    // Speed + stamina
    if (racing) {
      const boosting = input.boost && st.stamina > 0;
      let target = P.topSpeed * pace * (boosting ? 1.27 : 0.86);
      if (st.stamina < 15) target *= 0.62;
      st.speed = damp(st.speed, target, P.accelLambda, dt);
      st.stamina += (boosting ? -P.boostDrain : P.regen - P.baseDrain) * dt;
      st.stamina = clamp(st.stamina, 0, P.staminaMax);
      st.travelled += st.speed * dt;
      st.time += dt;
    } else {
      st.speed = damp(st.speed, 0, 2, dt);
    }
    const speedMph = st.speed * 2.237;
    st.topMph = Math.max(st.topMph, speedMph);

    // Obstacles (placed via the path transform; collide in lane space)
    let warnMsg = null, warnNear = 1e9;
    for (const o of obstacles) {
      const ahead = o.dist - st.travelled;
      if (o.chase && ahead < 1 && ahead > -55 && racing) o.x = moveToward(o.x, st.x, 1.9 * dt);
      path.toWorld(o.dist, o.x, 0, st.travelled, o.obj.position);
      o.obj.rotation.y = -Math.atan2(path.dx(o.dist), 1);
      o.obj.visible = ahead < theme.fogFar + 12 && ahead > -14;
      if (racing && !o.passed && ahead < 1.6 && ahead > -2.2) {
        if (Math.abs(st.x - o.x) < o.half + RIG_HALF) hit(o.type);
        o.passed = true;
      }
      if (racing && !o.passed && ahead > 0 && ahead < warnDistDyn && ahead < warnNear) {
        warnNear = ahead; warnMsg = warnLabel(o.type);
      }
    }

    // River
    if (river) {
      path.toWorld(river.dist + river.depth / 2, 0, 0, st.travelled, river.group.position);
      river.group.rotation.y = -Math.atan2(path.dx(river.dist), 1);
      river._water.material.opacity = 0.78 + Math.sin(st.t * 3) * 0.06;
      const ahead = river.dist - st.travelled;
      if (racing && !river.done) {
        if (st.travelled > river.dist) {
          river.done = true;
          if (Math.abs(st.x - river.safeX) <= river.safeHalf) hud.showToast('Clean crossing! 🧊', 'good');
          else { st.cargo -= 0.16; st.speed *= 0.45; st.hits++; shake = 0.7; hud.showToast('Cold water! 🥶  Cargo soaked', 'bad'); }
        } else if (ahead < warnDistDyn + 18 && ahead < warnNear) {
          warnNear = ahead; warnMsg = '⚠ River crossing — aim between the green flags';
        }
      }
    }

    if (st.started) hud.setWarn(warnMsg);

    // Start props + finish, positioned along the path
    for (const sp of startProps) {
      path.toWorld(sp.d, sp.lane, 0, st.travelled, sp.obj.position);
      sp.obj.visible = (sp.d - st.travelled) > -16 && (sp.d - st.travelled) < theme.fogFar;
    }
    path.toWorld(level.length, 0, 0, st.travelled, finishGroup.position);
    finishGroup.rotation.y = -Math.atan2(path.dx(level.length), 1);

    // Win / lose
    st.cargo = clamp(st.cargo, 0, 1);
    if (racing) {
      if (st.cargo <= 0) finish(false);
      else if (st.travelled >= level.length) finish(true);
    }

    // Rig — sits on the trail, aligned to the local heading + grade, banking in turns
    path.toWorld(st.travelled, st.x, 0, st.travelled, rig.group.position);
    rig.group.rotation.y = -Math.atan2(path.dx(st.travelled), 1);
    rig.group.rotation.x = Math.atan2(path.dy(st.travelled), 1);
    rig.update(st.t, clamp(st.speed / (P.topSpeed * pace), 0, 1.3), clamp(st.xVel / P.steerRate, -1, 1));

    // Camera — chase, banking into the upcoming bend and tilting for hills
    if (shake > 0) shake = Math.max(0, shake - dt * 1.6);
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    const LA = 30;
    const aheadX = path.x(st.travelled + LA) - path.x(st.travelled);
    const aheadY = path.y(st.travelled + LA) - path.y(st.travelled);
    const cam = screen.camera;
    cam.position.x = damp(cam.position.x, st.x * 0.45 + aheadX * 0.18, 6, dt) + sx;
    cam.position.y = 4.4 + sy + clamp(aheadY * 0.25, -1.2, 1.6);
    cam.position.z = 8;
    cam.lookAt(st.x * 0.3 + aheadX * 0.65, 1.5 + aheadY * 0.85, -LA);

    if (dirLight) { dirLight.position.set(st.x - 18, 34, 12); dirLight.target.position.set(st.x, 0, -6); }

    hud.set({
      progress, time: st.time, speedMph, topMph: st.topMph, pace,
      stamina: clamp(st.stamina / P.staminaMax, 0, 1), cargo: st.cargo,
    });
    hud.tick(dt);

    track.update(st.travelled);
    world.update(dt, st.travelled, st.speed, cam.position);

    function hit(type) {
      const dmg = { log: 0.1, rock: 0.08, moose: 0.16, wolf: 0.13 }[type] || 0.1;
      st.cargo -= dmg; st.speed *= 0.42; st.hits++; shake = 0.7;
      hud.showToast(hitLabel(type), 'bad');
    }
  };

  function finish(win) {
    if (done) return;
    done = true;
    setTimeout(() => onFinish({
      win, level, levelIndex, time: st.time, topMph: st.topMph, hits: st.hits, cargo: st.cargo,
    }), 700);
  }

  return screen;
}

function warnLabel(t) {
  return { log: '⚠ Fallen tree ahead — steer around it', rock: '⚠ Rocks ahead', moose: '⚠ MOOSE on the trail!', wolf: '⚠ Wolves closing in — break away!' }[t] || '⚠ Obstacle ahead';
}
function hitLabel(t) {
  return { log: 'Smacked a log! 🪵', rock: 'Hit the rocks! 🪨', moose: 'Tangled with a moose! 🫎', wolf: 'Wolves struck! 🐺' }[t] || 'Crash!';
}
