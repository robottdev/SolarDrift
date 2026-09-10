import {
  DEFAULT_POWER,
  WAVEFORMS,
  angleTo,
  allocatedTotal,
  canEnterGate,
  clamp,
  dist,
  facingShieldKey,
  gateExplodes,
  hyperdriveDrain,
  hyperdriveSpeed,
  laserDamage,
  lifeSupportDrain,
  maxSpeed,
  missileDamage,
  navHazard,
  nextMissionIndex,
  repairRate,
  sensorRange,
  sensorZoom,
  setSystemPower,
  shieldAbsorb,
  shortestAngle,
  thrustAccel,
  unallocated,
  wrapAngle,
} from "/lib/logic.js";
import { AudioEngine } from "./audio.js";
import {
  DIALOGUE,
  INTRO,
  ITEMS,
  MISSIONS,
  PLANETS,
  TITLE,
} from "./data.js";

const SAVE_KEY = "solar-drift-save-v1";
const SYS_META = [
  ["weapons", "WEAPONS"],
  ["lifeSupport", "LIFE"],
  ["engines", "ENGINES"],
  ["sensors", "SENSORS"],
  ["shieldFore", "SH FWD"],
  ["shieldAft", "SH AFT"],
  ["shieldPort", "SH PORT"],
  ["shieldStarboard", "SH STBD"],
];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

