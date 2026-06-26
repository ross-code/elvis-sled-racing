// The course path: maps a course distance `d` to a curving, climbing centerline.
// Gameplay stays in trail-relative "lane" coordinates; this module is the visual
// transform that bends the world, raises canyon walls, and banks the camera.
import * as THREE from 'three';
import { makeRng, smoothstep, clamp } from './util.js';

export function createTrailPath(level) {
  const c = level.curve || {};
  const bendAmp = c.bendAmp ?? 0, bendFreq = c.bendFreq ?? 0.006;
  const elevAmp = c.elevAmp ?? 0, elevFreq = c.elevFreq ?? 0.004;
  const climb = c.climb ?? 0, rampStart = c.rampStart ?? 300;
  const L = level.length;
  const rng = makeRng((level.seed || 1) + 991);
  const p1 = rng() * 6.283, p2 = rng() * 6.283, p3 = rng() * 6.283;

  // Lateral centerline offset (metres). Calm at the very start, then snakes.
  function x(d) {
    const ramp = smoothstep(0, rampStart, d) * (1 - smoothstep(L - 90, L, d));
    return ramp * bendAmp * (Math.sin(d * bendFreq + p1) + 0.42 * Math.sin(d * bendFreq * 2.37 + p2));
  }
  // Elevation (metres).
  function y(d) {
    const ramp = smoothstep(0, rampStart * 0.6, d);
    return ramp * (elevAmp * Math.sin(d * elevFreq + p3) + climb * (d / L));
  }
  const E = 0.5;
  const dx = (d) => (x(d + E) - x(d - E)) / (2 * E); // lateral slope (≈ tan of yaw)
  const dy = (d) => (y(d + E) - y(d - E)) / (2 * E); // grade (≈ tan of pitch)

  // Canyon zones: returns { mode, t, wall } where t ramps 0→1→0 across the zone.
  function canyon(d) {
    let best = null;
    for (const z of level.canyons || []) {
      if (d <= z.start - 36 || d >= z.end + 36) continue;
      const t = Math.min(smoothstep(z.start - 30, z.start + 34, d), 1 - smoothstep(z.end - 34, z.end + 30, d));
      if (t > 0.001 && (!best || t > best.t)) best = { mode: z.mode || 'gorge', t, wall: z.wall || 28 };
    }
    return best;
  }

  // World position of a point at course distance `d`, lane offset (perp), height,
  // rendered relative to the player's current `travelled` (player sits near origin).
  // Outrun-style: the centerline shifts laterally/vertically with the bend & grade,
  // and lane is added along world-X (an excellent approximation at these headings).
  const _v = new THREE.Vector3();
  function toWorld(d, lane, hy, travelled, out = _v) {
    return out.set(
      x(d) - x(travelled) + lane,
      y(d) - y(travelled) + hy,
      -(d - travelled)
    );
  }
  // Heading (yaw) and grade (pitch) used to orient props/segments along the trail.
  const headingAt = (d) => Math.atan2(dx(d), 1);
  const gradeAt = (d) => Math.atan2(dy(d), 1);

  return { x, y, dx, dy, canyon, toWorld, headingAt, gradeAt, length: L, level };
}
