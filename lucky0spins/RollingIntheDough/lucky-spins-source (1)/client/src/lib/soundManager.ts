// Sound Manager for game audio
class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.7;
  private soundCache: Map<string, AudioBuffer> = new Map();

  constructor() {
    const saved = localStorage.getItem("soundMuted");
    this.isMuted = saved ? JSON.parse(saved) : false;
    const savedVolume = localStorage.getItem("masterVolume");
    this.masterVolume = savedVolume ? parseFloat(savedVolume) : 0.7;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a simple beep/tone
  playTone(frequency: number, duration: number, type: "sine" | "square" | "sawtooth" = "sine") {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("Could not play tone:", e);
    }
  }

  // Play spin sound (whoosh)
  playSpin() {
    this.playTone(200, 0.3, "sine");
    setTimeout(() => this.playTone(300, 0.2, "sine"), 100);
  }

  // Play small win sound
  playSmallWin() {
    this.playTone(523, 0.1); // C5
    setTimeout(() => this.playTone(659, 0.1), 100); // E5
    setTimeout(() => this.playTone(784, 0.15), 200); // G5
  }

  // Play big win sound
  playBigWin() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2), i * 150);
    });
  }

  // Play jackpot sound
  playJackpot() {
    const frequencies = [1047, 1175, 1319, 1397, 1568, 1760, 1976];
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15), i * 100);
    });
  }

  // Play button click sound
  playClick() {
    this.playTone(800, 0.05, "square");
  }

  // Play error sound
  playError() {
    this.playTone(200, 0.2, "square");
    setTimeout(() => this.playTone(150, 0.2, "square"), 150);
  }

  // Background music loop (simple implementation)
  playBackgroundMusic() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Simple looping melody
      const melody = [
        { freq: 262, duration: 0.5 }, // C4
        { freq: 330, duration: 0.5 }, // E4
        { freq: 392, duration: 0.5 }, // G4
        { freq: 440, duration: 0.5 }, // A4
        { freq: 392, duration: 0.5 }, // G4
        { freq: 330, duration: 0.5 }, // E4
      ];

      let currentTime = now;
      melody.forEach(({ freq, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(this.masterVolume * 0.1, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

        osc.start(currentTime);
        osc.stop(currentTime + duration);

        currentTime += duration;
      });
    } catch (e) {
      console.warn("Could not play background music:", e);
    }
  }

  // Mute/unmute
  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem("soundMuted", JSON.stringify(muted));
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // Set master volume
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem("masterVolume", this.masterVolume.toString());
  }

  getVolume(): number {
    return this.masterVolume;
  }
}

export const soundManager = new SoundManager();
