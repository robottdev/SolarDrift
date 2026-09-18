import {
  CARGO_CAPACITY,
  CHIP_MASS,
  HELIOS_SEED,
  LASER_RANGE,
  MINERALS,
  STARTING_CREDITS,
  STARTING_FUEL,
  STARTING_HULL,
  STATION_RANGE,
  TRACTOR_CATCH,
  applyMine,
  applySale,
  cargoMass,
  cargoSpace,
  chipCollected,
  clamp,
  cutRock,
  dist,
  ejectChipVelocity,
  formatCredits,
  formatTonnes,
  headingVector,
  moonWorldPos,
  nearestMiningTarget,
  nextMissionIndex,
  rockVisualDrawSize,
  rockVisualRadius,
  resolvePlayCollisions,
  sellAll,
  shortestAngle,
  stationPrices,
  stationWorldPos,
  tractorStep,
  wrapAngle,
} from "/lib/logic.js";
import { AudioEngine } from "./audio.js";
import { CALLSIGN, DIALOGUE, ENDING, INTRO, MISSIONS, TITLE } from "./data.js";

const SAVE_KEY = "solar-drift-save-v4";

function canvasFromSprite(sprite) {
  const c = document.createElement("canvas");
  c.width = sprite.width;
  c.height = sprite.height;
  const ctx = c.getContext("2d");
  ctx.putImageData(new ImageData(new Uint8ClampedArray(sprite.pixels), sprite.width, sprite.height), 0, 0);
  return c;
}

export class Game {
  constructor() {
    this.audio = new AudioEngine();
    this.view = document.getElementById("view");
    this.radar = document.getElementById("radar");
    this.ctx = this.view.getContext("2d");
    this.rtx = this.radar.getContext("2d");
    this.keys = new Set();
    this.sprites = [];
    this.scene = null;
    this.ready = false;
    this.generating = false;
    this.shake = 0;
    this.toastTimer = 0;
    this.introIndex = 0;
    this.dialogue = null;
    this.mode = "title";
    this.last = 0;
    this.zoom = 1;
    this.prices = stationPrices(1);
    this.cutHeld = false;
    this.chips = [];
    this.cutAcc = 0;
    this.bind();
    this.refreshContinue();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    window.addEventListener("resize", () => this.resize());
    this.resize();
    this.generateWorld();
  }

