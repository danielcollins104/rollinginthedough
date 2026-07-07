/**
 * Rolling in the Dough — Sound Psychology Library (v2)
 * Refactored to use the unified audio core. All oscillators now route
 * through the shared AudioContext + master limiter + master gain, so
 * (a) sounds from this module mix correctly with sounds.ts instead of
 * fighting for a separate audio device, (b) the per-context cap of 6
 * can't be exhausted, and (c) the single mute gate (audioCore.setMuted)
 * silences everything when the user toggles sound off.
 *
 * Original design intent preserved:
 * - playSpin: anticipation builder (100→200Hz sweep)
 * - playReelStop: 200Hz thunk + harmonic overtones
 * - playWinMusic: ascending C-major chord = psychologically pleasing
 * - playMegaWin: bass gamma (40Hz) + ascending harmonic series
 * - playJackpot: deep bass swell + full octave celebration
 * - playBonusAlert: ascending alert (E5 G5 C6 E6)
 * - playCascade: descending sweep (800→400Hz) = falling
 *
 * Peak gains kept under 0.5 per branch; the master limiter is the
 * safety net below that.
 */

import {
  playTone,
  playChord,
  playArpeggio,
  playNoise,
  getAudioContext,
  getMixBus as coreMixBus,
} from "./audioCore";
import { computeEnvelope } from "./audioEnvelope";

/**
 * Plays a single oscillator through audioCore's mix bus with a click-free
 * attack/hold/release envelope. Returns the gain node so callers can
 * chain filters if needed.
 */
