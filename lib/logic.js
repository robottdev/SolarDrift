/** Pure simulation helpers shared by the browser game and Node tests. */

export const VERSION = "2.0.0";
export const HELIOS_SEED = 1993;
export const CARGO_CAPACITY = 24;
export const LASER_RANGE = 260;
export const LASER_CONE = 0.62;
export const LASER_RATE = 0.72;
export const STATION_RANGE = 150;
export const STARTING_CREDITS = 18;
export const STARTING_FUEL = 90;
export const STARTING_HULL = 100;

export const MINERALS = {
  ice: {
    id: "ice",
    name: "Water Ice",
    rarity: "common",
    value: 4,
    hardness: 0.48,
    mass: 1,
    weight: 22,
    color: "#7ec8ff",
    rgb: [0.49, 0.78, 1],
    scan: "Volatile ice. Reactor feedstock, life support, and cheap bulk.",
  },
  silicate: {
    id: "silicate",
    name: "Silicates",
    rarity: "common",
    value: 3,
    hardness: 0.72,
    mass: 1,
    weight: 20,
    color: "#9aa3b0",
    rgb: [0.6, 0.64, 0.69],
    scan: "Common rock. Yard ballast. Pays for docking coffee.",
  },
  carbon: {
    id: "carbon",
    name: "Carbonaceous",
    rarity: "common",
    value: 6,
    hardness: 0.62,
    mass: 1,
    weight: 16,
    color: "#5a534c",
    rgb: [0.35, 0.33, 0.3],
    scan: "Organic-rich chondrite. Composites, filters, black-market ink.",
  },
  iron: {
    id: "iron",
    name: "Iron",
    rarity: "common",
    value: 8,
    hardness: 1.0,
    mass: 1,
    weight: 18,
    color: "#c45a3a",
    rgb: [0.77, 0.35, 0.23],
    scan: "Native iron. Hull plate, nails, and every yard's favorite excuse.",
  },
  nickel: {
    id: "nickel",
    name: "Nickel",
    rarity: "uncommon",
    value: 14,
    hardness: 1.12,
    mass: 1,
    weight: 9,
    color: "#c9d0d4",
    rgb: [0.79, 0.82, 0.83],
    scan: "Alloy metal. Makes iron behave. Makes accountants smile.",
  },
  sulfur: {
    id: "sulfur",
    name: "Sulfur",
    rarity: "uncommon",
    value: 11,
    hardness: 0.58,
    mass: 1,
    weight: 8,
    color: "#e4d34a",
    rgb: [0.89, 0.83, 0.29],
    scan: "Yellow volatiles. Chemicals, matches, and one very specific smell.",
  },
  copper: {
    id: "copper",
    name: "Copper",
    rarity: "uncommon",
    value: 18,
    hardness: 0.88,
    mass: 1,
    weight: 8,
    color: "#d4843a",
    rgb: [0.83, 0.52, 0.23],
    scan: "Conductor. The Anchorage pays extra when the lights flicker.",
  },
  magnesium: {
    id: "magnesium",
    name: "Magnesium",
    rarity: "uncommon",
    value: 16,
    hardness: 0.8,
    mass: 1,
    weight: 7,
    color: "#e8e4d8",
    rgb: [0.91, 0.89, 0.85],
    scan: "Light structural metal. Burns if you ask it to. Do not ask it to.",
  },
  aluminum: {
    id: "aluminum",
    name: "Aluminum",
    rarity: "uncommon",
    value: 15,
    hardness: 0.78,
    mass: 1,
    weight: 7,
    color: "#b8c4cc",
    rgb: [0.72, 0.77, 0.8],
    scan: "Airframe stock. Soft, useful, everywhere once you start looking.",
  },
  titanium: {
    id: "titanium",
    name: "Titanium",
    rarity: "uncommon",
    value: 32,
    hardness: 1.42,
    mass: 1,
    weight: 6,
    color: "#8aa0b8",
    rgb: [0.54, 0.63, 0.72],
    scan: "Hard rock. Armor, struts, and the reason your laser complains.",
  },
  gold: {
    id: "gold",
    name: "Gold",
    rarity: "rare",
    value: 90,
    hardness: 1.18,
    mass: 1,
    weight: 2.4,
    color: "#f0c14a",
    rgb: [0.94, 0.76, 0.29],
    scan: "Contacts and vanity. The assay office likes both.",
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    rarity: "rare",
    value: 120,
    hardness: 1.52,
    mass: 1,
    weight: 2.1,
    color: "#dfe6ee",
    rgb: [0.87, 0.9, 0.93],
    scan: "Catalyst metal. Fuel cells, jump hardware, and serious invoices.",
  },
  palladium: {
    id: "palladium",
    name: "Palladium",
    rarity: "rare",
    value: 110,
    hardness: 1.48,
    mass: 1,
    weight: 1.8,
    color: "#c5d0dc",
    rgb: [0.77, 0.82, 0.86],
    scan: "Sister to platinum. The assay treats them as a family.",
  },
  iridium: {
    id: "iridium",
    name: "Iridium",
    rarity: "rare",
    value: 150,
    hardness: 1.7,
    mass: 1,
    weight: 1.4,
    color: "#9eb0c8",
    rgb: [0.62, 0.69, 0.78],
    scan: "Impact-slick superalloy. Dense, rude, expensive.",
  },
  rare_earth: {
    id: "rare_earth",
    name: "Lanthanides",
    rarity: "rare",
    value: 95,
    hardness: 1.32,
    mass: 1,
    weight: 1.9,
    color: "#5cff9a",
    rgb: [0.36, 1, 0.6],
    scan: "Magnet feedstock. Sensors, coils, and PIP's favorite toys.",
  },
  helium3: {
    id: "helium3",
    name: "Helium-3",
    rarity: "exotic",
    value: 220,
    hardness: 0.42,
    mass: 1,
    weight: 0.6,
    color: "#b8fff0",
    rgb: [0.72, 1, 0.94],
    scan: "Fusion ice. Outer-belt prize. Do not sneeze near the hold.",
  },
  aetherite: {
    id: "aetherite",
    name: "Aetherite",
    rarity: "exotic",
    value: 400,
    hardness: 1.85,
    mass: 1,
    weight: 0,
    color: "#e56bff",
    rgb: [0.9, 0.42, 1],
    scan: "Unlisted crystal. Sings in jump-band. The assay will not name it on paper.",
  },
};

