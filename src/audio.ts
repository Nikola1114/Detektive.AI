/**
 * Procedural audio, synthesised in the browser with the Web Audio API.
 * Every sound is generated from oscillators and noise — no audio files, so
 * there are no licensing concerns. Nothing plays until the player enables sound.
 */
type Ambience = "office" | "scene" | "interrogation" | "street" | "silent";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private ambientBus!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private rainGain!: GainNode;
  private trafficGain!: GainNode;
  private humGain!: GainNode;
  private tickGain!: GainNode;
  private musicTimer: number | null = null;
  private tickTimer: number | null = null;
  enabled = false;
  vols = { ambient: 0.6, music: 0.4, sfx: 0.7 };

  private noiseBuffer(ctx: AudioContext, brown = false) {
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }

  private loop(buf: AudioBuffer, dest: AudioNode) {
    const src = this.ctx!.createBufferSource();
    src.buffer = buf; src.loop = true; src.connect(dest); src.start();
    return src;
  }

  private init() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.connect(ctx.destination);
    this.ambientBus = ctx.createGain(); this.ambientBus.connect(this.master);
    this.musicBus = ctx.createGain(); this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);

    // Rain against glass: high-passed white noise with a slowly wandering band.
    const white = this.noiseBuffer(ctx);
    this.rainGain = ctx.createGain();
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
    const bp = ctx.createBiquadFilter(); bp.type = "peaking"; bp.frequency.value = 3200; bp.gain.value = 4;
    this.loop(white, hp); hp.connect(bp); bp.connect(this.rainGain); this.rainGain.connect(this.ambientBus);

    // Distant traffic: low brown noise with a slow swell.
    const brown = this.noiseBuffer(ctx, true);
    this.trafficGain = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220;
    this.loop(brown, lp); lp.connect(this.trafficGain); this.trafficGain.connect(this.ambientBus);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain); lfoGain.connect(this.trafficGain.gain); lfo.start();

    // Office / fluorescent hum.
    this.humGain = ctx.createGain(); this.humGain.gain.value = 0;
    const hum = ctx.createOscillator(); hum.frequency.value = 60; hum.connect(this.humGain);
    const hum2 = ctx.createOscillator(); hum2.frequency.value = 120; const h2g = ctx.createGain(); h2g.gain.value = 0.3; hum2.connect(h2g); h2g.connect(this.humGain);
    this.humGain.connect(this.ambientBus); hum.start(); hum2.start();

    // Interrogation-room clock.
    this.tickGain = ctx.createGain(); this.tickGain.gain.value = 0; this.tickGain.connect(this.ambientBus);
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, t, 0.3);
    this.ambientBus.gain.setTargetAtTime(this.vols.ambient * 0.5, t, 0.3);
    this.musicBus.gain.setTargetAtTime(this.vols.music * 0.35, t, 0.3);
    this.sfxBus.gain.setTargetAtTime(this.vols.sfx * 0.6, t, 0.05);
  }

  configure(enabled: boolean, vols: { ambient: number; music: number; sfx: number }) {
    this.vols = vols;
    if (enabled && !this.ctx) this.init();
    this.enabled = enabled;
    if (this.ctx && enabled && this.ctx.state === "suspended") void this.ctx.resume();
    this.applyVolumes();
    if (enabled) this.startMusic(); else this.stopMusic();
  }

  setAmbience(kind: Ambience) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const mix: Record<Ambience, [number, number, number, number]> = {
      office: [0.22, 0.25, 0.012, 0], scene: [0.3, 0.15, 0.006, 0], interrogation: [0.06, 0.05, 0.02, 1],
      street: [0.45, 0.4, 0, 0], silent: [0, 0, 0, 0],
    };
    const [rain, traffic, hum, tick] = mix[kind];
    this.rainGain.gain.setTargetAtTime(rain, t, 1.2);
    this.trafficGain.gain.setTargetAtTime(traffic, t, 1.2);
    this.humGain.gain.setTargetAtTime(hum, t, 1.2);
    this.tickGain.gain.setTargetAtTime(tick ? 0.5 : 0, t, 0.5);
    if (tick && this.tickTimer === null) this.tickTimer = window.setInterval(() => this.tick(), 1000);
    if (!tick && this.tickTimer !== null) { clearInterval(this.tickTimer); this.tickTimer = null; }
  }

  private tick() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = "square"; o.frequency.value = 2400;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g); g.connect(this.tickGain); o.start(t); o.stop(t + 0.04);
  }

  /** A slow, dark pad that drifts between minor chords. */
  private startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    const chords = [[146.83, 174.61, 220], [130.81, 155.56, 196], [116.54, 146.83, 174.61], [110, 130.81, 164.81]];
    let i = 0;
    const play = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const filter = this.ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 700; filter.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 3); g.gain.linearRampToValueAtTime(0, t + 11);
      filter.connect(g); g.connect(this.musicBus);
      for (const f of chords[i % chords.length]) {
        for (const det of [-4, 4]) {
          const o = this.ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det;
          o.connect(filter); o.start(t); o.stop(t + 11.5);
        }
      }
      i++;
    };
    play();
    this.musicTimer = window.setInterval(play, 9000);
  }

  private stopMusic() {
    if (this.musicTimer !== null) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }

  sfx(kind: "discover" | "deduction" | "contradiction" | "unlock" | "click" | "error" | "achievement") {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const tone = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = "sine") => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t + start); g.gain.linearRampToValueAtTime(vol, t + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      o.connect(g); g.connect(this.sfxBus); o.start(t + start); o.stop(t + start + dur + 0.05);
    };
    switch (kind) {
      case "click": tone(1800, 0, 0.04, 0.08, "triangle"); break;
      case "discover": tone(660, 0, 0.9, 0.25); tone(990, 0.08, 1.1, 0.15); tone(1320, 0.16, 1.2, 0.08); break;
      case "unlock": tone(392, 0, 0.5, 0.2, "triangle"); tone(587, 0.12, 0.8, 0.2, "triangle"); break;
      case "deduction": tone(98, 0, 1.6, 0.35, "triangle"); tone(784, 0.05, 1.4, 0.12); tone(1175, 0.15, 1.6, 0.08); break;
      case "contradiction": tone(110, 0, 1.4, 0.35, "sawtooth"); tone(116.5, 0, 1.4, 0.25, "sawtooth"); tone(880, 0.1, 0.8, 0.1); break;
      case "achievement": [523, 659, 784, 1047].forEach((f, k) => tone(f, k * 0.1, 1.2, 0.15)); break;
      case "error": tone(160, 0, 0.25, 0.2, "square"); break;
    }
  }
}

export const audio = new AudioEngine();
export type { Ambience };
