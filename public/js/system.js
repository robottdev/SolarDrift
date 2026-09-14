import { Color } from "./stellar/core.js";
import { generatePlanet, generateSun, generateMoon, generateAsteroid, generateBackground, PlanetType } from "./stellar/celestial.js";
import { generateShip, generateStation } from "./stellar/craft.js";
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

const PLANET_SPECS = [
  {
    id: "cinder",
    name: "Cinder",
    kind: "terrestrial",
    dist: 860,
    ang: 0.55,
    radius: 44,
    seed: 1101,
    colors: [
      new Color(0.62, 0.28, 0.16, 1),
      new Color(0.78, 0.42, 0.18, 1),
      new Color(0.35, 0.2, 0.14, 1),
    ],
    moons: [{ name: "Cinder-b", seed: 1110, radius: 12, orbitRadius: 78, orbitSpeed: 0.55, phase: 1.2 }],
  },
  {
    id: "drift",
    name: "Drift",
    kind: "terrestrial",
    dist: 1520,
    ang: 2.15,
    radius: 58,
    seed: 2202,
    colors: [
      new Color(0.18, 0.38, 0.72, 1),
      new Color(0.22, 0.55, 0.32, 1),
      new Color(0.7, 0.62, 0.4, 1),
    ],
    moons: [{ name: "Parking Rock", seed: 2210, radius: 14, orbitRadius: 102, orbitSpeed: 0.42, phase: 4.1 }],
  },
  {
    id: "bruise",
    name: "Bruise",
    kind: "gas",
    dist: 2760,
    ang: 4.05,
    radius: 122,
    seed: 3303,
    colors: [
      new Color(0.55, 0.28, 0.72, 1),
      new Color(0.82, 0.45, 0.22, 1),
      new Color(0.95, 0.82, 0.55, 1),
    ],
    moons: [
      { name: "Bruise-b", seed: 3310, radius: 16, orbitRadius: 188, orbitSpeed: 0.32, phase: 0.4 },
      { name: "Bruise-c", seed: 3320, radius: 11, orbitRadius: 248, orbitSpeed: 0.24, phase: 2.7 },
    ],
  },
  {
    id: "nys",
    name: "Nys",
    kind: "terrestrial",
    dist: 3640,
    ang: 5.35,
    radius: 50,
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
    spriteIndex: push(generateSun({ seed, size: 96, mainColor: starColor })),
    radius: 220,
    color: { r: starColor.r, g: starColor.g, b: starColor.b },
  };

  const bgTex = generateBackground({
    seed: seed + 19,
    width: 256,
    height: 256,
    frequency: 0.02,
    lacunarity: 2.1,
    persistence: 0.48,
    octaves: 4,
    starCount: 90,
    tint: new Color(0.18, 0.22, 0.48, 1),
    brightness: 0.44,
  });
  const background = { spriteIndex: push(bgTex), width: 256, height: 256 };

  const planets = PLANET_SPECS.map((spec) => {
    const terrestrial = spec.kind === "terrestrial";
    const tex = generatePlanet({
      seed: spec.seed,
      size: 80,
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
        size: 40,
        roughness: 0.45 + rand() * 0.3,
        colors: [
          new Color(0.4, 0.4, 0.4),
          new Color(0.62, 0.62, 0.6),
          new Color(0.78, 0.76, 0.72),
        ],
        lightAngle,
      });
      return { ...m, spriteIndex: push(mTex) };
    });
    return {
      id: spec.id,
      name: spec.name,
      kind: spec.kind,
      radius: spec.radius,
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
      size: 64,
      colors: rockPalette(shade),
      minerals: true,
      mineralColor: colorFromRgb(spec.rgb),
      lightAngle,
    });
    mineralSprites[id] = push(tex);
  }

  const beltInner = 1880;
  const beltOuter = 2480;
  const rocks = [];
  const rockCount = 54;
  for (let i = 0; i < rockCount; i++) {
    const outer = i / rockCount > 0.72;
    const mineral = pickMineralId(rand, { allowExotic: outer && rand() < 0.12 });
    const spec = MINERALS[mineral];
    const rad = beltInner + rand() * (beltOuter - beltInner);
    const ang = rand() * Math.PI * 2;
    const baseRadius = 11 + rand() * 10;
    const reserve = 6 + rand() * 16 + (spec.rarity === "rare" ? 4 : 0);
    rocks.push({
      id: `rock-${i}`,
      mineral,
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad,
      heading: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 0.7,
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
  const ghostRad = 2410;
  const aether = MINERALS.aetherite;
  rocks.push({
    id: "ghost-vein",
    mineral: "aetherite",
    x: Math.cos(ghostAng) * ghostRad,
    y: Math.sin(ghostAng) * ghostRad,
    heading: 0.2,
    spin: 0.18,
    baseRadius: 22,
    radius: 22,
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
    radius: 30,
    parent: planets.indexOf(drift),
    orbitRadius: drift.radius * 2.35,
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

  const npcs = [
    {
      name: "Hauler 11",
      spriteIndex: push(npcA),
      radius: 20,
      x: drift.x + 140,
      y: drift.y - 80,
      heading: 0.4,
      speed: 22,
    },
    {
      name: "Patrol 4",
      spriteIndex: push(npcB),
      radius: 18,
      x: planets[0].x + 90,
      y: planets[0].y + 40,
      heading: 2.1,
      speed: 28,
    },
  ];

  let worldRadius = sun.radius + 400;
  for (const p of planets) worldRadius = Math.max(worldRadius, Math.hypot(p.x, p.y) + p.radius + 280);

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
      radius: 22,
      x: spawn.x + 64,
      y: spawn.y + 18,
      heading: 0.15,
    },
    sprites,
    mineralSprites,
    spawn,
  };
}
