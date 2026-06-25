// Low-poly winter props shared by the world backdrop and the race hazards.
import * as THREE from 'three';
import { rand } from './util.js';

const snow = new THREE.MeshStandardMaterial({ color: 0xf3f6ff, roughness: 1 });
const pineMat = new THREE.MeshStandardMaterial({ color: 0x2f5d44, roughness: 0.9 });
const pineMat2 = new THREE.MeshStandardMaterial({ color: 0x27513b, roughness: 0.9 });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3d24, roughness: 0.9 });
const logMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2c, roughness: 0.85 });
const logEnd = new THREE.MeshStandardMaterial({ color: 0x8a6038, roughness: 0.8 });
const rockMat = new THREE.MeshStandardMaterial({ color: 0x747a82, roughness: 0.95 });
const mooseMat = new THREE.MeshStandardMaterial({ color: 0x4a3526, roughness: 0.9 });
const antlerMat = new THREE.MeshStandardMaterial({ color: 0xb6a487, roughness: 0.8 });
const wolfMat = new THREE.MeshStandardMaterial({ color: 0x6f757e, roughness: 0.95 });
const wolfDark = new THREE.MeshStandardMaterial({ color: 0x4c5158, roughness: 0.95 });
const cabinMat = new THREE.MeshStandardMaterial({ color: 0x5a3c25, roughness: 0.9 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0xeaf0ff, roughness: 1 });
const warmWin = new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffb347, emissiveIntensity: 0.8 });

function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  return m;
}

export function makePine(rng, scale = 1) {
  const g = new THREE.Group();
  const h = rand(rng, 2.2, 3.6) * scale;
  g.add(mesh(new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, h * 0.4, 6), trunkMat, 0, h * 0.2, 0));
  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const r = (0.95 - t * 0.5) * scale;
    const ch = h * 0.42;
    const y = h * 0.42 + i * ch * 0.55;
    g.add(mesh(new THREE.ConeGeometry(r, ch, 7), i % 2 ? pineMat2 : pineMat, 0, y, 0));
    // snow cap
    const cap = mesh(new THREE.ConeGeometry(r * 0.96, ch * 0.45, 7), snow, 0, y + ch * 0.22, 0);
    cap.castShadow = false;
    g.add(cap);
  }
  g.rotation.y = rng() * Math.PI;
  return g;
}

export function makeRock(rng, scale = 1) {
  const g = new THREE.Group();
  const s = rand(rng, 0.6, 1.1) * scale;
  const r = mesh(new THREE.DodecahedronGeometry(s, 0), rockMat, 0, s * 0.5, 0);
  r.rotation.set(rng(), rng(), rng());
  g.add(r);
  const cap = mesh(new THREE.SphereGeometry(s * 0.92, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), snow, 0, s * 0.6, 0);
  cap.castShadow = false;
  g.add(cap);
  return g;
}

// Fallen tree across the trail — the classic dodge hazard.
export function makeLog(rng) {
  const g = new THREE.Group();
  const len = rand(rng, 3.4, 5.2);
  const r = rand(rng, 0.34, 0.46);
  const trunk = mesh(new THREE.CylinderGeometry(r, r * 0.92, len, 12), logMat, 0, r, 0);
  trunk.rotation.z = Math.PI / 2;
  g.add(trunk);
  g.add(mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.06, 12), logEnd, len / 2, r, 0).rotateZ(Math.PI / 2));
  g.add(mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.06, 12), logEnd, -len / 2, r, 0).rotateZ(Math.PI / 2));
  // snow line on top
  const snowTop = mesh(new THREE.BoxGeometry(len, 0.12, r * 1.3, 1), snow, 0, r * 1.55, 0, false);
  g.add(snowTop);
  // a couple of broken branch stubs
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), logMat, len * 0.2, r + 0.3, 0.1));
  g.userData.halfWidth = len / 2;
  return g;
}

export function makeMoose(rng) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.9, 1.0, 2.0), mooseMat, 0, 1.7, 0));      // body
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mooseMat, 0, 2.0, -1.1));   // shoulders hump
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.55, 0.9), mooseMat, 0, 2.3, -1.35)); // neck/head
  g.add(mesh(new THREE.BoxGeometry(0.34, 0.4, 0.6), mooseMat, 0, 2.2, -1.85)); // snout
  for (const [x, z] of [[-0.32, -0.8], [0.32, -0.8], [-0.32, 0.8], [0.32, 0.8]])
    g.add(mesh(new THREE.BoxGeometry(0.2, 1.7, 0.2), mooseMat, x, 0.85, z));   // legs
  // antlers (flat palms)
  for (const s of [-1, 1]) {
    const a = mesh(new THREE.BoxGeometry(0.5, 0.08, 0.6), antlerMat, s * 0.42, 2.65, -1.4);
    a.rotation.z = s * 0.3; g.add(a);
  }
  g.userData.halfWidth = 1.0;
  return g;
}

export function makeWolf(rng) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.42, 1.1), wolfMat, 0, 0.62, 0));    // body
  g.add(mesh(new THREE.SphereGeometry(0.24, 12, 12), wolfMat, 0, 0.74, -0.62)); // head
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.14, 0.26), wolfDark, 0, 0.68, -0.82)); // snout
  for (const [x, z] of [[-0.14, -0.35], [0.14, -0.35], [-0.14, 0.38], [0.14, 0.38]])
    g.add(mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), wolfDark, x, 0.3, z));
  for (const s of [-1, 1]) g.add(mesh(new THREE.ConeGeometry(0.09, 0.18, 5), wolfDark, s * 0.12, 0.95, -0.6));
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.5, 6), wolfMat, 0, 0.6, 0.6).rotateX(0.7));
  g.userData.halfWidth = 0.5;
  return g;
}

// Trail marker stake with a colored flag.
export function makeFlag(color = 0xff7a3d) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), trunkMat, 0, 0.8, 0));
  const flag = mesh(new THREE.PlaneGeometry(0.5, 0.34),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide }), 0.27, 1.35, 0, false);
  g.add(flag);
  return g;
}

export function makeCabin(rng) {
  const g = new THREE.Group();
  const w = rand(rng, 1.6, 2.4), h = rand(rng, 1.3, 1.8), d = rand(rng, 1.6, 2.2);
  g.add(mesh(new THREE.BoxGeometry(w, h, d), cabinMat, 0, h / 2, 0));
  const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.8, h * 0.7, 4), roofMat, 0, h + h * 0.32, 0);
  roof.rotation.y = Math.PI / 4; g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(0.4, 0.5, 0.05), warmWin, w * 0.22, h * 0.5, d / 2 + 0.02));
  return g;
}