function spawnOsc(
  ctx: AudioContext,
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
  // Route through audioCore's bus (which already goes through the master
  // limiter and master gain). Direct ctx.destination connections would
  // bypass the limiter and risk destination clipping.
  gain.connect(getMixBus());
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

// Local mix-bus helper that calls the unified audio core. The bus is
// the same one sounds.ts writes to, so all sounds share a single
// AudioContext + master limiter + master gain.
function getMixBus(): AudioNode {
  const ctx = getAudioContext();
  return ctx ? coreMixBus(ctx) : ({ connect: () => {} } as unknown as AudioNode);
}

function playSequence(
  frequencies: number[],
  duration: number,
  delay: number = 0.1,
  volume: number = 0.18
): void {
  // Use audioCore.playTone so the chain is consistent with sounds.ts.
  // Each note gets its own click-free envelope via audioCore.
  frequencies.forEach((freq, index) => {
    playTone(freq, duration, "sine", volume, delay * index);
  });
}

export function playSpin(): void {
  // 100→200Hz sweep, 800ms. The sweep is gentle (no noise) so it
  // doesn't pile on top of sounds.ts's spin sound if both fire.
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = 0.8;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(coreMixBus(ctx));
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(200, now + duration);

    const env = computeEnvelope(duration, 0, 0.18, 0.10, duration * 0.4);
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

export function playReelStop(): void {
  // Mechanical click + harmonic. 200Hz thunk + 400Hz + 600Hz overtones.
  // Peak gain 0.20 — short, won't accumulate across 5 reel stops.
  try {
    playTone(200, 0.12, "sine", 0.18);
    playTone(400, 0.10, "sine", 0.12, 0.02);
    playTone(600, 0.08, "sine", 0.10, 0.04);
  } catch (e) {
    console.warn("Reel stop sound failed:", e);
  }
}

export function playWinMusic(isSmallWin: boolean = false): void {
  try {
    if (isSmallWin) {
      // C5 → E5 → G5 (quick dopamine spike)
      playSequence([523, 659, 784], 0.20, 0.10, 0.13);
    } else {
      // C5 → E5 → G5 → C6 (sustained climax)
      playSequence([523, 659, 784, 1047], 0.25, 0.12, 0.15);
    }
  } catch (e) {
    console.warn("Win music failed:", e);
  }
}

export function playMegaWin(): void {
  try {
    // Bass gamma (40Hz) — short, won't clip into the next sound
    playTone(40, 0.20, "sine", 0.18);
    // Ascending harmonic series
    playSequence([523, 659, 784, 1047, 1319], 0.25, 0.10, 0.13);
  } catch (e) {
    console.warn("Mega win sound failed:", e);
  }
}

export function playJackpot(): void {
  try {
    // Deep bass foundation (80Hz)
    playTone(80, 0.30, "sine", 0.20);
    // Full octave celebration
    playSequence([523, 659, 784, 1047, 1319, 1568], 0.30, 0.10, 0.13);
    // High bell tail
    playTone(2093, 0.50, "sine", 0.10, 0.60);
  } catch (e) {
    console.warn("Jackpot sound failed:", e);
  }
}

export function playBonusAlert(): void {
  try {
    // Ascending alert E5 → G5 → C6 → E6.
    playSequence([659, 784, 1047, 1319], 0.20, 0.10, 0.15);
  } catch (e) {
    console.warn("Bonus alert sound failed:", e);
  }
}

export function playCascade(): void {
  // Descending sweep 800Hz → 400Hz. Falls and lands.
  try {
    playTone(800, 0.25, "sine", 0.16, 0, 400);
    playTone(600, 0.20, "sine", 0.10, 0.10, 300);
  } catch (e) {
    console.warn("Cascade sound failed:", e);
  }
}

/**
 * Background music — sustained 432Hz "healing" tone with 40Hz gamma overlay.
 *
 * Old version started oscillators with NEVER stop them — every call piled
 * oscillators on top of the live ones, multiplying the volume and producing
 * a layered "wind blowing" drone that wouldn't go away. Now both oscillators
 * have a finite 8s duration and explicit .stop() calls. Callers MUST
 * re-invoke playBackgroundMusic() before the 8s elapses to keep the music
 * going. startBackgroundMusic/loopBackgroundMusic manage continuity.
 */
let bgFundamental: { osc: OscillatorNode; gain: GainNode } | null = null;
let bgGamma: { osc: OscillatorNode; gain: GainNode } | null = null;
const BG_DURATION = 8; // seconds

export function playBackgroundMusic(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const end = now + BG_DURATION;
    const bus = coreMixBus(ctx);

    // 432Hz fundamental
    const fundamental = ctx.createOscillator();
    const fundamentalGain = ctx.createGain();
    fundamental.connect(fundamentalGain);
    fundamentalGain.connect(bus);
    fundamental.type = "sine";
    fundamental.frequency.value = 432;
    const fundEnv = computeEnvelope(BG_DURATION, 0, 0.06, 0.5, BG_DURATION * 0.5);
    fundamentalGain.gain.setValueAtTime(0, now + fundEnv.attackStart);
    fundamentalGain.gain.linearRampToValueAtTime(fundEnv.peak, now + fundEnv.attackEnd);
    fundamentalGain.gain.setValueAtTime(fundEnv.peak, now + fundEnv.releaseStart);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.001, end);
    fundamental.start(now);
    fundamental.stop(end);
    bgFundamental = { osc: fundamental, gain: fundamentalGain };

    // 40Hz gamma overlay
    const gamma = ctx.createOscillator();
    const gammaGain = ctx.createGain();
    gamma.connect(gammaGain);
    gammaGain.connect(bus);
    gamma.type = "sine";
    gamma.frequency.value = 40;
    const gammaEnv = computeEnvelope(BG_DURATION, 0, 0.04, 0.5, BG_DURATION * 0.5);
    gammaGain.gain.setValueAtTime(0, now + gammaEnv.attackStart);
    gammaGain.gain.linearRampToValueAtTime(gammaEnv.peak, now + gammaEnv.attackEnd);
    gammaGain.gain.setValueAtTime(gammaEnv.peak, now + gammaEnv.releaseStart);
    gammaGain.gain.exponentialRampToValueAtTime(0.001, end);
    gamma.start(now);
    gamma.stop(end);
    bgGamma = { osc: gamma, gain: gammaGain };
  } catch (e) {
    console.warn("Background music failed:", e);
  }
}

export function startBackgroundMusic(): void {
  playBackgroundMusic();
  // Re-invoke every 7s (1s before BG_DURATION) so the loop is continuous.
  setInterval(() => playBackgroundMusic(), 7000);
}

export function loopBackgroundMusic(): void {
  startBackgroundMusic();
}

export function stopBackgroundMusic(): void {
  if (bgFundamental) {
    try { bgFundamental.osc.stop(); } catch {}
    bgFundamental = null;
  }
  if (bgGamma) {
    try { bgGamma.osc.stop(); } catch {}
    bgGamma = null;
  }
}
