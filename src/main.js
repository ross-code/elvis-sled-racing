// Bootstrap: one renderer + canvas, a tiny screen manager, and the flow
// Title -> Draft -> Race -> Result.
import * as THREE from 'three';
import { el } from './util.js';
import { createTitleScreen, createDraftScreen } from './screens.js';
import { createRaceScreen } from './race.js';
import { LEVELS } from './config.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const clock = new THREE.Clock();
let current = null;
let lastTeam = null;

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  if (current && current.camera) { current.camera.aspect = w / h; current.camera.updateProjectionMatrix(); }
}
addEventListener('resize', resize);

function setScreen(screen, ...args) {
  if (current && current.exit) current.exit();
  current = screen;
  if (current.enter) current.enter(...args);
  resize();
}

// ---- Result overlay --------------------------------------------------------
const resultBody = el('div', { class: 'result-body' });
const resultOverlay = el('div', { class: 'overlay result-overlay hidden', id: 'resultScreen' }, [resultBody]);
document.body.appendChild(resultOverlay);

function showResult(r) {
  const cargoPct = Math.round(r.cargo * 100);
  let stars = 1;
  if (r.win) {
    stars = 2;
    if (r.time <= r.level.par * 0.92 && r.hits <= 1 && cargoPct >= 80) stars = 3;
    else if (r.time <= r.level.par * 1.1 && cargoPct >= 60) stars = 2;
    else stars = 1;
  }
  const starRow = r.win ? '★★★'.slice(0, stars).padEnd(3, '☆') : '☆☆☆';
  const idx = r.levelIndex ?? 0;
  const hasNext = idx + 1 < LEVELS.length;
  const nextLevel = hasNext ? LEVELS[idx + 1] : null;

  resultBody.innerHTML = '';
  resultBody.appendChild(el('div', { class: 'tag', text: 'Leg ' + r.level.id + ' · ' + r.level.name + ' · ' + r.level.from + ' → ' + r.level.to }));
  resultBody.appendChild(el('h1', {
    class: 'result-title ' + (r.win ? 'win' : 'lose'),
    text: r.win ? (hasNext ? 'Leg Complete!' : 'Journey Complete! 🏆') : 'Run Failed',
  }));
  resultBody.appendChild(el('div', { class: 'result-stars', text: starRow }));
  resultBody.appendChild(el('p', {
    class: 'result-flavor',
    text: r.win
      ? (hasNext
        ? `${r.level.to} reached. The next leg climbs toward ${nextLevel.to} — ${nextLevel.name}.`
        : 'Elvis and the team carried the cargo the whole way. The North is conquered.')
      : 'The cargo didn’t survive the trail. Re-balance the team, or retry the leg.',
  }));
  resultBody.appendChild(el('div', { class: 'result-stats' }, [
    stat('Time', r.time.toFixed(1) + 's'),
    stat('Top speed', Math.round(r.topMph) + ' mph'),
    stat('Hits taken', String(r.hits)),
    stat('Cargo left', cargoPct + '%'),
  ]));

  const btns = [];
  if (r.win && hasNext) {
    btns.push(el('button', { class: 'btn', text: 'Next Leg  ▶', onclick: () => { hideResult(); setScreen(race, lastTeam, idx + 1); } }));
    btns.push(el('button', { class: 'btn btn-ghost', text: 'Replay Leg', onclick: () => { hideResult(); setScreen(race, lastTeam, idx); } }));
  } else {
    btns.push(el('button', { class: 'btn', text: r.win ? 'Play Again' : 'Retry Leg', onclick: () => { hideResult(); setScreen(race, lastTeam, r.win ? 0 : idx); } }));
    btns.push(el('button', { class: 'btn btn-ghost', text: 'Re-draft Team', onclick: () => { hideResult(); setScreen(draft); } }));
  }
  resultBody.appendChild(el('div', { class: 'result-btns' }, btns));
  if (r.win && hasNext) resultBody.appendChild(el('div', { class: 'next-note', text: 'Your team carries over. Leg ' + (idx + 2) + ' of ' + LEVELS.length + '.' }));
  resultOverlay.classList.remove('hidden');
}
function hideResult() { resultOverlay.classList.add('hidden'); }
function stat(label, value) {
  return el('div', { class: 'rstat' }, [el('div', { class: 'rstat-v', text: value }), el('div', { class: 'rstat-l', text: label })]);
}

// ---- Screens ---------------------------------------------------------------
const title = createTitleScreen({ onStart: () => setScreen(draft) });
const draft = createDraftScreen({ onRace: (team) => { lastTeam = team; setScreen(race, team, 0); } });
const race = createRaceScreen({ onFinish: (r) => showResult(r) });

setScreen(title);

// ---- Loop ------------------------------------------------------------------
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (current && current.update) current.update(dt);
  if (current && current.scene && current.camera) renderer.render(current.scene, current.camera);
});
