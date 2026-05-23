/**
 * Audio Engine — Enhanced Sound System
 * Programmatic Web Audio API sound generation
 * All sounds are short (< 2 seconds) and snappy
 */

let audioCtx: AudioContext | null = null;
let muted = false;

// ── AudioContext singleton ──────────────────────────────────────────────────
export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(m: boolean) {
  muted = m;
}

// ── Primitive helpers ─────────────────────────────────────────────────────

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.3,
  delay = 0,
  endFreq?: number
) {
  if (muted) return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + delay + duration);
  }
  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function noise(duration: number, gain = 0.1, delay = 0, filterFreq = 1200) {
  if (muted) return;
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + delay);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
  source.stop(ctx.currentTime + delay + duration);
}

function chord(freqs: number[], duration: number, type: OscillatorType = "sine", gain = 0.2, delay = 0) {
  freqs.forEach((f) => tone(f, duration, type, gain / freqs.length, delay));
}

// ── Sound API ─────────────────────────────────────────────────────────────

/** Short tactile click for every button press */
export function playButtonClick() {
  tone(900, 0.04, "sine", 0.18);
  tone(1400, 0.03, "sine", 0.1, 0.01);
}

/** Spin whirring + rising pitch */
export function playSpin() {
  noise(0.2, 0.08, 0, 1800);
  tone(100, 0.2, "sine", 0.1, 0, 160);
  tone(200, 0.15, "sine", 0.08, 0.05, 300);
  tone(300, 0.1, "sine", 0.06, 0.1, 400);
}

/** Satisfying reel stop thunk */
export function playReelStop() {
  tone(200, 0.12, "sine", 0.22);
  tone(400, 0.08, "sine", 0.18, 0.02);
  tone(600, 0.06, "sine", 0.12, 0.04);
  noise(0.08, 0.05, 0.02, 2500);
  tone(1200, 0.04, "sine", 0.08, 0.05);
}

// ── Scatter anticipation ───────────────────────────────────────────────────

let scatterAnticipationOsc: OscillatorNode | null = null;
let scatterAnticipationGain: GainNode | null = null;
let scatterAnticipationInterval: ReturnType<typeof setInterval> | null = null;

export function startScatterAnticipation() {
  if (muted) return;
  const ctx = getAudioContext();

  // Create a looping oscillator that rises in pitch
  scatterAnticipationOsc = ctx.createOscillator();
  scatterAnticipationGain = ctx.createGain();

  scatterAnticipationOsc.connect(scatterAnticipationGain);
  scatterAnticipationGain.connect(ctx.destination);

  scatterAnticipationOsc.type = "sine";
  // Start at a low tension frequency
  scatterAnticipationOsc.frequency.setValueAtTime(220, ctx.currentTime);
  scatterAnticipationGain.gain.setValueAtTime(0, ctx.currentTime);

  // Fade in quickly
  scatterAnticipationGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.1);

  scatterAnticipationOsc.start(ctx.currentTime);

  // Gradually increase pitch over time (simulates tension buildup)
  let elapsed = 0;
  const duration = 3000; // 3 seconds max anticipation
  const targetFreq = 440;
  const startFreq = 220;

  scatterAnticipationInterval = setInterval(() => {
    elapsed += 50;
    const progress = Math.min(elapsed / duration, 1);
    const currentFreq = startFreq + (targetFreq - startFreq) * progress;
    if (scatterAnticipationOsc) {
      scatterAnticipationOsc.frequency.setValueAtTime(currentFreq, ctx.currentTime);
    }
    // Also increase gain slightly for intensity
    if (scatterAnticipationGain) {
      scatterAnticipationGain.gain.setValueAtTime(0.22 + progress * 0.08, ctx.currentTime);
    }
    if (progress >= 1 && scatterAnticipationInterval) {
      clearInterval(scatterAnticipationInterval);
    }
  }, 50);
}

export function stopScatterAnticipation() {
  if (scatterAnticipationInterval) {
    clearInterval(scatterAnticipationInterval);
    scatterAnticipationInterval = null;
  }
  if (scatterAnticipationOsc && scatterAnticipationGain) {
    const ctx = getAudioContext();
    scatterAnticipationGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    setTimeout(() => {
      try {
        scatterAnticipationOsc?.stop();
      } catch {}
      scatterAnticipationOsc = null;
      scatterAnticipationGain = null;
    }, 150);
  }
}

/** Triumphant fanfare when 3rd scatter lands */
export function playScatterFanfare() {
  // First stop the anticipation
  stopScatterAnticipation();

  // Triumphant ascending chord
  tone(330, 0.25, "sine", 0.35);
  tone(440, 0.2, "sine", 0.32, 0.08);
  tone(550, 0.2, "sine", 0.3, 0.16);
  tone(660, 0.25, "sine", 0.32, 0.24);
  tone(880, 0.3, "sine", 0.35, 0.32);
  // Harmony chord
  chord([440, 660, 880], 0.35, "sine", 0.28, 0.45);
  noise(0.15, 0.12, 0.5, 4000);
}

// ── Near miss ─────────────────────────────────────────────────────────────

/** Quick ascending note that doesn't resolve — "so close!" feeling */
export function playNearMiss() {
  tone(440, 0.08, "sine", 0.22);
  tone(550, 0.08, "sine", 0.25, 0.1);
  tone(660, 0.12, "sine", 0.28, 0.2);
  tone(784, 0.15, "sine", 0.3, 0.3); // stops just short — no resolution
  // No bass to back it — left hanging
}

