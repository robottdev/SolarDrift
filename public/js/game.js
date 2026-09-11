import {
  DEFAULT_POWER,
  WAVEFORMS,
  angleTo,
  allocatedTotal,
  cameraScale,
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
  setSystemPower,
  shieldAbsorb,
  shortestAngle,
  thrustAccel,
  unallocated,
  wrapAngle,
} from "/lib/logic.js";
import { AudioEngine } from "./audio.js";
import {
  CALLSIGN,
  DIALOGUE,
  ENDING,
  INTRO,
  ITEMS,
  MISSIONS,
  PLANETS,
  TITLE,
} from "./data.js";

const SAVE_KEY = "solar-drift-save-v2";
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
    this.stars = Array.from({ length: 280 }, () => ({
      x: Math.random() * 8000 - 4000,
      y: Math.random() * 8000 - 4000,
      z: Math.random() * 2 + 0.3,
      a: Math.random(),
    }));
    this.img = {};
    this.scale = cameraScale(30);
    this.loadImages();
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
    this.renderIntro();
    this.show("intro");
  }

  renderIntro() {
    const card = INTRO[this.introIndex];
    const who = document.getElementById("intro-who");
    const text = document.getElementById("intro-text");
    if (typeof card === "string") {
      who.textContent = "";
      who.classList.add("hidden");
      text.textContent = card;
      return;
    }
    who.classList.remove("hidden");
    who.textContent = card.who;
    who.style.color = card.who === "PIP" ? "var(--cyan)" : "var(--amber)";
    text.textContent = card.text;
  }

  advanceIntro() {
    this.introIndex += 1;
    if (this.introIndex >= INTRO.length) {
      this.show("play");
      this.toast("PIP: Something just decloaked. If it's Rex, I want first insult.");
      return;
    }
    this.renderIntro();
  }

  continueSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      this.deserialize(JSON.parse(raw));
      this.audio.resume();
      this.audio.startPad();
      this.show("play");
      this.toast("PIP: Save reconstructed. You still owe me an apology.");
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
      x: 0,
      y: -90,
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
    this.rocks = [];
    this.spawnWorld(fresh);
    this.syncHud();
  }

  loadImages() {
    const spec = {
      player: "/assets/ships/player.png",
      ally: "/assets/ships/ally.png",
      patrol: "/assets/ships/patrol.png",
      raider: "/assets/ships/raider.png",
      raiderHeavy: "/assets/ships/raider-heavy.png",
      gunship: "/assets/ships/gunship.png",
      warden: "/assets/ships/warden.png",
      trader: "/assets/ships/trader.png",
      ufo: "/assets/ships/ufo.png",
      laserBlue: "/assets/fx/laser-blue.png",
      laserRed: "/assets/fx/laser-red.png",
      laserGreen: "/assets/fx/laser-green.png",
      boltBlue: "/assets/fx/bolt-blue.png",
      boltRed: "/assets/fx/bolt-red.png",
      flame: "/assets/fx/flame.png",
      shield: "/assets/fx/shield.png",
      star1: "/assets/fx/star1.png",
      nebula: "/assets/bg/nebula.jpg",
      starsTile: "/assets/bg/stars-tile.png",
      rockA: "/assets/world/rock-a.png",
      rockB: "/assets/world/rock-b.png",
      rockC: "/assets/world/rock-c.png",
      rockD: "/assets/world/rock-d.png",
      rockE: "/assets/world/rock-e.png",
      rockF: "/assets/world/rock-f.png",
    };
    for (const [key, src] of Object.entries(spec)) {
      const im = new Image();
      im.src = src;
      this.img[key] = im;
    }
  }

  spawnWorld(fresh) {
    this.ships = [
      this.makeShip({
        id: "kade",
        name: "Honest Rex",
        x: 48,
        y: -70,
        faction: "ally",
        sprite: "ally",
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
          name: "Yard Bouncer",
          x,
          y,
          faction: "gov",
          sprite: "patrol",
          waveform: pick(WAVEFORMS),
          ai: "orbit",
          orbit: { x: -90, y: 70, r: 70 + i * 18 },
        })
      );
    });
    this.spawnRocks();
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

  spawnRocks() {
    const kinds = ["rockA", "rockB", "rockC", "rockD", "rockE", "rockF"];
    this.rocks = [];
    for (let i = 0; i < 52; i++) {
      const ang = rand(0, Math.PI * 2);
      const rad = rand(80, 520);
      this.rocks.push({
        x: Math.cos(ang) * rad + rand(-40, 40),
        y: Math.sin(ang) * rad + rand(-40, 40),
        size: rand(14, 38),
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.35, 0.35),
        kind: pick(kinds),
      });
    }
    for (let i = 0; i < 18; i++) {
      this.rocks.push({
        x: 160 + rand(-90, 90),
        y: -110 + rand(-80, 80),
        size: rand(12, 32),
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.5, 0.5),
        kind: pick(kinds),
      });
    }
  }

  spawnConvoy() {
    if (this.ships.some((s) => s.group === "convoy" && !s.dead)) return;
    for (let i = 0; i < 3; i++) {
      this.ships.push(
        this.makeShip({
          id: `smuggler-${i}`,
          name: "Gutter Dog",
          group: "convoy",
          x: 190 + i * 28,
          y: -80 - i * 16,
          faction: "raider",
          sprite: "raider",
          waveform: pick(WAVEFORMS),
          ai: "chase",
          hull: 48,
          maxHull: 48,
        })
      );
    }
    this.toast("PIP: Gutter Dog transponders just lit near Nix Pawn. Try not to write them a review.");
  }

  spawnGunships() {
    if (this.ships.some((s) => s.group === "guns" && !s.dead)) return;
    for (let i = 0; i < 4; i++) {
      this.ships.push(
        this.makeShip({
          id: `gun-${i}`,
          name: "Repo Gunship",
          group: "guns",
          x: -1460 + i * 30,
          y: 1100 + (i % 2) * 40,
          faction: "warden",
          sprite: "gunship",
          waveform: pick(WAVEFORMS),
          ai: "chase",
          hull: 70,
          maxHull: 70,
        })
      );
    }
    this.toast("PIP: Repo gunships over Wrench Camp. Collections, but with lasers.");
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
      this.openDialogue("pip");
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
      this.toast("PIP: Juice is in the ring, not in us. Geometry unlocking. I remain unimpressed.");
      this.save();
      return;
    }
    if (body.cargo === "scanner" && !this.flags.hasScanner) {
      this.giveItem("scanner");
      this.flags.hasScanner = true;
      this.toast("PIP: Listening dish seated. I can see more than your feelings now.");
      this.save();
      return;
    }
    if (body.cargo === "crystals" && this.flags.rescuedColony && !this.flags.hasCrystals) {
      this.giveItem("crystals");
      this.flags.hasCrystals = true;
      p.reactor += 160;
      p.fuel = 220;
      this.toast("PIP: Flux Spares seated. Reactor climbing. Still not candy.");
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
      this.toast("PIP: No Hyperdrive Core. We can drift with style, or we can install a core.");
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
      if (id !== "pip") {
        this.openDialogue("pip");
        return;
      }
      this.toast("PIP: I'm already on this channel, Captain.");
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
    if (id === "pip") return Math.min(nextMissionIndex(f), DIALOGUE.pip.lines.length - 1);
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
      if (choice.give === "hyperdrive") this.toast("PIP: Hyperdrive Core online. H / F10 when the sky is clear and Scott is brave.");
      if (choice.give === "voidseed") this.toast("PIP: That canister is humming. I am drafting a complaint.");
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
    document.getElementById("ending-eyebrow").textContent = ENDING.eyebrow;
    document.getElementById("ending-title").textContent = ENDING.title;
    document.getElementById("ending-text").textContent = ENDING.text;
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
    p.fireCd = 0.16 + (3 - p.banks) * 0.04;
    this.audio.laser();
    const spread = (p.banks - 1) * 0.09;
    for (let i = 0; i < p.banks; i++) {
      const a = p.angle + (i - (p.banks - 1) / 2) * spread;
      this.projectiles.push({
        x: p.x + Math.cos(a) * 22,
        y: p.y + Math.sin(a) * 22,
        vx: Math.cos(a) * 280 + p.vx,
        vy: Math.sin(a) * 280 + p.vy,
        life: 0.85,
        from: "player",
        wave: p.waveform,
        missile: false,
        banks: p.banks,
        sprite: "laserBlue",
        color: "#5ce1ff",
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
      vx: Math.cos(p.angle) * 210 + p.vx,
      vy: Math.sin(p.angle) * 210 + p.vy,
      life: 2.2,
      from: "player",
      wave: p.waveform,
      missile: true,
      sprite: "boltBlue",
      color: "#ffc14a",
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
      this.toast("PIP: That's Rex. Hail with C. I have prepared several insults.");
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
    p.thrusting = thrusting;
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
      this.kill("PIP: You flew the juice through the ring. Both sides of the door went white. I did warn you in a funny voice.");
      return;
    }
    if (canEnterGate(this.flags) && !this.flags.enteredGate) {
      this.player.hyperOn = false;
      this.audio.setHyper(false);
      this.openDialogue("nyx");
    } else if (!this.flags.hasVoidseed) {
      this.player.vx *= -1.2;
      this.player.vy *= -1.2;
      this.toast("PIP: GEOMETRY LOCK. The ring would like a repaired ship, not a vibe.");
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
        s.vx += Math.cos(s.angle) * 55 * dt;
        s.vy += Math.sin(s.angle) * 55 * dt;
        const cap = 72;
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > cap) {
          s.vx *= cap / sp;
          s.vy *= cap / sp;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.fireCd -= dt;
        const d = dist(s.x, s.y, this.player.x, this.player.y);
        if (d < 180 && s.fireCd <= 0 && Math.abs(shortestAngle(s.angle, desired)) < 0.35) {
          s.fireCd = 0.85;
          const a = s.angle;
          this.projectiles.push({
            x: s.x + Math.cos(a) * 18,
            y: s.y + Math.sin(a) * 18,
            vx: Math.cos(a) * 240,
            vy: Math.sin(a) * 240,
            life: 0.9,
            from: s.id,
            wave: s.waveform,
            missile: false,
            sprite: "laserRed",
            color: "#ff5a9a",
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
          if (dist(shot.x, shot.y, s.x, s.y) < 22) {
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
      } else if (dist(shot.x, shot.y, p.x, p.y) < 20) {
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
    if (p.hull <= 0) this.kill("PIP: Hull integrity zero. I told you it was mostly opinion.");
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
      this.toast("PIP: Dogs down. Siphon Hose recovered. Bolt is waiting, and she is not patient.");
      this.save();
    }
    if (s.group === "guns" && this.ships.filter((x) => x.group === "guns" && !x.dead).length === 0) {
      this.flags.rescuedColony = true;
      this.toast("PIP: Repo fleet folded. Hail the Cousins or Wrench Camp. Try gratitude. As a bit.");
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
    for (const rock of this.rocks) rock.rot += rock.spin * dt;
  }

  regen(dt) {
    const p = this.player;
    p.hull = clamp(p.hull + repairRate(p.power.lifeSupport) * dt, 0, p.maxHull);
    p.hull -= lifeSupportDrain(p.power.lifeSupport, dt);
    if (p.hull <= 0) this.kill("PIP: Life support starved the hull. Next time, perhaps, allocate the gigawatts.");
    for (const key of ["shieldFore", "shieldAft", "shieldPort", "shieldStarboard"]) {
      const cap = p.power[key];
      if (p.shieldNow[key] < cap) p.shieldNow[key] = Math.min(cap, p.shieldNow[key] + cap * 0.12 * dt);
    }
    p.fuel = clamp(p.fuel + (this.hasItem("crystals") ? 2.5 : 0.6) * dt, 0, this.hasItem("crystals") ? 260 : 160);
  }

  missionWatch() {
    if (this.flags.hasVoidseed && !this.flags.warnedLira && dist(this.player.x, this.player.y, -90, 70) > 200) {
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

  viewScale() {
    const p = this.player;
    let scale = cameraScale(p.power.sensors);
    const threat = this.ships.some(
      (s) => !s.dead && s.hostile && dist(p.x, p.y, s.x, s.y) < 170
    );
    if (threat) scale *= 1.12;
    this.scale = scale;
    return scale;
  }

  screenToWorld(sx, sy) {
    const scale = this.scale || cameraScale(this.player.power.sensors);
    return {
      x: (sx - this.w / 2) / scale + this.player.x,
      y: (sy - this.h / 2) / scale + this.player.y,
    };
  }

  draw() {
    if (!this.w) this.resize();
    const ctx = this.ctx;
    const p = this.player;
    const scale = this.viewScale();
    ctx.fillStyle = "#05010a";
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.translate((this.shake && (Math.random() - 0.5) * this.shake) || 0, (this.shake && (Math.random() - 0.5) * this.shake) || 0);
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-p.x, -p.y);

    this.drawNebula(ctx, p);
    this.drawStars(ctx, p, scale);
    for (const rock of this.rocks) this.drawRock(ctx, rock);
    for (const body of PLANETS) this.drawBody(ctx, body, p);
    if (p.nav) this.drawNav(ctx, p);
    for (const s of this.ships) if (!s.dead && !s.cloaked) this.drawShip(ctx, s, false);
    this.drawShip(ctx, p, true);
    for (const shot of this.projectiles) this.drawShot(ctx, shot);
    for (const q of this.particles) {
      ctx.fillStyle = q.color;
      ctx.globalAlpha = clamp(q.life * 2, 0, 1);
      ctx.fillRect(q.x - 1, q.y - 1, 2.4, 2.4);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    this.drawVignette(ctx);
    this.drawRadar();
  }

  drawNebula(ctx, p) {
    const neb = this.img.nebula;
    const tile = this.img.starsTile;
    if (tile && tile.complete && tile.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      const ox = (p.x * 0.04) % 256;
      const oy = (p.y * 0.04) % 256;
      ctx.drawImage(tile, p.x - 700 - ox, p.y - 500 - oy, 1400, 1000);
      ctx.restore();
    }
    if (neb && neb.complete && neb.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.drawImage(neb, p.x - 920 - p.x * 0.12, p.y - 620 - p.y * 0.12, 1840, 1240);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.18;
      const g = ctx.createRadialGradient(p.x + 80, p.y - 40, 40, p.x, p.y, 520);
      g.addColorStop(0, "rgba(255, 80, 140, 0.65)");
      g.addColorStop(0.45, "rgba(90, 40, 160, 0.35)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(p.x - 900, p.y - 700, 1800, 1400);
      ctx.restore();
    }
  }

  drawSprite(ctx, img, x, y, angle, size) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const h = size * (img.naturalHeight / img.naturalWidth);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(img, -size / 2, -h / 2, size, h);
    ctx.restore();
    return true;
  }

  drawStars(ctx, p, scale) {
    for (const s of this.stars) {
      const par = 0.18 * s.z;
      const x = s.x + p.x * par;
      const y = s.y + p.y * par;
      ctx.globalAlpha = 0.4 + s.a * 0.6;
      const img = this.img.star1;
      if (img && img.complete && img.naturalWidth && s.z > 1.2) {
        ctx.drawImage(img, x, y, 4 * s.z, 4 * s.z);
      } else {
        ctx.fillStyle = "#e8f0ff";
        ctx.fillRect(x, y, 1.2 * s.z, 1.2 * s.z);
      }
    }
    ctx.globalAlpha = 1;
    if (p.hyperOn) {
      ctx.strokeStyle = "rgba(229,107,255,0.45)";
      ctx.lineWidth = 1.2 / scale;
      for (let i = 0; i < 22; i++) {
        const a = p.angle + rand(-0.5, 0.5);
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(a) * 18, p.y - Math.sin(a) * 18);
        ctx.lineTo(p.x - Math.cos(a) * 90, p.y - Math.sin(a) * 90);
        ctx.stroke();
      }
    }
  }

  drawRock(ctx, rock) {
    const img = this.img[rock.kind];
    if (!this.drawSprite(ctx, img, rock.x, rock.y, rock.rot, rock.size)) {
      ctx.fillStyle = "#6a5344";
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawShot(ctx, shot) {
    const ang = Math.atan2(shot.vy, shot.vx);
    ctx.save();
    ctx.strokeStyle = shot.color || "#5ce1ff";
    ctx.shadowColor = shot.color || "#5ce1ff";
    ctx.shadowBlur = 8;
    ctx.lineWidth = shot.missile ? 1.6 : 0.9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(shot.x, shot.y);
    ctx.lineTo(shot.x - shot.vx * 0.12, shot.y - shot.vy * 0.12);
    ctx.stroke();
    ctx.restore();
    const img = this.img[shot.sprite];
    this.drawSprite(ctx, img, shot.x, shot.y, ang, shot.missile ? 10 : 7);
  }

  drawBody(ctx, body, p) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    const halo = ctx.createRadialGradient(body.x, body.y, body.radius * 0.7, body.x, body.y, body.radius * 2.1);
    halo.addColorStop(0, body.color);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(body.x, body.y, body.radius * 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const g = ctx.createRadialGradient(body.x - body.radius * 0.35, body.y - body.radius * 0.35, 3, body.x, body.y, body.radius);
    g.addColorStop(0, body.color);
    g.addColorStop(0.55, body.color2);
    g.addColorStop(1, "#07040c");
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
    const close = dist(p.x, p.y, body.x, body.y) < body.radius + 220;
    if (close) {
      ctx.fillStyle = "#ffc14a";
      ctx.font = "7px Share Tech Mono, monospace";
      ctx.fillText(body.name, body.x + body.radius + 4, body.y);
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
    const spriteKey = player
      ? "player"
      : s.sprite || (s.hostile ? "raider" : s.faction === "ally" ? "ally" : "patrol");
    const size = player ? 38 : s.group === "guns" ? 42 : 34;
    if (player && s.thrusting) {
      this.drawSprite(
        ctx,
        this.img.flame,
        s.x - Math.cos(s.angle) * 22,
        s.y - Math.sin(s.angle) * 22,
        s.angle + Math.PI,
        14
      );
    }
    const drawn = this.drawSprite(ctx, this.img[spriteKey], s.x, s.y, s.angle, size);
    if (!drawn) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillStyle = player ? "#9be8ff" : s.hostile ? "#ff5a6a" : "#7dffb0";
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, 8);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-12, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (player) {
      const hp = clamp(s.hull / s.maxHull, 0, 1);
      ctx.strokeStyle = hp > 0.5 ? "#5cff9a" : hp > 0.25 ? "#ffc14a" : "#ff5a6a";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(s.x - 16, s.y - 16, 32, 32);
      if ((s.shieldNow?.shieldFore || 0) > 1) {
        this.drawSprite(ctx, this.img.shield, s.x, s.y, s.angle, 48);
      }
    } else if (s.hostile) {
      ctx.fillStyle = "rgba(255,90,106,0.85)";
      ctx.fillRect(s.x - 14, s.y - 24, 28 * clamp(s.hull / s.maxHull, 0, 1), 3);
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
    const scale = 0.12;
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
    document.getElementById("callsign").textContent = CALLSIGN;
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
