// Title screen and the team-draft screen. Both reuse a rotating husky showcase
// rendered through the same canvas, with DOM panels layered on top.
import * as THREE from 'three';
import { el } from './util.js';
import { makeRng } from './util.js';
import { createWorld } from './world.js';
import { createHusky } from './husky.js';
import { COATS, EYES, STATS, STAT_BUDGET, STAT_MIN, STAT_MAX, MAX_TEAMMATES, ELVIS } from './config.js';

// ---- Shared 3D showcase ----------------------------------------------------
function createShowcase(seed) {
  const rng = makeRng(seed);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1730);
  scene.fog = new THREE.Fog(0x153f57, 26, 220);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 700);
  camera.position.set(0.2, 1.7, 5.4);
  camera.lookAt(0, 1.0, 0);

  scene.add(new THREE.HemisphereLight(0xbcd6ff, 0xe8f0ff, 0.7));
  const key = new THREE.DirectionalLight(0xfff0e0, 1.15);
  key.position.set(-5, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 40;
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 6, bottom: -4 });
  key.shadow.camera.updateProjectionMatrix();
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x66a6ff, 0.7); rim.position.set(6, 4, -6); scene.add(rim);

  const world = createWorld(rng, { scroll: false, trailHalfWidth: 6 });
  scene.add(world.group);

  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.75, 0.45, 32),
    new THREE.MeshStandardMaterial({ color: 0xeef3ff, roughness: 1 })
  );
  ped.position.y = 0.2; ped.receiveShadow = true; scene.add(ped);

  const holder = new THREE.Group();
  holder.position.y = 0.43; holder.scale.setScalar(1.4); scene.add(holder);

  let cur = null, t = 0, spin = true;
  function setDog(spec) {
    if (cur) holder.remove(cur.group);
    cur = createHusky(spec);
    holder.add(cur.group);
  }
  function update(dt) {
    t += dt;
    if (cur) cur.update(t * 0.5, 0.12);
    if (spin) holder.rotation.y += dt * 0.5;
    world.update(dt, 0, 0, camera.position);
  }
  return { scene, camera, setDog, update, setSpin: (v) => (spin = v), holder };
}

// ---- Title screen ----------------------------------------------------------
export function createTitleScreen({ onStart }) {
  const show = createShowcase(7);
  show.setDog({ coat: ELVIS.coat, eye: ELVIS.eye, wooly: true, snowNose: true, lod: 'high', scale: 1 });

  const overlay = el('div', { class: 'overlay title-overlay hidden', id: 'titleScreen' }, [
    el('div', { class: 'title-inner' }, [
      el('div', { class: 'tag', text: "A husky's sled-dog adventure" }),
      el('h1', { class: 'game-title', html: 'ELVIS<span>SNOW&nbsp;RUN</span>' }),
      el('p', { class: 'title-sub', text: 'Draft your team, harness up, and race the 1925 serum run toward Nome. Dodge fallen trees, ford the river at the ice bridge, and outrun the wolves.' }),
      el('button', { class: 'btn btn-big', text: '🛷  Start the Run', onclick: () => onStart() }),
      el('div', { class: 'keys', html: '<kbd>◀</kbd><kbd>▶</kbd> steer &nbsp;·&nbsp; <kbd>⇧ Shift</kbd> / <kbd>Space</kbd> mush faster' }),
      el('div', { class: 'credit', text: 'Starring Elvis — the wooly white Siberian with the blue eyes' }),
    ]),
  ]);
  document.body.appendChild(overlay);

  return {
    scene: show.scene, camera: show.camera,
    enter() { overlay.classList.remove('hidden'); },
    exit() { overlay.classList.add('hidden'); },
    update(dt) { show.update(dt); },
  };
}