  bind() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key);
      this.keys.add(e.code);
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) || e.code === "Space") {
        e.preventDefault();
      }
      if (this.mode === "play") this.handleKey(e);
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key);
      this.keys.delete(e.code);
      if (e.key === " " || e.code === "Space") {
        this.cutHeld = false;
        this.audio.stopLaser();
      }
    });
    this.view.addEventListener("mousedown", (e) => {
      if (this.mode !== "play" || !this.player) return;
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      this.player.nav = world;
      this.toast(`Course plotted: ${world.x | 0}, ${world.y | 0}`);
      this.audio.ui();
    });
    this.view.addEventListener(
      "wheel",
      (e) => {
        if (this.mode !== "play") return;
        e.preventDefault();
        this.zoom = clamp(this.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.28, 1);
      },
      { passive: false }
    );
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      this.onAction(btn.dataset.act, btn.dataset);
    });
    document.getElementById("btn-new").onclick = () => this.startNew();
    document.getElementById("btn-continue").onclick = () => this.continueSave();
    document.getElementById("btn-how").onclick = () => this.show("how");
    document.getElementById("btn-how-close").onclick = () => this.show("title");
    document.getElementById("btn-intro").onclick = () => this.advanceIntro();
    document.getElementById("btn-retry").onclick = () => this.continueSave() || this.startNew();
    document.getElementById("btn-restart").onclick = () => this.startNew();
    document.getElementById("btn-ending-title").onclick = () => this.show("title");
    document.getElementById("btn-plot").onclick = () => {
      const x = Number(document.getElementById("nav-x").value);
      const y = Number(document.getElementById("nav-y").value);
      if (Number.isFinite(x) && Number.isFinite(y) && this.player) {
        this.player.nav = { x, y };
        this.toast(`Course plotted: ${x}, ${y}`);
      }
    };
    const cut = document.getElementById("btn-cut");
    if (cut) {
      const down = (e) => {
        e.preventDefault();
        this.cutHeld = true;
        this.audio.resume();
      };
      const up = () => {
        this.cutHeld = false;
        this.audio.stopLaser();
      };
      cut.addEventListener("pointerdown", down);
      cut.addEventListener("pointerup", up);
      cut.addEventListener("pointercancel", up);
      cut.addEventListener("lostpointercapture", up);
    }
  }

  generateWorld() {
    this.generating = true;
    this.setLoad("Generating Helios from Stellar Sprites…");
    const fail = (err) => {
      this.setLoad("Sprite generator failed. Retrying on this thread…");
      this.generateMain(err);
    };
    try {
      const worker = new Worker("/js/worker.js", { type: "module" });
      const id = 1;
      const timer = setTimeout(() => {
        worker.terminate();
        fail(new Error("timeout"));
      }, 90000);
      worker.onmessage = (ev) => {
        clearTimeout(timer);
        worker.terminate();
        if (!ev.data?.ok) {
          fail(new Error(ev.data?.error || "worker"));
          return;
        }
        this.installScene(ev.data.scene);
      };
      worker.onerror = (e) => {
        clearTimeout(timer);
        worker.terminate();
        fail(e);
      };
      worker.postMessage({ id, seed: HELIOS_SEED });
    } catch (err) {
      fail(err);
    }
  }

  async generateMain() {
    try {
      const { generateHeliosSystem } = await import("./system.js");
      this.installScene(generateHeliosSystem(HELIOS_SEED));
    } catch (err) {
      this.setLoad(`Could not generate Helios: ${err.message || err}`);
    }
  }

  installScene(scene) {
    this.scene = scene;
    this.sprites = scene.sprites.map(canvasFromSprite);
    this.ready = true;
    this.generating = false;
    this.setLoad("");
    this.reset(false);
    this.refreshContinue();
    if (this.mode === "title") this.show("title");
  }

  setLoad(msg) {
    const el = document.getElementById("loading");
    const text = document.getElementById("loading-text");
    if (!el) return;
    if (!msg) {
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    if (text) text.textContent = msg;
  }

  refreshContinue() {
    document.getElementById("btn-continue").disabled = !localStorage.getItem(SAVE_KEY) || !this.ready;
  }

  show(mode) {
    for (const id of ["title", "how", "intro", "game", "dialogue", "pause", "dead", "ending"]) {
      const playish = (mode === "play" && id === "game") || (mode === "dialogue" && id === "game") || (mode === "pause" && id === "game");
      document.getElementById(id).classList.toggle("hidden", id !== mode && !playish);
    }
    if (mode === "play" || mode === "dialogue" || mode === "pause") {
      document.getElementById("game").classList.remove("hidden");
    }
    this.mode = mode === "game" ? "play" : mode;
    if (mode === "play") {
      this.resize();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      this.view.focus();
    }
  }

  startNew() {
    if (!this.ready) {
      this.toast("Helios is still generating.");
      return;
    }
    this.audio.resume();
    this.audio.titleSting();
    this.audio.startPad();
    this.reset(true);
    this.introIndex = 0;
    this.renderIntro();
    this.show("intro");
  }

  renderIntro() {
    const card = INTRO[this.introIndex];
    const who = document.getElementById("intro-who");
    const text = document.getElementById("intro-text");
    who.classList.remove("hidden");
    who.textContent = card.who;
    who.style.color = card.who === "PIP" ? "var(--cyan)" : "var(--amber)";
    text.textContent = card.text;
  }

  advanceIntro() {
    this.introIndex += 1;
    if (this.introIndex >= INTRO.length) {
      this.show("play");
      this.toast("PIP: Ice first. Pale rocks. Hold Space. Try not to mine the station.");
      return;
    }
    this.renderIntro();
  }

  continueSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw || !this.ready) return false;
    try {
      this.deserialize(JSON.parse(raw));
      this.audio.resume();
      this.audio.startPad();
      this.show("play");
      this.toast("PIP: Claim reconstructed. The laser missed you.");
      return true;
    } catch {
      this.toast("Save corrupt.");
      return false;
    }
  }

  reset(fresh) {
    if (!this.scene) return;
    const spawn = this.scene.player;
    this.time = 0;
    this.flags = {};
    this.player = {
      x: spawn.x,
      y: spawn.y,
      heading: spawn.heading || 0,
      vx: 0,
      vy: 0,
      hull: STARTING_HULL,
      maxHull: STARTING_HULL,
      fuel: STARTING_FUEL,
      credits: STARTING_CREDITS,
      cargo: {},
      nav: null,
      radius: spawn.radius,
      drawSize: spawn.drawSize,
      thrusting: false,
    };
    this.planets = this.scene.planets.map((p) => ({ ...p, moons: p.moons.map((m) => ({ ...m })) }));
    this.rocks = this.scene.rocks.map((r) => ({ ...r }));
    this.npcs = this.scene.npcs.map((n) => ({ ...n }));
    this.station = { ...this.scene.station };
    this.scanTarget = null;
    this.laserHit = null;
    this.laserVis = 0;
    this.mining = false;
    this.particles = [];
    this.chips = [];
    this.cutAcc = 0;
    this.cutSprite = 0;
    this.cutMineral = null;
    if (!fresh) this.syncHud();
    else this.syncHud();
  }

  handleKey(e) {
    const k = e.key;
    if (k === "c" || k === "C") this.hail();
    if (k === "v" || k === "V") this.scan();
    if (k === "t" || k === "T") this.sellAtStation();
    if (k === "Escape") this.show("pause");
  }

  onAction(act) {
    if (act === "hail") this.hail();
    if (act === "scan") this.scan();
    if (act === "sell") this.sellAtStation();
    if (act === "pause") this.show("pause");
    if (act === "resume") this.show("play");
    if (act === "save") {
      this.save();
      this.toast("Slot written.");
    }
    if (act === "load") this.continueSave();
    if (act === "title") this.show("title");
    if (act === "lock-objective") this.lockObjective();
    this.syncHud();
  }

  stationPos() {
    return stationWorldPos(this.station, this.planets);
  }

  nearStation() {
    const s = this.stationPos();
    return dist(this.player.x, this.player.y, s.x, s.y) < this.station.radius + STATION_RANGE;
  }

  lockObjective() {
    const idx = nextMissionIndex(this.flags);
    if (idx <= 1 || idx === 2 || idx === 3 || idx === 5 || idx === 7) {
      const s = this.stationPos();
      this.player.nav = { x: s.x, y: s.y };
      this.toast("Objective lock: Helios Anchorage");
      return;
    }
    if (idx === 6) {
      const ghost = this.rocks.find((r) => r.story);
      if (ghost) {
        this.player.nav = { x: ghost.x, y: ghost.y };
        this.toast("Objective lock: Ghost Vein");
        return;
      }
    }
    const rock = this.rocks.find((r) => !r.gone && r.reserve > 0 && r.mineral === (idx === 0 ? "ice" : idx === 4 ? "titanium" : "iron"));
    if (rock) {
      this.player.nav = { x: rock.x, y: rock.y };
      this.toast(`Objective lock: ${MINERALS[rock.mineral].name} rock`);
      return;
    }
    this.toast("No lock.");
  }

  hail() {
    if (this.mode !== "play") return;
    if (this.nearStation()) {
      this.openDialogue("station");
      return;
    }
    this.openDialogue("pip");
  }

  scan() {
    const p = this.player;
    let best = null;
    let bestD = 400;
    for (const rock of this.rocks) {
      if (rock.gone) continue;
      const d = dist(p.x, p.y, rock.x, rock.y) - rock.radius;
      if (d < bestD) {
        bestD = d;
        best = rock;
      }
    }
    const s = this.stationPos();
    if (dist(p.x, p.y, s.x, s.y) - this.station.radius < bestD) {
      this.toast("SCAN Helios Anchorage: buy desk live. Credits for rock. Coffee for money.");
      this.audio.hail();
      return;
    }
    if (!best) {
      this.toast("Scan: empty volume.");
      return;
    }
    this.scanTarget = best;
    const spec = MINERALS[best.mineral];
    this.toast(`SCAN ${best.story ? "GHOST VEIN" : "ASTEROID"}: ${spec.name} · ${formatTonnes(best.reserve)} remaining. ${spec.scan}`);
    this.audio.hail();
  }

  sellAtStation() {
    if (!this.nearStation()) {
      this.toast("PIP: No buy desk in this volume. The Anchorage is over Drift.");
      return;
    }
    if (this.cutAcc > 0.001 && this.cutMineral) {
      this.ingestChip({ mineral: this.cutMineral, amount: this.cutAcc });
      this.cutAcc = 0;
    }
    for (const chip of this.chips) this.ingestChip(chip);
    this.chips = [];
    const mass = cargoMass(this.player.cargo);
    if (mass <= 0) {
      this.toast("Voss: Hold's empty. I don't buy air.");
      return;
    }
    const result = sellAll(this.player.cargo, this.prices);
    this.player.cargo = result.cargo;
    this.player.credits += result.credits;
    this.flags = applySale(this.flags, result.sold, result.credits);
    this.audio.ping();
    this.toast(`Sold ${formatTonnes(mass)} for ${formatCredits(result.credits)}. Book is ${formatCredits(this.player.credits)}.`);
    this.save();
    this.syncHud();
    if (nextMissionIndex(this.flags) === 8) this.finish();
  }

  openDialogue(id) {
    const pack = DIALOGUE[id];
    if (!pack) return;
    const idx = this.dialogueStart(id);
    this.audio.hail();
    this.dialogue = { id, pack, idx };
    this.renderDialogue();
    this.show("dialogue");
  }

  dialogueStart(id) {
    const f = this.flags;
    if (id === "station") {
      if ((f.minedAetherite || 0) >= 2 && !f.briefedCore) return 2;
      if (f.soldOnce) return 1;
      return 0;
    }
    return Math.min(nextMissionIndex(f), DIALOGUE.pip.lines.length - 1);
  }

  renderDialogue() {
    const { pack, idx } = this.dialogue;
    const node = pack.lines[idx];
    document.getElementById("who").textContent = pack.speaker;
    document.getElementById("portrait").style.background = pack.portrait;
    let text = node.text;
    if (node.require === "minedAetherite" && (this.flags.minedAetherite || 0) < 2) text = node.failText || text;
    document.getElementById("line").textContent = text;
    const box = document.getElementById("choices");
    const blocked = node.require === "minedAetherite" && (this.flags.minedAetherite || 0) < 2;
    const choices = blocked ? [{ label: "Close channel.", next: "close" }] : node.choices;
    box.innerHTML = "";
    for (const choice of choices) {
      const b = document.createElement("button");
      b.textContent = choice.label;
      b.onclick = () => this.pickChoice(choice, blocked);
      box.appendChild(b);
    }
  }

  pickChoice(choice, blocked) {
    if (blocked || choice.next === "close") {
      this.closeDialogue();
      return;
    }
    if (choice.flag) this.flags[choice.flag] = true;
    if (choice.next == null) {
      this.save();
      this.closeDialogue();
      this.syncHud();
      if (this.flags.briefedCore) this.finish();
      return;
    }
    this.dialogue.idx = choice.next;
    this.renderDialogue();
  }

  closeDialogue() {
    this.dialogue = null;
    this.show("play");
    this.syncHud();
  }

  finish() {
    this.flags.briefedCore = true;
    document.getElementById("ending-eyebrow").textContent = ENDING.eyebrow;
    document.getElementById("ending-title").textContent = ENDING.title;
    document.getElementById("ending-text").textContent = ENDING.text;
    this.show("ending");
    this.audio.stopLaser();
    this.save();
  }

  loop(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000 || 0.016);
    this.last = t;
    if (this.mode === "play" && this.ready) this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) document.getElementById("toast").classList.add("hidden");
    }
    this.steerPlayer(dt);
    this.updateMotion(dt);
    this.updateMining(dt);
    this.updateChips(dt);
    this.updateParticles(dt);
    this.player.fuel = clamp(this.player.fuel + 1.6 * dt, 0, 120);
    if (this.player.hull < this.player.maxHull) this.player.hull = clamp(this.player.hull + 1.2 * dt, 0, this.player.maxHull);
    const sec = this.time | 0;
    const prev = (this.time - dt) | 0;
    if (sec !== prev && sec % 2 === 0) this.syncHud();
    if (this.laserHeld() || this.mining || (this.chips && this.chips.length)) this.syncHud();
    if (sec !== prev && sec % 20 === 0) this.save();
    this.shake = Math.max(0, this.shake - dt * 8);
  }

  steerPlayer(dt) {
    const p = this.player;
    const rot = 2.5;
    if (this.keys.has("a") || this.keys.has("A") || this.keys.has("ArrowLeft")) p.heading -= rot * dt;
    if (this.keys.has("d") || this.keys.has("D") || this.keys.has("ArrowRight")) p.heading += rot * dt;
    p.heading = wrapAngle(p.heading);

    if (p.nav) {
      const desired = Math.atan2(p.nav.x - p.x, p.y - p.nav.y);
      const delta = shortestAngle(p.heading, desired);
      p.heading = wrapAngle(p.heading + clamp(delta, -rot * dt, rot * dt));
      if (dist(p.x, p.y, p.nav.x, p.nav.y) < 36) p.nav = null;
    }

    const boost = this.keys.has("Shift") || this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const accel = (boost ? 260 : 140) * dt;
    const fwd = headingVector(p.heading);
    const thrusting =
      this.keys.has("w") || this.keys.has("W") || this.keys.has("ArrowUp") || Boolean(p.nav);
    const reverse = this.keys.has("s") || this.keys.has("S") || this.keys.has("ArrowDown");
    p.thrusting = thrusting;
    if (thrusting) {
      p.vx += fwd.x * accel;
      p.vy += fwd.y * accel;
      this.burst(p.x - fwd.x * 18, p.y - fwd.y * 18, Math.atan2(fwd.y, fwd.x) + Math.PI, "#5ce1ff", 2);
    }
    if (reverse) {
      p.vx -= fwd.x * accel * 0.45;
      p.vy -= fwd.y * accel * 0.45;
    }
    if (this.keys.has("x") || this.keys.has("X") || this.keys.has("Control")) {
      p.vx *= Math.exp(-2.6 * dt);
      p.vy *= Math.exp(-2.6 * dt);
    }
    p.vx *= Math.exp(-0.32 * dt);
    p.vy *= Math.exp(-0.32 * dt);
    const cap = boost ? 200 : 120;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > cap) {
      p.vx *= cap / sp;
      p.vy *= cap / sp;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    this.bounceWorld(p);
  }

  bounceWorld(p) {
    const resolved = resolvePlayCollisions(p, this.rocks, this.npcs);
    p.x = resolved.x;
    p.y = resolved.y;
    p.vx = resolved.vx;
    p.vy = resolved.vy;
    const dSun = Math.hypot(p.x, p.y);
    const limit = this.scene.worldRadius * 1.15;
    if (dSun > limit) {
      p.x *= limit / dSun;
      p.y *= limit / dSun;
      p.vx *= 0.4;
      p.vy *= 0.4;
    }
  }

  updateMotion(dt) {
    for (const p of this.planets) {
      for (const m of p.moons) m.phase += m.orbitSpeed * dt;
    }
    this.station.phase += this.station.orbitSpeed * dt;
    for (const r of this.rocks) {
      if (r.gone) continue;
      r.heading += r.spin * dt;
      r.radius = rockVisualRadius(r);
      r.drawSize = rockVisualDrawSize(r);
    }
    for (const n of this.npcs) {
      n.heading += Math.sin(this.time * 0.3 + n.speed * 0.01) * 0.35 * dt;
      const f = headingVector(n.heading);
      n.x += f.x * n.speed * dt;
      n.y += f.y * n.speed * dt;
      const bounced = resolvePlayCollisions(n, this.rocks);
      n.x = bounced.x;
      n.y = bounced.y;
    }
  }

  laserHeld() {
    return this.cutHeld || this.keys.has(" ") || this.keys.has("Space") || this.keys.has("Spacebar");
  }

  updateMining(dt) {
    const holding = this.laserHeld();
    this.mining = false;
    if (!holding) {
      this.laserVis = Math.max(0, (this.laserVis || 0) - dt * 3.2);
      if (this.laserVis <= 0) {
        this.laserHit = null;
        this.audio.stopLaser();
      }
      return;
    }
    this.laserVis = 1;
    if (this.player.fuel < 0.4) {
      this.audio.stopLaser();
      this.toast("PIP: Flux too thin to cut.");
      return;
    }
    this.audio.startLaser();
    this.player.fuel -= 3.8 * dt;
    const p = this.player;
    const fwd = headingVector(p.heading);
    const originX = p.x + fwd.x * (p.radius * 0.7);
    const originY = p.y + fwd.y * (p.radius * 0.7);
    const hit = nearestMiningTarget(originX, originY, p.heading, LASER_RANGE, this.rocks);
    this.laserHit = hit || {
      x: originX + fwd.x * LASER_RANGE,
      y: originY + fwd.y * LASER_RANGE,
      miss: true,
    };
    if (!hit) return;
    this.mining = true;
    const rock = this.rocks[hit.index];
    const pending = (this.chips || []).reduce((n, c) => n + c.amount, 0) + (this.cutAcc || 0);
    const space = cargoSpace(this.player.cargo) - pending;
    const result = cutRock(rock, dt, space);
    this.rocks[hit.index] = result.rock;
    if (result.full) {
      this.toast("PIP: Hold is full. Sell at the Anchorage before we invent a second ship.");
      return;
    }
    if (result.extracted > 0) {
      const spec = MINERALS[result.mineral];
      this.burst(hit.x, hit.y, 0, spec.color, 2);
      this.cutAcc = (this.cutAcc || 0) + result.extracted;
      this.cutMineral = result.mineral;
      this.cutSprite = rock.spriteIndex;
      while (this.cutAcc >= CHIP_MASS && (this.chips || []).length < 28) {
        this.spawnChip(hit.x, hit.y, result.mineral, CHIP_MASS, rock.spriteIndex);
        this.cutAcc -= CHIP_MASS;
      }
      if (result.rock.reserve <= 0) {
        if (this.cutAcc > 0.001) {
          this.spawnChip(hit.x, hit.y, result.mineral, this.cutAcc, rock.spriteIndex);
          this.cutAcc = 0;
        }
        this.rocks[hit.index].gone = true;
        this.toast(`PIP: Rock spent. Reeling in ${spec.name}.`);
      }
    }
  }

  spawnChip(x, y, mineral, amount, spriteIndex) {
    const p = this.player;
    const kick = ejectChipVelocity(x, y, p.x, p.y);
    this.chips.push({
      x,
      y,
      vx: kick.vx + p.vx * 0.2,
      vy: kick.vy + p.vy * 0.2,
      mineral,
      amount,
      spriteIndex,
      drawSize: 16 + Math.min(14, amount * 22),
      heading: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 8,
      life: 5.5,
    });
  }

  ingestChip(chip) {
    const id = chip.mineral;
    this.player.cargo = { ...this.player.cargo, [id]: (this.player.cargo[id] || 0) + chip.amount };
    this.flags = applyMine(this.flags, id, chip.amount);
  }

  updateChips(dt) {
    if (!this.chips.length) return;
    const p = this.player;
    const next = [];
    for (const chip of this.chips) {
      const moved = tractorStep(chip, p.x, p.y, dt);
      if (chipCollected(moved, p.x, p.y, p.radius + TRACTOR_CATCH)) {
        this.ingestChip(moved);
        continue;
      }
      next.push(moved);
    }
    this.chips = next;
  }

  burst(x, y, ang, color, n) {
    for (let i = 0; i < n; i++) {
      const a = ang + (Math.random() - 0.5) * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * (20 + Math.random() * 70),
        vy: Math.sin(a) * (20 + Math.random() * 70),
        life: 0.2 + Math.random() * 0.4,
        color,
      });
    }
  }

  updateParticles(dt) {
    for (const q of this.particles) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.life -= dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  kill(reason) {
    this.audio.stopLaser();
    document.getElementById("dead-reason").textContent = reason;
    this.show("dead");
  }

  save() {
    if (!this.player) return;
    if (this.cutAcc > 0.001 && this.cutMineral) {
      this.ingestChip({ mineral: this.cutMineral, amount: this.cutAcc });
      this.cutAcc = 0;
    }
    for (const chip of this.chips) this.ingestChip(chip);
    this.chips = [];
    const data = {
      flags: this.flags,
      player: this.player,
      rocks: this.rocks.map((r) => ({ id: r.id, reserve: r.reserve, gone: r.gone })),
      time: this.time,
      credits: this.player.credits,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    this.refreshContinue();
  }

  deserialize(data) {
    this.reset(false);
    this.flags = data.flags || {};
    Object.assign(this.player, data.player);
    this.player.cargo = data.player?.cargo || {};
    if (!this.player.drawSize) this.player.drawSize = this.scene.player.drawSize;
    this.time = data.time || 0;
    if (Array.isArray(data.rocks)) {
      const byId = new Map(data.rocks.map((r) => [r.id, r]));
      for (const rock of this.rocks) {
        const saved = byId.get(rock.id);
        if (!saved) continue;
        rock.reserve = saved.reserve;
        rock.gone = saved.gone;
        rock.radius = rockVisualRadius(rock);
        rock.drawSize = rockVisualDrawSize(rock);
      }
    }
    this.syncHud();
  }

  toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    this.toastTimer = 4.2;
  }

  resize() {
    const rect = this.view.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.view.width = Math.max(1, rect.width * dpr);
    this.view.height = Math.max(1, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  }

  screenToWorld(sx, sy) {
    const p = this.player || { x: 0, y: 0 };
    return {
      x: (sx - this.w / 2) / this.zoom + p.x,
      y: (sy - this.h / 2) / this.zoom + p.y,
    };
  }

  worldToScreen(x, y) {
    const p = this.player || { x: 0, y: 0 };
    return {
      x: (x - p.x) * this.zoom + this.w / 2,
      y: (y - p.y) * this.zoom + this.h / 2,
    };
  }

  draw() {
    if (!this.w) this.resize();
    const ctx = this.ctx;
    ctx.fillStyle = "#05010a";
    ctx.fillRect(0, 0, this.w, this.h);
    if (!this.ready || !this.player) {
      ctx.fillStyle = "#5ce1ff";
      ctx.font = "16px Share Tech Mono, monospace";
      ctx.fillText("Generating Helios…", 24, 40);
      return;
    }
    ctx.save();
    ctx.translate((this.shake && (Math.random() - 0.5) * this.shake) || 0, (this.shake && (Math.random() - 0.5) * this.shake) || 0);

    this.drawBackground(ctx);
    this.drawSunGlow(ctx);
    this.drawSprite(ctx, this.scene.sun.spriteIndex, 0, 0, this.scene.sun.drawSize, 0, false);
    for (const planet of this.planets) {
      this.drawSprite(ctx, planet.spriteIndex, planet.x, planet.y, planet.drawSize, 0, true);
      for (const moon of planet.moons) {
        const mp = moonWorldPos(planet, moon);
        this.drawSprite(ctx, moon.spriteIndex, mp.x, mp.y, moon.drawSize, 0, true);
      }
    }
    const sp = this.stationPos();
    this.drawSprite(ctx, this.station.spriteIndex, sp.x, sp.y, this.station.drawSize, this.station.phase, false);
    for (const rock of this.rocks) {
      if (rock.gone) continue;
      this.drawSprite(ctx, rock.spriteIndex, rock.x, rock.y, rock.drawSize, rock.heading, false);
    }
    for (const n of this.npcs) {
      this.drawSprite(ctx, n.spriteIndex, n.x, n.y, n.drawSize, n.heading, false);
    }
    if (this.player.nav) this.drawNav(ctx);
    this.drawLaser(ctx);
    this.drawTractor(ctx);
    this.drawChips(ctx);
    this.drawSprite(ctx, this.scene.player.spriteIndex, this.player.x, this.player.y, this.player.drawSize, this.player.heading, false);
    for (const q of this.particles) {
      ctx.globalAlpha = clamp(q.life * 2, 0, 1);
      ctx.fillStyle = q.color;
      const s = this.worldToScreen(q.x, q.y);
      ctx.fillRect(s.x - 1, s.y - 1, 2.4, 2.4);
      ctx.globalAlpha = 1;
    }
    this.drawLabels(ctx);
    ctx.restore();
    this.drawVignette(ctx);
    this.drawRadar();
  }

  drawBackground(ctx) {
    const bg = this.sprites[this.scene.background.spriteIndex];
    if (!bg) return;
    const tw = bg.width;
    const th = bg.height;
    const ox = Math.round(((this.player.x * 0.035) % tw + tw) % tw);
    const oy = Math.round(((this.player.y * 0.035) % th + th) % th);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let y = -oy; y < this.h; y += th) {
      for (let x = -ox; x < this.w; x += tw) ctx.drawImage(bg, x, y);
    }
    ctx.restore();
  }

  drawSunGlow(ctx) {
    const s = this.worldToScreen(0, 0);
    const glowR = (this.scene.sun.drawSize * 0.55) * this.zoom;
    const glow = ctx.createRadialGradient(s.x, s.y, glowR * 0.18, s.x, s.y, glowR);
    glow.addColorStop(0, "rgba(255, 230, 170, 0.22)");
    glow.addColorStop(0.45, "rgba(255, 180, 80, 0.08)");
    glow.addColorStop(1, "rgba(255, 140, 40, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSprite(ctx, spriteIndex, x, y, drawSize, rotation, lightFromSun) {
    const img = this.sprites[spriteIndex];
    if (!img) return;
    const p = this.worldToScreen(x, y);
    const native = Math.min(img.width, img.height);
    const target = Math.max(6, (drawSize || native) * this.zoom);
    const size = Math.min(target, native);
    ctx.save();
    ctx.translate(p.x, p.y);
    let rot = rotation || 0;
    if (lightFromSun) rot = Math.atan2(y, x);
    ctx.rotate(rot);
    const downscaling = size + 0.5 < native;
    ctx.imageSmoothingEnabled = downscaling;
    if (downscaling) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  drawLaser(ctx) {
    if (!this.laserHit || (this.laserVis || 0) <= 0) return;
    const p = this.player;
    const fwd = headingVector(p.heading);
    const ox = p.x + fwd.x * (p.radius * 0.7);
    const oy = p.y + fwd.y * (p.radius * 0.7);
    const a = this.worldToScreen(ox, oy);
    const b = this.worldToScreen(this.laserHit.x, this.laserHit.y);
    const mineral = this.laserHit.rock ? MINERALS[this.laserHit.rock.mineral] : null;
    const color = mineral ? mineral.color : "#5ce1ff";
    ctx.save();
    ctx.globalAlpha = Math.max(0.35, this.laserVis);
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.lineWidth = this.mining ? 6 : 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.lineWidth = this.mining ? 2.2 : 1.2;
    ctx.strokeStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (this.mining) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawTractor(ctx) {
    if (!this.chips.length) return;
    const origin = this.worldToScreen(this.player.x, this.player.y);
    ctx.save();
    ctx.lineCap = "round";
    for (const chip of this.chips) {
      const spec = MINERALS[chip.mineral];
      const dest = this.worldToScreen(chip.x, chip.y);
      const color = spec ? spec.color : "#5ce1ff";
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(dest.x, dest.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#d9f8ff";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(dest.x, dest.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawChips(ctx) {
    for (const chip of this.chips) {
      this.drawSprite(ctx, chip.spriteIndex, chip.x, chip.y, chip.drawSize, chip.heading, false);
    }
  }

  drawNav(ctx) {
    const p = this.player;
    const a = this.worldToScreen(p.x, p.y);
    const b = this.worldToScreen(p.nav.x, p.nav.y);
    ctx.save();
    ctx.strokeStyle = "rgba(255,193,74,0.7)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawLabels(ctx) {
    ctx.font = "12px Share Tech Mono, monospace";
    const maybe = (name, x, y, r, color) => {
      if (dist(this.player.x, this.player.y, x, y) > r + 500) return;
      const s = this.worldToScreen(x, y);
      ctx.fillStyle = color;
      ctx.fillText(name, s.x + r * this.zoom + 6, s.y);
    };
    maybe(this.scene.sun.name, 0, 0, this.scene.sun.radius, "#ffc14a");
    for (const p of this.planets) maybe(p.name, p.x, p.y, p.radius, "#ffc14a");
    const sp = this.stationPos();
    maybe(this.station.name, sp.x, sp.y, this.station.radius, "#5ce1ff");
    const ghost = this.rocks.find((r) => r.story && !r.gone);
    if (ghost && nextMissionIndex(this.flags) >= 6) {
      maybe("Ghost Vein", ghost.x, ghost.y, ghost.radius, "#e56bff");
    }
  }

  drawVignette(ctx) {
    const g = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.2, this.w / 2, this.h / 2, this.h * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.fillStyle = "#5ce1ff";
    ctx.font = "13px Share Tech Mono, monospace";
    ctx.fillText(TITLE, 16, 22);
    ctx.fillStyle = "#7f93b8";
    const p = this.player;
    ctx.fillText(
      `HULL ${p.hull | 0}   SPD ${Math.hypot(p.vx, p.vy) | 0}   ${this.mining ? "CUTTING" : this.chips.length ? "TRACTOR" : this.laserHeld() ? "LASER" : "DRIFT"}`,
      16,
      40
    );
  }

  drawRadar() {
    const rtx = this.rtx;
    const w = this.radar.width;
    const h = this.radar.height;
    rtx.fillStyle = "#05070f";
    rtx.fillRect(0, 0, w, h);
    rtx.strokeStyle = "rgba(92,225,255,0.25)";
    rtx.beginPath();
    rtx.arc(w / 2, h / 2, 90, 0, Math.PI * 2);
    rtx.stroke();
    const scale = 0.032;
    const plot = (x, y, color, size = 3) => {
      rtx.fillStyle = color;
      rtx.fillRect(w / 2 + (x - this.player.x) * scale - size / 2, h / 2 + (y - this.player.y) * scale - size / 2, size, size);
    };
    plot(0, 0, "#ffc14a", 6);
    for (const p of this.planets) plot(p.x, p.y, p.kind === "gas" ? "#d48cff" : "#7ec8ff", 3);
    const s = this.stationPos();
    plot(s.x, s.y, "#5ce1ff", 4);
    for (const r of this.rocks) {
      if (r.gone) continue;
      if (dist(this.player.x, this.player.y, r.x, r.y) > 1800) continue;
      plot(r.x, r.y, r.story ? "#e56bff" : MINERALS[r.mineral].color, r.story ? 4 : 2);
    }
    plot(this.player.x, this.player.y, "#ffffff", 4);
    if (this.player.nav) {
      rtx.strokeStyle = "#ffc14a";
      rtx.beginPath();
      rtx.moveTo(w / 2, h / 2);
      rtx.lineTo(w / 2 + (this.player.nav.x - this.player.x) * scale, h / 2 + (this.player.nav.y - this.player.y) * scale);
      rtx.stroke();
    }
  }

  syncHud() {
    if (!this.player) return;
    const p = this.player;
    const mission = MISSIONS[nextMissionIndex(this.flags)];
    document.getElementById("callsign").textContent = CALLSIGN;
    document.getElementById("mission-title").textContent = mission.title;
    document.getElementById("mission-brief").textContent = mission.brief;
    document.getElementById("coords").textContent = `${p.x | 0}, ${p.y | 0}`;
    document.getElementById("credits").textContent = formatCredits(p.credits);
    document.getElementById("fuel").textContent = p.fuel | 0;
    document.getElementById("hold").textContent = `${formatTonnes(cargoMass(p.cargo))} / ${CARGO_CAPACITY}t`;
    document.getElementById("clock").textContent = new Date(this.time * 1000).toISOString().substring(14, 19);
    const laser = document.getElementById("laser-state");
    if (laser) laser.textContent = this.mining ? "CUTTING" : this.chips.length ? "TRACTOR" : this.laserHeld() ? "BEAM" : "IDLE";
    const cargo = document.getElementById("cargo");
    const entries = Object.entries(p.cargo).filter(([, n]) => n > 0.05);
    cargo.innerHTML = entries.length
      ? entries
          .map(([id, n]) => {
            const spec = MINERALS[id];
            return `<li><i style="background:${spec.color}"></i>${spec.name} <b>${formatTonnes(n)}</b> <span>${this.prices[id]} CR/t</span></li>`;
          })
          .join("")
      : "<li>empty</li>";
  }
}
