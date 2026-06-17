// Sound Manager for game audio
class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.7;
  private soundCache: Map<string, AudioBuffer> = new Map();
  private backgroundMusicInterval: number | null = null;
  private backgroundMusicEnabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem("soundMuted");
    this.isMuted = saved ? JSON.parse(saved) : false;
    const savedVolume = localStorage.getItem("masterVolume");
    this.masterVolume = savedVolume ? parseFloat(savedVolume) : 0.7;
    const savedBgMusic = localStorage.getItem("backgroundMusicEnabled");
    this.backgroundMusicEnabled = savedBgMusic ? JSON.parse(savedBgMusic) : true;
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

  // Background music loop - psychologically effective casino ambient
  // Research-backed: Low-volume, mid-tempo (~120 BPM), major-key, seamless loop
  // Creates positive mood maintenance without conscious attention (Langer & Imber, 2007)
  // Uses consonant intervals (major 3rd, perfect 5th) - avoids dissonance fatigue
  playBackgroundMusic() {
    if (this.isMuted || !this.backgroundMusicEnabled) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Stop any existing background music
      if (this.backgroundMusicInterval) {
        clearInterval(this.backgroundMusicInterval);
      }

      // Casino-style loop: 8-bar phrase at 120 BPM = 16 seconds
      // Uses pentatonic major (no dissonant 4th/7th) = pleasant, non-fatiguing
      const melody = [
        // Bar 1-2: Gentle opening (tonic - dominant)
        { freq: 262, duration: 0.8, delay: 0.0 },   // C4
        { freq: 330, duration: 0.8, delay: 0.8 },   // E4 (major 3rd - warmth)
        { freq: 392, duration: 0.8, delay: 1.6 },   // G4 (perfect 5th - stability)
        { freq: 330, duration: 0.8, delay: 2.4 },   // E4
        
        // Bar 3-4: Lift (subdominant feel)
        { freq: 349, duration: 0.8, delay: 3.2 },   // F4
        { freq: 392, duration: 0.8, delay: 4.0 },   // G4
        { freq: 440, duration: 0.8, delay: 4.8 },   // A4
        { freq: 392, duration: 0.8, delay: 5.6 },   // G4
        
        // Bar 5-6: Resolution
        { freq: 330, duration: 0.8, delay: 6.4 },   // E4
        { freq: 262, duration: 0.8, delay: 7.2 },   // C4
        { freq: 294, duration: 0.8, delay: 8.0 },   // D4
        { freq: 330, duration: 0.8, delay: 8.8 },   // E4
        
        // Bar 7-8: Turnaround
        { freq: 392, duration: 0.8, delay: 9.6 },   // G4
        { freq: 440, duration: 0.8, delay: 10.4 },  // A4
        { freq: 392, duration: 0.8, delay: 11.2 },  // G4
        { freq: 330, duration: 1.6, delay: 12.0 },  // E4 (hold - resolution)
        { freq: 262, duration: 1.6, delay: 13.6 },  // C4 (tonic resolution)
      ];

      const playLoop = () => {
        if (this.isMuted || !this.backgroundMusicEnabled) return;
        
        const loopStart = ctx.currentTime;
        melody.forEach(({ freq, duration, delay }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.type = "sine";
          osc.frequency.value = freq;

          // Very low volume - subliminal mood maintenance (~15% of master)
          gain.gain.setValueAtTime(this.masterVolume * 0.1, loopStart + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, loopStart + delay + duration);

          // Gentle lowpass - removes any harshness, keeps it warm
          filter.type = "lowpass";
          filter.frequency.value = 800;
          filter.Q.value = 0.5;

          osc.start(loopStart + delay);
          osc.stop(loopStart + delay + duration);
        });
      };

      // Play immediately
      playLoop();
      
      // Loop every 16 seconds (8 bars @ 120 BPM)
      this.backgroundMusicInterval = window.setInterval(playLoop, 16000);
      
    } catch (e) {
      console.warn("Could not play background music:", e);
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusicInterval) {
      clearInterval(this.backgroundMusicInterval);
      this.backgroundMusicInterval = null;
    }
  }

  // Mute/unmute
  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem("soundMuted", JSON.stringify(muted));
    if (muted) {
      this.stopBackgroundMusic();
    } else if (this.backgroundMusicEnabled) {
      this.playBackgroundMusic();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // Set master volume
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem("masterVolume", this.masterVolume.toString());
    // Restart background music at new volume
    if (this.backgroundMusicEnabled && !this.isMuted) {
      this.playBackgroundMusic();
    }
  }

  getVolume(): number {
    return this.masterVolume;
  }

  // Toggle background music
  setBackgroundMusicEnabled(enabled: boolean) {
    this.backgroundMusicEnabled = enabled;
    localStorage.setItem("backgroundMusicEnabled", JSON.stringify(enabled));
    if (enabled && !this.isMuted) {
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
  }

  getBackgroundMusicEnabled(): boolean {
    return this.backgroundMusicEnabled;
  }
}

export const soundManager = new SoundManager();
