// Keyboard + touch input. Exposes simple intent booleans the race reads.
export const input = {
  left: false, right: false, boost: false,
  _kb: { left: false, right: false, boost: false },
  _touch: { left: false, right: false, boost: false },
  _sync() {
    this.left = this._kb.left || this._touch.left;
    this.right = this._kb.right || this._touch.right;
    this.boost = this._kb.boost || this._touch.boost;
  },
};

const map = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'boost', ShiftRight: 'boost', Space: 'boost', ArrowUp: 'boost', KeyW: 'boost',
};

window.addEventListener('keydown', (e) => {
  const a = map[e.code];
  if (a) { input._kb[a] = true; input._sync(); if (e.code === 'Space') e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  const a = map[e.code];
  if (a) { input._kb[a] = false; input._sync(); }
});
window.addEventListener('blur', () => {
  input._kb.left = input._kb.right = input._kb.boost = false; input._sync();
});

// Bind an on-screen button (pointer) to a touch intent.
export function bindTouch(elm, action) {
  const set = (v) => (e) => { e.preventDefault(); input._touch[action] = v; input._sync(); };
  elm.addEventListener('pointerdown', set(true));
  elm.addEventListener('pointerup', set(false));
  elm.addEventListener('pointerleave', set(false));
  elm.addEventListener('pointercancel', set(false));
}
