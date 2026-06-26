// Procedural sound (Web Audio, no asset files): a smooth sled-runner glide that
// scales with speed, paw-fall patter synced to the team's gait, and crash thuds.
// Created lazily on the first user gesture (autoplay policy).
import { clamp } from './util.js';

let ctx = null, master = null, noiseBuf = null;
let glideSrc, bodyFilter, bodyGain, hissFilter, hissGain;
let footPhase = 0;
let muted = false;
try { muted = localStorage.getItem('elvisSledMuted') === '1'; } catch (e) {}

function makeNoise(c, dur) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.9;
  master.connect(ctx.destination);
  noiseBuf = makeNoise(ctx, 1.4);

  // Smooth glide bed: looping noise -> a low "rush" body + a high "snow spray" hiss.
  glideSrc = ctx.createBufferSource();
  glideSrc.buffer = noiseBuf; glideSrc.loop = true;
  bodyFilter = ctx.createBiquadFilter(); bodyFilter.type = 'lowpass'; bodyFilter.frequency.value = 480; bodyFilter.Q.value = 0.7;
  bodyGain = ctx.createGain(); bodyGain.gain.value = 0;
  hissFilter = ctx.createBiquadFilter(); hissFilter.type = 'bandpass'; hissFilter.frequency.value = 2200; hissFilter.Q.value = 0.55;
  hissGain = ctx.createGain(); hissGain.gain.value = 0;
  glideSrc.connect(bodyFilter).connect(bodyGain).connect(master);
  glideSrc.connect(hissFilter).connect(hissGain).connect(master);
  glideSrc.start();
}

// A single paw landing in snow: a soft noise "puff" + a low body thump.
function paw(intensity, pan = 0, delay = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = 0.8 + Math.random() * 0.5;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 680 + Math.random() * 520; lp.Q.value = 0.9;
  const g = ctx.createGain();
  const peak = 0.085 * intensity;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
  const panner = ctx.createStereoPanner(); panner.pan.value = clamp(pan, -1, 1);
  src.connect(lp).connect(g).connect(panner).connect(master);
  const off = Math.random() * (noiseBuf.duration - 0.2);
  src.start(t, off, 0.12); src.stop(t + 0.13);

  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(115 + Math.random() * 30, t);
  o.frequency.exponentialRampToValueAtTime(58, t + 0.08);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.05 * intensity), t + 0.006);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(og).connect(panner);
  o.start(t); o.stop(t + 0.13);
}

// The team's bounding gait: a "ka-thump" pair, panned a touch for width.
function emitStep(s) {
  const base = 0.55 + 0.45 * s;
  paw(0.95 * base, (Math.random() * 2 - 1) * 0.5, 0);
  if (Math.random() < 0.65) paw(0.6 * base, (Math.random() * 2 - 1) * 0.5, 0.05 + Math.random() * 0.05);
}

// Crash / cold-water impact.
function thud(intensity = 1) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.2);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.22 * intensity), t + 0.008);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(og).connect(master); o.start(t); o.stop(t + 0.32);

  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.16 * intensity), t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  src.connect(lp).connect(g).connect(master);
  src.start(t, Math.random() * 0.5, 0.26); src.stop(t + 0.27);
}

// Called every frame from the race. speed01 ~ 0..1, moving gates everything.
function update(dt, speed01, moving) {
  if (!ctx) return;
  speed01 = clamp(speed01, 0, 1);
  const now = ctx.currentTime, tc = 0.08;
  bodyGain.gain.setTargetAtTime((moving ? 0.17 : 0) * speed01, now, tc);
  hissGain.gain.setTargetAtTime((moving ? 0.085 : 0) * speed01 * speed01, now, tc);
  bodyFilter.frequency.setTargetAtTime(360 + speed01 * 1500, now, tc);
  hissFilter.frequency.setTargetAtTime(1600 + speed01 * 2600, now, tc);

  if (moving && !muted) {
    const rate = 1.6 + speed01 * 4.6;        // team footfall beats / sec
    footPhase += rate * dt;
    while (footPhase >= 1) { footPhase -= 1; emitStep(speed01); }
  } else footPhase = 0;
}

// Ramp the glide down when leaving the race.
function silence() {
  if (!ctx) return;
  const now = ctx.currentTime;
  bodyGain.gain.setTargetAtTime(0, now, 0.05);
  hissGain.gain.setTargetAtTime(0, now, 0.05);
  footPhase = 0;
}

function setMuted(m) {
  muted = m;
  try { localStorage.setItem('elvisSledMuted', m ? '1' : '0'); } catch (e) {}
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02);
}
function toggleMute() { ensure(); setMuted(!muted); }

export const audio = {
  ensure, update, paw, thud, silence, toggleMute, setMuted,
  get muted() { return muted; },
  get _state() { return ctx ? ctx.state : 'none'; },
};

// Unlock on the first gesture; 'M' toggles mute globally.
if (typeof window !== 'undefined') {
  const unlock = () => ensure();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyM') toggleMute(); else ensure(); });
}
