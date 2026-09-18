import { Color } from "../stellar/js/core.js";
import { generatePlanet, generateSun, generateMoon, generateAsteroid, generateBackground, generateBlackhole, PlanetType, SUN_DISK_RATIO } from "../stellar/js/celestial.js";
import { generateShip, generateStation } from "../stellar/js/craft.js";
import {
  BODY_GAP,
  HELIOS_SEED,
  MINERALS,
  MINERAL_IDS,
  mulberry32,
  pickMineralId,
  placeClearOf,
  spriteRadius,
} from "../../lib/logic.js";
import {
  DEFAULT_SETTINGS,
  asteroidCountFor,
  clampSettings,
  hashSeed,
  hostileCountFor,
  planetCountFor,
  shipClassOf,
  systemSeed,
} from "../../lib/settings.js";

function packTexture(tex) {
  return { width: tex.width, height: tex.height, pixels: tex.toRgbaBytes() };
}

function colorFromRgb(rgb, a = 1) {
  return new Color(rgb[0], rgb[1], rgb[2], a);
}

function rockPalette(shade) {
  return [
    new Color(0.32 + shade, 0.31 + shade, 0.3 + shade),
    new Color(0.5 + shade, 0.49 + shade, 0.46 + shade),
    new Color(0.68 + shade, 0.66 + shade, 0.62 + shade),
  ];
}

/** Native texture sizes. Sprites are drawn at this size × zoom, never upscaled. */
const TEX = {
  sun: 512,
  terrestrial: 256,
  gas: 320,
  moon: 160,
  asteroid: 128,
  background: 512,
  wormhole: 256,
};

const PLANET_DISK = 0.42;
const ASTEROID_DISK = 0.4;
const STATION_DRAW = 160;
const WORMHOLE_DRAW = 256;

const PLANET_SPECS = [
  {
    id: "cinder",
    name: "Cinder",
    kind: "terrestrial",
    dist: 1500,
    ang: 0.55,
    seed: 1101,
    colors: [
      new Color(0.62, 0.28, 0.16, 1),
      new Color(0.78, 0.42, 0.18, 1),
      new Color(0.35, 0.2, 0.14, 1),
    ],
    moons: [{ name: "Cinder-b", seed: 1110, orbitSpeed: 0.55, phase: 1.2 }],
  },
  {
    id: "drift",
    name: "Drift",
    kind: "terrestrial",
    dist: 2700,
    ang: 2.15,
    seed: 2202,
    colors: [
      new Color(0.18, 0.38, 0.72, 1),
      new Color(0.22, 0.55, 0.32, 1),
      new Color(0.7, 0.62, 0.4, 1),
    ],
    moons: [{ name: "Parking Rock", seed: 2210, orbitSpeed: 0.42, phase: 4.1 }],
  },
  {
    id: "bruise",
    name: "Bruise",
    kind: "gas",
    dist: 4900,
    ang: 4.05,
    seed: 3303,
    colors: [
      new Color(0.55, 0.28, 0.72, 1),
      new Color(0.82, 0.45, 0.22, 1),
      new Color(0.95, 0.82, 0.55, 1),
    ],
    moons: [
      { name: "Bruise-b", seed: 3310, orbitSpeed: 0.32, phase: 0.4 },
      { name: "Bruise-c", seed: 3320, orbitSpeed: 0.24, phase: 2.7 },
    ],
  },
  {
    id: "nys",
    name: "Nys",
    kind: "terrestrial",
    dist: 6400,
    ang: 5.35,
    seed: 4404,
    colors: [
      new Color(0.55, 0.78, 0.9, 1),
      new Color(0.72, 0.82, 0.88, 1),
      new Color(0.3, 0.45, 0.55, 1),
    ],
    moons: [],
  },
];

const SYSTEM_NAMES = ["Helios", "Nyx", "Vesper", "Keel", "Ashen", "Picket", "Sable", "Orison"];
const REMOTE_PLANET_NAMES = ["Kite", "Marrow", "Quill", "Hearth", "Vellum", "Rook", "Dusk", "Iota", "Calder", "Wren"];
const STAR_COLORS = [
  new Color(1, 0.9, 0.52, 1),
  new Color(0.55, 0.72, 1, 1),
  new Color(1, 0.55, 0.32, 1),
  new Color(1, 0.78, 0.82, 1),
  new Color(0.72, 1, 0.85, 1),
];

