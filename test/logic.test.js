import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_POWER,
  WAVEFORMS,
  allocatedTotal,
  canEnterGate,
  facingShieldKey,
  gateExplodes,
  hyperdriveDrain,
  hyperdriveSpeed,
  laserDamage,
  navHazard,
  nextMissionIndex,
  sensorZoom,
  setSystemPower,
  shieldAbsorb,
  unallocated,
  waveformMultiplier,
} from "../lib/logic.js";

test("power allocation never exceeds reactor", () => {
  const reactor = 220;
  let power = { ...DEFAULT_POWER };
  power = setSystemPower(reactor, power, "engines", 400);
  assert.equal(allocatedTotal(power) <= reactor, true);
  assert.equal(unallocated(reactor, power) >= 0, true);
});

test("matched waveforms blunt laser damage", () => {
  assert.equal(waveformMultiplier("sine", "sine"), 0.32);
  assert.equal(waveformMultiplier("sine", "saw"), 1);
  const matched = laserDamage(80, 2, "square", "square");
  const mismatched = laserDamage(80, 2, "square", "saw");
  assert.equal(matched < mismatched, true);
});

test("directional shields pick the struck facing", () => {
  assert.equal(facingShieldKey(0, 0), "shieldFore");
  assert.equal(facingShieldKey(0, Math.PI), "shieldAft");
  assert.equal(facingShieldKey(0, Math.PI / 2), "shieldStarboard");
  assert.equal(facingShieldKey(0, -Math.PI / 2), "shieldPort");
});

test("shields absorb part of a hit", () => {
  const result = shieldAbsorb(40, 20);
  assert.equal(result.hull < 20, true);
  assert.equal(result.absorbed > 0, true);
});

test("hyperdrive scales with engine throttle", () => {
  assert.equal(hyperdriveSpeed(200, 200) > hyperdriveSpeed(40, 40), true);
  assert.equal(hyperdriveDrain(200, 1) > hyperdriveDrain(20, 1), true);
});

test("sensors zoom out as power rises", () => {
  assert.equal(sensorZoom(0) < sensorZoom(120), true);
});

test("nav hazard blocks hyperdrive near planets", () => {
  const hazard = navHazard(0, 0, [{ x: 10, y: 0, radius: 40, name: "Helios" }], []);
  assert.equal(hazard, "Helios");
  const clear = navHazard(800, 800, [{ x: 10, y: 0, radius: 40, name: "Helios" }], []);
  assert.equal(clear, null);
});

test("campaign gating for the vortex", () => {
  assert.equal(canEnterGate({ hasVoidseed: true, ejectedVoidseed: true }), true);
  assert.equal(gateExplodes({ hasVoidseed: true, ejectedVoidseed: false }), true);
  assert.equal(nextMissionIndex({}), 0);
  assert.equal(nextMissionIndex({ talkedKade: true, hasScanner: true }), 2);
});

test("waveform table has three combat profiles", () => {
  assert.deepEqual(WAVEFORMS, ["sine", "square", "saw"]);
});
