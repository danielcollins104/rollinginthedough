/**
 * Click-free envelope timing — pure functions for unit testing.
 *
 * Instant gain transitions from 0 → peak produce audible "blats" (the
 * textbook "blowing into a microphone" artifact, especially on noise
 * transients and low-frequency sines). This module factors out the
 * timing math so the envelope can be tested without an AudioContext.
 *
 * The envelope is: linear attack (0 → peak), hold at peak for sustain,
 * exponential release (peak → ~silence). All times are in seconds.
 */

export interface EnvelopeTiming {
  /** Start of the attack ramp (relative to ctx.currentTime). */
  attackStart: number;
  /** End of the attack ramp / start of the hold. */
  attackEnd: number;
  /** End of the hold / start of the release. */
  releaseStart: number;
  /** End of the release — where the oscillator is stopped. */
  releaseEnd: number;
  /** Peak gain value. */
  peak: number;
}

/**
 * Compute click-free envelope timing for an oscillator of the given
 * duration and delay. Defaults attack/decay to small enough values
 * that they're inaudible as "delay" but large enough to eliminate
 * edge transients.
 */
export function computeEnvelope(
  duration: number,
  delay = 0,
  peak = 0.3,
  attack = 0.008,
  preRelease = 0.05
): EnvelopeTiming {
  const attackStart = delay;
  const attackEnd = delay + attack;
  // The release phase should be at least `preRelease` long so the
  // exponential ramp has room to falloff silently. If duration is
  // shorter than attack + preRelease, collapse to a linear ramp.
  const releaseStart = Math.max(attackEnd, delay + duration - preRelease);
  const releaseEnd = delay + duration;
  return { attackStart, attackEnd, releaseStart, releaseEnd, peak };
}

/**
 * Format an envelope for debug display.
 */
export function describeEnvelope(env: EnvelopeTiming): string {
  return (
    `attack=${(env.attackEnd - env.attackStart) * 1000 | 0}ms ` +
    `hold=${(env.releaseStart - env.attackEnd) * 1000 | 0}ms ` +
    `release=${(env.releaseEnd - env.releaseStart) * 1000 | 0}ms ` +
    `peak=${env.peak}`
  );
}
