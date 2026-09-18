import test from "node:test";
import assert from "node:assert/strict";
import {
  CARGO_CAPACITY,
  MINERALS,
  MINERAL_IDS,
  PGM_IDS,
  applyMine,
  applySale,
  cargoMass,
  cargoSpace,
  chipCollected,
  cutRock,
  ejectChipVelocity,
  formatCredits,
  headingVector,
  mineTick,
  mulberry32,
  nearestLaserTarget,
  nearestMiningTarget,
  nearestRayHit,
  nextMissionIndex,
  pickMineralId,
  rayCircleHit,
  rockVisualDrawSize,
  rockVisualRadius,
  resolvePlayCollisions,
  saleValue,
  sellAll,
  stationPrices,
  steerChase,
  tractorStep,
} from "../lib/logic.js";

test("mineral catalog covers common through exotic asteroid ore", () => {
  const rarities = new Set(MINERAL_IDS.map((id) => MINERALS[id].rarity));
  assert.equal(MINERAL_IDS.length >= 16, true);
  assert.ok(rarities.has("common"));
  assert.ok(rarities.has("uncommon"));
  assert.ok(rarities.has("rare"));
  assert.ok(rarities.has("exotic"));
  assert.equal(MINERALS.ice.value < MINERALS.iron.value, true);
  assert.equal(MINERALS.iron.value < MINERALS.titanium.value, true);
  assert.equal(MINERALS.titanium.value < MINERALS.platinum.value, true);
  assert.equal(MINERALS.aetherite.value > MINERALS.helium3.value, true);
  for (const id of MINERAL_IDS) {
    const m = MINERALS[id];
    assert.ok(m.value >= 1);
    assert.ok(m.hardness > 0);
    assert.equal(m.color.startsWith("#"), true);
    assert.equal(m.rgb.length, 3);
  }
});

test("Credits are an integer book at posted tonnes", () => {
  const prices = stationPrices(1);
  assert.equal(prices.ice, 4);
  assert.equal(prices.aetherite, 400);
  assert.equal(saleValue("iron", 12, prices), 96);
  const { credits, sold, cargo } = sellAll({ ice: 8, iron: 2.4 }, prices);
  assert.equal(credits, 32 + 19);
  assert.equal(sold.ice, 8);
  assert.deepEqual(cargo, {});
  assert.equal(formatCredits(1234), "CR 1,234");
});

test("hold mass cannot exceed capacity while mining", () => {
  const rock = { mineral: "ice", reserve: 40, hardness: 0.48 };
  let cargo = { ice: CARGO_CAPACITY - 0.2 };
  assert.ok(cargoMass(cargo) < CARGO_CAPACITY);
  const result = mineTick(rock, 5, cargo, CARGO_CAPACITY, 10);
  assert.equal(result.full || cargoMass(result.cargo) <= CARGO_CAPACITY + 1e-6, true);
  assert.ok(cargoSpace(result.cargo) < 0.21);
});

test("mining rate falls as hardness rises", () => {
  const ice = mineTick({ mineral: "ice", reserve: 20, hardness: MINERALS.ice.hardness }, 1, {});
  const tit = mineTick({ mineral: "titanium", reserve: 20, hardness: MINERALS.titanium.hardness }, 1, {});
  assert.ok(ice.extracted > tit.extracted);
  assert.equal(ice.mineral, "ice");
});

test("seeded belt rolls stay off exotic unless allowed", () => {
  const rand = mulberry32(1993);
  const ids = Array.from({ length: 80 }, () => pickMineralId(rand, { allowExotic: false }));
  assert.equal(ids.includes("aetherite"), false);
  assert.equal(ids.includes("helium3"), false);
  assert.ok(ids.includes("ice") || ids.includes("iron") || ids.includes("silicate"));
});

test("mining laser cone still grabs an off-axis rock", () => {
  const rocks = [{ x: 18, y: -40, radius: 10, reserve: 4, gone: false }];
  const miss = nearestRayHit(0, 0, 0, 150, rocks);
  assert.equal(miss, null);
  const hit = nearestMiningTarget(0, 0, 0, 150, rocks);
  assert.ok(hit);
  assert.equal(hit.index, 0);
});

test("mining laser ray hits the nearest rock in the beam", () => {
  const { x, y } = headingVector(0);
  assert.ok(Math.abs(x) < 1e-9);
  assert.ok(Math.abs(y + 1) < 1e-9);
  const hit = rayCircleHit(0, 0, 0, -1, 100, 0, -40, 8);
  assert.ok(hit);
  assert.ok(hit.t < 40);
  const rocks = [
    { x: 0, y: -80, radius: 10, reserve: 4, gone: false },
    { x: 0, y: -30, radius: 8, reserve: 4, gone: false },
  ];
  const nearest = nearestRayHit(0, 0, 0, 96, rocks);
  assert.equal(nearest.index, 1);
});

