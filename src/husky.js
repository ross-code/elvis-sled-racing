// Procedural, stylized-but-recognizable Siberian husky.
// Faces -Z (forward). Returns { group, update(t, gaitSpeed) }.
import * as THREE from 'three';

const furMat = (c, rough = 0.95) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 });

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
function sphere(r, mat, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// A soft fluff tuft (low-poly cone cluster) for the wooly look.
function tuft(r, mat, x, y, z) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r * (0.7 + i * 0.12), r * 1.6, 6), mat);
    c.rotation.set(Math.PI * 0.5, 0, i * 1.3);
    c.position.set((i - 1) * r * 0.4, 0, 0);
    c.castShadow = true;
    g.add(c);
  }
  g.position.set(x, y, z);
  return g;
}

export function createHusky(spec) {
  const coat = spec.coat;
  const scale = spec.scale ?? 1;
  const wooly = !!spec.wooly;

  const matMain = furMat(coat.main);
  const matUnder = furMat(coat.under);
  const matMask = furMat(coat.mask);
  const matEarTip = furMat(coat.earTip);
  const matNose = new THREE.MeshStandardMaterial({ color: 0x241f1d, roughness: 0.5 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.6 }); // eye-liner / mouth
  const eyeColor = spec.eye?.color ?? 0x6fb7e8;
  const eyeColor2 = spec.eye?.color2 ?? eyeColor;
  const matEye = (c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.15, emissive: c, emissiveIntensity: 0.25 });
  const matGlint = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.4 });

  const root = new THREE.Group();
  const body = new THREE.Group(); // bobs while running
  root.add(body);

  // --- Torso: chest (taller, front) + hindquarters, white underside ---------
  body.add(box(0.46, 0.42, 0.5, matMain, 0, 0.58, -0.18)); // chest/shoulders
  body.add(box(0.42, 0.38, 0.5, matMain, 0, 0.55, 0.28));  // hindquarters
  body.add(box(0.40, 0.20, 0.95, matUnder, 0, 0.42, 0.05)); // belly underside

  // Fluffy neck ruff
  const ruff = wooly ? 0.30 : 0.26;
  body.add(sphere(ruff, matMain, 0, 0.66, -0.42, 12));
  if (wooly) {
    body.add(tuft(0.13, matMain, 0.22, 0.6, -0.36));
    body.add(tuft(0.13, matMain, -0.22, 0.6, -0.36));
    body.add(tuft(0.12, matUnder, 0, 0.45, -0.5)); // chest floof
  }

  // --- Head -----------------------------------------------------------------
  const head = new THREE.Group();
  head.position.set(0, 0.82, -0.52);
  body.add(head);

  head.add(sphere(0.27, matMain, 0, 0, 0, 18)); // skull
  // face mask (top of head / between ears)
  head.add(box(0.34, 0.12, 0.22, matMask, 0, 0.14, 0.02));
  // white blaze down the face
  head.add(box(0.10, 0.30, 0.16, matUnder, 0, -0.02, -0.18));

  // Muzzle
  const muzzle = box(0.20, 0.17, 0.30, matUnder, 0, -0.07, -0.26);
  head.add(muzzle);
  // Nose (dark, slightly pink-speckled underside via small accent)
  head.add(sphere(0.066, matNose, 0, -0.05, -0.42, 12));
  head.add(box(0.10, 0.03, 0.04, matDark, 0, -0.12, -0.36)); // mouth line

  // Ears — erect triangular cones, white with warm tips, dark rim
  function ear(side) {
    const g = new THREE.Group();
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 5), matMain);
    e.castShadow = true;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 5), matEarTip);
    inner.position.z = -0.03;
    inner.position.y = -0.01;
    g.add(e, inner);
    g.position.set(0.14 * side, 0.26, 0.04);
    g.rotation.set(-0.12, 0, -0.22 * side);
    return g;
  }
  const earL = ear(-1), earR = ear(1);
  head.add(earL, earR);

  // Eyes — dark almond "eye-liner" rim, colored iris, pupil, glint
  function eye(side, color) {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), matDark);
    rim.scale.set(1, 0.7, 0.5);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), matEye(color));
    iris.position.z = -0.03;
    const pupil = sphere(0.024, matDark, 0, 0, -0.06, 8);
    const glint = sphere(0.012, matGlint, 0.02, 0.02, -0.07, 6);
    g.add(rim, iris, pupil, glint);
    g.position.set(0.13 * side, 0.04, -0.18);
    g.rotation.y = 0.25 * side;
    return g;
  }
  head.add(eye(-1, eyeColor), eye(1, eyeColor2));

  // --- Tail — curled fluffy plume ------------------------------------------
  const tail = new THREE.Group();
  tail.position.set(0, 0.62, 0.5);
  body.add(tail);
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.14, 0.16),
      new THREE.Vector3(0, 0.30, 0.12),
      new THREE.Vector3(0, 0.36, -0.04),
      new THREE.Vector3(0, 0.30, -0.16),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, wooly ? 0.13 : 0.1, 8), matMain);
    tube.castShadow = true;
    tail.add(tube);
    tail.add(sphere(wooly ? 0.13 : 0.1, matUnder, 0, 0.3, -0.16, 10)); // white tip
  }

  // --- Legs — 4 pivots that swing fore/aft ---------------------------------
  function leg(x, z, front) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.5, z);
    const upper = box(0.13, 0.3, 0.15, matMain, 0, -0.15, 0);
    const lower = box(0.11, 0.26, 0.12, matUnder, 0, -0.4, 0.01);
    const paw = box(0.13, 0.08, 0.17, matUnder, 0, -0.55, -0.02);
    pivot.add(upper, lower, paw);
    pivot.userData.front = front;
    return pivot;
  }
  const legs = [
    leg(-0.17, -0.28, true),
    leg(0.17, -0.28, true),
    leg(-0.17, 0.30, false),
    leg(0.17, 0.30, false),
  ];
  legs.forEach((l) => body.add(l));

  root.scale.setScalar(scale);

  // --- Animation ------------------------------------------------------------
  function update(t, gaitSpeed = 1) {
    const cadence = 9;
    const ph = t * cadence * (0.5 + gaitSpeed * 0.9);
    const amp = 0.5 + gaitSpeed * 0.55;
    for (const l of legs) {
      const off = l.userData.front ? 0 : Math.PI; // bound gait
      l.rotation.x = Math.sin(ph + off) * amp;
    }
    body.position.y = Math.abs(Math.sin(ph)) * 0.05 * (0.5 + gaitSpeed);
    body.rotation.x = Math.sin(ph * 2) * 0.015 * gaitSpeed;
    tail.rotation.z = Math.sin(t * 6) * 0.25;
    tail.rotation.x = -0.1 + Math.sin(t * 3) * 0.08;
    head.rotation.x = Math.sin(ph) * 0.03 * gaitSpeed;
    earL.rotation.x = Math.sin(t * 7 + 1) * 0.06;
    earR.rotation.x = Math.sin(t * 7) * 0.06;
  }

  return { group: root, update };
}
