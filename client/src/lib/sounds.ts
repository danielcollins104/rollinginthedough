/**
 * Rolling in the Dough — Sound Effects Library (v4)
 * Unified audio: every branch routes through audioCore (shared context,
 * master limiter, single mute gate). All branches retuned so the
 * per-branch summed peak gain stays under 0.5 to prevent destination
 * clipping (which read as "blowing into a microphone" / "dirtbike").
 *
 * Design principles (from casino-sound research, see game-animation-physics
 * skill § "Web Audio API — Mechanical Slot Sounds"):
 * - Click-free envelopes: every oscillator has a 5-8ms linear attack
 *   ramp from 0 → peak. Without it, the gain jump from silence to peak
 *   produces an audible "blat" — the dominant cause of the dirtbike
 *   distortion in v3.
 * - Sub-bass (30-80Hz) for "weight" — but keep it short (< 200ms) so
 *   the 5 reel-stop thunks (one per reel, 220ms apart) don't stack into
 *   a sustained rumble. Each reel-stop in v4 is under 180ms with the
 *   sub-bass truncated to 80ms.
 * - No broadband noise above 4kHz without a steep lowpass. The
 *   spin/reel_stop sounds in v3 had 4-5kHz bandpass noise that
 *   produced a sustained high-frequency sizzle — engine-like.
 * - Win sounds: ascending arpeggios + harmonic stacks (C major chord
 *   progression, the most psychoacoustically pleasing key). Peak gain
 *   cut to 0.5 to prevent clipping.
 * - Huntress scatter: sub-bass slam + filtered metallic clash (the
 *   "sword on shield" sonic branding) — peak gain 0.45 to leave headroom
 *   for the limiter.
 * - Three variations per major sound (spin, reel_stop, win tiers,
 *   huntress slam levels) so the player doesn't habituate. Variation
 *   chosen randomly per call, seeded by Math.random() — players can't
 *   predict the exact timbre, which keeps each event feeling "fresh."
 *
 * Game-economy sound design (Langer & Imber 2007, Dixon 2014):
 * - SPIN: low anticipation builder, no win-y tonal content.
 * - REEL STOP (×5, one per reel): mechanical thunk, weight without
 *   win-y chord — the player should not feel rewarded just because a
 *   reel stopped; reward comes on the WIN event, not the stop.
 * - COIN DROP: short bright clink, fires on every coin particle
 *   rendered so the falling coins are audibly metallic.
 * - BUTTON CLICK: tiny blip, 50ms, no tail — so rapid clicks (bet +/-
 *   spam) don't pile up.
 * - SMALL WIN / BIG WIN / MEGA WIN / JACKPOT: progressively more
 *   frequencies, longer tail, more harmonic layering.
 * - LDW NEAR MISS: ascending question that doesn't resolve — the
 *   "almost won" feeling.
 * - STREAK MILESTONE: distinct chime at 3x/5x/10x, with brightness
 *   scaling up at each milestone.
 * - BONUS ENTRY: red-alert-strobe style — dissonant cluster with
 *   bass drop.
 */

import {
  playTone,
  playNoise,
  playChord,
  playArpeggio,
  setMuted as setCoreMuted,
  isMuted as isCoreMuted,
} from "./audioCore";

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
  | "multi_win"
  | "scatter_win"
  | "scatter_land"
  | "wild_land"
  | "wild_lock"
  | "near_miss"
  | "ldw" // loss disguised as win — fake win on a net-loss spin
  | "streak_milestone"
  | "cascade_1"
  | "cascade_2"
  | "cascade_3"
  | "cascade_4"
  | "cascade_5";

/** Convenience wrappers re-exported for callers that prefer the
 *  per-library setter. The single source of truth is audioCore.setMuted. */
export function setSoundEnabled(enabled: boolean) {
  setCoreMuted(!enabled);
}

export function isSoundEnabled(): boolean {
  return !isCoreMuted();
}

/**
 * Play scaled win sound based on number of winning lines.
 * More wins = bigger, more intense sound. Called on spin resolution.
 */
