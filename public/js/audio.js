export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._laser = null;
    this._pad = null;
  }

  resume() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  beep(freq, dur = 0.08, type = "square", gain = 0.12, slide = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  startLaser() {
    if (this.muted || !this.ctx || this._laser) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc2.type = "square";
    osc.frequency.value = 240;
    osc2.frequency.value = 90;
    f.type = "bandpass";
    f.frequency.value = 420;
    f.Q.value = 2.4;
    g.gain.value = 0.045;
    osc.connect(f);
    osc2.connect(f);
    f.connect(g);
    g.connect(this.master);
    osc.start();
    osc2.start();
    this._laser = { osc, osc2, g };
  }

  stopLaser() {
    if (!this._laser) return;
    try {
      this._laser.osc.stop();
      this._laser.osc2.stop();
    } catch {
      /* already stopped */
    }
    this._laser = null;
  }

  hit() {
    this.beep(90, 0.18, "square", 0.14, -40);
  }

  ping() {
    this.beep(740, 0.06, "square", 0.06);
  }

  hail() {
    this.beep(523, 0.1, "square", 0.08);
    setTimeout(() => this.beep(659, 0.12, "square", 0.08), 90);
  }

  ui() {
    this.beep(440, 0.04, "square", 0.05);
  }

  startPad() {
    if (!this.ctx || this._pad) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc2.type = "sine";
    osc.frequency.value = 110;
    osc2.frequency.value = 164.8;
    g.gain.value = 0.03;
    osc.connect(g);
    osc2.connect(g);
    g.connect(this.master);
    osc.start();
    osc2.start();
    this._pad = { osc, osc2, g };
  }

  titleSting() {
    [196, 247, 294, 392].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.18, "square", 0.07), i * 120);
    });
  }
}