export const MINERAL_IDS = Object.keys(MINERALS);
export const PGM_IDS = ["gold", "platinum", "palladium", "iridium"];

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function headingVector(heading) {
  return { x: Math.sin(heading), y: -Math.cos(heading) };
}

export function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function shortestAngle(from, to) {
  return wrapAngle(to - from);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(bx - ax, ay - by);
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(rand, ids, weights) {
  let sum = 0;
  for (const w of weights) sum += w;
  let roll = rand() * sum;
  for (let i = 0; i < ids.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

export function pickMineralId(rand, { allowExotic = false, forceId = null } = {}) {
  if (forceId && MINERALS[forceId]) return forceId;
  const pool = MINERAL_IDS.filter((id) => allowExotic || MINERALS[id].rarity !== "exotic");
  const weights = pool.map((id) => MINERALS[id].weight);
  return pickWeighted(rand, pool, weights);
}

export function cargoMass(cargo) {
  let mass = 0;
  for (const [id, amount] of Object.entries(cargo || {})) {
    const spec = MINERALS[id];
    if (!spec || amount <= 0) continue;
    mass += amount * spec.mass;
  }
  return mass;
}

export function cargoSpace(cargo, capacity = CARGO_CAPACITY) {
  return Math.max(0, capacity - cargoMass(cargo));
}

export function stationPrices(multiplier = 1) {
  const table = {};
  for (const id of MINERAL_IDS) {
    table[id] = Math.max(1, Math.round(MINERALS[id].value * multiplier));
  }
  return table;
}

export function saleValue(mineralId, amount, priceTable) {
  const price = priceTable?.[mineralId] ?? MINERALS[mineralId]?.value ?? 0;
  return Math.floor(price * Math.max(0, amount));
}

export function sellAll(cargo, priceTable) {
  const sold = {};
  let credits = 0;
  for (const [id, amount] of Object.entries(cargo || {})) {
    if (amount <= 0) continue;
    sold[id] = amount;
    credits += saleValue(id, amount, priceTable);
  }
  return { credits, sold, cargo: {} };
}

export function pgmAmount(cargoOrSold) {
  let n = 0;
  for (const id of PGM_IDS) n += cargoOrSold[id] || 0;
  return n;
}

export function applySale(flags, sold, creditsGained) {
  return {
    ...flags,
    soldOnce: true,
    lifetimeCredits: (flags.lifetimeCredits || 0) + creditsGained,
    soldIron: (flags.soldIron || 0) + (sold.iron || 0),
    soldPgm: (flags.soldPgm || 0) + pgmAmount(sold),
    soldAetherite: (flags.soldAetherite || 0) + (sold.aetherite || 0),
  };
}

export function applyMine(flags, mineral, amount) {
  if (!mineral || amount <= 0) return { ...flags };
  const next = { ...flags };
  if (mineral === "ice") next.minedIce = (next.minedIce || 0) + amount;
  if (mineral === "titanium") next.minedTitanium = (next.minedTitanium || 0) + amount;
  if (mineral === "aetherite") next.minedAetherite = (next.minedAetherite || 0) + amount;
  return next;
}

export function mineTick(rock, dt, cargo, capacity = CARGO_CAPACITY, laserRate = LASER_RATE) {
  if (!rock || rock.reserve <= 0) {
    return { cargo, rock, extracted: 0, mineral: rock?.mineral || null, full: false };
  }
  const space = cargoSpace(cargo, capacity);
  if (space <= 1e-6) {
    return { cargo, rock, extracted: 0, mineral: rock.mineral, full: true };
  }
  const hardness = Math.max(0.35, rock.hardness || MINERALS[rock.mineral]?.hardness || 1);
  const rate = laserRate / hardness;
  const take = Math.min(rock.reserve, space, rate * dt);
  const nextCargo = { ...cargo, [rock.mineral]: (cargo[rock.mineral] || 0) + take };
  const nextRock = { ...rock, reserve: Math.max(0, rock.reserve - take) };
  if (nextRock.reserve <= 0.001) nextRock.reserve = 0;
  return { cargo: nextCargo, rock: nextRock, extracted: take, mineral: rock.mineral, full: false };
}

export function rayCircleHit(ox, oy, dx, dy, maxLen, cx, cy, radius) {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t1 = (-b - s) / 2;
  const t2 = (-b + s) / 2;
  let t = Infinity;
  if (t1 >= 0 && t1 <= maxLen) t = t1;
  else if (t2 >= 0 && t2 <= maxLen) t = t2;
  if (t === Infinity) return null;
  return { t, x: ox + dx * t, y: oy + dy * t };
}

export function nearestRayHit(ox, oy, heading, maxLen, rocks) {
  const { x: dx, y: dy } = headingVector(heading);
  let best = null;
  for (let i = 0; i < rocks.length; i++) {
    const rock = rocks[i];
    if (!rock || rock.gone || rock.reserve <= 0) continue;
    const hit = rayCircleHit(ox, oy, dx, dy, maxLen, rock.x, rock.y, rock.radius);
    if (!hit) continue;
    if (!best || hit.t < best.t) best = { ...hit, index: i, rock };
  }
  return best;
}

export function nearestMiningTarget(ox, oy, heading, maxLen, rocks, cone = LASER_CONE) {
  const ray = nearestRayHit(ox, oy, heading, maxLen, rocks);
  if (ray) return ray;
  let best = null;
  for (let i = 0; i < rocks.length; i++) {
    const rock = rocks[i];
    if (!rock || rock.gone || rock.reserve <= 0) continue;
    const dx = rock.x - ox;
    const dy = rock.y - oy;
    const d = Math.hypot(dx, dy);
    if (d > maxLen + rock.radius) continue;
    const ang = Math.atan2(dx, -dy);
    if (Math.abs(shortestAngle(heading, ang)) > cone) continue;
    const t = Math.max(0, d - rock.radius);
    if (!best || t < best.t) {
      const nx = dx / (d || 1);
      const ny = dy / (d || 1);
      const reach = Math.min(d, maxLen);
      best = { t, x: ox + nx * reach, y: oy + ny * reach, index: i, rock };
    }
  }
  return best;
}

export function rockVisualScale(rock) {
  const max = rock.maxReserve || rock.reserve || 1;
  return clamp(rock.reserve / max, 0.28, 1);
}

export function rockVisualRadius(rock) {
  return rock.baseRadius * rockVisualScale(rock);
}

export function rockVisualDrawSize(rock) {
  return (rock.baseDrawSize || rock.drawSize || rock.baseRadius * 2) * rockVisualScale(rock);
}

export function formatCredits(n) {
  return `CR ${Math.floor(n).toLocaleString("en-US")}`;
}

export function formatTonnes(n) {
  if (n >= 10) return `${n.toFixed(0)}t`;
  return `${n.toFixed(1)}t`;
}

export function nextMissionIndex(flags) {
  const f = flags || {};
  if ((f.minedIce || 0) < 8) return 0;
  if (!f.soldOnce) return 1;
  if ((f.soldIron || 0) < 12) return 2;
  if ((f.lifetimeCredits || 0) < 250) return 3;
  if ((f.minedTitanium || 0) < 6) return 4;
  if ((f.soldPgm || 0) < 4) return 5;
  if ((f.minedAetherite || 0) < 2) return 6;
  if (!f.briefedCore) return 7;
  return 8;
}

export function moonWorldPos(planet, moon) {
  return {
    x: planet.x + Math.cos(moon.phase) * moon.orbitRadius,
    y: planet.y + Math.sin(moon.phase) * moon.orbitRadius,
  };
}

export function stationWorldPos(station, planets) {
  const host = planets[station.parent] || planets[0];
  return {
    x: host.x + Math.cos(station.phase) * station.orbitRadius,
    y: host.y + Math.sin(station.phase) * station.orbitRadius,
  };
}
