// Atmosphere layer: themed sky, aurora, sun/moon, stars, distant mountains and
// snowfall. Terrain (trail/canyons) is handled by track.js; the showcase can opt
// into a simple ground plane via opts.ground.
import * as THREE from 'three';
import { rand } from './util.js';

const DEFAULT = {
  skyTop: 0x07112b, skyMid: 0x123a5e, skyHor: 0x2f7e8c, fogFar: 178,
  aurora: true, moon: true, sun: null, stars: 600, snow: 1,
  ground: 0xeaf0ff, rock: 0x9fb0cc, rockSnow: 0xf3f6ff,
};

export function createWorld(rng, opts = {}) {
  const theme = Object.assign({}, DEFAULT, opts.theme || {});
  const group = new THREE.Group();
  let time = 0;

  // ---- Sky dome ------------------------------------------------------------
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(440, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(theme.skyTop) },
        mid: { value: new THREE.Color(theme.skyMid) },
        hor: { value: new THREE.Color(theme.skyHor) },
      },
      vertexShader: `varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vp; uniform vec3 top, mid, hor;
        void main(){
          float h = normalize(vp).y;
          vec3 c = mix(hor, mid, smoothstep(0.0, 0.34, h));
          c = mix(c, top, smoothstep(0.3, 0.92, h));
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  ));

  // ---- Stars ---------------------------------------------------------------
  if (theme.stars > 0) {
    const n = theme.stars, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 420, u = rng(), v = rng();
      const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.82 + 28;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xdfe9ff, size: 1.4, sizeAttenuation: false })));
  }

  // ---- Moon / Sun ----------------------------------------------------------
  if (theme.moon) {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 24), new THREE.MeshBasicMaterial({ color: 0xeaf2ff }));
    moon.position.set(-120, 150, -320); group.add(moon);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(90, 90, 1); halo.position.copy(moon.position); group.add(halo);
  }
  if (theme.sun) {
    const [sx, sy, sz] = theme.sun.pos.map((v) => v * 6);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(20, 28, 28), new THREE.MeshBasicMaterial({ color: theme.sun.color }));
    sun.position.set(sx, sy * 2 + 60, sz - 120); group.add(sun);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color: theme.sun.color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(180, 180, 1); halo.position.copy(sun.position); group.add(halo);
  }

  // ---- Aurora --------------------------------------------------------------
  const auroraMats = [];
  if (theme.aurora) {
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
      m.position.set(0, 120 + i * 16, -300 + i * 8); group.add(m);
    }
  }

  // ---- Distant mountains ---------------------------------------------------
  {
    const mat = new THREE.MeshStandardMaterial({ color: theme.rock || 0x9fb0cc, roughness: 1, flatShading: true });
    const mat2 = new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.rock || 0x7286a8).multiplyScalar(0.8), roughness: 1, flatShading: true });
    for (let ring = 0; ring < 2; ring++) {
      const R = 250 - ring * 40, count = 26;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        if (Math.sin(a) > 0.32) continue;
        const hgt = rand(rng, 32, 78) - ring * 8;
        const peak = new THREE.Mesh(new THREE.ConeGeometry(rand(rng, 26, 48), hgt, 4), ring ? mat2 : mat);
        peak.position.set(Math.cos(a) * R, hgt / 2 - 6, Math.sin(a) * R);
        peak.rotation.y = rng() * Math.PI;
        // snow cap
        const cap = new THREE.Mesh(new THREE.ConeGeometry(rand(rng, 12, 20), hgt * 0.32, 4), new THREE.MeshStandardMaterial({ color: theme.rockSnow || 0xf3f6ff, roughness: 1, flatShading: true }));
        cap.position.set(peak.position.x, peak.position.y + hgt * 0.34, peak.position.z); cap.rotation.y = peak.rotation.y;
        group.add(peak, cap);
      }
    }
  }

  // ---- Optional simple ground (showcase only) ------------------------------
  if (opts.ground) {
    const g = new THREE.PlaneGeometry(600, 600, 32, 32).rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: theme.ground, roughness: 1 }));
    ground.receiveShadow = true; group.add(ground);
  }

  // ---- Snowfall ------------------------------------------------------------
  const SNOW = Math.min(3400, Math.round(1300 * (theme.snow || 1)));
  const snowPos = new Float32Array(SNOW * 3);
  const snowVel = new Float32Array(SNOW);
  for (let i = 0; i < SNOW; i++) {
    snowPos[i * 3] = rand(rng, -60, 60);
    snowPos[i * 3 + 1] = rand(rng, 0, 55);
    snowPos[i * 3 + 2] = rand(rng, -90, 30);
    snowVel[i] = rand(rng, 4, 11) * (0.7 + (theme.snow || 1) * 0.3);
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22 + (theme.snow > 1.5 ? 0.08 : 0), transparent: true, opacity: 0.9, depthWrite: false }));
  snow.frustumCulled = false; group.add(snow);

  function update(dt, travelled = 0, speed = 0, camPos = null) {
    time += dt;
    for (const m of auroraMats) m.uniforms.t.value = time;
    const cx = camPos ? camPos.x : 0, cz = camPos ? camPos.z : 0;
    const a = snowGeo.attributes.position.array;
    const wind = theme.snow > 1.5 ? 4 : 0.4;
    for (let i = 0; i < SNOW; i++) {
      a[i * 3 + 1] -= snowVel[i] * dt;
      a[i * 3 + 2] += (speed * 0.45 + 2) * dt;
      a[i * 3] += Math.sin(time + i) * wind * dt;
      if (a[i * 3 + 1] < 0 || a[i * 3 + 2] > cz + 18) {
        a[i * 3] = cx + rand(rng, -55, 55);
        a[i * 3 + 1] = rand(rng, 35, 55);
        a[i * 3 + 2] = cz + rand(rng, -90, -10);
      }
    }
    snowGeo.attributes.position.needsUpdate = true;
  }

  return { group, update };
}
