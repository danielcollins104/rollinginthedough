/**
 * Rolling in the Dough — Scientifically-Designed Sound Psychology
 *
 * Based on behavioral psychology research:
 * - Dopamine triggers: ascending frequencies, harmonic progressions, unexpected rewards
 * - Variable Ratio Reinforcement: unpredictable rewards trigger stronger dopamine response
 * - Frequency psychology: 40Hz (gamma) for focus, 432Hz for calm, 528Hz for healing
 * - Temporal dynamics: longer sustained notes = stronger reward sensation
 * - Win music on small net gains: behavioral conditioning (Skinner box principles)
 *
 * v2: All oscillators use a click-free ADSR envelope via computeEnvelope().
 * Earlier versions jumped gain from 0 to peak instantly with
 * setValueAtTime(value, now), then exponential-ramped DOWN. That instant
 * "blat" is the textbook "blowing into a microphone" artifact —
 * especially audible on low frequencies and on rapid sequences where
 * each tone starts while the previous one is still in its release phase.
 */

import { computeEnvelope } from "./audioEnvelope";

// Single shared audio context — creating new ones per-call hits the
// browser's ~6-context cap and causes sounds to fail or play through
// an isolated context that ignores the global mute.
let audioCtxInstance: globalThis.AudioContext | null = null;

function getAudioContext(): globalThis.AudioContext | null {
  try {
    if (!audioCtxInstance) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtxInstance = new Ctx();
    }
    if (audioCtxInstance.state === "suspended") {
      void audioCtxInstance.resume();
    }
    return audioCtxInstance;
  } catch {
    return null;
  }
}

/**
 * Plays a single oscillator through ctx.destination with a click-free
 * attack/hold/release envelope. Returns the gain node so callers can
 * chain filters if needed.
 *
 *   attack  — linear ramp from 0 → peak (default 12ms)
 *   release — exponential ramp from peak → 0.001 (starts at duration - 0.04s)
 */
function spawnOsc(
  ctx: globalThis.AudioContext,
  frequency: number,
  peak: number,
  duration: number,
  type: OscillatorType = "sine",
  delay = 0,
  attack = 0.012,
  preRelease = 0.04
): { osc: OscillatorNode; gain: GainNode } {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  const env = computeEnvelope(duration, delay, peak, attack, preRelease);
  const t = (offset: number) => ctx.currentTime + offset;
  gain.gain.setValueAtTime(0, t(env.attackStart));
  gain.gain.linearRampToValueAtTime(env.peak, t(env.attackEnd));
  gain.gain.setValueAtTime(env.peak, t(env.releaseStart));
  gain.gain.exponentialRampToValueAtTime(0.001, t(env.releaseEnd));

  osc.start(t(env.attackStart));
  osc.stop(t(env.releaseEnd));
  return { osc, gain };
}

/**
 * Sequence of tones (chord/ascending arpeggio). Each note has its own
 * click-free envelope so the start and end of every note is silent.
 */
function playSequence(
  frequencies: number[],
  duration: number,
  delay: number = 0.1,
  volume: number = 0.25
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  frequencies.forEach((freq, index) => {
    spawnOsc(ctx, freq, volume, duration, "sine", delay * index);
  });
}

/**
 * SPIN SOUND — Anticipation builder
 * Frequency sweep from 100Hz → 200Hz creates tension and excitement.
 */
export function playSpin(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = 0.8;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(200, now + duration);

    // Click-free envelope via the shared helper.
    const env = computeEnvelope(duration, 0, 0.25, 0.1, duration * 0.4);
    gain.gain.setValueAtTime(0, now + env.attackStart);
    gain.gain.linearRampToValueAtTime(env.peak, now + env.attackEnd);
    gain.gain.setValueAtTime(env.peak, now + env.releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.001, now + env.releaseEnd);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Spin sound failed:", e);
  }
}

/**
 * REEL STOP SOUND — Satisfying mechanical click
 * 200Hz thunk + harmonic overtones (400Hz, 600Hz) = satisfying resonance
 */
export function playReelStop(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    spawnOsc(ctx, 200, 0.3, 0.15, "sine", 0, 0.005, 0.04);
    spawnOsc(ctx, 400, 0.15, 0.2,  "sine", 0, 0.005, 0.04);
    spawnOsc(ctx, 600, 0.1,  0.25, "sine", 0, 0.005, 0.04);
  } catch (e) {
    console.warn("Reel stop sound failed:", e);
  }
}

/**
 * WIN MUSIC — Plays on any net positive outcome.
 * Ascending progression: C5 → E5 → G5 → C6 (C major chord = psychologically pleasing).
 */
export function playWinMusic(isSmallWin: boolean = false): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (isSmallWin) {
      // C5 → E5 → G5 (quick dopamine spike)
      playSequence([523, 659, 784], 0.3, 0.15, 0.2);
    } else {
      // C5 → E5 → G5 → C6 (sustained climax)
      playSequence([523, 659, 784, 1047], 0.5, 0.2, 0.25);
    }
  } catch (e) {
    console.warn("Win music failed:", e);
  }
}

/**
 * MEGA WIN — Epic celebration with 40Hz gamma and ascending harmonic series.
 */
export function playMegaWin(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Bass gamma (40Hz) — long duration
    spawnOsc(ctx, 40, 0.2, 1.2, "sine", 0, 0.08, 0.4);

    // Ascending harmonic series with attack ramps
    playSequence([523, 659, 784, 1047, 1319], 0.4, 0.25, 0.3);
  } catch (e) {
    console.warn("Mega win sound failed:", e);
  }
}

/**
 * JACKPOT — Maximum celebration with full octave progression.
 */
