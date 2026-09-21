import test from "node:test";
import assert from "node:assert/strict";
import { headingVector } from "../lib/logic.js";
import { chaseIntent, flySpecOf, rightVector, stepFly } from "../lib/flight.js";
import { SHIP_CLASSES } from "../lib/settings.js";

test("heavier hulls accelerate slower and keep sliding after cut-off", () => {
  const light = SHIP_CLASSES.interceptor;
  const heavy = SHIP_CLASSES.hauler;
  const intent = { forward: true };
  let a = { x: 0, y: 0, vx: 0, vy: 0, heading: 0, omega: 0 };
  let b = { ...a };
  for (let i = 0; i < 12; i++) {
    a = stepFly(a, intent, light, 0.05);
    b = stepFly(b, intent, heavy, 0.05);
  }
  const spA = Math.hypot(a.vx, a.vy);
  const spB = Math.hypot(b.vx, b.vy);
  assert.ok(spA > spB, `interceptor ${spA.toFixed(1)} should out-accelerate hauler ${spB.toFixed(1)}`);

  const coast = stepFly({ x: 0, y: 0, vx: 80, vy: 0, heading: 0, omega: 0 }, {}, heavy, 0.4);
  assert.ok(coast.vx > 70, `hauler should still be sliding, vx=${coast.vx.toFixed(1)}`);
  assert.ok(Math.abs(coast.x - 80 * 0.4) < 12);
});

test("strafe is perpendicular to the nose and A/D cancel", () => {
  const ship = SHIP_CLASSES.gunship;
  const left = stepFly({ x: 0, y: 0, vx: 0, vy: 0, heading: 0, omega: 0 }, { strafe: -1 }, ship, 0.2);
  const right = headingVector(0);
  assert.ok(Math.abs(left.vx) > 4, "strafe should add lateral speed");
  assert.ok(Math.abs(left.vy) < Math.abs(left.vx), "heading 0 strafe is mostly +x / -x");
  const both = stepFly({ x: 0, y: 0, vx: 0, vy: 0, heading: 0, omega: 0 }, { strafe: 0 }, ship, 0.2);
  assert.equal(both.vx, 0);
  const r = rightVector(0);
  assert.ok(Math.abs(r.x - 1) < 1e-9);
  assert.ok(Math.abs(r.y) < 1e-9);
  const side = stepFly({ x: 0, y: 0, vx: 0, vy: 0, heading: 0, omega: 0 }, { strafe: 1 }, ship, 0.2);
  assert.ok(side.vx > 0);
});

test("mouse aim yaws toward a world point instead of snapping", () => {
  const ship = SHIP_CLASSES.hauler;
  let body = { x: 0, y: 0, vx: 0, vy: 0, heading: 0, omega: 0 };
  for (let i = 0; i < 8; i++) body = stepFly(body, {}, ship, 0.05, { x: 40, y: 0 });
  assert.ok(body.heading > 0.08, "should start turning toward +x");
  assert.ok(body.heading < 1.4, "should not snap to the target in a few ticks");
  assert.ok(body.omega > 0);
});

test("chase intent only burns main once the nose is roughly on target", () => {
  const lined = chaseIntent({ x: 0, y: 0, heading: 0 }, 0, -40);
  assert.equal(lined.forward, true);
  const off = chaseIntent({ x: 0, y: 0, heading: 0 }, 80, 0);
  assert.equal(off.forward, false);
});

test("flySpecOf fills mass and thrust from a ship class", () => {
  const spec = flySpecOf(SHIP_CLASSES.hauler);
  assert.ok(spec.mass > flySpecOf(SHIP_CLASSES.interceptor).mass);
  assert.ok(spec.inertia > spec.mass);
  assert.ok(spec.thrust > 0);
});
