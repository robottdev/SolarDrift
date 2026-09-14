import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server.js";
import { CALLSIGN, DIALOGUE, INTRO, MISSIONS } from "../public/js/data.js";
import { MINERALS } from "../lib/logic.js";

test("health endpoint is Railway-ready", async () => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "solar-drift");
  assert.equal(body.version, "2.0.0");
  server.close();
});

test("index and game modules are served", async () => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address();
  const home = await fetch(`http://127.0.0.1:${port}/`);
  const html = await home.text();
  assert.equal(home.status, 200);
  assert.match(html, /SOLAR DRIFT/);
  assert.match(html, /The Claim/);
  assert.match(html, /Start Claim/);
  assert.match(html, /v=2\.0\.0/);
  const logic = await fetch(`http://127.0.0.1:${port}/lib/logic.js`);
  assert.equal(logic.status, 200);
  const game = await fetch(`http://127.0.0.1:${port}/js/game.js`);
  assert.equal(game.status, 200);
  const stellar = await fetch(`http://127.0.0.1:${port}/js/stellar/celestial.js`);
  assert.equal(stellar.status, 200);
  server.close();
});

test("episode is a miner claim with Credits and a laser", () => {
  assert.equal(MISSIONS[0].id, "ice");
  assert.equal(MISSIONS[MISSIONS.length - 1].id, "done");
  assert.equal(CALLSIGN, "SCOTT · PIP");
  assert.equal(DIALOGUE.pip.speaker, "PIP");
  assert.equal(DIALOGUE.station.speaker.includes("Anchorage"), true);
  assert.equal(INTRO[0].who, "SCOTT");
  assert.ok(INTRO.some((card) => card.who === "PIP"));
  assert.match(INTRO.map((card) => card.text).join(" "), /mine|laser|Credits/i);
  assert.ok(MINERALS.aetherite);
  assert.ok(MINERALS.ice);
});
