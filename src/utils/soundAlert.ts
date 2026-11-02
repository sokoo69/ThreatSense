/**
 * Web Audio API synthesizer for ThreatSense SOC alert sounds.
 * Generates clean synth tones without external audio file dependencies.
 */
class SoundAlertManager {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private lastAlertTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('threatsense_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('threatsense_muted', String(muted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Urgent dual-frequency alert for High Threat level (66-100%)
   */
  public playHighThreatAlert() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastAlertTime < 2500) return; // Prevent sound spamming
    this.lastAlertTime = now;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.32);
      osc2.stop(ctx.currentTime + 0.32);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Distinct resonant chord reserved ONLY for Affective Masking detection
   */
  public playMaskingAlert() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastAlertTime < 2500) return;
    this.lastAlertTime = now;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // Magenta/Violet signature sweep: mysterious dissonant chord resolving
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.52);
    } catch {
      // Audio policy safe
    }
  }
}

export const soundManager = new SoundAlertManager();
