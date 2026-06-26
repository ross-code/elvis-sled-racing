// Procedural, detailed-but-stylized Siberian husky, matched to Elvis.
// Faces -Z (forward). Returns { group, update(t, gaitSpeed) }.
// spec: { coat:{main,under,mask,earTip}, eye:{color,color2?}, wooly, scale,
//         snowNose, lod:'high'|'low' }
import * as THREE from 'three';

const furMat = (c, rough = 0.95, flat = false) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, flatShading: flat });

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; return m;
}
function sphere(r, mat, x = 0, y = 0, z = 0, seg = 14) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; return m;
}
// Faceted "fur clump" — flat-shaded icosahedron reads as wooly fluff.
function clump(r, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat);
  m.position.set(x, y, z); m.castShadow = true;
  m.rotation.set(x * 7, y * 5, z * 3);
  return m;
}
function tuft(r, mat, x, y, z, spread = 3) {
  const g = new THREE.Group();
  for (let i = 0; i < spread; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r * (0.65 + i * 0.12), r * 1.7, 6), mat);
    c.rotation.set(Math.PI * 0.5, 0, i * 1.3);
    c.position.set((i - 1) * r * 0.42, 0, 0);
    c.castShadow = true; g.add(c);
  }
  g.position.set(x, y, z); return g;
}

