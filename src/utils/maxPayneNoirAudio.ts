import { MAX_PAYNE_NOIR_CELLO_THEME } from './accountSettingsLogic';

export type NoirAudioSourceMode = 'track' | 'synth';

export const MAX_PAYNE_THEME_STREAM_URL = '/api/audio/max-payne-theme';

/**
 * Max Payne Snowy Rooftop Soundtrack Engine.
 * Primary playback: Official "23. Max Theme Short.mp3" streamed seamlessly from
 * the user-specified khinsider track via same-origin `/api/audio/max-payne-theme`.
 * Automatic resilient fallback: Procedural C-minor cello + piano + rooftop wind
 * synthesizer (Web Audio API) if the MP3 stream is ever unavailable offline.
 */
export class MaxPayneNoirAudioEngine {
  private audioEl: HTMLAudioElement | null = null;
  private sourceMode: NoirAudioSourceMode = 'track';
  private listeners = new Set<() => void>();

  // Procedural Web Audio API fallback nodes
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private volume = 0.72;
  private stepIndex = 0;
  private schedulerTimer: number | null = null;
  private synthActive = false;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  public getSourceMode(): NoirAudioSourceMode {
    return this.sourceMode;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioEl;
  }

  private ensureAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (this.audioEl) return this.audioEl;

    const el = new Audio(MAX_PAYNE_THEME_STREAM_URL);
    el.loop = true;
    el.preload = 'auto';
    el.volume = this.volume;
    el.muted = this.isMuted;
    el.setAttribute('data-testid', 'max-payne-theme-audio');

    el.addEventListener('playing', () => {
      this.sourceMode = 'track';
      this.isPlaying = true;
      this.stopSynthFallback();
      this.emitChange();
    });

    el.addEventListener('pause', () => {
      if (this.sourceMode === 'track' && !this.synthActive) {
        this.isPlaying = false;
        this.emitChange();
      }
    });

    el.addEventListener('error', () => {
      if (this.isPlaying && !this.synthActive) {
        this.activateSynthFallback();
      }
    });

