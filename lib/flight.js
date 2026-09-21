/** SPAZ-like heavy flight: mass, inertia, strafe, coasting. Shared by the sim and tests. */

import { clamp, headingVector, shortestAngle, wrapAngle } from "./logic.js";

export function rightVector(heading) {
  const f = headingVector(heading);
  return { x: -f.y, y: f.x };
}

export function flySpecOf(ship = {}) {
  const mass = Math.max(0.35, Number(ship.mass) || 1);
  const thrust = Number(ship.thrust) || (ship.accel || 140) * mass;
  return {
    mass,
    inertia: Math.max(0.4, Number(ship.inertia) || mass * 1.15),
    thrust,
    strafeThrust: Number(ship.strafeThrust) || thrust * 0.55,
    turnTorque: Number(ship.turnTorque) || (ship.turn || 2.4) * 2.2,
    maxOmega: Number(ship.maxOmega) || 2.8,
    speed: Number(ship.speed) || 140,
    boostSpeed: Number(ship.boostSpeed) || (Number(ship.speed) || 140) * 1.45,
    boostMul: Number(ship.boostMul) || 1.7,
    drag: Number(ship.drag) || 0.11,
    angDrag: Number(ship.angDrag) || 2.6,
    brakeDrag: Number(ship.brakeDrag) || 1.85,
    overspeedDrag: Number(ship.overspeedDrag) || 0.85,
    aimGain: Number(ship.aimGain) || 7.2,
    aimDamp: Number(ship.aimDamp) || 2.5,
  };
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Integrate one heavy-ship step. `aim` is an optional world point the nose should track. */
export function stepFly(body, intent = {}, ship = {}, dt = 0.016, aim = null) {
  const spec = flySpecOf(ship);
  const t = Math.max(0, Number(dt) || 0);
  let heading = num(body.heading);
  let omega = num(body.omega);
  let vx = num(body.vx);
  let vy = num(body.vy);
  let x = num(body.x);
  let y = num(body.y);

  let yaw = clamp(num(intent.yaw), -1, 1);
  if (aim && Number.isFinite(aim.x) && Number.isFinite(aim.y)) {
    const desired = Math.atan2(aim.x - x, y - aim.y);
    const err = shortestAngle(heading, desired);
    const pd = spec.aimGain * err - spec.aimDamp * omega;
    yaw = clamp(yaw + clamp(pd / Math.max(spec.turnTorque, 0.01), -1, 1), -1, 1);
  }

  omega += (yaw * spec.turnTorque / spec.inertia) * t;
  omega *= Math.exp(-spec.angDrag * t);
  omega = clamp(omega, -spec.maxOmega, spec.maxOmega);
  heading = wrapAngle(heading + omega * t);

  const fwd = headingVector(heading);
  const right = rightVector(heading);
  const boost = Boolean(intent.boost);
  const main = spec.thrust * (boost ? spec.boostMul : 1);
  let fx = 0;
  let fy = 0;
  if (intent.forward) {
    fx += fwd.x * main;
    fy += fwd.y * main;
  }
  if (intent.back) {
    fx -= fwd.x * main * 0.42;
    fy -= fwd.y * main * 0.42;
  }
  const strafe = clamp(num(intent.strafe), -1, 1);
  if (strafe) {
    fx += right.x * spec.strafeThrust * strafe;
    fy += right.y * spec.strafeThrust * strafe;
  }

  vx += (fx / spec.mass) * t;
  vy += (fy / spec.mass) * t;

  if (intent.brake) {
    const b = Math.exp(-spec.brakeDrag * t);
    vx *= b;
    vy *= b;
    omega *= Math.exp(-spec.brakeDrag * 0.55 * t);
  }

  const coast = Math.exp(-spec.drag * t);
  vx *= coast;
  vy *= coast;

  const cap = boost ? spec.boostSpeed : spec.speed;
  const sp = Math.hypot(vx, vy);
  if (sp > cap) {
    const extra = (sp - cap) / Math.max(cap, 1);
    const k = Math.exp(-spec.overspeedDrag * extra * t);
    vx *= k;
    vy *= k;
    const sp2 = Math.hypot(vx, vy);
    if (sp2 > cap * 1.14) {
      vx *= (cap * 1.14) / sp2;
      vy *= (cap * 1.14) / sp2;
    }
  }

  return {
    ...body,
    heading,
    omega,
    vx,
    vy,
    x: x + vx * t,
    y: y + vy * t,
    thrusting: Boolean(intent.forward),
    strafing: strafe !== 0,
  };
}

export function chaseIntent(npc, tx, ty) {
  const desired = Math.atan2(tx - npc.x, npc.y - ty);
  const err = Math.abs(shortestAngle(npc.heading || 0, desired));
  return {
    forward: err < 0.9,
    back: false,
    boost: err < 0.28,
    brake: false,
    strafe: 0,
    yaw: 0,
  };
}
