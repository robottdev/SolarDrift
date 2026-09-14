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
});
