import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server.js";
import { CALLSIGN, DIALOGUE, INTRO, MISSIONS, PLANETS } from "../public/js/data.js";

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
  assert.equal(body.version, "1.2.0");
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
  assert.match(html, /The Setup/);
  assert.match(html, /Start Drifting/);
  assert.match(html, /v=1\.2\.0/);
  const logic = await fetch(`http://127.0.0.1:${port}/lib/logic.js`);
  assert.equal(logic.status, 200);
  const game = await fetch(`http://127.0.0.1:${port}/js/game.js`);
  assert.equal(game.status, 200);
  server.close();
});

test("episode has a full objective chain and named space", () => {
  assert.equal(MISSIONS.length, 12);
  assert.ok(PLANETS.find((p) => p.id === "vortex"));
  assert.ok(PLANETS.find((p) => p.id === "helios-station"));
  assert.equal(PLANETS.find((p) => p.id === "helios-station").name, "Bolt's Yard");
  assert.equal(PLANETS.find((p) => p.id === "vortex").name, "Old Jump Ring");
  assert.equal(CALLSIGN, "SCOTT · PIP");
  assert.equal(DIALOGUE.pip.speaker, "PIP");
  assert.equal(DIALOGUE.pip.lines.length, MISSIONS.length);
  assert.equal(INTRO[0].who, "SCOTT");
  assert.ok(INTRO.some((card) => card.who === "PIP"));
  assert.match(INTRO.map((card) => card.text).join(" "), /set us up|Gantry|Gutter Dogs/);
});
