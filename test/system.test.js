import test from "node:test";
import assert from "node:assert/strict";
import { generateHeliosSystem } from "../public/js/system.js";
import { HELIOS_SEED, MINERALS } from "../lib/logic.js";

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
