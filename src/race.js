// Level 1 — "The Serum Run": race the team from Nenana toward Nome, dodging
// fallen logs, rocks, a moose and wolves, and crossing the river at the ice
// bridge. Forward is -Z; the world scrolls past a near-stationary sled rig.
import * as THREE from 'three';
import { input } from './input.js';
import { clamp, damp, makeRng, rand } from './util.js';
import { createWorld, worldZ } from './world.js';
import { createTeamRig } from './teamRig.js';
import { createHud } from './hud.js';
import { makeLog, makeRock, makeMoose, makeWolf, makeFlag, makeCabin } from './props.js';
import { LEVEL1 } from './config.js';

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
  g.fillStyle = '#ffffff'; g.lineWidth = 8;
  g.strokeStyle = '#ffd27a'; g.strokeRect(14, 14, 484, 228);
  g.textAlign = 'center'; g.fillStyle = '#fff4e0';
  g.font = 'bold 92px Georgia'; g.fillText(top, 256, 120);
  g.font = 'bold 46px Georgia'; g.fillStyle = '#ffd27a'; g.fillText(bottom, 256, 188);
  return new THREE.CanvasTexture(c);
}

export function createRaceScreen({ onFinish }) {
  const screen = { scene: null, camera: null };
  let world, rig, hud, level, avg;
  let obstacles, river, finishGroup;
  let st; // mutable race state
  let done = false;
  let shake = 0;

  screen.enter = function (team) {
    level = LEVEL1;
    avg = aggregate(team);
    const rng = makeRng(level.seed);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1730);
    scene.fog = new THREE.Fog(0x153f57, 34, 158);
    screen.scene = scene;

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 700);
    camera.position.set(0, 4.4, 8);
    screen.camera = camera;

    // Lights
    scene.add(new THREE.HemisphereLight(0xbcd6ff, 0xdfeaff, 0.65));
    const amb = new THREE.AmbientLight(0x405a7a, 0.4); scene.add(amb);
    const moon = new THREE.DirectionalLight(0xdfeaff, 1.15);
    moon.position.set(-18, 34, 12);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.near = 1; moon.shadow.camera.far = 120;
    const sc = moon.shadow.camera;
    sc.left = -16; sc.right = 16; sc.top = 18; sc.bottom = -18; sc.updateProjectionMatrix();
    moon.shadow.bias = -0.0006;
    scene.add(moon); scene.add(moon.target);
    screen._moon = moon;

    // World + team rig
    world = createWorld(rng, { trailHalfWidth: level.trailHalfWidth, scroll: true });
    scene.add(world.group);
    rig = createTeamRig(team);
    scene.add(rig.group);

    // Start town (Nenana) just behind the start line
    for (let i = 0; i < 4; i++) {
      const cb = makeCabin(rng);
      cb.position.set((i % 2 ? 1 : -1) * (level.trailHalfWidth + 5 + rng() * 4), 0, 6 + i * 5);
      cb.scale.setScalar(1.2);
      scene.add(cb);
    }

    // ---- Course layout ----------------------------------------------------
    obstacles = [];
    const maxX = level.trailHalfWidth - 1.4;
    const px = () => rand(rng, -maxX, maxX);
    const addOb = (dist, type, obj, half, x) => {
      obj.position.set(x, 0, -999); obj.visible = false; scene.add(obj);
      obstacles.push({ dist, type, obj, half, x, passed: false, chase: type === 'wolf' });
    };
    const logSpots = [230, 360, 430, 560, 850, 930, 1255, 1330, 1405, 1505];
    for (const d of logSpots) { const o = makeLog(rng); addOb(d, 'log', o, o.userData.halfWidth, px()); }
    for (const d of [300, 500, 640, 1180, 1620]) {
      const s = rand(rng, 0.8, 1.4); const o = makeRock(rng, s); addOb(d, 'rock', o, s, px());
    }
    { const o = makeMoose(rng); addOb(700, 'moose', o, o.userData.halfWidth, rand(rng, -3, 3)); }
    { const o = makeMoose(rng); addOb(1545, 'moose', o, o.userData.halfWidth, rand(rng, -3, 3)); }
    // Wolf pack near 1150
    for (let i = 0; i < 2; i++) { const o = makeWolf(rng); addOb(1150 + i * 8, 'wolf', o, o.userData.halfWidth, (i ? 1 : -1) * 3); }

    // ---- River crossing ---------------------------------------------------
    const riverDist = 1010, depth = 8;
    const safeHalf = 1.8 + avg.smarts * 0.06;
    const safeX = rand(rng, -maxX + safeHalf, maxX - safeHalf);
    river = { dist: riverDist, depth, safeX, safeHalf, done: false, group: new THREE.Group() };
    const waterW = level.trailHalfWidth * 2 + 6;
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(waterW, depth).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1f5d6b, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.9 })
    );
    water.position.y = 0.01; river.group.add(water);
    river._water = water;
    const bridge = new THREE.Mesh(
      new THREE.PlaneGeometry(safeHalf * 2, depth + 1.4).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xdfeaff, roughness: 0.5, emissive: 0x223344, emissiveIntensity: 0.2 })
    );
    bridge.position.set(safeX, 0.06, 0); river.group.add(bridge);
    for (const s of [-1, 1]) {
      const f = makeFlag(0x39c66d); f.position.set(safeX + s * safeHalf, 0, -depth / 2 - 0.3); river.group.add(f);
      const f2 = makeFlag(0x39c66d); f2.position.set(safeX + s * safeHalf, 0, depth / 2 + 0.3); river.group.add(f2);
    }
    river.group.position.z = -999; scene.add(river.group);

    // ---- Finish (Nome) ----------------------------------------------------
    finishGroup = new THREE.Group();
    const post = (x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2b })); p.position.set(x, 2.5, 0); p.castShadow = true; return p; };
    finishGroup.add(post(-level.trailHalfWidth), post(level.trailHalfWidth));
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(level.trailHalfWidth * 2, 2.2),
      new THREE.MeshStandardMaterial({ map: bannerTexture('NOME', '★ FINISH ★'), side: THREE.DoubleSide })
    );
    banner.position.set(0, 4.4, 0); finishGroup.add(banner);
    for (let i = 0; i < 6; i++) {
      const cb = makeCabin(rng);
      cb.position.set((i % 2 ? 1 : -1) * (level.trailHalfWidth + 4 + rng() * 6), 0, -4 - i * 4);
      scene.add(cb); finishGroup.add(cb);
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

    // ---- Race state -------------------------------------------------------
    st = {
      travelled: 0, speed: 0, x: 0, xVel: 0, steer: 0,
      stamina: perf.staminaMax, cargo: 1, time: 0, t: 0,
      topMph: 0, hits: 0, maxX, perf, started: false, countdown: 3,
    };
    done = false; shake = 0;

    hud = createHud(level);
    document.body.appendChild(hud.root);
    hud.setWarn(level.cargo + ' loaded. ' + level.from + ' → ' + level.to + '   (◀ ▶ steer · hold ⇧/Space to mush)');
  };

  screen.exit = function () {
    if (hud && hud.root.parentNode) hud.root.parentNode.removeChild(hud.root);
  };

  screen.update = function (dt) {
    if (!st) return;
    dt = Math.min(dt, 0.05);
    st.t += dt;

    // Countdown gate before the race begins
    if (!st.started) {
      st.countdown -= dt;
      if (st.countdown <= 0) { st.started = true; hud.setWarn(null); }
      else hud.setWarn('Get ready… ' + Math.ceil(st.countdown));
    }
    const racing = st.started && !done;
    const P = st.perf;

    // Steering
    st.steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const desiredVel = racing ? st.steer * P.steerRate : 0;
    st.xVel = damp(st.xVel, desiredVel, P.handling, dt);
    st.x = clamp(st.x + st.xVel * dt, -st.maxX, st.maxX);

    // Speed + stamina
    if (racing) {
      const boosting = input.boost && st.stamina > 0;
      let target = P.topSpeed * (boosting ? 1.27 : 0.86);
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

    // Obstacles: position, chase, collide
    let warnMsg = null, warnNear = 1e9;
    for (const o of obstacles) {
      const zr = worldZ(o.dist, st.travelled);
      if (o.chase && zr < 2 && zr > -55 && racing) o.x = moveToward(o.x, st.x, 1.9 * dt);
      o.obj.position.set(o.x, 0, zr);
      o.obj.visible = zr > -170 && zr < 14;
      if (racing && !o.passed && zr > -1.6 && zr < 2.2) {
        // reached this obstacle's plane — resolve the dodge
        if (Math.abs(st.x - o.x) < o.half + RIG_HALF) hit(o.type);
        o.passed = true;
      }
      if (racing && !o.passed) {
        const ahead = o.dist - st.travelled;
        if (ahead > 0 && ahead < P.warnDist && ahead < warnNear) {
          warnNear = ahead; warnMsg = warnLabel(o.type);
        }
      }
    }

    // River
    {
      const rzr = worldZ(river.dist + river.depth / 2, st.travelled);
      river.group.position.z = rzr;
      river._water.material.opacity = 0.78 + Math.sin(st.t * 3) * 0.06;
      const ahead = river.dist - st.travelled;
      if (racing && !river.done) {
        if (st.travelled > river.dist) {
          river.done = true;
          if (Math.abs(st.x - river.safeX) <= river.safeHalf) {
            hud.showToast('Clean crossing! 🧊', 'good');
          } else {
            st.cargo -= 0.16; st.speed *= 0.45; st.hits++; shake = 0.7;
            hud.showToast('Cold water! 🥶  Serum soaked', 'bad');
          }
        } else if (ahead < P.warnDist + 18 && ahead < warnNear) {
          warnNear = ahead; warnMsg = '⚠ River crossing — aim between the green flags';
        }
      }
    }

    if (st.started) hud.setWarn(warnMsg); // null clears; countdown owns the pre-start text

    // Finish marker position
    finishGroup.position.z = worldZ(level.length, st.travelled);

    // Win / lose
    st.cargo = clamp(st.cargo, 0, 1);
    if (racing) {
      if (st.cargo <= 0) finish(false);
      else if (st.travelled >= level.length) finish(true);
    }

    // Animate rig + camera
    rig.group.position.x = st.x;
    rig.update(st.t, clamp(st.speed / P.topSpeed, 0, 1.3), clamp(st.xVel / P.steerRate, -1, 1));

    if (shake > 0) shake = Math.max(0, shake - dt * 1.6);
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    const cam = screen.camera;
    cam.position.x = damp(cam.position.x, st.x * 0.5, 6, dt) + sx;
    cam.position.y = 4.4 + sy;
    cam.position.z = 8;
    cam.lookAt(st.x * 0.35, 1.5, -9);

    // Keep the moonlight + shadow frustum centered on the rig
    if (screen._moon) { screen._moon.position.set(st.x - 18, 34, 12); screen._moon.target.position.set(st.x, 0, -4); }

    // HUD
    hud.set({
      progress: clamp(st.travelled / level.length, 0, 1),
      time: st.time, speedMph, topMph: st.topMph,
      stamina: clamp(st.stamina / P.staminaMax, 0, 1), cargo: st.cargo,
    });
    hud.tick(dt);

    // World ambience (snow follows camera)
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
      win, level, time: st.time, topMph: st.topMph, hits: st.hits, cargo: st.cargo,
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
