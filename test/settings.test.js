import test from "node:test";
import assert from "node:assert/strict";
import { LASER_RATE, cutRock, mineTick, MINERALS } from "../lib/logic.js";
import {
  DEFAULT_SETTINGS,
  SHIP_CLASSES,
  asteroidCountFor,
  clampSettings,
  hashSeed,
  hostileCountFor,
  planetCountFor,
  randomSeedString,
  shipClassOf,
  shipLaserDamage,
  systemSeed,
} from "../lib/settings.js";

test("hashSeed is stable and keeps numeric seeds", () => {
  assert.equal(hashSeed("Helios"), hashSeed("Helios"));
  assert.equal(hashSeed("1993"), 1993);
  assert.equal(hashSeed(" 1993 "), 1993);
  assert.notEqual(hashSeed("Helios"), hashSeed("Nyx"));
  assert.equal(hashSeed(""), hashSeed(""));
});

test("clampSettings fills defaults and clamps ranges", () => {
  const empty = clampSettings({});
  assert.equal(empty.seed, DEFAULT_SETTINGS.seed);
  assert.equal(empty.shipClass, "hauler");
  const zero = clampSettings({ hostileDensity: 0, startingCredits: 0, systems: 1 });
  assert.equal(zero.hostileDensity, 0);
  assert.equal(zero.startingCredits, 0);
  assert.equal(zero.systems, 1);
  const wild = clampSettings({ systems: 99, planetDensity: 9, asteroidDensity: 0, shipClass: "potato", seed: "x".repeat(80) });
  assert.equal(wild.systems, 8);
  assert.equal(wild.planetDensity, 1.8);
  assert.equal(wild.asteroidDensity, 0.4);
  assert.equal(wild.shipClass, "hauler");
  assert.equal(wild.seed.length, 48);
});

test("ship classes trade mining for speed", () => {
  const interceptor = shipClassOf("interceptor");
  const hauler = shipClassOf("hauler");
  const gunship = shipClassOf("gunship");
  const yacht = shipClassOf("yacht");
  assert.ok(hauler.cargo > interceptor.cargo);
  assert.ok(hauler.laserRate > interceptor.laserRate);
  assert.ok(interceptor.speed > hauler.speed);
  assert.ok(interceptor.combat > hauler.combat);
  assert.ok(gunship.cargo > interceptor.cargo && gunship.cargo < hauler.cargo);
  assert.equal(yacht.shipType, 3);
  const iceHauler = mineTick({ mineral: "ice", reserve: 20, hardness: MINERALS.ice.hardness }, 1, {}, hauler.cargo, hauler.laserRate);
  const iceFight = mineTick({ mineral: "ice", reserve: 20, hardness: MINERALS.ice.hardness }, 1, {}, interceptor.cargo, interceptor.laserRate);
  assert.ok(iceHauler.extracted > iceFight.extracted);
  const rock = { mineral: "ice", reserve: 20, hardness: MINERALS.ice.hardness };
  assert.ok(cutRock(rock, 1, 40, hauler.laserRate).extracted > cutRock(rock, 1, 40, interceptor.laserRate).extracted);
  assert.ok(hauler.laserRate > LASER_RATE);
  assert.ok(shipLaserDamage(1, interceptor) > shipLaserDamage(1, hauler));
});

test("density helpers scale counts", () => {
  assert.equal(planetCountFor(1, 4), 4);
  assert.equal(planetCountFor(0.4, 4), 2);
  assert.ok(planetCountFor(1.6, 4) >= 6);
  assert.equal(asteroidCountFor(1, 54), 54);
  assert.equal(hostileCountFor(0, 0), 0);
  assert.ok(hostileCountFor(3, 2) > hostileCountFor(1, 0));
  assert.notEqual(systemSeed(1993, 1), systemSeed(1993, 2));
  assert.match(randomSeedString(() => 0.1), /^[a-z]+-[a-z]+-\d{4}$/);
  assert.equal(Object.keys(SHIP_CLASSES).length, 4);
});
