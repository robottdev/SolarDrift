import test from "node:test";
import assert from "node:assert/strict";
import { generateGalaxy, generateHeliosSystem } from "../public/js/system.js";
import { BODY_GAP, HELIOS_SEED, MINERALS, dist, moonWorldPos, spriteRadius, stationWorldPos } from "../lib/logic.js";
import { DEFAULT_SETTINGS, hashSeed, planetCountFor } from "../lib/settings.js";

test("Helios system generates a belt, station, and Ghost Vein", () => {
  const scene = generateHeliosSystem(HELIOS_SEED);
  assert.equal(scene.starName, "Helios");
  assert.equal(scene.planets.length, 4);
  assert.ok(scene.planets.find((p) => p.id === "drift"));
  assert.equal(scene.station.name, "Helios Anchorage");
  assert.ok(scene.rocks.length >= 48);
  const ghost = scene.rocks.find((r) => r.story);
  assert.ok(ghost);
  assert.equal(ghost.mineral, "aetherite");
  assert.ok(scene.sprites.length > 10);
  assert.ok(scene.sprites[0].pixels.length === scene.sprites[0].width * scene.sprites[0].height * 4);
  for (const rock of scene.rocks) {
    assert.ok(MINERALS[rock.mineral]);
    assert.ok(rock.reserve > 0);
  }

  const sunTex = scene.sprites[scene.sun.spriteIndex];
  assert.equal(sunTex.width, 512);
  assert.equal(scene.sun.drawSize, 512);
  const drift = scene.planets.find((p) => p.id === "drift");
  assert.equal(scene.sprites[drift.spriteIndex].width, 256);
  assert.equal(drift.drawSize, 256);
  const bruise = scene.planets.find((p) => p.id === "bruise");
  assert.equal(scene.sprites[bruise.spriteIndex].width, 320);
  const moon = drift.moons[0];
  assert.equal(scene.sprites[moon.spriteIndex].width, 160);
  assert.ok(scene.player.drawSize < 60);
  for (const rock of scene.rocks) {
    const tex = scene.sprites[rock.spriteIndex];
    assert.equal(tex.width, 128);
    assert.ok(rock.drawSize <= tex.width);
    assert.ok(scene.player.drawSize < rock.drawSize);
  }
  assert.ok(scene.player.drawSize < scene.station.drawSize);
  assert.ok(scene.player.drawSize < drift.drawSize);
  assert.ok(scene.station.drawSize <= scene.sprites[scene.station.spriteIndex].width);
  for (const n of scene.npcs) {
    assert.ok(n.drawSize <= 52);
    assert.ok(n.drawSize < scene.station.drawSize);
  }
});

test("Helios bodies keep a gap and never overlap sprites", () => {
  const scene = generateHeliosSystem(HELIOS_SEED);
  const pts = [
    { id: "sun", x: 0, y: 0, r: spriteRadius(scene.sun) },
    ...scene.planets.map((p) => ({ id: p.id, x: p.x, y: p.y, r: spriteRadius(p) })),
  ];
  for (const p of scene.planets) {
    for (const m of p.moons) {
      assert.ok(
        m.orbitRadius + 1e-6 >= spriteRadius(p) + spriteRadius(m) + BODY_GAP,
        `${m.name} orbit clips ${p.name}`
      );
      const pos = moonWorldPos(p, m);
      pts.push({ id: m.name, x: pos.x, y: pos.y, r: spriteRadius(m) });
    }
    for (let i = 0; i < p.moons.length; i++) {
      for (let j = i + 1; j < p.moons.length; j++) {
        const a = p.moons[i];
        const b = p.moons[j];
        assert.ok(
          Math.abs(a.orbitRadius - b.orbitRadius) + 1e-6 >= spriteRadius(a) + spriteRadius(b) + BODY_GAP,
          `${a.name} orbit overlaps ${b.name}`
        );
      }
    }
  }
  const host = scene.planets[scene.station.parent] || scene.planets[0];
  assert.ok(
    scene.station.orbitRadius + 1e-6 >= spriteRadius(host) + spriteRadius(scene.station) + BODY_GAP,
    "station clips host planet"
  );
  for (const m of host.moons) {
    assert.ok(
      Math.abs(scene.station.orbitRadius - m.orbitRadius) + 1e-6 >=
        spriteRadius(scene.station) + spriteRadius(m) + BODY_GAP,
      `station orbit overlaps ${m.name}`
    );
  }
  const st = stationWorldPos(scene.station, scene.planets);
  pts.push({ id: "station", x: st.x, y: st.y, r: spriteRadius(scene.station) });
  for (const rock of scene.rocks) pts.push({ id: rock.id, x: rock.x, y: rock.y, r: spriteRadius(rock) });

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i];
      const b = pts[j];
      const d = dist(a.x, a.y, b.x, b.y);
      assert.ok(d + 1e-6 >= a.r + b.r + BODY_GAP, `${a.id} overlaps ${b.id} (d=${d.toFixed(1)} need ${(a.r + b.r + BODY_GAP).toFixed(1)})`);
    }
  }
});

test("galaxy settings make chained systems and scale planets", () => {
  const galaxy = generateGalaxy({
    ...DEFAULT_SETTINGS,
    seed: "1993",
    systems: 2,
    hostileDensity: 2,
    planetDensity: 0.4,
    asteroidDensity: 0.5,
    shipClass: "interceptor",
  });
  assert.equal(galaxy.numericSeed, hashSeed("1993"));
  assert.equal(galaxy.systems.length, 2);
  assert.equal(galaxy.systems[0].starName, "Helios");
  assert.equal(galaxy.systems[0].planets.length, planetCountFor(0.4, 4));
  assert.ok(galaxy.systems[0].planets.find((p) => p.id === "drift"));
  assert.ok(galaxy.systems[1].starName);
  assert.notEqual(galaxy.systems[1].starName, "Helios");
  assert.ok(galaxy.systems[0].wormholes.length >= 1);
  assert.equal(galaxy.systems[0].wormholes[0].target, 1);
  assert.ok(galaxy.systems[1].wormholes.some((w) => w.target === 0));
  assert.ok(galaxy.systems[0].hostiles.length >= 1);
  assert.ok(galaxy.player.drawSize <= 42);
  assert.equal(galaxy.settings.shipClass, "interceptor");
});