// ── Win tier sounds ────────────────────────────────────────────────────────

/** Subtle coin clink for small wins */
export function playSmallWin() {
  noise(0.08, 0.12, 0, 4000);
  tone(330, 0.15, "sine", 0.25);
  tone(440, 0.12, "sine", 0.28, 0.08);
  tone(550, 0.12, "sine", 0.3, 0.14);
  tone(660, 0.15, "sine", 0.32, 0.2);
  tone(880, 0.2, "sine", 0.28, 0.28);
}

/** Triumphant jingle for big wins */
export function playBigWin() {
  tone(60, 0.15, "sine", 0.3);
  noise(0.1, 0.15, 0, 4500);
  tone(440, 0.1, "sine", 0.3, 0.05);
  tone(550, 0.1, "sine", 0.32, 0.12);
  tone(660, 0.1, "sine", 0.34, 0.19);
  tone(880, 0.15, "sine", 0.36, 0.26);
  tone(1100, 0.2, "sine", 0.3, 0.34);
  chord([440, 660, 880, 1100], 0.3, "sine", 0.2, 0.42);
}

/** Full fanfare with choir + horns for jackpot */
export function playJackpot() {
  tone(40, 0.25, "sine", 0.4);
  tone(80, 0.22, "sine", 0.38, 0.02);
  tone(120, 0.2, "sine", 0.35, 0.04);
  noise(0.15, 0.2, 0.06, 5500);
  // Ascending fanfare sequence
  const fanfare = [220, 330, 440, 550, 660, 880];
  fanfare.forEach((freq, i) => {
    tone(freq, 0.25, "sine", 0.32, i * 0.06);
  });
  // Rich harmonic chord
  chord([440, 660, 880, 1100], 0.5, "sine", 0.28, 0.38);
  // Sustained high note
  tone(1320, 0.8, "sine", 0.3, 0.5);
  tone(1320, 0.8, "sine", 0.18, 0.5, 1400);
  // Celebratory burst
  noise(0.4, 0.12, 0.8, 4000);
  tone(1760, 0.4, "sine", 0.2, 0.9);
}

// ── Cascade combo sounds ───────────────────────────────────────────────────

/** Cascade level 1 — simple drop */
export function playCascade1() {
  tone(800, 0.3, "sine", 0.2);
  tone(600, 0.25, "sine", 0.18, 0.1);
}

/** Cascade level 2 — more exciting */
export function playCascade2() {
  noise(0.08, 0.1, 0, 3000);
  tone(600, 0.2, "sine", 0.25);
  tone(800, 0.15, "sine", 0.22, 0.08);
  tone(1000, 0.18, "sine", 0.24, 0.16);
}

/** Cascade level 3 — triumphant */
export function playCascade3() {
  tone(50, 0.12, "sine", 0.3);
  noise(0.1, 0.15, 0, 4000);
  tone(440, 0.1, "sine", 0.28, 0.05);
  tone(660, 0.12, "sine", 0.3, 0.12);
  tone(880, 0.2, "sine", 0.32, 0.2);
}

/** Cascade level 4+ — increasingly triumphant */
export function playCascade4plus(level: number) {
  // Scale up intensity with level
  const intensity = Math.min(level, 8);
  const bassGain = 0.3 + intensity * 0.05;
  const sparkleGain = 0.12 + intensity * 0.02;

  tone(40 + intensity * 2, 0.15, "sine", bassGain);
  noise(0.12, sparkleGain, 0, 4500 + intensity * 100);
  tone(440, 0.1, "sine", 0.3, 0.05);
  tone(660, 0.1, "sine", 0.32, 0.12);
  tone(880, 0.15, "sine", 0.34, 0.2);
  tone(1100, 0.2, "sine", 0.32, 0.28);
  chord([440, 660, 880, 1100], 0.25, "sine", 0.22 + intensity * 0.02, 0.38);
}

export function playCascade(level: number) {
  if (level === 1) playCascade1();
  else if (level === 2) playCascade2();
  else if (level === 3) playCascade3();
  else playCascade4plus(level);
}

// ── Sticky wild lock ──────────────────────────────────────────────────────

/** Solid thunk/click when wild locks in place */
export function playWildLock() {
  tone(80, 0.15, "sine", 0.4);
  tone(160, 0.1, "sine", 0.25, 0.03);
  tone(3000, 0.06, "sine", 0.15, 0.04);
  noise(0.06, 0.1, 0.02, 2000);
}

// ── Audio Engine interface exposed to components ──────────────────────────

export interface AudioEngine {
  playButtonClick: () => void;
  playSpin: () => void;
  playReelStop: () => void;
  startScatterAnticipation: () => void;
  stopScatterAnticipation: () => void;
  playScatterFanfare: () => void;
  playNearMiss: () => void;
  playSmallWin: () => void;
  playBigWin: () => void;
  playJackpot: () => void;
  playCascade: (level: number) => void;
  playWildLock: () => void;
  setMuted: (m: boolean) => void;
}

export const audioEngine: AudioEngine = {
  playButtonClick,
  playSpin,
  playReelStop,
  startScatterAnticipation,
  stopScatterAnticipation,
  playScatterFanfare,
  playNearMiss,
  playSmallWin,
  playBigWin,
  playJackpot,
  playCascade,
  playWildLock,
  setMuted,
};