export function createHusky(spec) {
  const coat = spec.coat;
  const scale = spec.scale ?? 1;
  const wooly = !!spec.wooly;
  const hi = (spec.lod ?? 'high') === 'high';

  const matMain = furMat(coat.main);
  const matMainFlat = furMat(coat.main, 0.95, true);
  const matUnder = furMat(coat.under);
  const matUnderFlat = furMat(coat.under, 0.95, true);
  const matMask = furMat(coat.mask);
  const matEarTip = furMat(coat.earTip);
  const matNose = new THREE.MeshStandardMaterial({ color: 0x241f1d, roughness: 0.45 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x141011, roughness: 0.6 });
  const matPink = new THREE.MeshStandardMaterial({ color: 0xe79aa0, roughness: 0.6 });
  const eyeColor = spec.eye?.color ?? 0x6fb7e8;
  const eyeColor2 = spec.eye?.color2 ?? eyeColor;
  const matEye = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.12, emissive: c, emissiveIntensity: 0.3 });
  const matGlint = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, emissive: 0xffffff, emissiveIntensity: 0.5 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // --- Torso: dark "saddle" over the back, white underside/chest -----------
  body.add(box(0.46, 0.42, 0.5, matMain, 0, 0.58, -0.18));  // chest/shoulders
  body.add(box(0.42, 0.38, 0.5, matMain, 0, 0.55, 0.28));   // hindquarters
  body.add(box(0.4, 0.2, 0.95, matUnder, 0, 0.42, 0.05));   // belly underside
  body.add(box(0.43, 0.12, 0.92, matMask, 0, 0.74, 0.04));  // back saddle (pattern)
  body.add(sphere(0.2, matUnder, 0, 0.46, -0.42, 12));      // white chest blaze

  // Fluffy neck ruff — clumps of fur
  const ruffN = wooly ? 7 : 5;
  for (let i = 0; i < ruffN; i++) {
    const a = (i / ruffN) * Math.PI * 2;
    body.add(clump(wooly ? 0.17 : 0.14, matMainFlat,
      Math.cos(a) * 0.26, 0.62 + Math.sin(a) * 0.16, -0.4 + Math.cos(a * 2) * 0.04));
  }
  if (wooly) {
    body.add(tuft(0.12, matUnderFlat, 0, 0.42, -0.5));      // chest floof
    body.add(clump(0.16, matMainFlat, 0.2, 0.66, 0.42));    // haunch floof
    body.add(clump(0.16, matMainFlat, -0.2, 0.66, 0.42));
  }

  // --- Head ----------------------------------------------------------------
  const head = new THREE.Group();
  head.position.set(0, 0.82, -0.52);
  head.rotation.x = 0.06;
  body.add(head);

  head.add(sphere(0.27, matMain, 0, 0, 0, 20));             // skull
  head.add(box(0.34, 0.14, 0.24, matMask, 0, 0.12, 0.02));  // forehead mask
  head.add(box(0.1, 0.34, 0.15, matUnder, 0, -0.02, -0.17)); // white blaze

  // Muzzle — tapered
  head.add(box(0.19, 0.16, 0.26, matUnder, 0, -0.08, -0.3));
  head.add(box(0.13, 0.12, 0.14, matUnder, 0, -0.1, -0.45)); // narrower front
  head.add(box(0.12, 0.06, 0.34, matMask, 0, 0.0, -0.32));   // nose bridge
  // Nose + nostrils + optional snow-nose speckle
  head.add(sphere(0.066, matNose, 0, -0.06, -0.52, 14));
  head.add(sphere(0.013, matDark, -0.025, -0.07, -0.57, 8));
  head.add(sphere(0.013, matDark, 0.025, -0.07, -0.57, 8));
  if (spec.snowNose) {
    head.add(sphere(0.018, matPink, 0.03, -0.04, -0.51, 8));
    head.add(sphere(0.013, matPink, -0.02, -0.085, -0.52, 8));
  }
  // Mouth + chin + tongue
  head.add(box(0.12, 0.025, 0.05, matDark, 0, -0.17, -0.42));
  head.add(box(0.04, 0.05, 0.06, matDark, -0.06, -0.16, -0.36));
  head.add(box(0.04, 0.05, 0.06, matDark, 0.06, -0.16, -0.36));
  const tongue = box(0.07, 0.025, 0.13, matPink, 0, -0.2, -0.4);
  head.add(tongue);

  // Cheek + brow fluff
  head.add(tuft(0.09, matMainFlat, 0.2, -0.04, -0.12, hi ? 3 : 2));
  head.add(tuft(0.09, matMainFlat, -0.2, -0.04, -0.12, hi ? 3 : 2));
  if (hi) {
    head.add(sphere(0.03, matEarTip, 0.1, 0.1, -0.2, 8));  // tan eyebrow dots
    head.add(sphere(0.03, matEarTip, -0.1, 0.1, -0.2, 8));
  }

  // Ears — outer + inner + dark rim
  function ear(side) {
    const g = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), matMain);
    outer.castShadow = true;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 6), matEarTip);
    inner.position.set(0, -0.01, -0.035);
    const pink = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.13, 6), matPink);
    pink.position.set(0, -0.02, -0.05);
    const rim = new THREE.Mesh(new THREE.ConeGeometry(0.125, 0.06, 6), matDark);
    rim.position.set(0, 0.12, 0);
    g.add(outer, inner, pink, rim);
    g.add(tuft(0.05, matMainFlat, 0, -0.12, 0.02, 2));     // fluffy base
    g.position.set(0.14 * side, 0.26, 0.04);
    g.rotation.set(-0.12, 0, -0.2 * side);
    return g;
  }
  const earL = ear(-1), earR = ear(1);
  head.add(earL, earR);

  // Eyes — almond rim, iris, pupil, glints, lid, eye-liner streak
  function eye(side, color) {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.SphereGeometry(0.066, 14, 14), matDark);
    rim.scale.set(1, 0.6, 0.42);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), matEye(color));
    iris.position.z = -0.03;
    const pupil = sphere(0.02, matDark, 0, 0, -0.062, 10);
    const glint1 = sphere(0.012, matGlint, 0.02, 0.02, -0.072, 6);
    const glint2 = sphere(0.006, matGlint, -0.016, -0.018, -0.072, 6);
    const lid = box(0.13, 0.022, 0.05, matDark, 0, 0.05, -0.03); // upper lid
    lid.rotation.z = -0.1 * side;
    const liner = box(0.11, 0.016, 0.03, matDark, 0.065 * side, -0.005, -0.02); // eyeliner streak
    liner.rotation.z = 0.26 * side;
    g.add(rim, iris, pupil, glint1, glint2, lid, liner);
    g.position.set(0.125 * side, 0.0, -0.2);
    g.rotation.y = 0.28 * side;
    return g;
  }
  const eyeL = eye(-1, eyeColor), eyeR = eye(1, eyeColor2);
  head.add(eyeL, eyeR);

  // Whiskers (high LOD only)
  if (hi) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0015, 0.16, 4), matDark);
        w.position.set(0.07 * side, -0.07 - i * 0.02, -0.46);
        w.rotation.set(Math.PI / 2 - 0.2, 0, (0.5 + i * 0.18) * side);
        head.add(w);
      }
    }
  }

  // --- Tail — fuller curled plume ------------------------------------------
  const tail = new THREE.Group();
  tail.position.set(0, 0.62, 0.5);
  body.add(tail);
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.16, 0.18),
      new THREE.Vector3(0, 0.34, 0.13), new THREE.Vector3(0, 0.4, -0.05),
      new THREE.Vector3(0, 0.32, -0.18),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, wooly ? 0.14 : 0.11, 8), matMain);
    tube.castShadow = true;
    tail.add(tube);
    // plume fluff along the curl
    for (let i = 0; i <= 4; i++) {
      const p = curve.getPoint(i / 4);
      tail.add(clump(wooly ? 0.12 : 0.1, matMainFlat, p.x, p.y, p.z));
    }
    tail.add(sphere(wooly ? 0.12 : 0.1, matUnder, 0, 0.32, -0.18, 10)); // white tip
  }

  // --- Legs — pivots with white socks + toes -------------------------------
  function leg(x, z, front) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.5, z);
    pivot.add(box(0.13, 0.3, 0.15, matMain, 0, -0.15, 0));     // upper (colored)
    pivot.add(box(0.11, 0.26, 0.12, matUnder, 0, -0.4, 0.01)); // lower "sock"
    const paw = box(0.13, 0.08, 0.18, matUnder, 0, -0.55, -0.02);
    pivot.add(paw);
    if (hi) for (let i = 0; i < 3; i++) // toe lines
      pivot.add(box(0.012, 0.06, 0.1, matDark, -0.04 + i * 0.04, -0.55, -0.08));
    pivot.userData.front = front;
    return pivot;
  }
  const legs = [leg(-0.17, -0.28, true), leg(0.17, -0.28, true), leg(-0.17, 0.3, false), leg(0.17, 0.3, false)];
  legs.forEach((l) => body.add(l));

  root.scale.setScalar(scale);

  // --- Animation -----------------------------------------------------------
  function update(t, gaitSpeed = 1) {
    const cadence = 9;
    const ph = t * cadence * (0.5 + gaitSpeed * 0.9);
    const amp = 0.5 + gaitSpeed * 0.55;
    for (const l of legs) {
      const off = l.userData.front ? 0 : Math.PI;
      l.rotation.x = Math.sin(ph + off) * amp;
    }
    body.position.y = Math.abs(Math.sin(ph)) * 0.05 * (0.5 + gaitSpeed);
    body.rotation.x = Math.sin(ph * 2) * 0.015 * gaitSpeed;
    tail.rotation.z = Math.sin(t * 6) * 0.25;
    tail.rotation.x = -0.1 + Math.sin(t * 3) * 0.08;
    head.rotation.x = 0.06 + Math.sin(ph) * 0.03 * gaitSpeed;
    earL.rotation.x = Math.sin(t * 7 + 1) * 0.06;
    earR.rotation.x = Math.sin(t * 7) * 0.06;
    // lolling tongue when running / panting
    const lol = Math.min(1, gaitSpeed * 1.3 + 0.15);
    tongue.scale.z = 1 + lol * 1.6;
    tongue.position.z = -0.4 - lol * 0.07;
    tongue.position.y = -0.2 - lol * 0.03 + Math.sin(t * 9) * 0.01;
    // periodic blink
    const bp = (t * 0.45) % 1;
    const blink = bp < 0.05 ? 1 - Math.abs(bp - 0.025) / 0.025 : 0;
    const s = 1 - 0.85 * blink;
    eyeL.scale.y = s; eyeR.scale.y = s;
  }

  return { group: root, update };
}
