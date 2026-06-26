// Segmented terrain that follows the course path: trail ribbon, flank snowfields,
// gorge walls / ridge drop-offs (the "steep valleys"), edge markers and scenery.
// Reuses the gameplay-neutral path transform so the world bends & climbs visually.
import * as THREE from 'three';
import { rand, clamp } from './util.js';
import { makePine, makeRock } from './props.js';

const std = (c, rough = 0.95, flat = false) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: rough, flatShading: flat });

export function createTrack(rng, path, level, theme) {
  const group = new THREE.Group();
  const halfW = level.trailHalfWidth;
  const SEG = 6;
  const COUNT = Math.ceil((theme.fogFar + 26) / SEG) + 2;

  const trailMat = std(theme.trail, 0.95);
  const groundMat = std(theme.ground, 1);
  const bermMat = std(theme.berm, 1);
  const rockMat = std(theme.rock, 0.96, true);
  const rockSnowMat = std(theme.rockSnow, 1, true);

  const hasGorge = (level.canyons || []).some((c) => c.mode === 'gorge');
  const hasRidge = (level.canyons || []).some((c) => c.mode === 'ridge');

  function flat(w, d, mat, y = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), mat);
    m.position.y = y; m.receiveShadow = true; return m;
  }
  function bx(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
  }

  // Build a gorge wall (rises from the trail edge). Pivot at base; scale.y = intensity.
  function gorgeWall(side, wall) {
    const g = new THREE.Group();
    const face = bx(wall * 0.5, wall, SEG + 0.6, rockMat, side * (halfW + wall * 0.22), wall * 0.5, 0);
    face.rotation.z = side * 0.16;
    const cap = bx(wall * 0.58, wall * 0.14, SEG + 0.6, rockSnowMat, side * (halfW + wall * 0.22), wall * 1.0, 0);
    cap.rotation.z = side * 0.16;
    const slab1 = bx(wall * 0.26, wall * 0.6, SEG * 0.5, rockMat, side * (halfW + wall * 0.05), wall * 0.42, SEG * 0.18);
    slab1.rotation.set(0.2, 0, side * 0.05);
    const slab2 = bx(wall * 0.22, wall * 0.45, SEG * 0.4, rockMat, side * (halfW + wall * 0.34), wall * 0.7, -SEG * 0.2);
    slab2.rotation.set(-0.15, 0, side * 0.3);
    g.add(face, cap, slab1, slab2);
    return g;
  }
  // Build a ridge drop-off (ground falls away into a valley).
  function ridgeDrop(side, wall) {
    const g = new THREE.Group();
    const slope = new THREE.Mesh(new THREE.PlaneGeometry(24, SEG + 0.6).rotateX(-Math.PI / 2), groundMat);
    slope.position.set(side * (halfW + 11), -wall * 0.42, 0);
    slope.rotation.z = side * 0.85; // tilt the snow slope down into the valley
    slope.receiveShadow = true;
    const rocks = bx(2.4, wall * 0.7, SEG * 0.5, rockMat, side * (halfW + 4), -wall * 0.35, 0);
    rocks.rotation.z = side * 0.5;
    g.add(slope, rocks);
    return g;
  }

  const segs = [];
  for (let i = 0; i < COUNT; i++) {
    const root = new THREE.Group();
    const trail = flat(halfW * 2 + 0.4, SEG + 0.5, trailMat, 0.02);
    const openL = flat(34, SEG + 0.6, groundMat, 0); openL.position.x = -(halfW + 17);
    const openR = flat(34, SEG + 0.6, groundMat, 0); openR.position.x = halfW + 17;
    const bermL = bx(0.7, 0.45, SEG + 0.5, bermMat, -(halfW + 0.5), 0.16, 0);
    const bermR = bx(0.7, 0.45, SEG + 0.5, bermMat, halfW + 0.5, 0.16, 0);
    root.add(trail, openL, openR, bermL, bermR);
    const s = { root, trail, openL, openR, bermL, bermR, d: -1, flag: null, gL: null, gR: null, rL: null, rR: null };
    if (hasGorge) { s.gL = gorgeWall(-1, 30); s.gR = gorgeWall(1, 30); root.add(s.gL, s.gR); }
    if (hasRidge) { s.rL = ridgeDrop(-1, 24); s.rR = ridgeDrop(1, 24); root.add(s.rL, s.rR); }
    group.add(root);
    segs.push(s);
  }

  // ---- Scenery (upright, distance-anchored, hidden inside canyon zones) -----
  const scenery = [];
  const sceneN = level.canyons && level.canyons.length ? 26 : 38;
  for (let i = 0; i < sceneN; i++) {
    const isPine = rng() < 0.66;
    const obj = isPine ? makePine(rng, rand(rng, 0.9, 1.7)) : makeRock(rng, rand(rng, 0.8, 1.6));
    group.add(obj);
    scenery.push({ obj, d: rng() * (theme.fogFar + 20), side: rng() < 0.5 ? -1 : 1, off: rand(rng, 3, 40), span: theme.fogFar + 20 });
  }

  const _p = new THREE.Vector3();
  function update(travelled) {
    const startCell = Math.floor((travelled - 12) / SEG);
    for (let i = 0; i < COUNT; i++) {
      const s = segs[i];
      const d = (startCell + i) * SEG;
      path.toWorld(d, 0, 0, travelled, _p);
      s.root.position.copy(_p);
      s.root.rotation.y = -Math.atan2(path.dx(d), 1);
      s.root.rotation.x = Math.atan2(path.dy(d), 1);

      const cz = path.canyon(d);
      const t = cz ? cz.t : 0;
      const gorge = cz && cz.mode === 'gorge';
      const ridge = cz && cz.mode === 'ridge';
      // flanks
      const openOn = !(ridge && t > 0.55);
      s.openL.visible = s.openR.visible = openOn;
      s.bermL.visible = s.bermR.visible = t < 0.4;
      if (s.gL) {
        s.gL.visible = s.gR.visible = gorge && t > 0.02;
        if (gorge) { s.gL.scale.y = s.gR.scale.y = clamp(t, 0.02, 1); }
      }
      if (s.rL) {
        s.rL.visible = s.rR.visible = ridge && t > 0.02;
        if (ridge) { s.rL.scale.y = s.rR.scale.y = clamp(t, 0.02, 1); }
      }
    }
    // scenery
    for (const it of scenery) {
      let dd = it.d;
      // keep its course distance ahead of the player within a rolling window
      let ahead = dd - travelled;
      if (ahead < -10) { it.d += it.span; it.side = rng() < 0.5 ? -1 : 1; it.off = rand(rng, 3, 40); dd = it.d; ahead = dd - travelled; }
      path.toWorld(dd, it.side * (halfW + it.off), 0, travelled, _p);
      it.obj.position.copy(_p);
      it.obj.rotation.y = -Math.atan2(path.dx(dd), 1);
      const cz = path.canyon(dd);
      it.obj.visible = ahead > -8 && ahead < theme.fogFar + 14 && !(cz && cz.t > 0.3);
    }
  }

  return { group, update };
}
