/** Keyboard helpers. Track physical `code` so Shift/chords cannot stick a letter key. */

export const STEER_CODES = {
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  yawLeft: ["KeyQ"],
  yawRight: ["KeyE"],
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
  const yawLeft = anyHeld(keys, STEER_CODES.yawLeft);
  const yawRight = anyHeld(keys, STEER_CODES.yawRight);
  const strafe = (right && !left ? 1 : 0) + (left && !right ? -1 : 0);
  const yaw = (yawRight && !yawLeft ? 1 : 0) + (yawLeft && !yawRight ? -1 : 0);
  return {
    left: left && !right,
    right: right && !left,
    turning: yaw !== 0,
    strafe,
    yaw,
    forward: anyHeld(keys, STEER_CODES.forward),
    back: anyHeld(keys, STEER_CODES.back),
    boost: anyHeld(keys, STEER_CODES.boost),
    brake: anyHeld(keys, STEER_CODES.brake),
    laser: anyHeld(keys, STEER_CODES.laser),
  };
}