function extraPlanetSpec(seed, extra, index) {
  const kind = extra % 2 === 0 ? "gas" : "terrestrial";
  const palettes = [
    [new Color(0.42, 0.2, 0.16, 1), new Color(0.78, 0.48, 0.22, 1), new Color(0.22, 0.14, 0.12, 1)],
    [new Color(0.2, 0.48, 0.42, 1), new Color(0.35, 0.7, 0.55, 1), new Color(0.12, 0.22, 0.28, 1)],
    [new Color(0.45, 0.32, 0.7, 1), new Color(0.7, 0.55, 0.85, 1), new Color(0.18, 0.14, 0.32, 1)],
  ];
  const moonCount = kind === "gas" ? 2 : extra % 3 === 0 ? 1 : 0;
  const moons = [];
  for (let i = 0; i < moonCount; i++) {
    moons.push({
      name: `${REMOTE_PLANET_NAMES[index % REMOTE_PLANET_NAMES.length]}-${String.fromCharCode(98 + i)}`,
      seed: seed + 9000 + extra * 40 + i * 11,
      orbitSpeed: 0.28 + i * 0.08,
      phase: extra * 0.7 + i * 1.4,
    });
  }
  return {
    id: `world-${index}`,
    name: REMOTE_PLANET_NAMES[index % REMOTE_PLANET_NAMES.length],
    kind,
    dist: 1500 + index * 1400,
    ang: (index * 1.7 + extra * 0.4) % (Math.PI * 2),
    seed: seed + 5000 + extra * 97,
    colors: palettes[extra % palettes.length],
    moons,
  };
}

function heliosPlanetSpecs(density) {
  const want = planetCountFor(density, 4);
  const byId = Object.fromEntries(PLANET_SPECS.map((s) => [s.id, s]));
  let specs;
  if (want <= 2) specs = [byId.cinder, byId.drift];
  else if (want === 3) specs = [byId.cinder, byId.drift, byId.bruise];
  else specs = PLANET_SPECS.slice();
  let extra = 0;
  while (specs.length < want) {
    extra += 1;
    specs.push(extraPlanetSpec(HELIOS_SEED + extra * 13, extra, specs.length));
  }
  return specs;
}

function remotePlanetSpecs(seed, density, rand) {
  const want = planetCountFor(density, 3);
  const specs = [];
  for (let i = 0; i < want; i++) {
    const kind = rand() > 0.62 ? "gas" : "terrestrial";
    const palettes = STAR_COLORS.map((c) => [
      new Color(c.r * 0.5, c.g * 0.35, c.b * 0.4, 1),
      new Color(0.25 + rand() * 0.5, 0.22 + rand() * 0.5, 0.2 + rand() * 0.5, 1),
      new Color(0.15 + rand() * 0.25, 0.14 + rand() * 0.25, 0.16 + rand() * 0.25, 1),
    ]);
    const moons = [];
    const moonCount = kind === "gas" ? 1 + (rand() > 0.5 ? 1 : 0) : rand() > 0.55 ? 1 : 0;
    for (let m = 0; m < moonCount; m++) {
      moons.push({
        name: `${REMOTE_PLANET_NAMES[(i + m + 2) % REMOTE_PLANET_NAMES.length]}-m${m + 1}`,
        seed: seed + 300 + i * 20 + m,
        orbitSpeed: 0.22 + rand() * 0.35,
        phase: rand() * Math.PI * 2,
      });
    }
    specs.push({
      id: `p${i}`,
      name: REMOTE_PLANET_NAMES[(seed + i) % REMOTE_PLANET_NAMES.length],
      kind,
      dist: 1400 + i * (1200 + rand() * 400),
      ang: rand() * Math.PI * 2,
      seed: seed + 80 + i * 17,
      colors: palettes[i % palettes.length],
      moons,
    });
  }
  return specs;
}

