export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._hyper = null;
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

  laser() {
    this.beep(880, 0.07, "square", 0.08, -500);
  }

  missile() {
    this.beep(180, 0.25, "sawtooth", 0.1, -80);
  }

  hit() {
    this.beep(90, 0.18, "square", 0.14, -40);
  }

  explode() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.35, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 400;
    src.buffer = buffer;
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  hail() {
    this.beep(523, 0.1, "square", 0.08);
    setTimeout(() => this.beep(659, 0.12, "square", 0.08), 90);
  }

  ui() {
    this.beep(440, 0.04, "square", 0.05);
  }

  setHyper(on) {
    if (!this.ctx) return;
    if (on && !this._hyper) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 42;
      g.gain.value = 0.04;
      osc.connect(g);
      g.connect(this.master);
      osc.start();
      this._hyper = { osc, g };
    }
    if (!on && this._hyper) {
      this._hyper.osc.stop();
      this._hyper = null;
    }
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
    [220, 277, 330, 440].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.18, "square", 0.07), i * 120);
    });
  }
}
