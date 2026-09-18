/** New-game world settings. Pure helpers shared by the generator, UI, and tests. */

import { clamp, CARGO_CAPACITY, LASER_RATE, STARTING_CREDITS, STARTING_FUEL, STARTING_HULL } from "./logic.js";

export const SETTING_LIMITS = {
  systems: { min: 1, max: 8 },
  hostileDensity: { min: 0, max: 3 },
  startingCredits: { min: 0, max: 400 },
  planetDensity: { min: 0.4, max: 1.8 },
  asteroidDensity: { min: 0.4, max: 1.8 },
  startingFuel: { min: 30, max: 160 },
};

export const SHIP_CLASSES = {
  interceptor: {
    id: "interceptor",
    name: "Interceptor",
    shipType: 0,
    cargo: 10,
    laserRate: 0.42,
    accel: 220,
    speed: 195,
    boostSpeed: 280,
    hull: 72,
    radius: 14,
    drawSize: 42,
    turn: 3.45,
    fuel: 80,
    fuelUse: 5.4,
    combat: 1.4,
    blurb: "A fighter that can mine. The cutter is a sidearm, the hold is a glovebox, and nothing in the belt outruns you.",
  },
  gunship: {
    id: "gunship",
    name: "Gunship",
    shipType: 1,
    cargo: 16,
    laserRate: 0.58,
    accel: 170,
    speed: 150,
    boostSpeed: 230,
    hull: 96,
    radius: 16,
    drawSize: 46,
    turn: 2.85,
    fuel: 90,
    fuelUse: 4.5,
    combat: 1.15,
    blurb: "Patrol hull. Decent cutter, decent guns, a hold that is not embarrassed. The compromise everyone pretends they wanted.",
  },
  hauler: {
    id: "hauler",
    name: "Hauler",
    shipType: 2,
    cargo: CARGO_CAPACITY,
    laserRate: LASER_RATE * 1.28,
    accel: 120,
    speed: 108,
    boostSpeed: 175,
    hull: STARTING_HULL + 12,
    radius: 18,
    drawSize: 48,
    turn: 2.2,
    fuel: 110,
    fuelUse: 3.4,
    combat: 0.72,
    blurb: "Ore mule. Best mining laser and the biggest hold. Turns like a rumor and fights like a filing cabinet.",
  },
  yacht: {
    id: "yacht",
    name: "Yacht",
    shipType: 3,
    cargo: 14,
    laserRate: 0.5,
    accel: 180,
    speed: 160,
    boostSpeed: 240,
    hull: 84,
    radius: 16,
    drawSize: 46,
    turn: 3.05,
    fuel: 100,
    fuelUse: 3.8,
    combat: 0.9,
    blurb: "Saucer runabout. Nimble, pretty, and a mediocre miner. Bring friends or bring patience.",
  },
};

export const DEFAULT_SETTINGS = {
  seed: "Helios",
  systems: 3,
  hostileDensity: 1,
  startingCredits: STARTING_CREDITS,
  shipClass: "hauler",
  planetDensity: 1,
  asteroidDensity: 1,
  startingFuel: STARTING_FUEL,
};

const SEED_A = ["ember", "keel", "nys", "drift", "ash", "vesper", "cinder", "bruise", "ghost", "picket", "sable", "orison"];
const SEED_B = ["lane", "claim", "haul", "rift", "veil", "core", "yard", "belt", "gate", "wake"];

/** FNV-1a. Digit-only strings that fit in uint32 keep their numeric value so "1993" remakes Helios. */
export function hashSeed(value) {
  const s = String(value ?? "").trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && n <= 0xffffffff) return n >>> 0;
  }
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randomSeedString(rand = Math.random) {
  const a = SEED_A[Math.floor(rand() * SEED_A.length) % SEED_A.length];
  const b = SEED_B[Math.floor(rand() * SEED_B.length) % SEED_B.length];
  const n = 1000 + Math.floor(rand() * 9000);
  return `${a}-${b}-${n}`;
}

export function shipClassOf(settingsOrId) {
  const id = typeof settingsOrId === "string" ? settingsOrId : settingsOrId?.shipClass;
  return SHIP_CLASSES[id] || SHIP_CLASSES.hauler;
}

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clampSettings(raw = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const ship = SHIP_CLASSES[src.shipClass] ? src.shipClass : DEFAULT_SETTINGS.shipClass;
  const seed = String(src.seed ?? DEFAULT_SETTINGS.seed).trim() || DEFAULT_SETTINGS.seed;
  return {
    seed: seed.slice(0, 48),
    systems: Math.round(clamp(num(src.systems, DEFAULT_SETTINGS.systems), SETTING_LIMITS.systems.min, SETTING_LIMITS.systems.max)),
    hostileDensity: clamp(num(src.hostileDensity, DEFAULT_SETTINGS.hostileDensity), SETTING_LIMITS.hostileDensity.min, SETTING_LIMITS.hostileDensity.max),
    startingCredits: Math.round(clamp(num(src.startingCredits, DEFAULT_SETTINGS.startingCredits), SETTING_LIMITS.startingCredits.min, SETTING_LIMITS.startingCredits.max)),
    shipClass: ship,
    planetDensity: clamp(num(src.planetDensity, DEFAULT_SETTINGS.planetDensity), SETTING_LIMITS.planetDensity.min, SETTING_LIMITS.planetDensity.max),
    asteroidDensity: clamp(num(src.asteroidDensity, DEFAULT_SETTINGS.asteroidDensity), SETTING_LIMITS.asteroidDensity.min, SETTING_LIMITS.asteroidDensity.max),
    startingFuel: Math.round(clamp(num(src.startingFuel, DEFAULT_SETTINGS.startingFuel), SETTING_LIMITS.startingFuel.min, SETTING_LIMITS.startingFuel.max)),
  };
}

export function systemSeed(numericSeed, index) {
  return (Math.imul((numericSeed >>> 0) + 1, 0x9e3779b1) + Math.imul(index + 1, 10007)) >>> 0;
}

export function planetCountFor(density, base = 4) {
  return Math.round(clamp(base * density, 2, 7));
}

export function asteroidCountFor(density, base = 54) {
  return Math.round(clamp(base * density, 16, 96));
}

export function hostileCountFor(density, systemIndex = 0) {
  if (density <= 0) return 0;
  return Math.round(density * (2.2 + systemIndex * 0.6));
}

export function shipLaserDamage(dt, ship = SHIP_CLASSES.hauler) {
  return (0.55 + (ship.laserRate || LASER_RATE)) * (ship.combat || 1) * 26 * dt;
}