function buildPlanets(specs, rand, push, lightAngle) {
  return specs.map((spec) => {
    const terrestrial = spec.kind === "terrestrial";
    const texSize = terrestrial ? TEX.terrestrial : TEX.gas;
    const tex = generatePlanet({
      seed: spec.seed,
      size: texSize,
      colors: spec.colors,
      planetType: terrestrial ? PlanetType.Terrestrial : PlanetType.Gas_Giant,
      oceans: terrestrial,
      clouds: terrestrial,
      cloudDensity: 0.4,
      cloudTransparency: 0.38,
      atmosphere: true,
      city: spec.id === "drift",
      cityDensity: 0.93,
      lightAngle,
      oceanColor: spec.colors[0],
    });
    const moonVis = TEX.moon * 0.5;
    const planetVis = texSize * 0.5;
    let nextOrbit = planetVis + moonVis + BODY_GAP;
    const moons = spec.moons.map((m) => {
      const mTex = generateMoon({
        seed: m.seed,
        size: TEX.moon,
        roughness: 0.45 + rand() * 0.3,
        colors: [
          new Color(0.4, 0.4, 0.4),
          new Color(0.62, 0.62, 0.6),
          new Color(0.78, 0.76, 0.72),
        ],
        lightAngle,
      });
      const orbitRadius = nextOrbit;
      nextOrbit += moonVis * 2 + BODY_GAP;
      return {
        ...m,
        orbitRadius,
        spriteIndex: push(mTex),
        drawSize: TEX.moon,
        radius: TEX.moon * PLANET_DISK,
      };
    });
    return {
      id: spec.id,
      name: spec.name,
      kind: spec.kind,
      drawSize: texSize,
      radius: texSize * PLANET_DISK,
      x: Math.cos(spec.ang) * spec.dist,
      y: Math.sin(spec.ang) * spec.dist,
      spriteIndex: push(tex),
      moons,
    };
  });
}

function makeMineralSprites(seed, push) {
  const mineralSprites = {};
  for (const id of MINERAL_IDS) {
    const spec = MINERALS[id];
    const shade = (id.charCodeAt(0) % 5) * 0.02;
    const tex = generateAsteroid({
      seed: seed + 800 + id.length * 17 + id.charCodeAt(0) * 13,
      size: TEX.asteroid,
      colors: rockPalette(shade),
      minerals: true,
      mineralColor: colorFromRgb(spec.rgb),
      lightAngle: 180,
    });
    mineralSprites[id] = push(tex);
  }
  return mineralSprites;
}

function worldRadiusOf(sun, planets) {
  let worldRadius = sun.drawSize * 0.5 + 500;
  for (const p of planets) worldRadius = Math.max(worldRadius, Math.hypot(p.x, p.y) + p.drawSize * 0.5 + 400);
  return worldRadius;
}

function occupancyFrom(sun, planets, station, rocks = []) {
  const occupancy = [{ id: "sun", x: 0, y: 0, r: spriteRadius(sun) }];
  for (const p of planets) {
    occupancy.push({ id: p.id, x: p.x, y: p.y, r: spriteRadius(p) });
    for (const m of p.moons) {
      occupancy.push({ id: m.name, x: p.x, y: p.y, r: spriteRadius(m), orbit: m.orbitRadius });
    }
  }
  if (station) {
    const host = planets[station.parent] || planets[0];
    occupancy.push({
      id: "station",
      x: host.x,
      y: host.y,
      r: spriteRadius(station),
      orbit: station.orbitRadius,
    });
  }
  for (const rock of rocks) occupancy.push({ id: rock.id, x: rock.x, y: rock.y, r: spriteRadius(rock) });
  return occupancy;
}

