// The winter environment: aurora sky, stars, moon, snowfall, mountains,
// snow ground + packed trail, and treadmill-scrolling pines / markers.
import * as THREE from 'three';
import { rand } from './util.js';
import { makePine, makeRock, makeFlag, makeCabin } from './props.js';

// Course->view mapping shared with the race: items ahead sit at -Z.
export const worldZ = (dist, travelled) => travelled - dist;

export function createWorld(rng, opts = {}) {
  const halfW = opts.trailHalfWidth ?? 9;
  const scroll = opts.scroll ?? true;
  const group = new THREE.Group();
  let time = 0;

  // ---- Sky dome (gradient) -------------------------------------------------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(420, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x07112b) },
        mid: { value: new THREE.Color(0x123a5e) },
        hor: { value: new THREE.Color(0x2f7e8c) },
      },
      vertexShader: `varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vp; uniform vec3 top, mid, hor;
        void main(){
          float h = normalize(vp).y;
          vec3 c = mix(hor, mid, smoothstep(0.0, 0.35, h));
          c = mix(c, top, smoothstep(0.3, 0.9, h));
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  );
  group.add(sky);

  // ---- Stars ---------------------------------------------------------------
  {
    const n = 600, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 400, u = rng(), v = rng();
      const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
      const y = Math.abs(r * Math.cos(ph));
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = y * 0.8 + 30;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe9ff, size: 1.4, sizeAttenuation: false })));
  }

  // ---- Moon ----------------------------------------------------------------
  {
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(14, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xeaf2ff })
    );
    moon.position.set(-120, 150, -320);
    group.add(moon);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0xbfd8ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.set(90, 90, 1);
    halo.position.copy(moon.position);
    group.add(halo);
  }

  // ---- Aurora --------------------------------------------------------------
  const auroraMats = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: {
        t: { value: 0 },
        c1: { value: new THREE.Color(i === 1 ? 0x6cf0a8 : 0x49e6b0) },
        c2: { value: new THREE.Color(i === 2 ? 0xa97bff : 0x3aa0ff) },
        seed: { value: i * 2.7 },
      },
      vertexShader: `varying vec2 vu; void main(){ vu = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vu; uniform float t, seed; uniform vec3 c1, c2;
        void main(){
          float x = vu.x;
          float wave = sin(x*9.0 + t*0.6 + seed) * 0.12 + sin(x*21.0 - t*0.3 + seed) * 0.05;
          float band = smoothstep(0.18, 0.0, abs(vu.y - 0.55 - wave));
          float curtain = 0.55 + 0.45*sin(x*40.0 + t + seed);
          float a = band * curtain * smoothstep(0.0, 0.25, vu.y) * smoothstep(1.0, 0.5, vu.y);
          vec3 c = mix(c1, c2, x + 0.2*sin(t*0.2));
          gl_FragColor = vec4(c, a*0.6);
        }`,
    });
    auroraMats.push(mat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(520, 150, 1, 1), mat);
    m.position.set(0, 120 + i * 16, -300 + i * 8);
    group.add(m);
  }

  // ---- Distant mountains ---------------------------------------------------
  {
    const mat = new THREE.MeshStandardMaterial({ color: 0x9fb0cc, roughness: 1, flatShading: true });
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x7286a8, roughness: 1, flatShading: true });
    for (let ring = 0; ring < 2; ring++) {
      const R = 250 - ring * 40, count = 26;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        if (Math.sin(a) > 0.3) continue; // only build toward the front/sides
        const hgt = rand(rng, 30, 70) - ring * 8;
        const peak = new THREE.Mesh(new THREE.ConeGeometry(rand(rng, 26, 46), hgt, 4), ring ? mat2 : mat);
        peak.position.set(Math.cos(a) * R, hgt / 2 - 6, Math.sin(a) * R);
        peak.rotation.y = rng() * Math.PI;
        group.add(peak);
      }
    }
  }

  // ---- Ground + trail ------------------------------------------------------
  {
    const g = new THREE.PlaneGeometry(700, 700, 48, 48);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const d = Math.hypot(x, z);
      if (d > halfW + 5) {
        const n = Math.sin(x * 0.05) * Math.cos(z * 0.045) + Math.sin(x * 0.13 + z * 0.07) * 0.5;
        pos.setY(i, n * 0.9 * Math.min(1, (d - halfW) / 30));
      }
    }
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xeaf0ff, roughness: 1 }));
    ground.receiveShadow = true;
    group.add(ground);

    // Packed-snow trail ribbon + berms
    const trail = new THREE.Mesh(
      new THREE.PlaneGeometry(halfW * 2 + 2, 520).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xd5deee, roughness: 0.95 })
    );
    trail.position.y = 0.02; trail.receiveShadow = true;
    group.add(trail);
    for (const s of [-1, 1]) {
      const berm = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 520),
        new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 1 })
      );
      berm.position.set(s * (halfW + 1), 0.18, 0); berm.receiveShadow = true;
      group.add(berm);
    }
  }

  // ---- Treadmill pools (pines, rocks, markers) -----------------------------
  // Every item carries a course position `dist`; the update() maps it to a Z
  // and, once it slips behind the camera, advances it by `span` to recycle.
  const WINDOW = 170;        // how far ahead things spawn
  const items = [];          // flat list of { obj, dist, span, x, randomize }
  function spawn(obj, dist, span, x) {
    group.add(obj);
    obj.position.x = x;
    items.push({ obj, dist, span, x });
  }
  if (scroll) {
    // Regularly-spaced edge flags on both sides (the main speed cue)
    const flagSpacing = 7, flagPairs = 16, flagSpan = flagSpacing * flagPairs;
    for (let i = 0; i < flagPairs; i++) {
      spawn(makeFlag(0xff7a3d), i * flagSpacing, flagSpan, -(halfW + 0.6));
      spawn(makeFlag(0xff7a3d), i * flagSpacing, flagSpan, halfW + 0.6);
    }
    // Pines on both flanks (randomize x/scale on recycle)
    for (let i = 0; i < 34; i++) {
      const it = makePine(rng, rand(rng, 0.85, 1.5));
      const side = rng() < 0.5 ? -1 : 1;
      spawn(it, rng() * WINDOW, WINDOW, side * (halfW + 3 + rng() * 42));
      items[items.length - 1].randomize = true;
    }
    // Scattered rocks / snow mounds on the open snow
    for (let i = 0; i < 16; i++) {
      const it = makeRock(rng, rand(rng, 0.7, 1.4));
      const side = rng() < 0.5 ? -1 : 1;
      spawn(it, rng() * WINDOW, WINDOW, side * (halfW + 2 + rng() * 45));
      items[items.length - 1].randomize = true;
    }
  }

  // ---- Snowfall ------------------------------------------------------------
  const SNOW = 1400;
  const snowPos = new Float32Array(SNOW * 3);
  const snowVel = new Float32Array(SNOW);
  for (let i = 0; i < SNOW; i++) {
    snowPos[i * 3] = rand(rng, -60, 60);
    snowPos[i * 3 + 1] = rand(rng, 0, 55);
    snowPos[i * 3 + 2] = rand(rng, -90, 30);
    snowVel[i] = rand(rng, 4, 11);
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.22, transparent: true, opacity: 0.9, depthWrite: false,
  }));
  snow.frustumCulled = false;
  group.add(snow);

  // ---- Update --------------------------------------------------------------
  function update(dt, travelled = 0, speed = 0, camPos = null) {
    time += dt;
    for (const m of auroraMats) m.uniforms.t.value = time;

    // snowfall (relative to camera so it always surrounds the player)
    const cx = camPos ? camPos.x : 0, cz = camPos ? camPos.z : 0;
    const a = snowGeo.attributes.position.array;
    for (let i = 0; i < SNOW; i++) {
      a[i * 3 + 1] -= snowVel[i] * dt;
      a[i * 3 + 2] += (speed * 0.45 + 2) * dt; // streak past the camera
      a[i * 3] += Math.sin(time + i) * 0.4 * dt;
      if (a[i * 3 + 1] < 0 || a[i * 3 + 2] > cz + 18) {
        a[i * 3] = cx + rand(rng, -55, 55);
        a[i * 3 + 1] = rand(rng, 35, 55);
        a[i * 3 + 2] = cz + rand(rng, -90, -10);
      }
    }
    snowGeo.attributes.position.needsUpdate = true;

    if (!scroll) return;
    // treadmill the prop items
    for (const it of items) {
      let zr = worldZ(it.dist, travelled);
      if (zr > 16) {
        it.dist += it.span;                 // recycle to the far end
        if (it.randomize) {
          const side = rng() < 0.5 ? -1 : 1;
          it.x = side * (halfW + 2 + rng() * 45);
          it.obj.position.x = it.x;
          it.obj.rotation.y = rng() * Math.PI;
        }
        zr = worldZ(it.dist, travelled);
      }
      it.obj.position.z = zr;
    }
  }

  return { group, update, makeCabin: () => makeCabin(rng) };
}