// ---- Draft screen ----------------------------------------------------------
export function createDraftScreen({ onRace }) {
  const show = createShowcase(11);
  show.setSpin(true);

  let dogId = 0;
  const elvisMember = {
    id: 'elvis', name: 'Elvis', isLead: true, locked: true, wooly: true, snowNose: true,
    coat: ELVIS.coat, eye: ELVIS.eye, stats: { ...ELVIS.stats },
  };
  function recruit(coatId, name) {
    const coat = COATS.find((c) => c.id === coatId) || COATS[1];
    return {
      id: 'r' + ++dogId, name, isLead: false, wooly: false, coat, eye: EYES[0],
      stats: { speed: 20, acceleration: 20, endurance: 20, leadership: 20, smarts: 20 },
    };
  }
  let team = [elvisMember, recruit('bw', 'Balto'), recruit('gray', 'Togo')];
  let sel = 0;

  // DOM scaffold
  const roster = el('div', { class: 'draft-roster' });
  const editor = el('div', { class: 'draft-editor' });
  const startBtn = el('button', { class: 'btn', text: 'Start the Race  ▶', onclick: () => onRace(team.map(cloneMember)) });
  const overlay = el('div', { class: 'overlay draft-overlay hidden', id: 'draftScreen' }, [
    el('div', { class: 'draft-head' }, [
      el('h2', { text: 'Draft Your Sled Team' }),
      el('div', { class: 'draft-sub', text: 'Elvis leads. Recruit up to ' + MAX_TEAMMATES + ' more — pick coats, eyes, and spend ' + STAT_BUDGET + ' points each.' }),
    ]),
    el('div', { class: 'draft-cols' }, [roster, el('div', { class: 'draft-stage' }), editor]),
    el('div', { class: 'draft-foot' }, [
      el('div', { class: 'foot-hint', text: 'The whole team’s averages drive your sled — balance speed, stamina and smarts.' }),
      startBtn,
    ]),
  ]);
  document.body.appendChild(overlay);

  const cloneMember = (m) => ({ ...m, coat: m.coat, eye: m.eye, stats: { ...m.stats } });

  function previewSelected() {
    const m = team[sel];
    show.setDog({ coat: m.coat, eye: m.eye, wooly: m.wooly, snowNose: m.snowNose, lod: 'high', scale: m.isLead ? 1 : 0.96 });
  }

  function renderRoster() {
    roster.innerHTML = '';
    roster.appendChild(el('div', { class: 'panel-title', text: 'Team (' + team.length + ')' }));
    team.forEach((m, i) => {
      const chip = el('div', { class: 'dog-chip' + (i === sel ? ' active' : '') + (m.isLead ? ' lead' : ''), onclick: () => { sel = i; renderAll(); } }, [
        el('span', { class: 'chip-swatch', style: `background:linear-gradient(120deg, #${m.coat.main.toString(16).padStart(6, '0')} 55%, #${m.coat.under.toString(16).padStart(6, '0')} 55%)` }),
        el('span', { class: 'chip-name', text: m.name }),
        m.isLead ? el('span', { class: 'chip-badge', text: 'LEAD' }) : null,
        !m.isLead ? el('button', {
          class: 'chip-x', text: '✕', title: 'Remove',
          onclick: (e) => { e.stopPropagation(); team = team.filter((x) => x.id !== m.id); sel = Math.min(sel, team.length - 1); renderAll(); },
        }) : null,
      ]);
      roster.appendChild(chip);
    });
    if (team.length < MAX_TEAMMATES + 1) {
      roster.appendChild(el('button', {
        class: 'add-dog', text: '＋ Recruit a husky',
        onclick: () => { const r = recruit(COATS[1 + (team.length % (COATS.length - 1))].id, 'Dog ' + team.length); team.push(r); sel = team.length - 1; renderAll(); },
      }));
    }
  }

  function statRow(m, stat, remaining) {
    const val = m.stats[stat.key];
    const fill = el('div', { class: 'sbar-fill', style: `width:${(val / STAT_MAX) * 100}%` });
    if (m.locked) {
      return el('div', { class: 'stat-row locked' }, [
        el('div', { class: 'stat-name', text: stat.label }),
        el('div', { class: 'sbar' }, [fill]),
        el('div', { class: 'stat-val', text: val }),
      ]);
    }
    const input = el('input', { type: 'range', min: STAT_MIN, max: STAT_MAX, value: val, class: 'stat-range' });
    input.addEventListener('input', () => {
      let v = parseInt(input.value, 10);
      const others = STATS.reduce((s, x) => s + (x.key === stat.key ? 0 : m.stats[x.key]), 0);
      if (v + others > STAT_BUDGET) v = STAT_BUDGET - others;
      v = Math.max(STAT_MIN, Math.min(STAT_MAX, v));
      m.stats[stat.key] = v;
      input.value = v;
      renderEditor();
    });
    return el('div', { class: 'stat-row' }, [
      el('div', { class: 'stat-name', text: stat.label }),
      input,
      el('div', { class: 'stat-val', text: val }),
    ]);
  }

  function renderEditor() {
    const m = team[sel];
    editor.innerHTML = '';
    const spent = STATS.reduce((s, x) => s + m.stats[x.key], 0);
    const remaining = STAT_BUDGET - spent;

    editor.appendChild(el('div', { class: 'panel-title', text: m.isLead ? 'Elvis — Lead Dog' : 'Configure ' + m.name }));

    if (m.locked) {
      editor.appendChild(el('div', { class: 'lock-note', text: '🔒 Your lead dog. Elvis is matched to the real husky — fixed look and stats.' }));
    } else {
      // name
      const name = el('input', { class: 'name-input', type: 'text', value: m.name, maxlength: 14 });
      name.addEventListener('input', () => { m.name = name.value || 'Dog'; renderRoster(); });
      editor.appendChild(el('label', { class: 'field-lbl', text: 'Name' }));
      editor.appendChild(name);

      // coat
      editor.appendChild(el('label', { class: 'field-lbl', text: 'Coat' }));
      const coats = el('div', { class: 'swatches' }, COATS.map((c) => el('button', {
        class: 'swatch' + (c.id === m.coat.id ? ' on' : ''), title: c.name,
        style: `background:linear-gradient(120deg, #${c.main.toString(16).padStart(6, '0')} 55%, #${c.under.toString(16).padStart(6, '0')} 55%)`,
        onclick: () => { m.coat = c; renderAll(); },
      })));
      editor.appendChild(coats);

      // eyes
      editor.appendChild(el('label', { class: 'field-lbl', text: 'Eyes' }));
      const eyes = el('div', { class: 'swatches' }, EYES.map((e) => el('button', {
        class: 'swatch eye' + (e.id === m.eye.id ? ' on' : ''), title: e.name,
        style: e.color2
          ? `background:linear-gradient(90deg, #${e.color.toString(16).padStart(6, '0')} 50%, #${e.color2.toString(16).padStart(6, '0')} 50%)`
          : `background:#${e.color.toString(16).padStart(6, '0')}`,
        onclick: () => { m.eye = e; renderAll(); },
      })));
      editor.appendChild(eyes);
    }

    // stats
    const head = el('div', { class: 'stats-head' }, [
      el('span', { text: 'Characteristics' }),
      el('span', { class: 'pts' + (remaining === 0 ? ' done' : '') + (remaining < 0 ? ' over' : ''), text: m.locked ? '100 / 100' : remaining + ' pts left' }),
    ]);
    editor.appendChild(head);
    const rows = el('div', { class: 'stat-rows' }, STATS.map((s) => statRow(m, s, remaining)));
    editor.appendChild(rows);
  }

  function renderAll() { renderRoster(); renderEditor(); previewSelected(); }

  return {
    scene: show.scene, camera: show.camera,
    enter() { overlay.classList.remove('hidden'); renderAll(); },
    exit() { overlay.classList.add('hidden'); },
    update(dt) { show.update(dt); },
  };
}