export function playJackpot(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Deep bass foundation (80Hz, swells up to 0.3)
    spawnOsc(ctx, 80, 0.3, 2.0, "sine", 0, 0.3, 0.5);

    // Full octave celebration: C5 → E5 → G5 → C6 → E6 → G6
    playSequence([523, 659, 784, 1047, 1319, 1568], 0.5, 0.15, 0.3);
  } catch (e) {
    console.warn("Jackpot sound failed:", e);
  }
}

/**
 * BONUS GAME TRIGGER — Exciting alert sound.
 * Ascending tones E5 → G5 → C6 → E6.
 */
export function playBonusAlert(): void {
  try {
    playSequence([659, 784, 1047, 1319], 0.25, 0.1, 0.3);
  } catch (e) {
    console.warn("Bonus alert sound failed:", e);
  }
}

/**
 * CASCADE SOUND — Satisfying cascade effect (Candy Crush style).
 * Descending sweep 800Hz → 400Hz.
 */
export function playCascade(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = 0.6;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(400, now + duration);

    const env = computeEnvelope(duration, 0, 0.25, 0.02, duration * 0.3);
    gain.gain.setValueAtTime(0, now + env.attackStart);
    gain.gain.linearRampToValueAtTime(env.peak, now + env.attackEnd);
    gain.gain.setValueAtTime(env.peak, now + env.releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.001, now + env.releaseEnd);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn("Cascade sound failed:", e);
  }
}

/**
 * BACKGROUND MUSIC — Sustained 432Hz "healing" tone with 40Hz gamma overlay.
 *
 * Old version started oscillators with NEVER stop them — every call piled
 * oscillators on top of the live ones, multiplying the volume and producing
 * a layered "wind blowing" drone that wouldn't go away. Now both oscillators
 * have a finite 8s duration and explicit .stop() calls. This means callers
 * MUST re-invoke playBackgroundMusic() periodically to keep the music going.
 *
 * Audio still won't restart in the middle of a sustained loop (since browsers
 * don't allow restarting a stopped oscillator), so callers should instead
 * use startBackgroundMusic/loopBackgroundMusic to manage continuity.
 */
let bgFundamental: { osc: OscillatorNode; gain: GainNode } | null = null;
let bgGamma: { osc: OscillatorNode; gain: GainNode } | null = null;
const BG_DURATION = 8; // seconds — must be re-invoked before this elapses

export function playBackgroundMusic(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const end = now + BG_DURATION;

    const fundamental = ctx.createOscillator();
    const fundamentalGain = ctx.createGain();
    fundamental.connect(fundamentalGain);
    fundamentalGain.connect(ctx.destination);
    fundamental.type = "sine";
    fundamental.frequency.value = 432;
    // Click-free envelope — instantaneous gain on a 432Hz sustained tone
    // produces an audible blip at start/end.
    const fundEnv = computeEnvelope(BG_DURATION, 0, 0.08, 0.5, BG_DURATION * 0.5);
    fundamentalGain.gain.setValueAtTime(0, now + fundEnv.attackStart);
    fundamentalGain.gain.linearRampToValueAtTime(fundEnv.peak, now + fundEnv.attackEnd);
    fundamentalGain.gain.setValueAtTime(fundEnv.peak, now + fundEnv.releaseStart);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.001, end);
    fundamental.start(now);
    fundamental.stop(end);

    const gamma = ctx.createOscillator();
    const gammaGain = ctx.createGain();
    gamma.connect(gammaGain);
    gammaGain.connect(ctx.destination);
    gamma.type = "sine";
    gamma.frequency.value = 40;
    const gammaEnv = computeEnvelope(BG_DURATION, 0, 0.05, 0.5, BG_DURATION * 0.5);
    gammaGain.gain.setValueAtTime(0, now + gammaEnv.attackStart);
    gammaGain.gain.linearRampToValueAtTime(gammaEnv.peak, now + gammaEnv.attackEnd);
    gammaGain.gain.setValueAtTime(gammaEnv.peak, now + gammaEnv.releaseStart);
    gammaGain.gain.exponentialRampToValueAtTime(0.001, end);
    gamma.start(now);
    gamma.stop(end);

    bgFundamental = { osc: fundamental, gain: fundamentalGain };
    bgGamma = { osc: gamma, gain: gammaGain };
  } catch (e) {
    console.warn("Background music failed:", e);
  }
}

/** Stop any currently-playing background music by ramping it down. */
export function stopBackgroundMusic(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const FADE = 0.25;
    if (bgFundamental && bgGamma) {
      // Ramp down then stop so the cutoff is inaudible.
      bgFundamental.gain.gain.cancelScheduledValues(now);
      bgFundamental.gain.gain.setValueAtTime(bgFundamental.gain.gain.value, now);
      bgFundamental.gain.gain.exponentialRampToValueAtTime(0.001, now + FADE);
      try { bgFundamental.osc.stop(now + FADE); } catch {}
      bgGamma.gain.gain.cancelScheduledValues(now);
      bgGamma.gain.gain.setValueAtTime(bgGamma.gain.gain.value, now);
      bgGamma.gain.gain.exponentialRampToValueAtTime(0.001, now + FADE);
      try { bgGamma.osc.stop(now + FADE); } catch {}
      bgFundamental = null;
      bgGamma = null;
    }
  } catch (e) {
    console.warn("Stop background music failed:", e);
  }
}

/**
 * NO WIN SOUND — Non-punishing, encouraging sound.
 * Subtle ascending G4 → A4 (not descending, which sounds negative).
 */
export function playNoWin(): void {
  try {
    playSequence([392, 440], 0.2, 0.1, 0.1);
  } catch (e) {
    console.warn("No win sound failed:", e);
  }
}
