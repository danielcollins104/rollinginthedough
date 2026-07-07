/**
 * Audio Core — Single shared AudioContext + master limiter for the whole game.
 *
 * Why this exists:
 * 1. Browser caps at ~6 simultaneous AudioContexts (Chrome). If sounds.ts,
 *    soundsPsychology.ts, and nearMiss.ts each create their own context,
 *    you burn through the cap and new sounds fail silently — the user
 *    reports "no sound" even though our code says it should be playing.
 * 2. Without a master limiter at the destination, any branch whose
 *    per-oscillator peaks sum above 1.0 hard-clips into broadband
 *    saturation that reads as "blowing into a microphone" or "dirtbike."
 * 3. Without a single shared gating flag, the user's mute toggle on the
 *    React UI may not actually mute anything because the audio lib
 *    reads its own module-local copy of the flag.
 *
 * One context, one limiter, one gate. Every sound library imports from
 * here. New sound code MUST use playTone / playNoise from this module
 * (or build on them) — direct `audioCtx.destination` writes are
 * forbidden because they bypass the limiter and the gate.
 */

let audioCtx: AudioContext | null = null;
let masterLimiter: DynamicsCompressorNode | null = null;
let masterGain: GainNode | null = null;
let muted = false; // the single source of truth for the mute toggle

/**
 * Get the shared AudioContext. Creates one on first call. Also creates
 * the master limiter and master gain if they don't exist. Both feed the
 * destination: gain → limiter → destination. The gain is the mute flag
 * (1.0 = on, 0.0 = muted), the limiter is the fail-safe against any
 * branch that sums above 1.0.
 */
export function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterLimiter = audioCtx.createDynamicsCompressor();
      // Aggressive but musical. threshold -8dB catches typical peaks
      // before they hit the ceiling; ratio 12 gives fast limiting without
      // audible pumping on dense win stings.
      masterLimiter.threshold.value = -8;
      masterLimiter.knee.value = 6;
      masterLimiter.ratio.value = 12;
      masterLimiter.attack.value = 0.003;
      masterLimiter.release.value = 0.08;
      masterGain.connect(masterLimiter);
      masterLimiter.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** The single node every oscillator's gain stage should connect to. */
export function getMixBus(ctx: AudioContext): AudioNode {
  return masterGain ?? ctx.destination;
}

/** Toggle the master mute. 0 = silent, 1 = full. Idempotent. */
export function setMuted(shouldMute: boolean): void {
  muted = shouldMute;
  if (masterGain && audioCtx) {
    // Use setTargetAtTime to avoid clicks when toggling.
    masterGain.gain.setTargetAtTime(muted ? 0 : 1, audioCtx.currentTime, 0.01);
  }
}

export function isMuted(): boolean {
  return muted;
}

/**
 * Play a smooth tone with optional frequency sweep.
 *
 * Click-free envelope: linear attack 0→peak over `attack` seconds, hold
 * at peak, exponential release to 0.001 over the final 50ms. The attack
 * ramp is the fix for the "blat" / "blowing into a mic" artifact that
 * happens when gain jumps from 0 to peak instantly.
 */
export function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gainValue = 0.3,
  delay = 0,
  endFrequency?: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const bus = getMixBus(ctx);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(bus);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(
      endFrequency,
      ctx.currentTime + delay + duration
    );
  }

  const ATTACK = 0.008;
  const RELEASE_START = Math.max(ATTACK, duration - 0.05);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay + ATTACK);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + delay + RELEASE_START);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

/**
 * Play filtered noise with click-free envelope.
 * Filtered white noise adds mechanical texture — gear mesh, pawl click,
 * cabinet rattle. Without the attack ramp, noise bursts are the worst
 * offender for the "blowing into a mic" broadband saturation.
 */
export function playNoise(
  duration: number,
  gainValue = 0.1,
  delay = 0,
  filterFreq = 1200,
  filterType: BiquadFilterType = "lowpass",
  filterQ = 1
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const bus = getMixBus(ctx);

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;

  const gain = ctx.createGain();
  const ATTACK = 0.005;
  const RELEASE_START = Math.max(ATTACK, duration - 0.04);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay + ATTACK);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + delay + RELEASE_START);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  source.start(ctx.currentTime + delay);
  source.stop(ctx.currentTime + delay + duration);
}

/**
 * Play a chord by stacking multiple tones. Each tone's gain is divided
 * by the number of voices so the sum doesn't explode on dense chords.
 */
export function playChord(
  frequencies: number[],
  duration: number,
  type: OscillatorType = "sine",
  gainValue = 0.2,
  delay = 0
) {
  const perVoice = gainValue / Math.max(1, frequencies.length);
  frequencies.forEach((freq) => {
    playTone(freq, duration, type, perVoice, delay);
  });
}

/**
 * Play a quick ascending arpeggio (each note slightly delayed from the
 * previous). Used for win stings, bonus alerts, and the huntress
 * warrior scatter trigger. The optional `startDelay` offsets the whole
 * arpeggio from the current time (in seconds) — useful for stacking
 * arpeggios with different starts so they overlap into a chord-stack.
 */
export function playArpeggio(
  frequencies: number[],
  noteDuration = 0.1,
  stepDelay = 0.06,
  type: OscillatorType = "sine",
  gainValue = 0.18,
  startDelay = 0
) {
  frequencies.forEach((freq, i) => {
    playTone(freq, noteDuration, type, gainValue, i * stepDelay + startDelay);
  });
}