function generateHeliosLayout({ seed, push, settings }) {
  const rand = mulberry32(seed);
  const lightAngle = 180;
  const starColor = new Color(1, 0.9, 0.52, 1);
  const sun = {
    name: "Helios",
    spriteIndex: push(generateSun({ seed, size: TEX.sun, mainColor: starColor })),
    drawSize: TEX.sun,
    radius: TEX.sun * SUN_DISK_RATIO,
    color: { r: starColor.r, g: starColor.g, b: starColor.b },
  };

  const bgTex = generateBackground({
    seed: seed + 19,
    width: TEX.background,
    height: TEX.background,
    frequency: 0.02,
    lacunarity: 2.1,
    persistence: 0.48,
    octaves: 4,
    starCount: 180,
    tint: new Color(0.18, 0.22, 0.48, 1),
    brightness: 0.44,
  });
  const background = { spriteIndex: push(bgTex), width: TEX.background, height: TEX.background };

  const planets = buildPlanets(heliosPlanetSpecs(settings.planetDensity), rand, push, lightAngle);
  const mineralSprites = makeMineralSprites(seed, push);

  const drift = planets.find((p) => p.id === "drift") || planets[1];
  const stationTex = generateStation({
    seed: seed + 50,
    colors: [new Color(0.55, 0.58, 0.62, 1), new Color(0.35, 0.78, 0.92, 1)],
    colorDetail: 0.04,
    numberOfPods: 7,
  }).texture;
  const stationVis = STATION_DRAW * 0.5;
  const outerMoon = drift.moons.reduce((best, m) => (!best || m.orbitRadius > best.orbitRadius ? m : best), null);
  const stationOrbit = Math.max(
    spriteRadius(drift) + stationVis + BODY_GAP,
    outerMoon ? outerMoon.orbitRadius + spriteRadius(outerMoon) + stationVis + BODY_GAP : 0
  );
  const station = {
    name: "Helios Anchorage",
    spriteIndex: push(stationTex),
    drawSize: STATION_DRAW,
    radius: stationVis,
    parent: planets.indexOf(drift),
    orbitRadius: stationOrbit,
    orbitSpeed: 0.22,
    phase: 1.15,
  };

  const occupancy = occupancyFrom(sun, planets, station);
  const beltInner = 3300;
  const beltOuter = 4400;
  const rocks = [];
  const rockCount = asteroidCountFor(settings.asteroidDensity, 54);

  function commitRock(rock) {
    rocks.push(rock);
    occupancy.push({ id: rock.id, x: rock.x, y: rock.y, r: spriteRadius(rock) });
  }

  function tryPlaceRock(partial, pick, tries = 160) {
    const pos = placeClearOf(rand, spriteRadius(partial), occupancy, pick, tries);
    if (!pos) return false;
    commitRock({ ...partial, x: pos.x, y: pos.y });
    return true;
  }

  for (let i = 0; i < rockCount; i++) {
    const outer = i / rockCount > 0.72;
    const mineral = pickMineralId(rand, { allowExotic: outer && rand() < 0.12 });
    const spec = MINERALS[mineral];
    const drawSize = TEX.asteroid * (0.78 + rand() * 0.22);
    const baseRadius = drawSize * ASTEROID_DISK;
    const reserve = 6 + rand() * 16 + (spec.rarity === "rare" ? 4 : 0);
    tryPlaceRock(
      {
        id: `rock-${i}`,
        mineral,
        heading: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 0.7,
        baseDrawSize: drawSize,
        drawSize,
        baseRadius,
        radius: baseRadius,
        reserve,
        maxReserve: reserve,
        hardness: spec.hardness,
        spriteIndex: mineralSprites[mineral],
        story: false,
        gone: false,
      },
      () => {
        const rad = beltInner + rand() * (beltOuter - beltInner);
        const ang = rand() * Math.PI * 2;
        return { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad };
      }
    );
  }

  const aether = MINERALS.aetherite;
  const ghostDraw = TEX.asteroid;
  const ghostPartial = {
    id: "ghost-vein",
    mineral: "aetherite",
    heading: 0.2,
    spin: 0.18,
    baseDrawSize: ghostDraw,
    drawSize: ghostDraw,
    baseRadius: ghostDraw * ASTEROID_DISK,
    radius: ghostDraw * ASTEROID_DISK,
    reserve: 5.5,
    maxReserve: 5.5,
    hardness: aether.hardness,
    spriteIndex: mineralSprites.aetherite,
    story: true,
    gone: false,
  };
  const ghostAng = 5.05;
  const ghostRad = 4280;
  const ghostPlaced = tryPlaceRock(
    ghostPartial,
    (r, i) => {
      if (i === 0) return { x: Math.cos(ghostAng) * ghostRad, y: Math.sin(ghostAng) * ghostRad };
      const rad = beltInner + r() * (beltOuter + 800 - beltInner);
      const ang = r() * Math.PI * 2;
      return { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad };
    },
    320
  );
  if (!ghostPlaced) {
    tryPlaceRock(ghostPartial, (r) => {
      const ang = r() * Math.PI * 2;
      const rad = 5200 + r() * 400;
      return { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad };
    }, 80);
  }

  const iceHeading = station.phase;
  const iceFieldDist = station.orbitRadius + spriteRadius(station) + BODY_GAP + 260;
  const iceCenter = {
    x: drift.x + Math.cos(iceHeading) * iceFieldDist,
    y: drift.y + Math.sin(iceHeading) * iceFieldDist,
  };

  const iceCount = Math.round(8 * clampRange(settings.asteroidDensity, 0.5, 1.4));
  for (let i = 0; i < iceCount; i++) {
    const ice = MINERALS.ice;
    const drawSize = TEX.asteroid * (0.82 + (i % 3) * 0.06);
    const partial = {
      id: `local-ice-${i}`,
      mineral: "ice",
      heading: (i / iceCount) * Math.PI * 2,
      spin: i % 2 ? 0.35 : -0.28,
      baseDrawSize: drawSize,
      drawSize,
      baseRadius: drawSize * ASTEROID_DISK,
      radius: drawSize * ASTEROID_DISK,
      reserve: 8 + i * 0.4,
      maxReserve: 8 + i * 0.4,
      hardness: ice.hardness,
      spriteIndex: mineralSprites.ice,
      story: false,
      gone: false,
    };
    tryPlaceRock(partial, (r) => {
      const ang = r() * Math.PI * 2;
      const rad = 70 + r() * 140;
      return { x: iceCenter.x + Math.cos(ang) * rad, y: iceCenter.y + Math.sin(ang) * rad };
    }, 200);
  }

  const spawn = placeClearOf(
    rand,
    18,
    occupancy,
    (r) => {
      const ang = r() * Math.PI * 2;
      const rad = 30 + r() * 110;
      return { x: iceCenter.x + Math.cos(ang) * rad, y: iceCenter.y + Math.sin(ang) * rad };
    },
    100,
    12
  ) || iceCenter;
  occupancy.push({ id: "spawn", x: spawn.x, y: spawn.y, r: 18 });

  const npcs = [];
  const hostiles = [];
  return {
    index: 0,
    id: "helios",
    starName: "Helios",
    worldRadius: worldRadiusOf(sun, planets),
    background,
    sun,
    planets,
    station,
    rocks,
    npcs,
    hostiles,
    wormholes: [],
    mineralSprites,
    spawn,
    playerHeading: 0.15,
    occupancy,
    rand,
    iceCenter,
    drift,
  };
}