    this.audioEl = el;
    return el;
  }

  public start(): boolean {
    if (typeof window === 'undefined') return false;

    const el = this.ensureAudioElement();
    if (el && this.sourceMode === 'track') {
      el.volume = this.volume;
      el.muted = this.isMuted;
      this.isPlaying = true;
      this.emitChange();

      try {
        const playResult = el.play();
        if (playResult && typeof playResult.catch === 'function') {
          void playResult.catch((err: unknown) => {
            const errName = (err as { name?: string })?.name ?? '';
            // If user paused quickly (AbortError) or browser blocked autoplay before gesture, don't force synth
            if (!this.isPlaying || errName === 'AbortError') return;
            if (errName === 'NotAllowedError') {
              this.isPlaying = false;
              this.emitChange();
              return;
            }
            // Genuine load/decode error -> fall back gracefully to procedural Web Audio theme
            this.activateSynthFallback();
          });
        }
        return true;
      } catch {
        return this.activateSynthFallback();
      }
    }

    return this.activateSynthFallback();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.audioEl) {
      try {
        this.audioEl.pause();
      } catch {
        // Ignore pause error
      }
    }
    this.stopSynthFallback();
    this.emitChange();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audioEl) {
      this.audioEl.muted = muted;
    }
    this.applyMasterGain();
    this.emitChange();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
    this.applyMasterGain();
  }

  public dispose(): void {
    this.stop();
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.removeAttribute('src');
        this.audioEl.load();
      } catch {
        // Ignore teardown error
      }
      this.audioEl = null;
    }
    if (this.ctx) {
      const ctxToClose = this.ctx;
      this.ctx = null;
      this.masterGain = null;
      this.musicGain = null;
      this.windGain = null;
      this.delayNode = null;
      this.delayFeedback = null;
      void ctxToClose.close().catch(() => {});
    }
    this.listeners.clear();
  }

  private activateSynthFallback(): boolean {
    if (typeof window === 'undefined') return false;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
        this.setupGraph(this.ctx);
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      this.sourceMode = 'synth';
      this.synthActive = true;
      this.isPlaying = true;
      this.applyMasterGain();
      this.startWinterWindBed();
      this.stepIndex = 0;
      this.scheduleNextPhraseNote();
      this.emitChange();
      return true;
    } catch {
      this.isPlaying = false;
      this.emitChange();
      return false;
    }
  }

  private stopSynthFallback(): void {
    this.synthActive = false;
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.stopWinterWindBed();
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
    }
  }

  private setupGraph(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    this.masterGain = master;

    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.48;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.42;
    const delayTone = ctx.createBiquadFilter();
    delayTone.type = 'lowpass';
    delayTone.frequency.value = 1280;

    delay.connect(delayTone);
    delayTone.connect(feedback);
    feedback.connect(delay);
    delayTone.connect(master);
    this.delayNode = delay;
    this.delayFeedback = feedback;

    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.82;
    musicBus.connect(master);
    musicBus.connect(delay);
    this.musicGain = musicBus;

    const windBus = ctx.createGain();
    windBus.gain.value = 0.19;
    windBus.connect(master);
    this.windGain = windBus;
  }

  private applyMasterGain(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target =
      this.synthActive && this.isPlaying && !this.isMuted
        ? Math.max(0.001, this.volume * 0.48)
        : 0.0001;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(target, now, 0.16);
  }

  private startWinterWindBed(): void {
    if (!this.ctx || !this.windGain || this.windSource) return;
    const ctx = this.ctx;
    const bufferLen = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < bufferLen; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.048;
      b6 = white * 0.115926;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 390;
    filter.Q.value = 1.45;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 190;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    src.connect(filter);
    filter.connect(this.windGain);
    src.start();
    lfo.start();
    this.windSource = src;
    this.windLfo = lfo;
  }

  private stopWinterWindBed(): void {
    if (this.windSource) {
      try {
        this.windSource.stop();
        this.windSource.disconnect();
      } catch {
        // Ignore already stopped source
      }
      this.windSource = null;
    }
    if (this.windLfo) {
      try {
        this.windLfo.stop();
        this.windLfo.disconnect();
      } catch {
        // Ignore already stopped LFO
      }
      this.windLfo = null;
    }
  }

  private scheduleNextPhraseNote(): void {
    if (!this.synthActive || !this.isPlaying || !this.ctx || !this.musicGain) return;

    const note = MAX_PAYNE_NOIR_CELLO_THEME[this.stepIndex % MAX_PAYNE_NOIR_CELLO_THEME.length];
    this.stepIndex = (this.stepIndex + 1) % MAX_PAYNE_NOIR_CELLO_THEME.length;

    const now = this.ctx.currentTime + 0.04;
    this.playBowedCelloNote(this.ctx, this.musicGain, note.freq, now, note.durationSec);

    if (note.chordFreqs && note.chordFreqs.length > 0) {
      note.chordFreqs.forEach((f) => {
        if (!this.ctx || !this.musicGain) return;
        this.playDarkStringPad(
          this.ctx,
          this.musicGain,
          f,
          now,
          Math.max(3.2, note.durationSec + 1.4)
        );
      });
    }

    if (note.pianoArpFreqs && note.pianoArpFreqs.length > 0) {
      const stepSpacing = Math.max(0.36, note.durationSec / note.pianoArpFreqs.length);
      note.pianoArpFreqs.forEach((f, idx) => {
        if (!this.ctx || !this.musicGain) return;
        this.playNoirPianoTone(
          this.ctx,
          this.musicGain,
          f,
          now + idx * stepSpacing,
          Math.max(2.1, stepSpacing * 2.2)
        );
      });
    }

    const nextMs = Math.round(note.durationSec * 960);
    this.schedulerTimer = window.setTimeout(() => {
      this.scheduleNextPhraseNote();
    }, nextMs);
  }

  private playBowedCelloNote(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    startTime: number,
    duration: number
  ): void {
    const oscMain = ctx.createOscillator();
    const oscDetune = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    oscMain.type = 'sawtooth';
    oscDetune.type = 'sawtooth';
    oscSub.type = 'triangle';

    oscMain.frequency.setValueAtTime(freq, startTime);
    oscDetune.frequency.setValueAtTime(freq, startTime);
    oscSub.frequency.setValueAtTime(freq * 0.5, startTime);
    oscMain.detune.setValueAtTime(-6, startTime);
    oscDetune.detune.setValueAtTime(6, startTime);

    const vibratoOsc = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoOsc.frequency.value = 4.8;
    vibratoGain.gain.setValueAtTime(0.0, startTime);
    vibratoGain.gain.linearRampToValueAtTime(
      freq * 0.0095,
      startTime + Math.min(0.7, duration * 0.42)
    );
    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(oscMain.frequency);
    vibratoGain.connect(oscDetune.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2.4;
    filter.frequency.setValueAtTime(320, startTime);
    filter.frequency.exponentialRampToValueAtTime(980, startTime + Math.min(0.65, duration * 0.36));
    filter.frequency.exponentialRampToValueAtTime(390, startTime + duration);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.24, startTime + Math.min(0.5, duration * 0.28));
    env.gain.setValueAtTime(0.21, startTime + Math.max(0.55, duration - 0.6));
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.35);

    const detuneGain = ctx.createGain();
    detuneGain.gain.value = 0.55;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.26;

    oscMain.connect(filter);
    oscDetune.connect(detuneGain);
    detuneGain.connect(filter);
    oscSub.connect(subGain);
    subGain.connect(filter);
    filter.connect(env);
    env.connect(dest);

    oscMain.start(startTime);
    oscDetune.start(startTime);
    oscSub.start(startTime);
    vibratoOsc.start(startTime);

    const stopAt = startTime + duration + 0.42;
    oscMain.stop(stopAt);
    oscDetune.stop(stopAt);
    oscSub.stop(stopAt);
    vibratoOsc.stop(stopAt);
  }

  private playDarkStringPad(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    startTime: number,
    duration: number
  ): void {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, startTime);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.042, startTime + 0.85);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(dest);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.12);
  }

  private playNoirPianoTone(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    startTime: number,
    duration: number
  ): void {
    const osc = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    osc.type = 'triangle';
    oscHarmonic.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1680, startTime);
    filter.frequency.exponentialRampToValueAtTime(340, startTime + duration);

    const harmGain = ctx.createGain();
    harmGain.gain.value = 0.18;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.075, startTime + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    oscHarmonic.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(env);
    env.connect(dest);

    osc.start(startTime);
    oscHarmonic.start(startTime);
    osc.stop(startTime + duration + 0.08);
    oscHarmonic.stop(startTime + duration + 0.08);
  }
}
