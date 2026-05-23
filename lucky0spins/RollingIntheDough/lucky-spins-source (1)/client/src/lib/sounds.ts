/**
 * Rolling in the Dough — Sound Effects Library (v3)
 * Research-Backed Addictive Sound Design Edition
 * Based on casino psychology research and neuroscience
 * 
 * Design Principles (from research):
 * - Win Sounds: Ascending pitch + layered harmonics trigger dopamine release
 * - Tempo: 120+ BPM for excitement, encourages quick decision-making
 * - Frequency Mix: Bass (40-80Hz) + warmth (200-500Hz) + clarity (2-5kHz) + sparkle (8-16kHz)
 * - Immediate Feedback: No delay between action and sound reinforcement
 * - Variety: Slight variations prevent habituation while maintaining consistency
 * - Huntress: Deep bass impact + metallic clash = memorable, distinctive cue
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a smooth tone with optional frequency sweep
 * Creates warm, analog-like sounds
 */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gainValue = 0.3,
  delay = 0,
  endFrequency?: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  
  // Frequency sweep for more interesting sound
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, ctx.currentTime + delay + duration);
  }

  // Smooth attack and release envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration);
}

/**
 * Play filtered noise with smooth envelope
 * Creates mechanical, organic textures
 */
function playNoise(duration: number, gainValue = 0.1, delay = 0, filterFreq = 1200) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gainValue, ctx.currentTime + delay);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 1;

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(ctx.currentTime + delay);
  source.stop(ctx.currentTime + delay + duration);
}

/**
 * Play a harmonic chord (multiple frequencies together)
 * Creates rich, satisfying sounds
 */
function playChord(frequencies: number[], duration: number, type: OscillatorType = "sine", gainValue = 0.2, delay = 0) {
  frequencies.forEach((freq) => {
    playTone(freq, duration, type, gainValue / frequencies.length, delay);
  });
}

export type SoundName =
  | "spin"
  | "reel_stop"
  | "small_win"
  | "big_win"
  | "mega_win"
  | "jackpot"
  | "coin_drop"
  | "button_click"
  | "free_spin"
  | "cascade"
  | "bonus_alert"
  | "win_explosion"
  | "huntress_slam"
  | "huntress_slam_2"
  | "huntress_slam_3"
  | "huntress_slam_4"
  | "huntress_slam_5"
  | "multi_win";

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

/**
 * Play scaled win sound based on number of winning lines
 * More wins = bigger, more intense sound
 */
export function playWinSound(winCount: number) {
  if (!soundEnabled || winCount <= 0) return;
  
  if (winCount === 1) {
    playSound("small_win");
  } else if (winCount === 2) {
    playSound("small_win");
    setTimeout(() => playSound("small_win"), 200);
  } else if (winCount === 3) {
    playSound("big_win");
  } else if (winCount >= 4 && winCount <= 6) {
    playSound("big_win");
    setTimeout(() => playSound("big_win"), 300);
  } else if (winCount >= 7) {
    playSound("mega_win");
  }
}