function clampRange(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function placeNpc(rand, occupancy, name, spriteIndex, drawSize, radius, near, extra = {}) {
  const halo = occupancy
    .filter((b) => Math.hypot(b.x - near.x, b.y - near.y) < 1)
    .reduce((m, b) => Math.max(m, (b.orbit || 0) + b.r), spriteRadius(near));
  const pos =
    placeClearOf(
      rand,
      drawSize * 0.5,
      occupancy,
      (r) => {
        const ang = r() * Math.PI * 2;
        const rad = halo + BODY_GAP + 40 + r() * 220;
        return { x: near.x + Math.cos(ang) * rad, y: near.y + Math.sin(ang) * rad };
      },
      80
    ) || {
      x: near.x + halo + BODY_GAP + 80,
      y: near.y,
    };
  occupancy.push({ id: name, x: pos.x, y: pos.y, r: drawSize * 0.5 });
  return {
    name,
    spriteIndex,
    drawSize,
    radius,
    x: pos.x,
    y: pos.y,
    heading: rand() * Math.PI * 2,
    speed: extra.speed ?? (name.startsWith("Patrol") || extra.hostile ? 28 : 22),
    hostile: Boolean(extra.hostile),
    hull: extra.hull ?? (extra.hostile ? 40 : 0),
    maxHull: extra.hull ?? (extra.hostile ? 40 : 0),
    gone: false,
    id: extra.id || name,
  };
}

function finishHeliosShips(layout, push, seed, settings, ship, hostileSprites) {
  const { rand, occupancy, planets, drift, npcs, hostiles } = layout;
  const npcA = generateShip({
    seed: seed + 401,
    shipType: 1,
    bodyDetail: 0.04,
    wingDetail: 0.07,
    colors: [new Color(0.5, 0.52, 0.55, 1), new Color(0.85, 0.45, 0.12, 1)],
    colorDetail: 0.06,
  }).texture;
  const npcB = generateShip({
    seed: seed + 414,
    shipType: 0,
    bodyDetail: 0.03,
    wingDetail: 0.08,
    colors: [new Color(0.62, 0.64, 0.68, 1), new Color(0.2, 0.55, 0.35, 1)],
    colorDetail: 0.07,
  }).texture;
  npcs.push(placeNpc(rand, occupancy, "Hauler 11", push(npcA), 52, 20, drift));
  npcs.push(placeNpc(rand, occupancy, "Patrol 4", push(npcB), 44, 16, planets[0]));

  const want = hostileCountFor(settings.hostileDensity, 0);
  for (let i = 0; i < want; i++) {
    const near = planets[i % planets.length];
    const spr = hostileSprites[i % hostileSprites.length];
    hostiles.push(
      placeNpc(rand, occupancy, `Raider ${i + 1}`, spr, 44, 15, near, {
        hostile: true,
        speed: 52 + (i % 3) * 10,
        hull: 28 + i * 4,
        id: `raider-${i}`,
      })
    );
  }
  layout.player = {
    spriteIndex: ship.spriteIndex,
    drawSize: ship.drawSize,
    radius: ship.radius,
    x: layout.spawn.x,
    y: layout.spawn.y,
    heading: layout.playerHeading,
  };
}

function generateRemoteSystem({ seed, index, push, settings, mineralSprites, hostileSprites, ship }) {
  const rand = mulberry32(seed);
  const lightAngle = 160 + (index * 12) % 40;
  const starColor = STAR_COLORS[index % STAR_COLORS.length];
  const starName = SYSTEM_NAMES[index] || `Lane ${index + 1}`;
  const sun = {
    name: starName,
    spriteIndex: push(generateSun({ seed, size: TEX.sun, mainColor: starColor })),
    drawSize: TEX.sun,
    radius: TEX.sun * SUN_DISK_RATIO,
    color: { r: starColor.r, g: starColor.g, b: starColor.b },
  };
  const bgTex = generateBackground({
    seed: seed + 19,
    width: TEX.background,
    height: TEX.background,
    frequency: 0.018 + index * 0.002,
    lacunarity: 2.1,
    persistence: 0.45,
    octaves: 4,
    starCount: 160 + index * 12,
    tint: new Color(0.12 + (index % 3) * 0.04, 0.16, 0.38 + (index % 2) * 0.08, 1),
    brightness: 0.4,
  });
  const background = { spriteIndex: push(bgTex), width: TEX.background, height: TEX.background };
  const planets = buildPlanets(remotePlanetSpecs(seed, settings.planetDensity, rand), rand, push, lightAngle);
  const host = planets[Math.min(1, planets.length - 1)] || planets[0];
  const stationTex = generateStation({
    seed: seed + 50,
    colors: [new Color(0.5, 0.52, 0.58, 1), new Color(0.85, 0.55, 0.22, 1)],
    colorDetail: 0.05,
    numberOfPods: 5 + (index % 3),
  }).texture;
  const stationVis = STATION_DRAW * 0.5;
  const outerMoon = host.moons.reduce((best, m) => (!best || m.orbitRadius > best.orbitRadius ? m : best), null);
  const station = {
    name: `${starName} Yard`,
    spriteIndex: push(stationTex),
    drawSize: STATION_DRAW,
    radius: stationVis,
    parent: planets.indexOf(host),
    orbitRadius: Math.max(
      spriteRadius(host) + stationVis + BODY_GAP,
      outerMoon ? outerMoon.orbitRadius + spriteRadius(outerMoon) + stationVis + BODY_GAP : 0
    ),
    orbitSpeed: 0.18,
    phase: 0.6 + index * 0.4,
  };

  const occupancy = occupancyFrom(sun, planets, station);
  const rocks = [];
  const rockCount = asteroidCountFor(settings.asteroidDensity, 40);
  const beltInner = 2400;
  const beltOuter = Math.max(3400, worldRadiusOf(sun, planets) * 0.55);

  function commitRock(rock) {
    rocks.push(rock);
    occupancy.push({ id: rock.id, x: rock.x, y: rock.y, r: spriteRadius(rock) });
  }

  for (let i = 0; i < rockCount; i++) {
    const outer = i / rockCount > 0.7;
    const mineral = pickMineralId(rand, { allowExotic: outer && rand() < 0.16 });
    const spec = MINERALS[mineral];
    const drawSize = TEX.asteroid * (0.78 + rand() * 0.22);
    const baseRadius = drawSize * ASTEROID_DISK;
    const reserve = 6 + rand() * 16 + (spec.rarity === "rare" ? 4 : 0);
    const pos = placeClearOf(
      rand,
      spriteRadius({ drawSize }),
      occupancy,
      () => {
        const rad = beltInner + rand() * (beltOuter - beltInner);
        const ang = rand() * Math.PI * 2;
        return { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad };
      },
      140
    );
    if (!pos) continue;
    commitRock({
      id: `sys${index}-rock-${i}`,
      mineral,
      heading: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 0.7,
      baseDrawSize: drawSize,
      drawSize,
      baseRadius,
      radius: baseRadius,
      reserve,
      maxReserve: reserve,
      hardness: spec.hardness,
      spriteIndex: mineralSprites[mineral],
      story: false,
      gone: false,
      x: pos.x,
      y: pos.y,
    });
  }

  const spawn =
    placeClearOf(
      rand,
      ship.radius,
      occupancy,
      (r) => {
        const ang = r() * Math.PI * 2;
        const rad = station.orbitRadius + 180 + r() * 120;
        return { x: host.x + Math.cos(ang) * rad, y: host.y + Math.sin(ang) * rad };
      },
      80,
      12
    ) || { x: host.x + station.orbitRadius + 200, y: host.y };
  occupancy.push({ id: "spawn", x: spawn.x, y: spawn.y, r: ship.radius });

  const npcs = [];
  const hostiles = [];
  const want = hostileCountFor(settings.hostileDensity, index);
  for (let i = 0; i < want; i++) {
    const near = planets[i % planets.length];
    hostiles.push(
      placeNpc(rand, occupancy, `${starName} Raider ${i + 1}`, hostileSprites[i % hostileSprites.length], 44, 15, near, {
        hostile: true,
        speed: 55 + (i % 4) * 8,
        hull: 32 + i * 5,
        id: `sys${index}-raider-${i}`,
      })
    );
  }

  return {
    index,
    id: starName.toLowerCase(),
    starName,
    worldRadius: worldRadiusOf(sun, planets),
    background,
    sun,
    planets,
    station,
    rocks,
    npcs,
    hostiles,
    wormholes: [],
    spawn,
    playerHeading: rand() * 0.4,
    occupancy,
    player: {
      spriteIndex: ship.spriteIndex,
      drawSize: ship.drawSize,
      radius: ship.radius,
      x: spawn.x,
      y: spawn.y,
      heading: 0.15,
    },
  };
}

function attachWormholes(systems, spriteIndex, numericSeed) {
  if (systems.length < 2 || spriteIndex < 0) return;
  const names = systems.map((s) => s.starName);
  for (let i = 0; i < systems.length; i++) {
    const rand = mulberry32(numericSeed + 44000 + i * 17);
    const sys = systems[i];
    const occupancy = occupancyFrom(sys.sun, sys.planets, sys.station, sys.rocks);
    const targets = [];
    if (i > 0) targets.push(i - 1);
    if (i < systems.length - 1) targets.push(i + 1);
    const holes = [];
    for (const target of targets) {
      const ang = (target + 1) * 2.15 + i * 0.7;
      const rad = Math.max(sys.worldRadius * 0.72, 3600);
      const pos =
        placeClearOf(
          rand,
          WORMHOLE_DRAW * 0.35,
          occupancy,
          (r, n) => {
            const a = ang + (n ? (r() - 0.5) * 0.8 : 0);
            const d = rad + (n ? r() * 400 : 0);
            return { x: Math.cos(a) * d, y: Math.sin(a) * d };
          },
          80
        ) || { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad };
      occupancy.push({ id: `wh-${i}-${target}`, x: pos.x, y: pos.y, r: WORMHOLE_DRAW * 0.35 });
      holes.push({
        id: `wh-${i}-${target}`,
        target,
        x: pos.x,
        y: pos.y,
        spriteIndex,
        drawSize: WORMHOLE_DRAW,
        radius: 42,
        name: `Gate to ${names[target]}`,
      });
    }
    sys.wormholes = holes;
    let wr = sys.worldRadius;
    for (const h of holes) wr = Math.max(wr, Math.hypot(h.x, h.y) + 320);
    sys.worldRadius = wr;
    delete sys.occupancy;
    delete sys.rand;
    delete sys.iceCenter;
    delete sys.drift;
  }
}

function makeHostileSprites(seed, push) {
  const a = generateShip({
    seed: seed + 901,
    shipType: 0,
    bodyDetail: 0.04,
    wingDetail: 0.07,
    colors: [new Color(0.42, 0.18, 0.16, 1), new Color(0.9, 0.22, 0.12, 1)],
    colorDetail: 0.07,
  }).texture;
  const b = generateShip({
    seed: seed + 914,
    shipType: 1,
    bodyDetail: 0.04,
    wingDetail: 0.08,
    colors: [new Color(0.28, 0.22, 0.2, 1), new Color(0.95, 0.55, 0.12, 1)],
    colorDetail: 0.06,
  }).texture;
  return [push(a), push(b)];
}

export function generateGalaxy(rawSettings = {}, opts = {}) {
  const settings = clampSettings({ ...DEFAULT_SETTINGS, ...rawSettings });
  const numericSeed = opts.numericSeed != null ? opts.numericSeed >>> 0 : hashSeed(settings.seed);
  const shipSpec = shipClassOf(settings);
  const sprites = [];
  const push = (tex) => {
    const idx = sprites.length;
    sprites.push(packTexture(tex));
    return idx;
  };

  const playerShip = generateShip({
    seed: numericSeed + 1,
    shipType: shipSpec.shipType,
    bodyDetail: 0.04,
    wingDetail: 0.06,
    colors: [new Color(0.68, 0.72, 0.76, 1), new Color(0.22, 0.78, 0.92, 1)],
    colorDetail: 0.07,
  });
  const ship = {
    spriteIndex: push(playerShip.texture),
    drawSize: shipSpec.drawSize,
    radius: shipSpec.radius,
    classId: shipSpec.id,
  };

  const hostileSprites = makeHostileSprites(numericSeed, push);
  const systems = [];
  const helios = generateHeliosLayout({ seed: numericSeed, push, settings });
  finishHeliosShips(helios, push, numericSeed, settings, ship, hostileSprites);
  systems.push(helios);
  const mineralSprites = helios.mineralSprites;

  for (let i = 1; i < settings.systems; i++) {
    systems.push(
      generateRemoteSystem({
        seed: systemSeed(numericSeed, i),
        index: i,
        push,
        settings,
        mineralSprites,
        hostileSprites,
        ship,
      })
    );
  }

  const wormholeSprite = settings.systems > 1 ? push(generateBlackhole({ seed: numericSeed + 77 })) : -1;
  attachWormholes(systems, wormholeSprite, numericSeed);

  for (const sys of systems) {
    delete sys.occupancy;
    delete sys.rand;
    delete sys.iceCenter;
    delete sys.drift;
  }

  return {
    settings,
    numericSeed,
    systems,
    sprites,
    mineralSprites,
    player: {
      spriteIndex: ship.spriteIndex,
      drawSize: ship.drawSize,
      radius: ship.radius,
      classId: ship.classId,
    },
    current: 0,
  };
}

export function generateHeliosSystem(seed = HELIOS_SEED) {
  const galaxy = generateGalaxy(
    {
      ...DEFAULT_SETTINGS,
      seed: String(seed),
      systems: 1,
      hostileDensity: 0,
      planetDensity: 1,
      asteroidDensity: 1,
      shipClass: "hauler",
    },
    { numericSeed: seed >>> 0 }
  );
  const sys = galaxy.systems[0];
  return {
    ...sys,
    seed,
    sprites: galaxy.sprites,
    mineralSprites: galaxy.mineralSprites,
    player: {
      spriteIndex: galaxy.player.spriteIndex,
      drawSize: galaxy.player.drawSize,
      radius: galaxy.player.radius,
      x: sys.spawn.x,
      y: sys.spawn.y,
      heading: sys.playerHeading || 0.15,
    },
  };
}
