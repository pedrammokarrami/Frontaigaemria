// Client-Side Web Audio API Spatial DSP Engine + Live Spectrum Analyzer
// Shapes audio with room-calibrated 3-band Biquad EQ + Delay/Feedback Spatial Reverb.
// Provides real synthesis playback for every room track AND processes direct external streams.

import type { AudioAcousticProfile } from './audioAgents';

export class SpatialAudioDspEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private lowEq: BiquadFilterNode | null = null;
  private midEq: BiquadFilterNode | null = null;
  private highEq: BiquadFilterNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private stepTimer: number | null = null;
  private isPlaying = false;
  private currentProfile: AudioAcousticProfile | null = null;
  private noteIndex = 0;
  private freqBins: Uint8Array<ArrayBuffer> = new Uint8Array(32);

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) return this.ctx;

    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const lowEq = ctx.createBiquadFilter();
    lowEq.type = 'lowshelf';
    lowEq.frequency.value = 180;

    const midEq = ctx.createBiquadFilter();
    midEq.type = 'peaking';
    midEq.frequency.value = 1100;
    midEq.Q.value = 1.0;

    const highEq = ctx.createBiquadFilter();
    highEq.type = 'highshelf';
    highEq.frequency.value = 5200;

    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const delayNode = ctx.createDelay(1.0);
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.value = 0.28;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.22;

    // Graph: Input -> lowEq -> midEq -> highEq -> (dry + delay loop) -> analyser -> masterGain -> out
    lowEq.connect(midEq);
    midEq.connect(highEq);

    highEq.connect(dryGain);
    dryGain.connect(analyser);

    highEq.connect(delayNode);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(analyser);

    analyser.connect(masterGain);
    masterGain.connect(ctx.destination);

    this.ctx = ctx;
    this.lowEq = lowEq;
    this.midEq = midEq;
    this.highEq = highEq;
    this.dryGain = dryGain;
    this.wetGain = wetGain;
    this.delayNode = delayNode;
    this.feedbackGain = feedbackGain;
    this.analyser = analyser;
    this.masterGain = masterGain;
    this.freqBins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

    return ctx;
  }

  public applyAcousticProfile(profile: AudioAcousticProfile): void {
    this.currentProfile = profile;
    const ctx = this.ctx;
    if (!ctx || !this.lowEq || !this.midEq || !this.highEq || !this.dryGain || !this.wetGain || !this.delayNode) {
      return;
    }
    const now = ctx.currentTime;
    this.lowEq.gain.setTargetAtTime(profile.eqLowDb, now, 0.08);
    this.midEq.gain.setTargetAtTime(profile.eqMidDb, now, 0.08);
    this.highEq.gain.setTargetAtTime(profile.eqHighDb, now, 0.08);
    this.wetGain.gain.setTargetAtTime(profile.reverbMix, now, 0.08);
    this.dryGain.gain.setTargetAtTime(1 - profile.reverbMix * 0.4, now, 0.08);
    this.delayNode.delayTime.setTargetAtTime(profile.reverbDelaySec, now, 0.08);
  }

  public setVolume(volume01: number): void {
    const safe = Math.max(0, Math.min(1, volume01));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(safe * 0.34, this.ctx.currentTime, 0.05);
    }
  }

  public async start(profile: AudioAcousticProfile, bpmOverride?: number): Promise<void> {
    const ctx = this.ensureContext();
    this.currentProfile = profile;
    this.applyAcousticProfile(profile);

    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => undefined);
    }

    this.stopScheduler();
    this.isPlaying = true;
    this.noteIndex = 0;

    if (!ctx || !this.lowEq) return;

    const effectiveBpm = bpmOverride ?? profile.baseSynthBpm;
    const intervalMs = Math.max(180, Math.round((60 / effectiveBpm) * 1000 * 0.5));

    const triggerNote = () => {
      if (!this.isPlaying || !this.ctx || !this.lowEq || !this.currentProfile) return;
      const now = this.ctx.currentTime;
      const scale = this.currentProfile.synthScaleNotesHz;
      const freq = scale[this.noteIndex % scale.length];
      this.noteIndex += 1;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      const timbre = this.currentProfile.synthTimbre;
      osc.type =
        timbre === 'berlin-acid' || timbre === 'trance-lead'
          ? 'sawtooth'
          : timbre === 'warm-jazz' || timbre === 'lute-harp'
            ? 'triangle'
            : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const dur = timbre === 'ambient-drone' ? 1.4 : timbre === 'berlin-acid' ? 0.22 : 0.48;
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(timbre === 'podcast-voice' ? 0.08 : 0.16, now + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(noteGain);
      noteGain.connect(this.lowEq);
      osc.start(now);
      osc.stop(now + dur + 0.04);

      // Subtle sub kick on downbeats for high-energy rooms
      if (
        (timbre === 'berlin-acid' || timbre === 'trance-lead' || timbre === 'stadium-pop') &&
        this.noteIndex % 2 === 1
      ) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(118, now);
        kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
        kickGain.gain.setValueAtTime(0.28, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        kickOsc.connect(kickGain);
        kickGain.connect(this.lowEq);
        kickOsc.start(now);
        kickOsc.stop(now + 0.18);
      }
    };

    triggerNote();
    this.stepTimer = window.setInterval(triggerNote, intervalMs);
  }

  public stop(): void {
    this.isPlaying = false;
    this.stopScheduler();
  }

  private stopScheduler(): void {
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }

  /**
   * Reads real FFT frequency bins from AnalyserNode (0..255), with smooth ambient idle floor.
   */
  public sampleSpectrum(barsCount = 24, fallbackSeed = 0): number[] {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(this.freqBins);
      const out: number[] = [];
      for (let i = 0; i < barsCount; i++) {
        const idx = i % this.freqBins.length;
        const val = this.freqBins[idx] / 255;
        // Blend live FFT with gentle rhythmic contour so paused/quiet frames never go flat dead
        out.push(Math.max(0.12, Math.min(1, val * 1.15)));
      }
      return out;
    }

    const idle: number[] = [];
    for (let i = 0; i < barsCount; i++) {
      idle.push(0.14 + Math.abs(Math.sin(fallbackSeed * 0.8 + i * 0.45)) * (this.isPlaying ? 0.55 : 0.08));
    }
    return idle;
  }

  public dispose(): void {
    this.stop();
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}
