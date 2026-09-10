/** Pure simulation helpers shared by the browser game and Node tests. */

export const WAVEFORMS = ["sine", "square", "saw"];

export const SYSTEM_KEYS = [
  "weapons",
  "lifeSupport",
  "engines",
  "sensors",
  "shieldFore",
  "shieldAft",
  "shieldPort",
  "shieldStarboard",
];

export const DEFAULT_POWER = {
  weapons: 40,
  lifeSupport: 30,
  engines: 70,
  sensors: 30,
  shieldFore: 10,
  shieldAft: 10,
  shieldPort: 10,
  shieldStarboard: 10,
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function shortestAngle(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function allocatedTotal(power) {
  return SYSTEM_KEYS.reduce((sum, key) => sum + (power[key] || 0), 0);
}

export function unallocated(reactor, power) {
  return Math.max(0, reactor - allocatedTotal(power));
}

export function setSystemPower(reactor, power, key, next) {
  const copy = { ...power };
  const others = allocatedTotal(copy) - (copy[key] || 0);
  const maxForKey = Math.max(0, reactor - others);
  copy[key] = clamp(Math.round(next), 0, maxForKey);
  return copy;
}

export function sensorZoom(sensorPower) {
  // Higher sensors = zoomed-out tactical view (more of the map).
  return clamp(1 + sensorPower / 90, 1, 4.2);
}

export function sensorRange(sensorPower) {
  return 220 + sensorPower * 6;
}

export function maxSpeed(enginePower) {
  return 32 + enginePower * 0.28;
}

export function thrustAccel(enginePower) {
  return 38 + enginePower * 0.42;
}

export function hyperdriveSpeed(enginePower, throttle) {
  const cap = clamp(enginePower, 0, 240);
  const t = clamp(throttle, 0, cap);
  return 220 + t * 3.4;
}

export function hyperdriveDrain(throttle, dt) {
  return (8 + throttle * 0.045) * dt;
}

export function repairRate(lifeSupport) {
  return lifeSupport * 0.045;
}

export function lifeSupportDrain(lifeSupport, dt) {
  if (lifeSupport > 4) return 0;
  return (5 - lifeSupport) * 2.2 * dt;
}

export function waveformMultiplier(weaponWave, shieldWave) {
  if (weaponWave === shieldWave) return 0.32;
  return 1;
}

export function laserDamage(weaponPower, banks, weaponWave, shieldWave) {
  const bankBonus = 0.7 + banks * 0.3;
  const base = 7 + weaponPower * 0.12;
  return base * bankBonus * waveformMultiplier(weaponWave, shieldWave);
}

export function missileDamage(weaponPower) {
  return 36 + weaponPower * 0.18;
}

export function shieldAbsorb(shieldPower, incoming) {
  if (shieldPower <= 0) return { absorbed: 0, hull: incoming, leftoverShield: 0 };
  const absorbed = Math.min(incoming, shieldPower * 0.55 + 4);
  return {
    absorbed,
    hull: Math.max(0, incoming - absorbed),
    leftoverShield: Math.max(0, shieldPower - absorbed * 0.35),
  };
}

export function facingShieldKey(shipAngle, impactAngle) {
  const rel = wrapAngle(impactAngle - shipAngle);
  const deg = (rel * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return "shieldFore";
  if (deg >= 45 && deg < 135) return "shieldStarboard";
  if (deg >= -135 && deg < -45) return "shieldPort";
  return "shieldAft";
}

export function navHazard(px, py, bodies, ships, safeRadius = 90) {
  for (const body of bodies) {
    if (dist(px, py, body.x, body.y) < body.radius + safeRadius) return body.name || "body";
  }
  for (const ship of ships) {
    if (ship.dead || ship.cloaked) continue;
    if (dist(px, py, ship.x, ship.y) < safeRadius * 0.55) return ship.name || "vessel";
  }
  return null;
}

export function canEnterGate(flags) {
  return Boolean(flags.hasVoidseed) && Boolean(flags.ejectedVoidseed);
}

export function gateExplodes(flags) {
  return Boolean(flags.hasVoidseed) && !flags.ejectedVoidseed;
}

export function nextMissionIndex(flags) {
  if (!flags.talkedKade) return 0;
  if (!flags.hasScanner) return 1;
  if (!flags.reportedIn) return 2;
  if (!flags.convoyCleared) return 3;
  if (!flags.hasHyperdrive) return 4;
  if (!flags.talkedLira) return 5;
  if (!flags.rescuedColony) return 6;
  if (!flags.hasCrystals) return 7;
  if (!flags.hasVoidseed) return 8;
  if (!flags.ejectedVoidseed) return 9;
  if (!flags.enteredGate) return 10;
  return 11;
}
