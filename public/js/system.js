import { Color } from "../stellar/js/core.js";
import { generatePlanet, generateSun, generateMoon, generateAsteroid, generateBackground, PlanetType, SUN_DISK_RATIO } from "../stellar/js/celestial.js";
import { generateShip, generateStation } from "../stellar/js/craft.js";
import {
  HELIOS_SEED,
  MINERALS,
  MINERAL_IDS,
  mulberry32,
  pickMineralId,
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
    moons: [{ name: "Cinder-b", seed: 1110, orbitRadius: 248, orbitSpeed: 0.55, phase: 1.2 }],
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
    moons: [{ name: "Parking Rock", seed: 2210, orbitRadius: 270, orbitSpeed: 0.42, phase: 4.1 }],
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
      { name: "Bruise-b", seed: 3310, orbitRadius: 300, orbitSpeed: 0.32, phase: 0.4 },
      { name: "Bruise-c", seed: 3320, orbitRadius: 400, orbitSpeed: 0.24, phase: 2.7 },
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
      return {
        ...m,
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

  const beltInner = 3300;
  const beltOuter = 4400;
  const rocks = [];
  const rockCount = 54;
  for (let i = 0; i < rockCount; i++) {
    const outer = i / rockCount > 0.72;
    const mineral = pickMineralId(rand, { allowExotic: outer && rand() < 0.12 });
    const spec = MINERALS[mineral];
    const rad = beltInner + rand() * (beltOuter - beltInner);
    const ang = rand() * Math.PI * 2;
    const drawSize = TEX.asteroid * (0.78 + rand() * 0.22);
    const baseRadius = drawSize * ASTEROID_DISK;
    const reserve = 6 + rand() * 16 + (spec.rarity === "rare" ? 4 : 0);
    rocks.push({
      id: `rock-${i}`,
      mineral,
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad,
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
    });
  }

  const ghostAng = 5.05;
  const ghostRad = 4280;
  const aether = MINERALS.aetherite;
  const ghostDraw = TEX.asteroid;
  rocks.push({
    id: "ghost-vein",
    mineral: "aetherite",
    x: Math.cos(ghostAng) * ghostRad,
    y: Math.sin(ghostAng) * ghostRad,
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
  });

  const drift = planets.find((p) => p.id === "drift") || planets[1];
  const stationTex = generateStation({
    seed: seed + 50,
    colors: [new Color(0.55, 0.58, 0.62, 1), new Color(0.35, 0.78, 0.92, 1)],
    colorDetail: 0.04,
    numberOfPods: 7,
  }).texture;
  const station = {
    name: "Helios Anchorage",
    spriteIndex: push(stationTex),
    drawSize: STATION_DRAW,
    radius: STATION_DRAW * 0.5,
    parent: planets.indexOf(drift),
    orbitRadius: drift.radius + STATION_DRAW * 0.5 + 90,
    orbitSpeed: 0.22,
    phase: 1.15,
  };

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

  const spawn = {
    x: drift.x + Math.cos(station.phase) * station.orbitRadius,
    y: drift.y + Math.sin(station.phase) * station.orbitRadius,
  };

  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const rad = 160 + (i % 3) * 55;
    const ice = MINERALS.ice;
    const drawSize = TEX.asteroid * (0.82 + (i % 3) * 0.06);
    rocks.push({
      id: `local-ice-${i}`,
      mineral: "ice",
      x: spawn.x + 110 + Math.cos(ang) * rad,
      y: spawn.y + 30 + Math.sin(ang) * rad,
      heading: ang,
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
    });
  }

  const npcs = [
    {
      name: "Hauler 11",
      spriteIndex: push(npcA),
      drawSize: 52,
      radius: 20,
      x: drift.x + 240,
      y: drift.y - 140,
      heading: 0.4,
      speed: 22,
    },
    {
      name: "Patrol 4",
      spriteIndex: push(npcB),
      drawSize: 44,
      radius: 16,
      x: planets[0].x + 160,
      y: planets[0].y + 70,
      heading: 2.1,
      speed: 28,
    },
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
      x: spawn.x + 110,
      y: spawn.y + 30,
      heading: 0.15,
    },
    sprites,
    mineralSprites,
    spawn,
  };
}
