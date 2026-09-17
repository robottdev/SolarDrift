import { Color } from "../stellar/js/core.js";
import { generatePlanet, generateSun, generateMoon, generateAsteroid, generateBackground, PlanetType, SUN_DISK_RATIO } from "../stellar/js/celestial.js";
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
};

const PLANET_DISK = 0.42;
const ASTEROID_DISK = 0.4;
const SHIP_DRAW = 48;
const STATION_DRAW = 160;

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

export function generateHeliosSystem(seed = HELIOS_SEED) {
  const rand = mulberry32(seed);
  const sprites = [];
  const push = (tex) => {
    const idx = sprites.length;
    sprites.push(packTexture(tex));
    return idx;
  };

  const starColor = new Color(1, 0.9, 0.52, 1);
  const lightAngle = 180;
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

  const planets = PLANET_SPECS.map((spec) => {
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
      lightAngle,
    });
    mineralSprites[id] = push(tex);
  }

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

  const occupancy = [{ id: "sun", x: 0, y: 0, r: spriteRadius(sun) }];
  for (const p of planets) {
    occupancy.push({ id: p.id, x: p.x, y: p.y, r: spriteRadius(p) });
    for (const m of p.moons) {
      occupancy.push({ id: m.name, x: p.x, y: p.y, r: spriteRadius(m), orbit: m.orbitRadius });
    }
  }
  occupancy.push({
    id: "station",
    x: drift.x,
    y: drift.y,
    r: spriteRadius(station),
    orbit: station.orbitRadius,
  });

  const beltInner = 3300;
  const beltOuter = 4400;
  const rocks = [];
  const rockCount = 54;

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

  const playerShip = generateShip({
    seed: seed + 1,
    shipType: 2,
    bodyDetail: 0.04,
    wingDetail: 0.06,
    colors: [new Color(0.68, 0.72, 0.76, 1), new Color(0.22, 0.78, 0.92, 1)],
    colorDetail: 0.07,
  });
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

  const iceHeading = station.phase;
  const iceFieldDist = station.orbitRadius + spriteRadius(station) + BODY_GAP + 260;
  const iceCenter = {
    x: drift.x + Math.cos(iceHeading) * iceFieldDist,
    y: drift.y + Math.sin(iceHeading) * iceFieldDist,
  };

  for (let i = 0; i < 8; i++) {
    const ice = MINERALS.ice;
    const drawSize = TEX.asteroid * (0.82 + (i % 3) * 0.06);
    const partial = {
      id: `local-ice-${i}`,
      mineral: "ice",
      heading: (i / 8) * Math.PI * 2,
      spin: (i % 2 ? 0.35 : -0.28),
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

  function placeNpc(name, spriteIndex, drawSize, radius, near) {
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
      speed: name.startsWith("Patrol") ? 28 : 22,
    };
  }

  const npcs = [
    placeNpc("Hauler 11", push(npcA), 52, 20, drift),
    placeNpc("Patrol 4", push(npcB), 44, 16, planets[0]),
  ];

  let worldRadius = sun.drawSize * 0.5 + 500;
  for (const p of planets) worldRadius = Math.max(worldRadius, Math.hypot(p.x, p.y) + p.drawSize * 0.5 + 400);

  return {
    seed,
    starName: "Helios",
    worldRadius,
    background,
    sun,
    planets,
    station,
    rocks,
    npcs,
    player: {
      spriteIndex: push(playerShip.texture),
      drawSize: SHIP_DRAW,
      radius: 18,
      x: spawn.x,
      y: spawn.y,
      heading: 0.15,
    },
    sprites,
    mineralSprites,
    spawn,
  };
}
