/**
 * Rolling in the Dough — Scientifically-Designed Sound Psychology
 * 
 * Based on behavioral psychology research:
 * - Dopamine triggers: ascending frequencies, harmonic progressions, unexpected rewards
 * - Variable Ratio Reinforcement: unpredictable rewards trigger stronger dopamine response
 * - Frequency psychology: 40Hz (gamma) for focus, 432Hz for calm, 528Hz for healing
 * - Temporal dynamics: longer sustained notes = stronger reward sensation
 * - Win music on small net gains: behavioral conditioning (Skinner box principles)
 */

interface AudioContext {
  audioContext: globalThis.AudioContext;
}

let audioCtxInstance: globalThis.AudioContext | null = null;

function getAudioContext(): globalThis.AudioContext {
  if (!audioCtxInstance) {
    audioCtxInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtxInstance;
}

/**
 * Creates a sine wave oscillator with specified frequency and duration
 */
function playTone(
  frequency: number,
  duration: number,
  volume: number = 0.3,
  envelope: "attack" | "sustain" | "decay" = "sustain"
): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = frequency;

    const now = ctx.currentTime;

    if (envelope === "attack") {
      // Quick attack for impact
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    } else if (envelope === "sustain") {
      // Sustained note
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    } else {
      // Decay envelope (quick fade)
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.3);
    }

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
}

/**
 * Plays multiple tones in sequence (for chords and progressions)
 */
function playSequence(
  frequencies: number[],
  duration: number,
  delay: number = 0.1,
  volume: number = 0.2
): void {
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, duration, volume, "sustain");
    }, delay * index * 1000);
  });
}

/**
 * SPIN SOUND — Anticipation builder
 * Frequency sweep from 100Hz to 200Hz creates tension and excitement
 * Used before spin to build anticipation (classical conditioning)
 */
export function playSpin(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    const now = ctx.currentTime;
    const duration = 0.8;

    // Frequency sweep: 100Hz → 200Hz (creates tension)
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(200, now + duration);

    // Volume envelope: fade in then out
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Spin sound failed:", e);
  }
}

/**
 * REEL STOP SOUND — Satisfying mechanical click
 * 200Hz thunk + harmonic overtones (400Hz, 600Hz) = satisfying resonance
 * Triggers reward sensation (similar to physical slot machine)
 */
export function playReelStop(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Primary thunk (200Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.value = 200;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Harmonic overtone 1 (400Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.value = 400;
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc2.start(now);
    osc2.stop(now + 0.2);

    // Harmonic overtone 2 (600Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.type = "sine";
    osc3.frequency.value = 600;
    gain3.gain.setValueAtTime(0.1, now);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc3.start(now);
    osc3.stop(now + 0.25);
  } catch (e) {
    console.warn("Reel stop sound failed:", e);
  }
}

/**
 * WIN MUSIC (Net Positive) — Plays on ANY net positive outcome
 * Even small wins trigger this to reinforce gambling behavior (variable ratio schedule)
 * Ascending progression: 523Hz (C5) → 659Hz (E5) → 784Hz (G5) → 1047Hz (C6)
 * These frequencies are based on the C major chord (psychologically pleasing)
 * Duration extended for sustained dopamine hit
 */
export function playWinMusic(isSmallWin: boolean = false): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (isSmallWin) {
      // Small win: quick ascending progression (dopamine spike)
      // C5 (523Hz) → E5 (659Hz) → G5 (784Hz)
      const frequencies = [523, 659, 784];
      const duration = 0.3;
      const delay = 0.15;

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const startTime = now + delay * index;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } else {
      // Big win: extended progression with sustain (longer dopamine release)
      // C5 → E5 → G5 → C6 (octave jump = psychological climax)
      const frequencies = [523, 659, 784, 1047];
      const duration = 0.5;
      const delay = 0.2;

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const startTime = now + delay * index;
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    }
  } catch (e) {
    console.warn("Win music failed:", e);
  }
}