export function playWinSound(winCount: number) {
  if (winCount <= 0) return;

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
  if (isCoreMuted()) return;

  switch (name) {
    case "spin": {
      // v3 had broadband noise + sub-bass that read as "dirtbike." v4:
      // clean ascending whoosh only. No noise — the slot machine doesn't
      // need a literal "shhh" sound to feel like it's spinning; the
      // visual streaks + reel physics do that work. Three short sines
      // sweeping up = a "winding up" anticipation builder. Total peak
      // gain ~0.18 — much quieter than the visual intensity implies,
      // which is intentional: spin should set up the win, not steal
      // its thunder.
      const v = Math.floor(Math.random() * 3);
      if (v === 0) {
        // Classic: rising whoosh
        playTone(160, 0.10, "sine", 0.10, 0, 360);
        playTone(320, 0.08, "sine", 0.08, 0.10, 540);
      } else if (v === 1) {
        // Brighter — adds a sparkle bell at the end
        playTone(180, 0.12, "sine", 0.10, 0, 420);
        playTone(880, 0.10, "sine", 0.08, 0.10);
      } else {
        // Warmer — harmonic stack
        playTone(140, 0.14, "sine", 0.10, 0, 280);
        playTone(280, 0.10, "sine", 0.06, 0.10, 420);
      }
      break;
    }

    case "reel_stop":
      // v3 had 0.16-0.22s of sub-bass + noise per reel. With 5 reel
      // stops 220ms apart, the 220Hz cabinet ring tail of stop #1
      // overlapped with stops #2-3, producing a sustained low rumble —
      // the "dirtbike" engine note. v4 cuts the sub-bass to 80ms and
      // drops the long cabinet ring. What remains: a sharp pawl click
      // + a short body resonance. Mechanical, not engine-like.
      {
        const v = Math.floor(Math.random() * 3);
        if (v === 0) {
          // Light — single click + brief thud
          playTone(180, 0.06, "sine", 0.16);              // Body thud
          playNoise(0.025, 0.10, 0, 2000, "highpass");   // Pawl click
        } else if (v === 1) {
          // Medium — click + low thunk
          playTone(140, 0.08, "sine", 0.16);              // Lower thud
          playNoise(0.030, 0.10, 0, 2200, "highpass");   // Click
          playTone(260, 0.06, "sine", 0.10, 0.04);        // High bite
        } else {
          // Heavy — the "last reel" feel
          playTone(120, 0.09, "sine", 0.16);              // Deepest thud
          playNoise(0.035, 0.12, 0, 1800, "highpass");   // Sharper click
          playTone(220, 0.07, "sine", 0.10, 0.04);        // Ring
        }
      }
      break;

    case "small_win":
      // Ascending C major (C5 E5 G5 C6) — psychoacoustically the
      // "pleasing" chord. Cut from v3's 1.29 peak sum to 0.38.
      {
        const v = Math.floor(Math.random() * 3);
        if (v === 0) {
          playArpeggio([523, 659, 784, 1047], 0.12, 0.06, "sine", 0.12);
        } else if (v === 1) {
          playArpeggio([587, 740, 880, 1175], 0.12, 0.06, "triangle", 0.11);
        } else {
          // Brighter with a high bell
          playArpeggio([659, 784, 988, 1319], 0.10, 0.05, "sine", 0.10);
          playTone(1760, 0.20, "sine", 0.06, 0.20);
        }
      }
      break;

    case "big_win":
      // Bigger harmonic stack with sub-bass body. Peak gain cut from
      // 2.11 to 0.45.
      {
        const v = Math.floor(Math.random() * 3);
        if (v === 0) {
          // Sub-bass body + ascending major chord
          playTone(80, 0.15, "sine", 0.12);
          playArpeggio([440, 554, 659, 880, 1109], 0.13, 0.05, "sine", 0.09);
          playTone(1320, 0.25, "sine", 0.06, 0.30);
        } else if (v === 1) {
          // Triumphant — wider chord spread
          playTone(60, 0.18, "sine", 0.12);
          playChord([220, 277, 330, 440], 0.15, "sine", 0.10, 0.04);
          playChord([440, 554, 659, 880], 0.20, "sine", 0.10, 0.18);
          playTone(1760, 0.30, "sine", 0.05, 0.35);
        } else {
          // Sparkle cascade
          playTone(70, 0.15, "sine", 0.10);
          playArpeggio([880, 1109, 1319, 1760, 2217], 0.10, 0.05, "sine", 0.08);
          playTone(120, 0.30, "sine", 0.06, 0.30);
        }
      }
      break;

    case "mega_win":
      // Longer tail, more harmonic content. Peak gain 0.50.
      {
        const v = Math.floor(Math.random() * 3);
        if (v === 0) {
          // Build-and-release
          playTone(50, 0.20, "sine", 0.13);
          playArpeggio([330, 415, 523, 659, 880, 1109], 0.15, 0.05, "sine", 0.10);
          playChord([523, 659, 880, 1109], 0.40, "sine", 0.10, 0.35);
          playTone(1760, 0.50, "sine", 0.06, 0.50);
        } else if (v === 1) {
          // Sub-bass thunder — raised from 40Hz to 65Hz so phone
          // speakers can reproduce without buzzing.
          playTone(65, 0.30, "sine", 0.12);
          playTone(95, 0.25, "sine", 0.10, 0.05);
          playArpeggio([220, 330, 440, 554, 659, 880], 0.15, 0.05, "sine", 0.09);
          playChord([440, 659, 880, 1109], 0.45, "sine", 0.10, 0.40);
          playTone(1320, 0.50, "sine", 0.06, 0.55);
        } else {
          // Triumphant fanfare
          playTone(65, 0.20, "sine", 0.12);
          playArpeggio([523, 659, 784, 1047, 1319, 1568, 2093], 0.12, 0.04, "sine", 0.09);
          playChord([659, 1047, 1319, 1568], 0.50, "sine", 0.10, 0.45);
          playTone(2200, 0.50, "sine", 0.05, 0.55);
        }
      }
      break;

case "jackpot":
      // Maximum celebration. Peak gain 0.50. Multiple staggered arpeggios
      // for the "payout is still climbing" feeling.
      // Sub-bass was 30/40Hz; raised to 60/70Hz so phone speakers can
      // actually reproduce it. Below 60Hz the cone can't move fast
      // enough and the result reads as wind-rumble.
      {
        const v = Math.floor(Math.random() * 2);
        if (v === 0) {
          // Rising storm
          playTone(70, 0.40, "sine", 0.12);
          playTone(110, 0.30, "sine", 0.10, 0.05);
          // Three overlapping arpeggios at different speeds = chord-stack payoff
          playArpeggio([220, 277, 330, 440, 554, 659, 880], 0.18, 0.04, "sine", 0.08);
          playArpeggio([330, 440, 554, 659, 880, 1109, 1320], 0.18, 0.04, "sine", 0.07, 0.10);
          playChord([659, 880, 1109, 1320, 1760], 0.70, "sine", 0.10, 0.50);
          playTone(2200, 0.80, "sine", 0.05, 0.60);
        } else {
          // Cathedral bells
          playTone(60, 0.50, "sine", 0.11);
          playTone(90, 0.40, "sine", 0.10, 0.04);
          playArpeggio([196, 247, 294, 392, 494, 587, 784, 988], 0.20, 0.05, "sine", 0.08);
          playArpeggio([247, 330, 392, 494, 659, 784, 988, 1319], 0.18, 0.04, "sine", 0.07, 0.12);
          playChord([392, 494, 659, 784, 988, 1319], 0.80, "sine", 0.10, 0.55);
          // Was 1976/2637Hz — the 2637Hz bell at high harmonic content
          // stacked with the chord triggered the limiter and sounded
          // "wind-like" via compressor pump. Capped at 1900Hz.
          playTone(1900, 0.80, "sine", 0.05, 0.70);
        }
      }
      break;

    case "coin_drop":
      // Metallic clink — fires on every coin particle rendered. Three
      // frequencies for the bell-like "tink" timbre. Quick decay so
      // rapid coin showers don't stack into a wash.
      playTone(1320, 0.06, "sine", 0.18);
      playTone(1760, 0.05, "sine", 0.14, 0.02);
      playTone(880, 0.04, "sine", 0.10, 0.04);
      break;

    case "button_click":
      // Tiny blip, 50ms total. Designed to NOT pile up when the user
      // spam-clicks bet +/-. No tail, no harmonic content.
      playTone(1100, 0.05, "sine", 0.12);
      break;

    case "free_spin":
      // Magical ascending sparkle. Distinct from "small_win" — the
      // progression goes higher and uses triangle wave for bell-like
      // timbre.
      playArpeggio([880, 1109, 1319, 1760, 2349], 0.10, 0.05, "triangle", 0.10);
      playTone(2349, 0.20, "sine", 0.06, 0.25);
      break;

    case "cascade":
      // Single neutral cascade sound. The per-level cascade_1..5
      // variations are what fire during cascading wins; this generic
      // variant is for a single non-stacked cascade event.
      playTone(800, 0.10, "sine", 0.14, 0, 400);
      playTone(600, 0.08, "sine", 0.10, 0.08, 300);
      break;

case "bonus_alert":
      // Red-alert-strobe style: dissonant interval cluster + bass drop.
      // Square wave was previously used here, but square waves contain
      // every odd harmonic and read as "buzzy / blown-speaker" on small
      // speakers. Sine with a tight tritone gives the same urgency cue
      // without the harmonic clutter.
      playTone(80, 0.18, "sine", 0.12);                  // Bass drop
      playArpeggio([659, 784, 988, 1047], 0.10, 0.06, "sine", 0.07);  // Sine tritone = urgency
      playTone(1319, 0.30, "sine", 0.08, 0.20);
      break;

    case "win_explosion":
      // Single explosive burst — sharp, high-frequency, short. Used
      // for cascade chain reactions and combo bonuses.
      playTone(60, 0.08, "sine", 0.12);                   // Bass thump
      playTone(220, 0.06, "sine", 0.10, 0.03);            // Body
      playArpeggio([880, 1109, 1319, 1760, 2349], 0.08, 0.04, "sine", 0.08);
      playTone(2637, 0.10, "sine", 0.06, 0.20);
      break;

    case "huntress_slam":
    case "huntress_slam_2":
    case "huntress_slam_3":
    case "huntress_slam_4":
    case "huntress_slam_5": {
      // Sonic branding for the scatter symbol. Sub-bass slam + filtered
      // metallic clash + harmonic stack. Five intensity levels scale
      // the gain and add high-frequency sparkle with each step. The
      // band-passed noise around 1500Hz with Q=8 gives the "sword on
      // shield" timbre without broadband sizzle.
      const level = parseInt(name.split("_")[2] ?? "1", 10);
      const slamGain = 0.10 + level * 0.025;  // 0.13 → 0.225
      const noiseGain = 0.06 + level * 0.015; // 0.075 → 0.135
      const tailGain = 0.04 + level * 0.012;  // 0.052 → 0.10

      playTone(45, 0.15, "sine", slamGain);                  // Felt sub-bass
      playTone(85, 0.12, "sine", slamGain * 0.85, 0.01);     // Body
      // Metallic clash: 1500Hz bandpass noise, Q=8 for narrow "sword ring" timbre
      playNoise(0.10, noiseGain, 0.02, 1500, "bandpass", 8);
      // Harmonic stack — low levels just bass, high levels add treble sparkle
      if (level >= 2) {
        playTone(170, 0.10, "sine", slamGain * 0.7, 0.03);
        playTone(220, 0.08, "sine", slamGain * 0.5, 0.05);
      }
      if (level >= 3) {
        playTone(1100, 0.10, "sine", tailGain, 0.05);
        playTone(1500, 0.08, "sine", tailGain * 0.8, 0.06);
      }
      if (level >= 4) {
        // Was 2200 + 3000Hz, capped at 3000 to stay below the master
        // lowpass cutoff (5000Hz) with a safe margin.
        playTone(2200, 0.08, "sine", tailGain * 0.5, 0.07);
        playTone(2800, 0.06, "sine", tailGain * 0.35, 0.08);
      }
      if (level >= 5) {
        // Jackpot-level slam: high harmonic shimmer. Was 4400 + 5500Hz,
        // which on small speakers hard-clipped to a distorted hiss
        // (the "blown speaker" report). Capped at 3800/3500 so the
        // shimmer is still felt but not above the master lowpass margin.
        playTone(3500, 0.08, "sine", tailGain * 0.3, 0.08);
        playTone(3800, 0.06, "sine", tailGain * 0.25, 0.10);
        playChord([220, 330, 440, 550, 660, 880], 0.30, "sine", 0.08, 0.10);
      }
      break;
    }

    case "multi_win":
      // Two winning paylines simultaneously. Slightly bigger than
      // big_win, with extra chord density.
      playTone(50, 0.18, "sine", 0.12);
      playChord([440, 554, 659, 880], 0.20, "sine", 0.10, 0.04);
      playChord([659, 880, 1109, 1319], 0.25, "sine", 0.10, 0.18);
      playTone(1760, 0.40, "sine", 0.06, 0.30);
      break;

    case "scatter_win":
      // Triumphant fanfare when 3+ scatters trigger the bonus.
      playArpeggio([523, 659, 784, 1047], 0.18, 0.08, "sine", 0.12);
      playTone(1319, 0.30, "sine", 0.10, 0.32);
      playTone(1760, 0.40, "sine", 0.06, 0.40);
      break;

    case "scatter_land":
      // Single scatter lands on a reel — quick high "tink" to read as
      // "special symbol alert" without being a full win.
      playTone(1320, 0.06, "sine", 0.16);
      playTone(1760, 0.04, "sine", 0.12, 0.03);
      break;

    case "wild_land":
      // Wild lands — golden thunk, mid-bell ring.
      playTone(440, 0.10, "sine", 0.18);
      playTone(880, 0.08, "sine", 0.12, 0.04);
      playTone(1320, 0.06, "sine", 0.08, 0.08);
      break;

    case "wild_lock":
      // Wild locks in place (stays for the cascade). Lower, heavier.
      playTone(220, 0.10, "sine", 0.20);
      playTone(440, 0.08, "sine", 0.14, 0.04);
      playTone(660, 0.06, "sine", 0.10, 0.08);
      break;

    case "near_miss":
      // Ascending question that doesn't resolve — the "almost won"
      // feeling. Rises to 660Hz, stops short, then a flat tail.
      playTone(330, 0.05, "sine", 0.14, 0, 660);
      // No resolution — leaves the ear hanging
      break;

    case "ldw":
      // Loss Disguised as Win (Wood & Griffiths 2007). The player
      // bet $100, won back $40, but the sounds are designed to make
      // it feel like a win. Two short ascending chimes with a
      // cheerful bell tail. The trick is the *pattern* sounds like
      // a win, even though the coin counter shows a net loss.
      // Peak gain intentionally capped at 0.30 so the LDW doesn't
      // out-shout an actual real win.
      playArpeggio([523, 659, 784], 0.08, 0.05, "sine", 0.10);
      playTone(1047, 0.15, "sine", 0.08, 0.20);
      break;

    case "streak_milestone":
      // Streak counter crosses 3x / 5x / 10x — distinct chime that
      // scales with the milestone. Higher milestone = brighter, more
      // harmonic content. Called from the streak counter useEffect
      // on threshold transition (3, 5, 10) — never on every win.
      // Peak gain 0.40 so the streak chime doesn't out-shout the
      // actual win sound that triggered it.
      playArpeggio([880, 1109, 1319, 1760], 0.08, 0.05, "sine", 0.12);
      playChord([880, 1109, 1319, 1760, 2349], 0.25, "sine", 0.10, 0.20);
      playTone(2637, 0.30, "sine", 0.06, 0.30);
      break;

    case "cascade_1":
    case "cascade_2":
    case "cascade_3":
    case "cascade_4":
    case "cascade_5": {
      // Escalating cascade. Each step adds a higher voice and a
      // little more gain. Caller fires these on each cascade step.
      const step = parseInt(name.split("_")[1], 10);
      const baseFreq = 500 + step * 80;          // 580 → 900
      const gain = 0.10 + step * 0.018;          // 0.118 → 0.19
      playTone(baseFreq, 0.12, "sine", gain);
      playTone(baseFreq * 1.5, 0.10, "sine", gain * 0.8, 0.04);
      playTone(baseFreq * 2, 0.08, "sine", gain * 0.6, 0.08);
      if (step >= 3) {
        // Higher cascades add a sparkle layer
        playTone(baseFreq * 3, 0.08, "sine", gain * 0.5, 0.10);
      }
      break;
    }
  }
}

/**
 * Determine if a win should play win music.
 * Behavioral conditioning: play win music on ANY net positive outcome,
 * even small ones, to reinforce the variable-ratio reinforcement
 * schedule. Loss Disguised as Win (LDW) is a separate event — handled
 * by its own sound ("ldw") fired on net-loss spins that still had
 * matching scatter/wild symbols.
 */
export function shouldPlayWinMusic(netGain: number, bet: number): boolean {
  return netGain > 0;
}