export function playSound(name: SoundName) {
  if (!soundEnabled) return;

  switch (name) {
    case "spin":
      // Research-backed spin: mechanical whirring + ascending pitch = anticipation
      // Rising tones create tension and encourage quick decision-making (120+ BPM effect)
      playNoise(0.2, 0.08, 0, 1800);             // Mechanical whirring
      playTone(100, 0.2, "sine", 0.1, 0, 160);   // Rising bass sweep
      playTone(200, 0.15, "sine", 0.08, 0.05, 300); // Rising mid sweep
      playTone(300, 0.1, "sine", 0.06, 0.1, 400);   // Rising high sweep
      break;

    case "reel_stop":
      // Research-backed reel stop: satisfying mechanical click with harmonic resonance
      // Triggers reward sensation through multi-frequency engagement
      playTone(200, 0.12, "sine", 0.22);        // Deep thunk (warmth)
      playTone(400, 0.08, "sine", 0.18, 0.02);  // Harmonic ring (clarity)
      playTone(600, 0.06, "sine", 0.12, 0.04);  // Upper harmonic
      playNoise(0.08, 0.05, 0.02, 2500);        // Mechanical texture
      playTone(1200, 0.04, "sine", 0.08, 0.05); // Subtle sparkle
      break;

    case "small_win":
      // Research-backed small win: ascending pitch + harmonic richness
      // Triggers dopamine release through positive reinforcement
      playNoise(0.08, 0.12, 0, 4000); // High-freq sparkle (8-16kHz range)
      playTone(330, 0.15, "sine", 0.25);        // Low warmth (200-500Hz range)
      playTone(440, 0.12, "sine", 0.28, 0.08);  // A4 - ascending start
      playTone(550, 0.12, "sine", 0.3, 0.14);   // C#5 - ascending
      playTone(660, 0.15, "sine", 0.32, 0.2);   // E5 - peak (dopamine trigger)
      playTone(880, 0.2, "sine", 0.28, 0.28);   // A5 - satisfying finish
      break;

    case "big_win":
      // Research-backed big win: multi-frequency engagement
      // Bass impact + ascending melody + harmonic layering = strong dopamine response
      playTone(60, 0.15, "sine", 0.3);          // Deep bass impact (40-80Hz)
      playNoise(0.1, 0.15, 0, 4500);            // Sparkle burst
      playTone(440, 0.1, "sine", 0.3, 0.05);    // A4 start
      playTone(550, 0.1, "sine", 0.32, 0.12);   // C#5 ascending
      playTone(660, 0.1, "sine", 0.34, 0.19);   // E5 ascending
      playTone(880, 0.15, "sine", 0.36, 0.26);  // A5 peak
      playTone(1100, 0.2, "sine", 0.3, 0.34);   // Extended high
      playChord([440, 660, 880, 1100], 0.3, "sine", 0.2, 0.42); // Rich harmonic chord
      break;

    case "mega_win":
      // Research-backed mega win: maximum dopamine trigger
      // Multi-layered frequencies across entire spectrum + bass impact
      playTone(50, 0.2, "sine", 0.35);          // Sub-bass impact (felt, not heard)
      playTone(80, 0.18, "sine", 0.32, 0.02);   // Bass impact
      playNoise(0.12, 0.18, 0.04, 5000);        // High sparkle
      const megaFreqs = [330, 440, 550, 660, 880];
      megaFreqs.forEach((freq, i) => {
        playTone(freq, 0.2, "sine", 0.3, i * 0.06);
      });
      // Powerful harmonic swell
      playChord([440, 660, 1100, 1320], 0.4, "sine", 0.25, 0.4);
      playTone(1320, 0.5, "sine", 0.25, 0.5); // Sustained high note
      playTone(1760, 0.3, "sine", 0.15, 0.6); // Ultra-high sparkle
      break;

    case "jackpot":
      // Research-backed jackpot: MAXIMUM dopamine trigger
      // Full frequency spectrum engagement + sustained excitement
      playTone(40, 0.25, "sine", 0.4);          // Sub-bass (felt viscerally)
      playTone(80, 0.22, "sine", 0.38, 0.02);   // Bass impact
      playTone(120, 0.2, "sine", 0.35, 0.04);   // Secondary bass
      playNoise(0.15, 0.2, 0.06, 5500);         // High sparkle burst
      const jackpotFreqs = [220, 330, 440, 550, 660, 880];
      jackpotFreqs.forEach((freq, i) => {
        playTone(freq, 0.25, "sine", 0.32, i * 0.06);
      });
      // Powerful harmonic chord (multiple layers)
      playChord([440, 660, 880, 1100], 0.5, "sine", 0.28, 0.38);
      // Sustained high note with frequency sweep
      playTone(1320, 0.8, "sine", 0.3, 0.5);
      playTone(1320, 0.8, "sine", 0.18, 0.5, 1400); // Frequency wobble
      // Extended celebratory burst
      playNoise(0.4, 0.12, 0.8, 4000);
      playTone(1760, 0.4, "sine", 0.2, 0.9); // Ultra-high celebration
      break;

    case "coin_drop":
      // Satisfying metallic clink with resonance
      // Triggers reward sensation
      playTone(1200, 0.1, "sine", 0.22);
      playTone(900, 0.08, "sine", 0.18, 0.05);
      playTone(600, 0.06, "sine", 0.12, 0.08); // Resonance decay
      break;

    case "button_click":
      // Soft, satisfying click
      // Encourages interaction
      playTone(900, 0.05, "sine", 0.15);
      playTone(1200, 0.04, "sine", 0.1, 0.02);
      break;

    case "free_spin":
      // Magical, ascending sparkle
      // Feels exciting and rewarding
      const sparkleFreqs = [880, 1100, 1320, 1760];
      sparkleFreqs.forEach((freq, i) => {
        playTone(freq, 0.15, "sine", 0.24, i * 0.06);
      });
      // Harmonic shimmer
      playChord([880, 1320, 1760], 0.2, "sine", 0.15, 0.35);
      break;

    case "cascade":
      // Cascading/falling sound (Candy Crush style)
      playTone(800, 0.3, "sine", 0.2);
      playTone(600, 0.25, "sine", 0.18, 0.1);
      playTone(400, 0.2, "sine", 0.15, 0.2);
      break;

    case "bonus_alert":
      // Exciting bonus game trigger
      const bonusFreqs = [659, 784, 1047, 1319];
      bonusFreqs.forEach((freq, i) => {
        playTone(freq, 0.25, "sine", 0.3, i * 0.1);
      });
      break;

    case "win_explosion":
      // Research-backed win explosion: immediate, intense reward feedback
      // Bass impact + high-freq sparkle + ascending melody = strong dopamine surge
      playTone(60, 0.12, "sine", 0.35);         // Bass impact
      playNoise(0.15, 0.3, 0, 5000);            // Explosive high-freq burst
      playTone(880, 0.2, "sine", 0.35, 0.04);   // High impact tone
      playTone(1100, 0.2, "sine", 0.32, 0.08);  // Ascending
      playTone(1320, 0.25, "sine", 0.28, 0.12); // Peak
      playTone(1760, 0.2, "sine", 0.2, 0.16);   // Ultra-high sparkle
      break;

    case "huntress_slam":
      // Research-backed huntress slam: memorable, distinctive bonus trigger
      // Deep bass impact (40-80Hz) + metallic clash (high-freq transient)
      // Creates sonic branding for the huntress symbol
      playTone(50, 0.18, "sine", 0.4);          // Deep bass impact (felt)
      playTone(80, 0.2, "sine", 0.38, 0.01);    // Primary bass slam
      playNoise(0.1, 0.25, 0.02, 3500);         // Metallic clash (sword strike)
      playTone(120, 0.15, "sine", 0.3, 0.03);   // Secondary bass resonance
      playTone(200, 0.12, "sine", 0.2, 0.05);   // Harmonic resonance
      playTone(3000, 0.08, "sine", 0.15, 0.04); // High-freq metallic ring
      break;

    case "huntress_slam_2":
      // Crescendo slam #2: Louder and more intense (2 huntress symbols)
      playTone(45, 0.2, "sine", 0.5);           // Deeper bass impact
      playTone(75, 0.22, "sine", 0.48, 0.01);   // Primary bass slam (louder)
      playNoise(0.12, 0.35, 0.02, 3500);        // Metallic clash (more intense)
      playTone(110, 0.18, "sine", 0.4, 0.03);   // Secondary bass (louder)
      playTone(200, 0.15, "sine", 0.3, 0.05);   // Harmonic resonance (louder)
      playTone(3000, 0.1, "sine", 0.2, 0.04);   // High-freq metallic ring (louder)
      playTone(1500, 0.08, "sine", 0.15, 0.06); // Added mid-range impact
      break;

    case "huntress_slam_3":
      // Crescendo slam #3: Even louder and more aggressive (3 huntress symbols)
      playTone(40, 0.25, "sine", 0.6);          // Very deep bass impact
      playTone(70, 0.25, "sine", 0.58, 0.01);   // Primary bass slam (very loud)
      playNoise(0.15, 0.45, 0.02, 3500);        // Metallic clash (very intense)
      playTone(100, 0.2, "sine", 0.5, 0.03);    // Secondary bass (very loud)
      playTone(200, 0.18, "sine", 0.4, 0.05);   // Harmonic resonance (very loud)
      playTone(3000, 0.12, "sine", 0.25, 0.04); // High-freq metallic ring (very loud)
      playTone(1500, 0.1, "sine", 0.2, 0.06);   // Mid-range impact (louder)
      playTone(4500, 0.08, "sine", 0.15, 0.08); // Ultra-high sparkle
      break;

    case "huntress_slam_4":
      // Crescendo slam #4: Extreme intensity (4 huntress symbols)
      playTone(35, 0.3, "sine", 0.7);           // Extreme bass impact
      playTone(65, 0.28, "sine", 0.68, 0.01);   // Primary bass slam (extreme)
      playNoise(0.18, 0.55, 0.02, 3500);        // Metallic clash (extreme)
      playTone(90, 0.25, "sine", 0.6, 0.03);    // Secondary bass (extreme)
      playTone(200, 0.22, "sine", 0.5, 0.05);   // Harmonic resonance (extreme)
      playTone(3000, 0.15, "sine", 0.3, 0.04);  // High-freq metallic ring (extreme)
      playTone(1500, 0.12, "sine", 0.25, 0.06); // Mid-range impact (extreme)
      playTone(4500, 0.1, "sine", 0.2, 0.08);   // Ultra-high sparkle (extreme)
      playTone(6000, 0.08, "sine", 0.15, 0.1);  // Hyper-high sparkle
      break;

    case "huntress_slam_5":
      // Crescendo slam #5: Maximum intensity (5+ huntress symbols - JACKPOT!)
      playTone(30, 0.35, "sine", 0.8);          // Maximum bass impact
      playTone(60, 0.32, "sine", 0.78, 0.01);   // Primary bass slam (maximum)
      playNoise(0.2, 0.65, 0.02, 3500);         // Metallic clash (maximum)
      playTone(80, 0.3, "sine", 0.7, 0.03);     // Secondary bass (maximum)
      playTone(200, 0.25, "sine", 0.6, 0.05);   // Harmonic resonance (maximum)
      playTone(3000, 0.18, "sine", 0.35, 0.04); // High-freq metallic ring (maximum)
      playTone(1500, 0.15, "sine", 0.3, 0.06);  // Mid-range impact (maximum)
      playTone(4500, 0.12, "sine", 0.25, 0.08); // Ultra-high sparkle (maximum)
      playTone(6000, 0.1, "sine", 0.2, 0.1);    // Hyper-high sparkle (maximum)
      playNoise(0.15, 0.3, 0.15, 5000);         // Celebratory high-freq burst
      break;

    case "multi_win":
      // Multi-win celebration: stacked wins on multiple paylines
      // Intense, celebratory sound to reinforce excitement
      playTone(40, 0.2, "sine", 0.4);            // Deep bass impact
      playNoise(0.15, 0.35, 0.02, 5500);         // Explosive sparkle
      playChord([440, 660, 880, 1100], 0.25, "sine", 0.3, 0.05); // Rich harmony
      playTone(1320, 0.2, "sine", 0.35, 0.15);   // High peak
      playTone(1760, 0.15, "sine", 0.25, 0.2);   // Ultra-high sparkle
      break;
  }
}

/**
 * Determine if a win should play win music
 * Based on behavioral psychology: play win music on ANY net positive outcome
 * This reinforces the gambling behavior (variable ratio reinforcement schedule)
 */
export function shouldPlayWinMusic(netGain: number, bet: number): boolean {
  // Play win music if net gain is positive (even if small)
  return netGain > 0;
}