/**
 * MEGA WIN SOUND — Epic celebration with maximum dopamine trigger
 * Uses 40Hz gamma frequency (associated with peak cognitive performance)
 * Plus ascending harmonic series for psychological climax
 */
export function playMegaWin(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Gamma frequency (40Hz) for peak state
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.value = 40;
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    osc1.start(now);
    osc1.stop(now + 1.2);

    // Ascending harmonic progression: C5 → E5 → G5 → C6 → E6
    const frequencies = [523, 659, 784, 1047, 1319];
    const duration = 0.4;
    const delay = 0.25;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      const startTime = now + delay * index;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn("Mega win sound failed:", e);
  }
}

/**
 * JACKPOT SOUND — Maximum celebration with binaural beats
 * Combines multiple frequencies for maximum dopamine and adrenaline
 */
export function playJackpot(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Deep bass foundation (80Hz)
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.type = "sine";
    bass.frequency.value = 80;
    bassGain.gain.setValueAtTime(0.2, now);
    bassGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 2);
    bass.start(now);
    bass.stop(now + 2);

    // Ascending celebration: C5 → E5 → G5 → C6 → E6 → G6 (full octave)
    const frequencies = [523, 659, 784, 1047, 1319, 1568];
    const duration = 0.5;
    const delay = 0.15;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      const startTime = now + delay * index;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn("Jackpot sound failed:", e);
  }
}

/**
 * BONUS GAME TRIGGER — Exciting alert sound
 * Binaural beat pattern (40Hz gamma) with ascending tones
 */
export function playBonusAlert(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Quick ascending alert: E5 → G5 → C6 → E6
    const frequencies = [659, 784, 1047, 1319];
    const duration = 0.25;
    const delay = 0.1;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      const startTime = now + delay * index;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn("Bonus alert sound failed:", e);
  }
}

/**
 * CASCADE SOUND — Satisfying cascade effect (like Candy Crush)
 * Descending frequency sweep with harmonic resonance
 */
export function playCascade(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    const now = ctx.currentTime;
    const duration = 0.6;

    // Descending sweep: 800Hz → 400Hz (falling cascade)
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(400, now + duration);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Cascade sound failed:", e);
  }
}

/**
 * BACKGROUND MUSIC LOOP — Sticky, enticing ambient music
 * Uses 432Hz (the "healing frequency") with 40Hz gamma overlay
 * Creates a hypnotic, addictive state (similar to casino background music)
 */
export function playBackgroundMusic(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 432Hz fundamental (healing/calming frequency)
    const fundamental = ctx.createOscillator();
    const fundamentalGain = ctx.createGain();
    fundamental.connect(fundamentalGain);
    fundamentalGain.connect(ctx.destination);
    fundamental.type = "sine";
    fundamental.frequency.value = 432;
    fundamentalGain.gain.setValueAtTime(0.08, now);

    // 40Hz gamma overlay (creates addictive state)
    const gamma = ctx.createOscillator();
    const gammaGain = ctx.createGain();
    gamma.connect(gammaGain);
    gammaGain.connect(ctx.destination);
    gamma.type = "sine";
    gamma.frequency.value = 40;
    gammaGain.gain.setValueAtTime(0.05, now);

    // Let them play indefinitely (will be stopped by component)
    fundamental.start(now);
    gamma.start(now);

    return;
  } catch (e) {
    console.warn("Background music failed:", e);
  }
}

/**
 * NO WIN SOUND — Non-punishing, encouraging sound
 * Doesn't trigger negative emotions, encourages next spin
 * Subtle ascending tone (not descending, which sounds negative)
 */
export function playNoWin(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Subtle ascending tone: G4 → A4 (non-threatening)
    const frequencies = [392, 440];
    const duration = 0.2;
    const delay = 0.1;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      const startTime = now + delay * index;
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn("No win sound failed:", e);
  }
}
