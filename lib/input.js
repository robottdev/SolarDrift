/** Keyboard helpers. Track physical `code` so Shift/chords cannot stick a letter key. */

export const STEER_CODES = {
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  forward: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  boost: ["ShiftLeft", "ShiftRight"],
  brake: ["KeyX", "ControlLeft", "ControlRight"],
  laser: ["Space"],
};

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function eventTargetsTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (TYPING_TAGS.has(tag)) return true;
  return Boolean(target.isContentEditable);
}

export function applyKeyEvent(keys, event, down) {
  const next = keys instanceof Set ? keys : new Set(keys);
  const code = event?.code;
  if (!code) return next;
  if (down) next.add(code);
  else next.delete(code);
  return next;
}

export function anyHeld(keys, codes) {
  if (!keys || !codes) return false;
  for (const code of codes) {
    if (keys.has(code)) return true;
  }
  return false;
}

export function steerIntent(keys) {
  const left = anyHeld(keys, STEER_CODES.left);
  const right = anyHeld(keys, STEER_CODES.right);
  return {
    left: left && !right,
    right: right && !left,
    turning: left !== right,
    forward: anyHeld(keys, STEER_CODES.forward),
    back: anyHeld(keys, STEER_CODES.back),
    boost: anyHeld(keys, STEER_CODES.boost),
    brake: anyHeld(keys, STEER_CODES.brake),
    laser: anyHeld(keys, STEER_CODES.laser),
  };
}
