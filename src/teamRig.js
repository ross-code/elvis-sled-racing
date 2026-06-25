// Assembles the full sled team: basket sled + musher + gangline + dogs in
// formation (lead dog out front). Forward is -Z. Origin sits at the sled.
import * as THREE from 'three';
import { createHusky } from './husky.js';

const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.8 });
const woodDark = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.85 });
const rope = new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.9 });
const metal = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.4, metalness: 0.6 });
const parka = new THREE.MeshStandardMaterial({ color: 0xc4502a, roughness: 0.85 });
const parkaFur = new THREE.MeshStandardMaterial({ color: 0xe8ddc8, roughness: 1 });
const skin = new THREE.MeshStandardMaterial({ color: 0xc98c63, roughness: 0.7 });
const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3f, roughness: 0.8 });
const crossMat = new THREE.MeshStandardMaterial({ color: 0xd23b3b, roughness: 0.5, emissive: 0x551111, emissiveIntensity: 0.3 });

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function buildSled() {
  const g = new THREE.Group();
  // Runners (skis) — span front (-z) to back (+z)
  g.add(box(0.12, 0.06, 2.0, woodDark, -0.34, 0.06, 0.2));
  g.add(box(0.12, 0.06, 2.0, woodDark, 0.34, 0.06, 0.2));
  // Upturned ski tips
  const tipL = box(0.12, 0.22, 0.3, woodDark, -0.34, 0.16, -0.85); tipL.rotation.x = 0.7;
  const tipR = box(0.12, 0.22, 0.3, woodDark, 0.34, 0.16, -0.85); tipR.rotation.x = 0.7;
  g.add(tipL, tipR);
  // Stanchions + basket bed
  for (const z of [-0.4, 0.2, 0.8]) {
    g.add(box(0.06, 0.34, 0.06, wood, -0.32, 0.27, z));
    g.add(box(0.06, 0.34, 0.06, wood, 0.32, 0.27, z));
  }
  g.add(box(0.74, 0.05, 1.5, wood, 0, 0.42, 0.2));   // bed
  g.add(box(0.78, 0.18, 0.06, wood, 0, 0.52, -0.55)); // front rail
  g.add(box(0.06, 0.2, 1.5, wood, -0.36, 0.55, 0.2)); // side rails
  g.add(box(0.06, 0.2, 1.5, wood, 0.36, 0.55, 0.2));

  // Driving bow (handlebar) at the back
  const bow = new THREE.Group();
  bow.add(box(0.06, 0.6, 0.06, wood, -0.34, 0.72, 1.0));
  bow.add(box(0.06, 0.6, 0.06, wood, 0.34, 0.72, 1.0));
  bow.add(box(0.78, 0.06, 0.06, wood, 0, 1.0, 1.0));
  g.add(bow);

  // Cargo: serum crate with a red cross
  const crate = box(0.5, 0.32, 0.5, crateMat, 0, 0.62, 0.2);
  g.add(crate);
  g.add(box(0.30, 0.07, 0.02, crossMat, 0, 0.66, -0.06));
  g.add(box(0.07, 0.20, 0.02, crossMat, 0, 0.66, -0.06));

  // Musher on the runners, gripping the bow
  const m = new THREE.Group();
  m.position.set(0, 0, 0.95);
  m.add(box(0.34, 0.5, 0.22, parka, 0, 0.78, 0));      // torso parka
  m.add(box(0.36, 0.12, 0.24, parkaFur, 0, 1.04, 0));  // hood fur ring
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), skin);
  headM.position.set(0, 1.16, 0.02); headM.castShadow = true; m.add(headM);
  m.add(box(0.14, 0.5, 0.14, parka, -0.22, 0.62, -0.18)); // arms reaching to bow
  m.add(box(0.14, 0.5, 0.14, parka, 0.22, 0.62, -0.18));
  m.add(box(0.16, 0.42, 0.16, woodDark, -0.14, 0.28, 0)); // legs
  m.add(box(0.16, 0.42, 0.16, woodDark, 0.14, 0.28, 0));
  g.add(m);

  return g;
}

// Lay out dog slots: lead out front, then rows of two behind it.
function layout(n) {
  const slots = [{ x: 0, z: 0, lead: true }]; // lead placeholder, z set below
  const rest = n - 1;
  const rows = Math.ceil(rest / 2);
  const dz = 1.35;
  const leadZ = -(rows + 1) * dz - 0.4;
  slots[0].z = leadZ;
  let placed = 0;
  for (let r = 1; r <= rows; r++) {
    const z = leadZ + r * dz;
    const remaining = rest - placed;
    if (remaining >= 2) {
      slots.push({ x: -0.62, z }, { x: 0.62, z });
      placed += 2;
    } else if (remaining === 1) {
      slots.push({ x: 0, z });
      placed += 1;
    }
  }
  return slots;
}

export function createTeamRig(team) {
  const root = new THREE.Group();
  const sled = buildSled();
  root.add(sled);

  const n = team.length;
  const slots = layout(n);
  const dogs = [];

  for (let i = 0; i < n; i++) {
    const member = team[i];
    const slot = slots[i] || slots[slots.length - 1];
    const h = createHusky({
      coat: member.coat,
      eye: member.eye,
      wooly: !!member.wooly,
      scale: member.isLead ? 0.92 : 0.86,
    });
    h.group.position.set(slot.x, 0, slot.z);
    root.add(h.group);
    dogs.push({ h, slot, phase: i * 1.7 });

    // Tug line from this dog back toward the gangline / sled
    const len = Math.abs(slot.z) - 0.4;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, len, 6), rope);
    line.rotation.x = Math.PI / 2;
    line.position.set(slot.x * 0.4, 0.34, slot.z + len / 2 + 0.2);
    root.add(line);
  }

  // Central gangline from sled nose to the lead dog
  const leadZ = slots[0].z;
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, Math.abs(leadZ) + 0.6, 6), rope);
  gl.rotation.x = Math.PI / 2;
  gl.position.set(0, 0.32, (leadZ - 0.6) / 2);
  root.add(gl);

  function update(t, speed, steer) {
    for (const d of dogs) d.h.update(t + d.phase, speed);
    // Bank the whole rig into turns; sled sways slightly.
    root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, -steer * 0.1, 0.1);
    sled.rotation.y = THREE.MathUtils.lerp(sled.rotation.y, steer * 0.06, 0.1);
  }

  return { group: root, update, dogs };
}
