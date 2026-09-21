import test from "node:test";
import assert from "node:assert/strict";
import { applyKeyEvent, eventTargetsTyping, steerIntent } from "../lib/input.js";

function chord(keys, steps) {
  for (const [down, event] of steps) applyKeyEvent(keys, event, down);
  return keys;
}

test("shift while holding A does not leave a stuck rotate-left key", () => {
  const keys = new Set();
  chord(keys, [
    [true, { key: "a", code: "KeyA" }],
    [true, { key: "Shift", code: "ShiftLeft" }],
    [true, { key: "A", code: "KeyA" }],
    [false, { key: "A", code: "KeyA" }],
    [false, { key: "Shift", code: "ShiftLeft" }],
  ]);
  const intent = steerIntent(keys);
  assert.equal(intent.left, false);
  assert.equal(intent.right, false);
  assert.equal(intent.turning, false);
  assert.equal(keys.has("KeyA"), false);
});

test("old key+letter tracking would stick A after a Shift chord", () => {
  const keys = new Set();
  const legacy = (down, event) => {
    if (down) {
      keys.add(event.key);
      keys.add(event.code);
    } else {
      keys.delete(event.key);
      keys.delete(event.code);
    }
  };
  legacy(true, { key: "a", code: "KeyA" });
  legacy(true, { key: "A", code: "KeyA" });
  legacy(false, { key: "A", code: "KeyA" });
  assert.equal(keys.has("a"), true);
  assert.equal(keys.has("KeyA"), false);
  assert.equal(steerIntent(keys).left, false);
});

test("A and D together cancel strafe", () => {
  const keys = new Set();
  applyKeyEvent(keys, { code: "KeyA" }, true);
  applyKeyEvent(keys, { code: "KeyD" }, true);
  const intent = steerIntent(keys);
  assert.equal(intent.left, false);
  assert.equal(intent.right, false);
  assert.equal(intent.strafe, 0);
  assert.equal(intent.turning, false);
});

test("Q and E yaw the hull when the mouse is not aiming", () => {
  const keys = new Set();
  applyKeyEvent(keys, { code: "KeyQ" }, true);
  const left = steerIntent(keys);
  assert.equal(left.yaw, -1);
  assert.equal(left.turning, true);
  applyKeyEvent(keys, { code: "KeyE" }, true);
  const both = steerIntent(keys);
  assert.equal(both.yaw, 0);
  assert.equal(both.turning, false);
});

test("typing in an input does not look like flight keys", () => {
  assert.equal(eventTargetsTyping({ tagName: "INPUT" }), true);
  assert.equal(eventTargetsTyping({ tagName: "CANVAS" }), false);
  assert.equal(eventTargetsTyping({ tagName: "DIV", isContentEditable: true }), true);
});
