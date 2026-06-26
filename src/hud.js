// In-race heads-up display, built as a DOM overlay over the canvas.
import { el } from './util.js';
import { bindTouch } from './input.js';

export function createHud(level) {
  const fill = el('div', { class: 'rp-fill' });
  const sled = el('div', { class: 'rp-sled', text: '🛷' });
  const progress = el('div', { class: 'rp-track' }, [fill, sled]);
  const route = el('div', { class: 'rp-route' }, [
    el('span', { class: 'rp-from', text: level.from }),
    el('span', { class: 'rp-cargo', text: '✚ ' + level.cargo }),
    el('span', { class: 'rp-to', text: level.to }),
  ]);

  const timeEl = el('div', { class: 'stat-num', text: '0.0s' });
  const speedEl = el('div', { class: 'stat-num', text: '0 mph' });
  const paceEl = el('div', { class: 'stat-num', text: '1.0×' });
  const stamFill = el('div', { class: 'bar-fill stam' });
  const cargoFill = el('div', { class: 'bar-fill cargo' });

  const warn = el('div', { class: 'rh-warn' });
  const toast = el('div', { class: 'rh-toast' });

  const btnL = el('button', { class: 'tbtn tbtn-l', text: '◀' });
  const btnR = el('button', { class: 'tbtn tbtn-r', text: '▶' });
  const btnB = el('button', { class: 'tbtn tbtn-b', text: 'BOOST' });
  const touch = el('div', { class: 'touch-controls' }, [btnL, btnB, btnR]);

  const root = el('div', { class: 'race-hud', id: 'raceHud' }, [
    el('div', { class: 'rh-top' }, [
      el('div', { class: 'rh-progress' }, [route, progress]),
      el('div', { class: 'rh-stats' }, [
        el('div', { class: 'stat' }, [el('div', { class: 'stat-lbl', text: 'TIME' }), timeEl]),
        el('div', { class: 'stat' }, [el('div', { class: 'stat-lbl', text: 'SPEED' }), speedEl]),
        el('div', { class: 'stat' }, [el('div', { class: 'stat-lbl', text: 'PACE' }), paceEl]),
      ]),
    ]),
    warn,
    toast,
    el('div', { class: 'rh-bars' }, [
      el('div', { class: 'bar-wrap' }, [el('div', { class: 'bar-lbl', text: '⚡ Stamina' }), el('div', { class: 'bar' }, [stamFill])]),
      el('div', { class: 'bar-wrap' }, [el('div', { class: 'bar-lbl', text: '✚ Serum' }), el('div', { class: 'bar' }, [cargoFill])]),
    ]),
    touch,
  ]);

  bindTouch(btnL, 'left');
  bindTouch(btnR, 'right');
  bindTouch(btnB, 'boost');

  let toastT = 0;
  function set(s) {
    fill.style.width = (s.progress * 100).toFixed(1) + '%';
    sled.style.left = (s.progress * 100).toFixed(1) + '%';
    timeEl.textContent = s.time.toFixed(1) + 's';
    speedEl.textContent = Math.round(s.speedMph) + ' mph';
    if (s.pace != null) {
      paceEl.textContent = s.pace.toFixed(1) + '×';
      paceEl.classList.toggle('hot', s.pace > 1.33);
    }
    stamFill.style.width = (s.stamina * 100).toFixed(0) + '%';
    stamFill.classList.toggle('low', s.stamina < 0.18);
    cargoFill.style.width = (s.cargo * 100).toFixed(0) + '%';
    cargoFill.classList.toggle('low', s.cargo < 0.34);
  }
  function setWarn(msg) {
    if (msg) { warn.textContent = msg; warn.classList.add('show'); }
    else warn.classList.remove('show');
  }
  function showToast(msg, kind = '') {
    toast.textContent = msg;
    toast.className = 'rh-toast show ' + kind;
    toastT = 1.4;
  }
  function tick(dt) {
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toast.classList.remove('show'); }
  }

  return { root, set, setWarn, showToast, tick };
}