export class Game {
  constructor() {
    this.audio = new AudioEngine();
    this.view = document.getElementById("view");
    this.radar = document.getElementById("radar");
    this.ctx = this.view.getContext("2d");
    this.rtx = this.radar.getContext("2d");
    this.keys = new Set();
    this.stars = Array.from({ length: 420 }, () => ({
      x: Math.random() * 8000 - 4000,
      y: Math.random() * 8000 - 4000,
      z: Math.random() * 2 + 0.3,
      a: Math.random(),
    }));
    this.shake = 0;
    this.toastTimer = 0;
    this.introIndex = 0;
    this.dialogue = null;
    this.mode = "title";
    this.last = 0;
    this.buildSystems();
    this.bind();
    this.reset(false);
    this.refreshContinue();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  buildSystems() {
    const root = document.getElementById("systems");
    root.innerHTML = SYS_META.map(
      ([key, label]) => `
      <div class="sys" data-sys="${key}">
        <span>${label}</span>
        <button data-act="pwr" data-key="${key}" data-dir="-1">-</button>
        <div class="bar"><i></i></div>
        <button data-act="pwr" data-key="${key}" data-dir="1">+</button>
        <b>0</b>
      </div>`
    ).join("");
    const banks = document.getElementById("banks");
    banks.innerHTML = [1, 2, 3]
      .map((n) => `<button data-act="banks" data-n="${n}">${n}</button>`)
      .join("");
  }

  bind() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.key);
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      if (this.mode === "play") this.handleKey(e);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));
    this.view.addEventListener("mousedown", (e) => {
      if (this.mode !== "play") return;
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      this.player.nav = world;
      this.toast(`Course plotted: ${world.x | 0}, ${world.y | 0}`);
      this.audio.ui();
    });
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
      if (Number.isFinite(x) && Number.isFinite(y)) {
        this.player.nav = { x, y };
        this.toast(`Course plotted: ${x}, ${y}`);
      }
    };
  }

  refreshContinue() {
    document.getElementById("btn-continue").disabled = !localStorage.getItem(SAVE_KEY);
  }

  show(mode) {
    for (const id of ["title", "how", "intro", "game", "dialogue", "pause", "dead", "ending"]) {
      document.getElementById(id).classList.toggle("hidden", id !== mode && !(mode === "play" && id === "game") && !(mode === "dialogue" && id === "game") && !(mode === "pause" && id === "game"));
    }
    if (mode === "play" || mode === "dialogue" || mode === "pause") {
      document.getElementById("game").classList.remove("hidden");
    }
    this.mode = mode === "game" ? "play" : mode;
    if (mode === "play") this.resize();
  }

  startNew() {
    this.audio.resume();
    this.audio.titleSting();
    this.audio.startPad();
    this.reset(true);
    this.introIndex = 0;
    document.getElementById("intro-text").textContent = INTRO[0];
    this.show("intro");
  }

  advanceIntro() {
    this.introIndex += 1;
    if (this.introIndex >= INTRO.length) {
      this.show("play");
      this.toast("Hold station. Cloaked contact inbound.");
      return;
    }
    document.getElementById("intro-text").textContent = INTRO[this.introIndex];
  }

  continueSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      this.deserialize(JSON.parse(raw));
      this.audio.resume();
      this.audio.startPad();
      this.show("play");
      this.toast("Save reconstructed.");
      return true;
    } catch {
      this.toast("Save corrupt.");
      return false;
    }
  }

  reset(fresh) {
    this.time = 0;
    this.flags = {};
    this.player = {
      x: 8,
      y: -22,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      hull: 100,
      maxHull: 100,
      waveform: "sine",
      shieldWave: "square",
      banks: 1,
      missiles: 6,
      fuel: 120,
      reactor: 220,
      power: { ...DEFAULT_POWER },
      shieldNow: { shieldFore: 10, shieldAft: 10, shieldPort: 10, shieldStarboard: 10 },
      cargo: [],
      hyperOn: false,
      hyperThrottle: 80,
      nav: null,
      fireCd: 0,
      missileCd: 0,
    };
    this.ships = [];
    this.projectiles = [];
    this.particles = [];
    this.spawnWorld(fresh);
    this.syncHud();
  }

  spawnWorld(fresh) {
    this.ships = [
      this.makeShip({
        id: "kade",
        name: "Kade",
        x: 36,
        y: -16,
        faction: "ally",
        cloaked: true,
        waveform: "saw",
        comms: "kade",
        ai: "hold",
      }),
    ];
    const patrols = [
      [-70, 110],
      [-40, 40],
      [20, 90],
    ];
    patrols.forEach(([x, y], i) => {
      this.ships.push(
        this.makeShip({
          id: `patrol-${i}`,
          name: "Authority Patrol",
          x,
          y,
          faction: "gov",
          waveform: pick(WAVEFORMS),
          ai: "orbit",
          orbit: { x: -90, y: 70, r: 70 + i * 18 },
        })
      );
    });
    if (!fresh && this.flags.reportedIn && !this.flags.convoyCleared) this.spawnConvoy();
    if (!fresh && this.flags.talkedLira && !this.flags.rescuedColony) this.spawnGunships();
  }

  makeShip(opts) {
    return {
      hull: 55,
      maxHull: 55,
      angle: rand(0, Math.PI * 2),
      vx: 0,
      vy: 0,
      dead: false,
      fireCd: rand(0, 1),
      hostile: opts.faction === "raider" || opts.faction === "warden",
      ...opts,
    };
  }

  spawnConvoy() {
    if (this.ships.some((s) => s.group === "convoy" && !s.dead)) return;
    for (let i = 0; i < 3; i++) {
      this.ships.push(
        this.makeShip({
          id: `smuggler-${i}`,
          name: "Smuggler",
          group: "convoy",
          x: 190 + i * 28,
          y: -80 - i * 16,
          faction: "raider",
          waveform: pick(WAVEFORMS),
          ai: "chase",
          hull: 48,
          maxHull: 48,
        })
      );
    }
    this.toast("Convoy transponders lit near Vela Hub.");
  }

  spawnGunships() {
    if (this.ships.some((s) => s.group === "guns" && !s.dead)) return;
    for (let i = 0; i < 4; i++) {
      this.ships.push(
        this.makeShip({
          id: `gun-${i}`,
          name: "Authority Gunship",
          group: "guns",
          x: -1460 + i * 30,
          y: 1100 + (i % 2) * 40,
          faction: "warden",
          waveform: pick(WAVEFORMS),
          ai: "chase",
          hull: 70,
          maxHull: 70,
        })
      );
    }
    this.toast("Gunships over Depot 9.");
  }

  handleKey(e) {
    const k = e.key;
    if (k === "c" || k === "C") this.hail();
    if (k === "v" || k === "V") this.scan();
    if (k === "t" || k === "T") this.transport();
    if (k === "h" || k === "H" || k === "F10") this.toggleHyper();
    if (k === "m" || k === "M") this.fireMissile();
    if (k === "1" || k === "2" || k === "3") this.player.banks = Number(k);
    if (k === "[") this.cycleWave("waveform", -1);
    if (k === "]") this.cycleWave("waveform", 1);
    if (k === ";") this.cycleWave("shieldWave", -1);
    if (k === "'") this.cycleWave("shieldWave", 1);
    if (k === "+" || k === "=") this.player.hyperThrottle = clamp(this.player.hyperThrottle + 10, 0, 240);
    if (k === "-" || k === "_") this.player.hyperThrottle = clamp(this.player.hyperThrottle - 10, 0, 240);
    if (k === "Escape") this.show("pause");
    if (k === " ") this.fireLaser();
  }

  onAction(act, data) {
    if (act === "pwr") {
      const dir = Number(data.dir);
      const p = this.player;
      p.power = setSystemPower(p.reactor, p.power, data.key, (p.power[data.key] || 0) + dir * 10);
      this.audio.ui();
      this.syncHud();
      return;
    }
    if (act === "banks") this.player.banks = Number(data.n);
    if (act === "w-wave") this.cycleWave("waveform", 1);
    if (act === "s-wave") this.cycleWave("shieldWave", 1);
    if (act === "hail") this.hail();
    if (act === "scan") this.scan();
    if (act === "transport") this.transport();
    if (act === "hyper") this.toggleHyper();
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

  cycleWave(field, dir) {
    const i = WAVEFORMS.indexOf(this.player[field]);
    this.player[field] = WAVEFORMS[(i + dir + WAVEFORMS.length) % WAVEFORMS.length];
    this.audio.ui();
  }

  lockObjective() {
    const mission = MISSIONS[nextMissionIndex(this.flags)];
    const body = PLANETS.find((p) => p.id === mission.targetId);
    const ship = this.ships.find((s) => s.id === mission.targetId && !s.dead);
    const t = body || ship;
    if (!t) {
      this.toast("No lock.");
      return;
    }
    this.player.nav = { x: t.x, y: t.y };
    this.toast(`Objective lock: ${t.name} (${t.x | 0}, ${t.y | 0})`);
  }

  nearestHail() {
    const p = this.player;
    let best = null;
    let bestD = 140;
    for (const body of PLANETS) {
      if (!body.hailable) continue;
      const d = dist(p.x, p.y, body.x, body.y) - body.radius;
      if (d < bestD) {
        bestD = d;
        best = { type: "planet", ref: body, comms: body.comms };
      }
    }
    for (const ship of this.ships) {
      if (ship.dead || ship.cloaked || !ship.comms) continue;
      const d = dist(p.x, p.y, ship.x, ship.y);
      if (d < bestD) {
        bestD = d;
        best = { type: "ship", ref: ship, comms: ship.comms };
      }
    }
    return best;
  }

  hail() {
    if (this.mode !== "play") return;
    const target = this.nearestHail();
    if (!target) {
      this.toast("No comms lock. Close range and retry.");
      return;
    }
    this.openDialogue(target.comms);
  }

  scan() {
    const p = this.player;
    const range = sensorRange(p.power.sensors) * (this.hasItem("scanner") ? 1.35 : 1);
    let hit = null;
    let best = range;
    for (const body of PLANETS) {
      const d = dist(p.x, p.y, body.x, body.y);
      if (d < best) {
        best = d;
        hit = body;
      }
    }
    for (const ship of this.ships) {
      if (ship.dead) continue;
      if (ship.cloaked && p.power.sensors < 90 && !this.hasItem("scanner")) continue;
      const d = dist(p.x, p.y, ship.x, ship.y);
      if (d < best) {
        best = d;
        hit = { name: ship.name, scan: `${ship.name} · hull ${ship.hull | 0}/${ship.maxHull} · wave ${ship.waveform}` };
      }
    }
    if (!hit) {
      this.toast("Scan: empty volume.");
      return;
    }
    this.toast(`SCAN ${hit.name}: ${hit.scan}`);
    this.audio.hail();
  }

  transport() {
    const p = this.player;
    const body = PLANETS.find((b) => dist(p.x, p.y, b.x, b.y) < b.radius + 70);
    if (!body) {
      this.toast("No transport lock.");
      return;
    }
    if (body.id === "vortex" && this.hasItem("voidseed") && !this.flags.ejectedVoidseed) {
      this.removeItem("voidseed");
      this.flags.ejectedVoidseed = true;
      this.toast("Voidseed transported into the aperture. Geometry unlocking.");
      this.save();
      return;
    }
    if (body.cargo === "scanner" && !this.flags.hasScanner) {
      this.giveItem("scanner");
      this.flags.hasScanner = true;
      this.toast("Echo Scanner in the hold. Sensors bite deeper.");
      this.save();
      return;
    }
    if (body.cargo === "crystals" && this.flags.rescuedColony && !this.flags.hasCrystals) {
      this.giveItem("crystals");
      this.flags.hasCrystals = true;
      p.reactor += 160;
      p.fuel = 220;
      this.toast("Flux Crystals seated. Reactor climbing.");
      this.save();
      return;
    }
    this.toast(`Nothing to transfer at ${body.name}.`);
  }

  giveItem(id) {
    if (!this.hasItem(id)) this.player.cargo.push(id);
  }

  removeItem(id) {
    this.player.cargo = this.player.cargo.filter((c) => c !== id);
  }

  hasItem(id) {
    return this.player.cargo.includes(id);
  }

  toggleHyper() {
    if (!this.hasItem("hyperdrive")) {
      this.toast("No Hyperdrive Core installed.");
      return;
    }
    const hazard = navHazard(this.player.x, this.player.y, PLANETS, this.ships.filter((s) => s !== this));
    if (!this.player.hyperOn && hazard) {
      this.toast(`NAV HAZARD: ${hazard}`);
      return;
    }
    this.player.hyperOn = !this.player.hyperOn;
    this.audio.setHyper(this.player.hyperOn);
    this.toast(this.player.hyperOn ? "Hyperdrive engaged." : "Hyperdrive cut.");
  }

  openDialogue(id) {
    const pack = DIALOGUE[id];
    if (!pack) return;
    const idx = this.dialogueStart(id);
    if (idx === -1) {
      this.toast("No comms handshake. Wrong target, or this channel is closed.");
      return;
    }
    this.audio.hail();
    this.dialogue = { id, pack, idx };
    this.renderDialogue();
    this.show("dialogue");
  }

  dialogueStart(id) {
    const f = this.flags;
    if (id === "kade") return f.talkedKade ? -1 : 0;
    if (id === "wreck") return 0;
    if (id === "hale") {
      if (f.hasCrystals && !f.hasVoidseed) return 3;
      if (f.convoyCleared && !f.hasHyperdrive) return 2;
      if (f.hasScanner && !f.reportedIn) return 0;
      if (!f.hasScanner) return 0;
      return -1;
    }
    if (id === "lira") {
      if (f.hasVoidseed && !f.warnedLira) return 2;
      if (f.hasHyperdrive && !f.talkedLira) return 0;
      return f.talkedLira ? -1 : 0;
    }
    if (id === "depot") return 0;
    if (id === "colony") {
      const guns = this.ships.filter((s) => s.group === "guns");
      if (guns.some((s) => !s.dead)) return -1;
      return f.rescuedColony ? -1 : 0;
    }
    if (id === "vortex") return this.flags.ejectedVoidseed ? 1 : 0;
    if (id === "vela") return 0;
    if (id === "nyx") return 0;
    return 0;
  }

  renderDialogue() {
    const { pack, idx } = this.dialogue;
    const node = pack.lines[idx];
    document.getElementById("who").textContent = pack.speaker;
    document.getElementById("portrait").style.background = pack.portrait;
    let text = node.text;
    if (node.require && !this.flags[node.require]) text = node.failText || text;
    if (node.requireNotEjected && this.flags.ejectedVoidseed) text = pack.lines[1].text;
    if (node.requireEjected && !this.flags.ejectedVoidseed) text = pack.lines[0].text;
    document.getElementById("line").textContent = text;
    const box = document.getElementById("choices");
    const blocked = node.require && !this.flags[node.require];
    const choices = blocked
      ? [{ label: "Close channel.", next: "close" }]
      : node.choices;
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
    if (choice.give) {
      this.giveItem(choice.give);
      if (choice.give === "hyperdrive") this.toast("Hyperdrive Core online. H / F10 when the sky is clear.");
      if (choice.give === "voidseed") this.toast("Voidseed in the hold. Lira will want a word.");
    }
    if (choice.eject) {
      this.removeItem("voidseed");
      this.flags.ejectedVoidseed = true;
    }
    if (choice.flag === "reportedIn") this.spawnConvoy();
    if (choice.flag === "talkedLira") this.spawnGunships();
    if (choice.flag === "hasVoidseed") {
      setTimeout(() => {
        if (this.mode === "play") this.openDialogue("lira");
      }, 600);
    }
    if (choice.flag === "enteredGate") {
      this.closeDialogue();
      this.finish();
      return;
    }
    if (choice.next == null) {
      this.save();
      this.closeDialogue();
      this.syncHud();
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
    document.getElementById("ending-text").textContent =
      "Nyx has a starfix and a war. The Wardens still keep bottles. Episode II would hunt the Controller — but this breakout is yours. The cage wall is open.";
    this.show("ending");
    this.audio.setHyper(false);
  }

  fireLaser() {
    const p = this.player;
    if (p.fireCd > 0) return;
    const cost = 0.35 * p.banks;
    if (p.fuel < cost) {
      this.toast("Flux too thin to fire.");
      return;
    }
    p.fuel -= cost;
    p.fireCd = 0.18 + (3 - p.banks) * 0.05;
    this.audio.laser();
    const spread = (p.banks - 1) * 0.08;
    for (let i = 0; i < p.banks; i++) {
      const a = p.angle + (i - (p.banks - 1) / 2) * spread;
      this.projectiles.push({
        x: p.x + Math.cos(a) * 18,
        y: p.y + Math.sin(a) * 18,
        vx: Math.cos(a) * 520 + p.vx,
        vy: Math.sin(a) * 520 + p.vy,
        life: 1.1,
        from: "player",
        wave: p.waveform,
        missile: false,
        banks: p.banks,
      });
    }
  }

  fireMissile() {
    const p = this.player;
    if (p.missileCd > 0 || p.missiles <= 0) return;
    p.missiles -= 1;
    p.missileCd = 0.8;
    this.audio.missile();
    this.projectiles.push({
      x: p.x,
      y: p.y,
      vx: Math.cos(p.angle) * 280 + p.vx,
      vy: Math.sin(p.angle) * 280 + p.vy,
      life: 2.2,
      from: "player",
      wave: p.waveform,
      missile: true,
      target: this.nearestEnemy(),
    });
  }

  nearestEnemy() {
    let best = null;
    let d = 1e9;
    for (const s of this.ships) {
      if (s.dead || !s.hostile) continue;
      const n = dist(this.player.x, this.player.y, s.x, s.y);
      if (n < d) {
        d = n;
        best = s;
      }
    }
    return best;
  }

  loop(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000 || 0.016);
    this.last = t;
    if (this.mode === "play") this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) document.getElementById("toast").classList.add("hidden");
    }
    const kade = this.ships.find((s) => s.id === "kade");
    if (kade && kade.cloaked && this.time > 3.2) {
      kade.cloaked = false;
      this.toast("Contact uncloaked. Hail with C.");
    }

    this.steerPlayer(dt);
    this.updateShips(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.regen(dt);
    this.missionWatch();
    const sec = this.time | 0;
    const prev = (this.time - dt) | 0;
    if (sec !== prev && sec % 2 === 0) this.syncHud();
    if (sec !== prev && sec % 20 === 0) this.save();
    this.shake = Math.max(0, this.shake - dt * 8);
  }

  steerPlayer(dt) {
    const p = this.player;
    const rot = 2.6;
    if (this.keys.has("a") || this.keys.has("A") || this.keys.has("ArrowLeft")) p.angle -= rot * dt;
    if (this.keys.has("d") || this.keys.has("D") || this.keys.has("ArrowRight")) p.angle += rot * dt;

    if (p.nav) {
      const desired = angleTo(p.x, p.y, p.nav.x, p.nav.y);
      const delta = shortestAngle(p.angle, desired);
      p.angle = wrapAngle(p.angle + clamp(delta, -rot * dt, rot * dt));
      if (dist(p.x, p.y, p.nav.x, p.nav.y) < 28) p.nav = null;
    }

    const thrusting =
      this.keys.has("w") ||
      this.keys.has("W") ||
      this.keys.has("ArrowUp") ||
      Boolean(p.nav);
    const reverse = this.keys.has("s") || this.keys.has("S") || this.keys.has("ArrowDown");
    const accel = thrustAccel(p.power.engines);
    if (thrusting) {
      p.vx += Math.cos(p.angle) * accel * dt;
      p.vy += Math.sin(p.angle) * accel * dt;
      this.burst(p.x - Math.cos(p.angle) * 12, p.y - Math.sin(p.angle) * 12, p.angle + Math.PI, "#5ce1ff", 2);
    }
    if (reverse) {
      p.vx -= Math.cos(p.angle) * accel * 0.45 * dt;
      p.vy -= Math.sin(p.angle) * accel * 0.45 * dt;
    }

    let speedCap = maxSpeed(p.power.engines);
    if (p.hyperOn) {
      const hazard = navHazard(p.x, p.y, PLANETS, this.ships);
      if (hazard) {
        p.hyperOn = false;
        this.audio.setHyper(false);
        this.toast(`Hyperdrive abort: ${hazard}`);
      } else if (p.fuel <= 0) {
        p.hyperOn = false;
        this.audio.setHyper(false);
        this.toast("Flux dry. Hyperdrive cut.");
      } else {
        speedCap = hyperdriveSpeed(p.power.engines, Math.min(p.hyperThrottle, p.power.engines));
        p.fuel -= hyperdriveDrain(Math.min(p.hyperThrottle, p.power.engines), dt);
        this.burst(p.x, p.y, p.angle + Math.PI, "#e56bff", 6);
      }
    }

    const sp = Math.hypot(p.vx, p.vy);
    if (sp > speedCap) {
      p.vx *= speedCap / sp;
      p.vy *= speedCap / sp;
    }
    p.vx *= thrusting || p.hyperOn ? 0.995 : 0.96;
    p.vy *= thrusting || p.hyperOn ? 0.995 : 0.96;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.fireCd = Math.max(0, p.fireCd - dt);
    p.missileCd = Math.max(0, p.missileCd - dt);
    if (this.keys.has(" ")) this.fireLaser();

    this.checkGate();
  }

  checkGate() {
    const gate = PLANETS.find((p) => p.id === "vortex");
    const d = dist(this.player.x, this.player.y, gate.x, gate.y);
    if (d > gate.radius - 8) return;
    if (gateExplodes(this.flags)) {
      this.kill("Voidseed mixed with the gate geometry. Both sides of the door went white.");
      return;
    }
    if (canEnterGate(this.flags) && !this.flags.enteredGate) {
      this.player.hyperOn = false;
      this.audio.setHyper(false);
      this.openDialogue("nyx");
    } else if (!this.flags.hasVoidseed) {
      this.player.vx *= -1.2;
      this.player.vy *= -1.2;
      this.toast("GEOMETRY LOCK. The door will not take you yet.");
    }
  }

  updateShips(dt) {
    for (const s of this.ships) {
      if (s.dead) continue;
      if (s.cloaked) continue;
      if (s.ai === "orbit" && s.orbit) {
        const a = angleTo(s.orbit.x, s.orbit.y, s.x, s.y) + 0.4 * dt;
        s.x = s.orbit.x + Math.cos(a) * s.orbit.r;
        s.y = s.orbit.y + Math.sin(a) * s.orbit.r;
        s.angle = a + Math.PI / 2;
      }
      if (s.ai === "chase" || s.hostile) {
        const desired = angleTo(s.x, s.y, this.player.x, this.player.y);
        s.angle = wrapAngle(s.angle + clamp(shortestAngle(s.angle, desired), -2 * dt, 2 * dt));
        s.vx += Math.cos(s.angle) * 80 * dt;
        s.vy += Math.sin(s.angle) * 80 * dt;
        const cap = 140;
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > cap) {
          s.vx *= cap / sp;
          s.vy *= cap / sp;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.fireCd -= dt;
        const d = dist(s.x, s.y, this.player.x, this.player.y);
        if (d < 420 && s.fireCd <= 0 && Math.abs(shortestAngle(s.angle, desired)) < 0.4) {
          s.fireCd = 0.7;
          this.projectiles.push({
            x: s.x,
            y: s.y,
            vx: Math.cos(s.angle) * 400,
            vy: Math.sin(s.angle) * 400,
            life: 1.2,
            from: s.id,
            wave: s.waveform,
            missile: false,
          });
        }
      }
      if (s.ai === "hold") {
        s.angle += dt * 0.2;
      }
    }
  }

  updateProjectiles(dt) {
    const p = this.player;
    for (const shot of this.projectiles) {
      if (shot.missile && shot.target && !shot.target.dead) {
        const a = angleTo(shot.x, shot.y, shot.target.x, shot.target.y);
        shot.vx += Math.cos(a) * 400 * dt;
        shot.vy += Math.sin(a) * 400 * dt;
      }
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      if (shot.from === "player") {
        for (const s of this.ships) {
          if (s.dead || s.cloaked || s.faction === "ally") continue;
          if (dist(shot.x, shot.y, s.x, s.y) < 16) {
            const dmg = shot.missile
              ? missileDamage(p.power.weapons)
              : laserDamage(p.power.weapons, shot.banks || 1, shot.wave, s.waveform);
            s.hull -= dmg;
            shot.life = 0;
            this.burst(s.x, s.y, 0, "#ffc14a", 8);
            if (s.hull <= 0) this.destroyShip(s);
            if (!s.hostile && s.faction === "gov") s.hostile = true;
          }
        }
      } else if (dist(shot.x, shot.y, p.x, p.y) < 16) {
        this.hitPlayer(shot);
        shot.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter((s) => s.life > 0);
  }

  hitPlayer(shot) {
    const p = this.player;
    const impact = angleTo(p.x, p.y, shot.x, shot.y);
    const key = facingShieldKey(p.angle, impact);
    const incoming = shot.missile ? 28 : laserDamage(50, 1, shot.wave, p.shieldWave);
    const result = shieldAbsorb(p.shieldNow[key] || 0, incoming);
    p.shieldNow[key] = result.leftoverShield;
    p.hull -= result.hull;
    this.shake = 6;
    this.audio.hit();
    if (p.hull <= 0) this.kill("Hull integrity zero. The contract ends here.");
  }

  destroyShip(s) {
    s.dead = true;
    this.audio.explode();
    this.burst(s.x, s.y, 0, "#ff5a6a", 24);
    if (this.hasItem("siphon") || s.group === "convoy") {
      this.player.fuel = clamp(this.player.fuel + 18, 0, 260);
    }
    if (s.group === "convoy" && this.ships.filter((x) => x.group === "convoy" && !x.dead).length === 0) {
      this.flags.convoyCleared = true;
      this.giveItem("siphon");
      this.toast("Convoy down. Energy Siphon recovered. Hale is waiting.");
      this.save();
    }
    if (s.group === "guns" && this.ships.filter((x) => x.group === "guns" && !x.dead).length === 0) {
      this.flags.rescuedColony = true;
      this.toast("Gunships down. Hail the colony or the depot.");
      this.save();
    }
  }

  burst(x, y, ang, color, n) {
    for (let i = 0; i < n; i++) {
      const a = ang + rand(-1, 1);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * rand(20, 90),
        vy: Math.sin(a) * rand(20, 90),
        life: rand(0.2, 0.6),
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

  regen(dt) {
    const p = this.player;
    p.hull = clamp(p.hull + repairRate(p.power.lifeSupport) * dt, 0, p.maxHull);
    p.hull -= lifeSupportDrain(p.power.lifeSupport, dt);
    if (p.hull <= 0) this.kill("Life support starved the hull.");
    for (const key of ["shieldFore", "shieldAft", "shieldPort", "shieldStarboard"]) {
      const cap = p.power[key];
      if (p.shieldNow[key] < cap) p.shieldNow[key] = Math.min(cap, p.shieldNow[key] + cap * 0.12 * dt);
    }
    p.fuel = clamp(p.fuel + (this.hasItem("crystals") ? 2.5 : 0.6) * dt, 0, this.hasItem("crystals") ? 260 : 160);
  }

  missionWatch() {
    if (this.flags.hasVoidseed && !this.flags.warnedLira && dist(this.player.x, this.player.y, -90, 70) > 200) {
      this.flags.warnedLira = true;
      this.openDialogue("lira");
    }
  }

  kill(reason) {
    this.player.hyperOn = false;
    this.audio.setHyper(false);
    document.getElementById("dead-reason").textContent = reason;
    this.show("dead");
  }

  save() {
    const data = {
      flags: this.flags,
      player: this.player,
      ships: this.ships.map((s) => ({
        id: s.id,
        dead: s.dead,
        x: s.x,
        y: s.y,
        hostile: s.hostile,
        cloaked: s.cloaked,
        hull: s.hull,
        group: s.group,
        faction: s.faction,
        name: s.name,
        waveform: s.waveform,
        ai: s.ai,
        orbit: s.orbit,
        comms: s.comms,
      })),
      time: this.time,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    this.refreshContinue();
  }

  deserialize(data) {
    this.reset(false);
    this.flags = data.flags || {};
    Object.assign(this.player, data.player);
    this.player.power = { ...DEFAULT_POWER, ...(data.player?.power || {}) };
    this.time = data.time || 0;
    if (Array.isArray(data.ships) && data.ships.length) {
      this.ships = data.ships.map((s) => this.makeShip(s));
    }
    if (this.flags.reportedIn && !this.flags.convoyCleared) this.spawnConvoy();
    if (this.flags.talkedLira && !this.flags.rescuedColony) this.spawnGunships();
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
    const zoom = sensorZoom(this.player.power.sensors);
    const camx = this.player.x;
    const camy = this.player.y;
    return {
      x: (sx - this.w / 2) * zoom + camx,
      y: (sy - this.h / 2) * zoom + camy,
    };
  }

  draw() {
    if (!this.w) this.resize();
    const ctx = this.ctx;
    const p = this.player;
    const zoom = this.mode === "play" || this.mode === "dialogue" || this.mode === "pause" ? sensorZoom(p.power.sensors) : 1.4;
    ctx.fillStyle = "#02030a";
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.translate((this.shake && (Math.random() - 0.5) * this.shake) || 0, (this.shake && (Math.random() - 0.5) * this.shake) || 0);
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(1 / zoom, 1 / zoom);
    ctx.translate(-p.x, -p.y);

    this.drawStars(ctx, p, zoom);
    for (const body of PLANETS) this.drawBody(ctx, body, p);
    if (p.nav) this.drawNav(ctx, p);
    for (const s of this.ships) if (!s.dead && !s.cloaked) this.drawShip(ctx, s, false);
    this.drawShip(ctx, p, true);
    for (const shot of this.projectiles) {
      ctx.strokeStyle = shot.missile ? "#ffc14a" : "#5ce1ff";
      ctx.lineWidth = shot.missile ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y);
      ctx.lineTo(shot.x - shot.vx * 0.03, shot.y - shot.vy * 0.03);
      ctx.stroke();
    }
    for (const q of this.particles) {
      ctx.fillStyle = q.color;
      ctx.globalAlpha = clamp(q.life * 2, 0, 1);
      ctx.fillRect(q.x, q.y, 2, 2);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    this.drawVignette(ctx);
    this.drawRadar();
  }

  drawStars(ctx, p, zoom) {
    ctx.fillStyle = "#d7e6ff";
    for (const s of this.stars) {
      const par = 0.15 * s.z;
      const x = s.x + p.x * par;
      const y = s.y + p.y * par;
      ctx.globalAlpha = 0.35 + s.a * 0.65;
      ctx.fillRect(x, y, s.z, s.z);
    }
    ctx.globalAlpha = 1;
    if (p.hyperOn) {
      ctx.strokeStyle = "rgba(229,107,255,0.35)";
      for (let i = 0; i < 18; i++) {
        const a = p.angle + rand(-0.4, 0.4);
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(a) * 40, p.y - Math.sin(a) * 40);
        ctx.lineTo(p.x - Math.cos(a) * (180 + zoom * 40), p.y - Math.sin(a) * (180 + zoom * 40));
        ctx.stroke();
      }
    }
  }

  drawBody(ctx, body, p) {
    const g = ctx.createRadialGradient(body.x - body.radius * 0.3, body.y - body.radius * 0.3, 4, body.x, body.y, body.radius);
    g.addColorStop(0, body.color);
    g.addColorStop(1, body.color2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
    ctx.fill();
    if (body.kind === "gate") {
      ctx.strokeStyle = "#5cffc8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(body.x, body.y, body.radius * 0.55, body.radius, this.time, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (body.kind === "star") {
      ctx.fillStyle = "rgba(255,180,70,0.12)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    const labelZoom = sensorZoom(p.power.sensors);
    if (labelZoom < 3.5 || dist(p.x, p.y, body.x, body.y) < 500) {
      ctx.fillStyle = "#ffc14a";
      ctx.font = "12px Share Tech Mono, monospace";
      ctx.fillText(body.name, body.x + body.radius + 6, body.y);
    }
  }

  drawNav(ctx, p) {
    ctx.strokeStyle = "rgba(255,193,74,0.7)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.nav.x, p.nav.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(p.nav.x, p.nav.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawShip(ctx, s, player) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.fillStyle = player ? "#9be8ff" : s.faction === "ally" ? "#e56bff" : s.hostile ? "#ff5a6a" : "#7dffb0";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, 8);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#07060e";
    ctx.stroke();
    if (player) {
      const hp = clamp(s.hull / s.maxHull, 0, 1);
      ctx.strokeStyle = hp > 0.5 ? "#5cff9a" : hp > 0.25 ? "#ffc14a" : "#ff5a6a";
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -10, 20, 20);
      const sh = s.shieldNow || {};
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#5ce1ff";
      if (sh.shieldFore > 1) {
        ctx.beginPath();
        ctx.arc(4, 0, 18, -0.8, 0.8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
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
    ctx.fillText(
      `HULL ${this.player.hull | 0}   SPD ${Math.hypot(this.player.vx, this.player.vy) | 0}   ${this.player.hyperOn ? "HYP ON" : "SUBLIGHT"}`,
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
    const scale = 0.08;
    const plot = (x, y, color, size = 3) => {
      rtx.fillStyle = color;
      rtx.fillRect(w / 2 + (x - this.player.x) * scale - size / 2, h / 2 + (y - this.player.y) * scale - size / 2, size, size);
    };
    for (const body of PLANETS) plot(body.x, body.y, body.kind === "gate" ? "#5cffc8" : "#ffc14a", body.kind === "star" ? 6 : 3);
    for (const s of this.ships) {
      if (s.dead || s.cloaked) continue;
      const range = sensorRange(this.player.power.sensors) * (this.hasItem("scanner") ? 1.4 : 1);
      if (dist(this.player.x, this.player.y, s.x, s.y) > range) continue;
      plot(s.x, s.y, s.hostile ? "#ff5a6a" : "#5cff9a");
    }
    plot(this.player.x, this.player.y, "#5ce1ff", 4);
    if (this.player.nav) {
      rtx.strokeStyle = "#ffc14a";
      rtx.beginPath();
      rtx.moveTo(w / 2, h / 2);
      rtx.lineTo(w / 2 + (this.player.nav.x - this.player.x) * scale, h / 2 + (this.player.nav.y - this.player.y) * scale);
      rtx.stroke();
    }
  }

  syncHud() {
    const p = this.player;
    const mission = MISSIONS[nextMissionIndex(this.flags)];
    document.getElementById("mission-title").textContent = mission.title;
    document.getElementById("mission-brief").textContent = mission.brief;
    document.getElementById("coords").textContent = `${p.x | 0}, ${p.y | 0}`;
    document.getElementById("unalloc").textContent = unallocated(p.reactor, p.power) | 0;
    document.getElementById("fuel").textContent = p.fuel | 0;
    document.getElementById("missiles").textContent = p.missiles;
    document.getElementById("clock").textContent = new Date(this.time * 1000).toISOString().substring(14, 19);
    document.querySelector('[data-act="w-wave"]').textContent = p.waveform;
    document.querySelector('[data-act="s-wave"]').textContent = p.shieldWave;
    for (const btn of document.querySelectorAll("#banks button")) {
      btn.classList.toggle("active", Number(btn.dataset.n) === p.banks);
    }
    const total = p.reactor;
    for (const row of document.querySelectorAll(".sys")) {
      const key = row.dataset.sys;
      const v = p.power[key] || 0;
      row.querySelector("b").textContent = v;
      row.querySelector("i").style.width = `${(v / total) * 100}%`;
    }
    const cargo = document.getElementById("cargo");
    cargo.innerHTML = p.cargo.length
      ? p.cargo.map((id) => `<li>${ITEMS[id]?.name || id}</li>`).join("")
      : "<li>empty</li>";
  }
}