test("sale flags advance the linear claim", () => {
  assert.equal(nextMissionIndex({}), 0);
  assert.equal(nextMissionIndex({ minedIce: 8 }), 1);
  let flags = applyMine({}, "ice", 8);
  flags = applySale(flags, { ice: 8 }, 32);
  assert.equal(nextMissionIndex(flags), 2);
  flags = applySale(flags, { iron: 12 }, 96);
  assert.equal(nextMissionIndex(flags), 3);
  flags = { ...flags, lifetimeCredits: 250 };
  assert.equal(nextMissionIndex(flags), 4);
  flags = applyMine(flags, "titanium", 6);
  assert.equal(nextMissionIndex(flags), 5);
  flags = applySale(flags, { platinum: 4 }, 480);
  assert.ok(PGM_IDS.includes("platinum"));
  assert.equal(nextMissionIndex(flags), 6);
  flags = applyMine(flags, "aetherite", 2);
  assert.equal(nextMissionIndex(flags), 7);
  flags.briefedCore = true;
  assert.equal(nextMissionIndex(flags), 8);
});

test("mined rocks shrink collision and draw size together", () => {
  const rock = { baseRadius: 50, baseDrawSize: 128, reserve: 4, maxReserve: 10 };
  assert.equal(rockVisualRadius(rock), 20);
  assert.equal(rockVisualDrawSize(rock), 51.2);
  rock.reserve = 0;
  assert.equal(rockVisualRadius(rock), 50 * 0.28);
  assert.equal(rockVisualDrawSize(rock), 128 * 0.28);
});

test("play-plane collisions are ships and asteroids only", () => {
  const ship = { x: 0, y: 0, radius: 10, vx: 4, vy: 0 };
  const planetHit = resolvePlayCollisions(ship, [], []);
  assert.equal(planetHit.x, 0);
  assert.equal(planetHit.hit, false);
  const rocks = [{ x: 12, y: 0, radius: 8, gone: false }];
  const bumped = resolvePlayCollisions(ship, rocks, []);
  assert.equal(bumped.hit, true);
  assert.ok(Math.abs(bumped.x - rocks[0].x) >= 18 - 1e-6);
  const gone = resolvePlayCollisions(ship, [{ x: 12, y: 0, radius: 8, gone: true }], []);
  assert.equal(gone.hit, false);
});

test("cutting a rock leaves ore for the tractor instead of filling the hold immediately", () => {
  const rock = { mineral: "ice", reserve: 8, hardness: MINERALS.ice.hardness };
  const cut = cutRock(rock, 1, 10);
  assert.ok(cut.extracted > 0);
  assert.ok(cut.rock.reserve < 8);
  assert.equal(cut.mineral, "ice");
  const deposited = mineTick(rock, 1, {});
  assert.ok((deposited.cargo.ice || 0) > 0);
});

test("tractor chips kick off the rock then reel into the ship", () => {
  const kick = ejectChipVelocity(10, 0, 0, 0, () => 0.5);
  assert.ok(kick.vx > 0);
  let chip = { x: 80, y: 0, vx: 0, vy: 0, heading: 0, spin: 1, life: 2 };
  chip = tractorStep(chip, 0, 0, 0.2);
  assert.ok(chip.x < 80);
  assert.equal(chipCollected({ x: 2, y: 0, life: 1 }, 0, 0, 16), true);
  assert.equal(chipCollected({ x: 80, y: 0, life: 1 }, 0, 0, 16), false);
  assert.equal(chipCollected({ x: 80, y: 0, life: 0 }, 0, 0, 16), true);
});

test("mining laser can pick a hostile in the cone", () => {
  const rocks = [{ x: 0, y: -90, radius: 10, reserve: 4, gone: false }];
  const hostiles = [{ x: 0, y: -30, radius: 12, hull: 20, gone: false }];
  const hit = nearestLaserTarget(0, 0, 0, 150, rocks, hostiles);
  assert.equal(hit.kind, "hostile");
  assert.equal(hit.index, 0);
  const chased = steerChase({ x: 0, y: 0, heading: 0 }, 40, 0, 0.2, 3, 50);
  assert.ok(chased.x !== 0 || chased.y !== 0);
});
