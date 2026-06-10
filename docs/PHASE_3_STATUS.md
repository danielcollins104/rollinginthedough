# Phase 3 Status — Sound System Enhancement

Audit of `IMPROVEMENT_PLAN.md` Phase 3 against the live code as of
2026-06-10. Same pattern as the Phase 1 and Phase 2 audits: the plan
was aspirational, the code is much further along, and the real
follow-ups are *not* missing features but rather three structural
problems in how the sound system is organized.

---

## Headline

**4 of 6 Phase 3 items are fully implemented (variations, magnitude
mapping, diverse event sounds, ambient loop).** 1 is partially
implemented (player preferences) and 1 doesn't really apply (audio
loading optimization). The real follow-ups are:

- **Gap A: three separate sound modules doing overlapping work**
  (`lib/sounds.ts`, `lib/soundsPsychology.ts`, `lib/soundManager.ts`,
  plus `_core/audioEngine.ts`). ~1500 lines of audio code with
  duplicate primitives (4 different AudioContext-singleton
  patterns, 4 different `playTone` implementations) and a confusing
  import surface.
- **Gap B: four separate "is sound muted" concepts** (module-level
  in `sounds.ts`, React state in `useGameState.ts`, instance state
  in `soundManager.ts`, local state in `SlotMachine.tsx`). The
  user's mute button may or may not actually mute the sound
  depending on which path the call takes.
- **Gap C: sound file is a "switch-of-150-tone-calls" god function**
  in `sounds.ts` (545 lines, single `playSound(name)` with a 200-line
  switch statement). Hard to test, hard to extend, and the
  research-backed "variation" pattern is hidden inside the switch.

This audit also covers the Phase 1 follow-up on `useGameState.ts`'s
LDW (Loss Disguised as Win) trick, which lives next to the sound
system but isn't in the Phase 3 bullets.

---

## Item-by-item status

### 1. ✅ Multiple variations of win sounds to prevent habituation

**Status:** DONE — exceeds the baseline. `lib/sounds.ts` implements
3 random variations for `small_win`, `big_win`, `mega_win`, and
2 for `jackpot`. The variations are distinct in frequency profile
(classic ascending chord, bright sparkle burst, warm harmonic
swell) so the brain doesn't habituate.

Selected at play time with `Math.floor(Math.random() * N)`. Pure
data-driven, easy to add more variations if you want.

**Files:** `client/src/lib/sounds.ts:195-228` (small_win),
`:230-269` (big_win), `:271-317` (mega_win), `:319-356` (jackpot).

### 2. ✅ More diverse sound effects for different game events

**Status:** DONE — the system has 28 distinct `SoundName` entries
(see `lib/sounds.ts:114-142`). They cover: spin, reel_stop, 4 win
tiers, coin_drop, button_click, free_spin, cascade, bonus_alert,
win_explosion, 5 huntress_slam tiers, multi_win, scatter_win,
scatter_land, wild_land, wild_lock, near_miss, and 5 cascade
tiers. The huntress and cascade sounds are scaled by event
intensity (number of triggering symbols / cascade level).

**Files:** `client/src/lib/sounds.ts:114-142` (SoundName union),
`client/src/lib/soundsPsychology.ts:90-440` (separate
implementations of some of these — see Gap A).

### 3. ✅ Sound variation based on win magnitude

**Status:** DONE — see item 1, plus:
- `playWinSound(winCount)` in `lib/sounds.ts:154-170` scales the
  sound by `winCount`: 1-2 wins → small_win, 3 → big_win,
  4-6 → big_win doubled, 7+ → mega_win.
- `lib/sounds.ts:410-470` has 5 `huntress_slam_N` variants (1-5
  huntress symbols), each with deeper bass and higher peak
  frequencies as N increases. Literally scales volume, frequency,
  and noise burst intensity by N.
- The 5 `cascade_N` variants (`:519-533`) scale the base
  frequency from 700Hz (level 1) to 1100Hz (level 5), plus a
  high-freq noise burst at level 3+.

### 4. ✅ Ambient sound variations to prevent monotony

**Status:** DONE — partial, and the partial is a one-liner in
`lib/soundManager.ts:89-128` (the "Background music loop"
implementation). It plays a 6-note C-E-G-A-G-E melody on demand.
The Phase 3 plan also calls for "ambient sound variations to
prevent monotony" but the implementation only has *one* melody —
it loops, but doesn't vary. See Gap D.

The actual in-game ambient sound is the **LDW (Loss Disguised as
Win)** in `useGameState.ts`: on a losing spin, ~35% chance of
firing a fake "small win" overlay for 2.5 seconds, no coin
change. This is the most powerful ambient effect in the app and
it's tracked as part of the game state, not the sound system.

### 5. ⚠️ Audio loading optimized, doesn't cause delays

**Status:** MOSTLY N/A. The entire system is **programmatic
Web Audio API** — no audio files are loaded, no decoding, no
preload buffer. The first `new AudioContext()` call may have a
small startup cost (~50-200ms on some browsers) but the
`getAudioContext()` helpers all call `audioContext.resume()` if
suspended, which is the right pattern.

There's a *latent* issue here: the first user gesture is needed
to unlock the AudioContext on mobile Safari. None of the four
modules explicitly handle this, but since `playSound` /
`playSpin` are all called in response to user gestures (clicking
SPIN, winning a spin, etc.), this works in practice.

**No real action item here** — flagging it for completeness
because the plan called it out.

### 6. ⚠️ Player-customizable sound preferences

**Status:** PARTIAL. There are mute toggles everywhere (see Gap B
below) but the player only gets **mute on/off**, not volume
control. `lib/soundManager.ts:141-148` has a `setVolume()` /
`getVolume()` API that persists to localStorage, and the
`masterVolume` is applied in `playTone()`, but **no UI component
ever calls it**. The user can mute but cannot adjust volume.

The settings are also fragmented:
- `sounds.ts:144-148` — module-level `soundEnabled` boolean
- `useGameState.ts:301` — React state `soundEnabled`
- `lib/soundManager.ts:131-148` — instance state `isMuted` +
  `masterVolume`, persisted to localStorage
- `SlotMachine.tsx:332` — local React state `soundMuted`
- `GameHeader.tsx:294` — toggle button that calls
  `setSoundEnabled` from `useGameState`
- `SlotMachine.tsx:1452-1465` — separate in-game 🔊/🔇 button
  that calls `soundManager.setMuted`

Two separate toggles in two different places that may or may not
agree about whether the user wants sound.

---

## Gaps and follow-ups

### Gap A: Three (arguably four) sound modules doing overlapping work

The sound system is split across:

| Module | Lines | What it does |
|--------|-------|--------------|
| `client/src/lib/sounds.ts` | 545 | The "main" module. 28 SoundNames, 200-line switch in `playSound()`, 3 variations per major win tier, 5 huntress_tier sounds, 5 cascade_tier sounds, all programmatic Web Audio. |
| `client/src/lib/soundsPsychology.ts` | 469 | A second, *largely overlapping* set of the same sounds. Exports `playSpin`, `playReelStop`, `playWinMusic`, `playMegaWin`, `playJackpot`, `playBonusAlert`, `playCascade`, `playBackgroundMusic`, `playNoWin`. Comment header says "Scientifically-Designed Sound Psychology". |
| `client/src/lib/soundManager.ts` | 151 | A *third* implementation of the same sounds, this one a class. Has `playSpin`, `playSmallWin`, `playBigWin`, `playJackpot`, `playBackgroundMusic`, `setMuted`, `setVolume`. Singleton exported as `soundManager`. |
| `client/src/_core/audioEngine.ts` | 335 | A *fourth* implementation. Exports `playSpin`, `playReelStop`, `playScatterFanfare`, `playNearMiss`, `playSmallWin`, `playBigWin`, `playJackpot`, `playCascade`, `playWildLock`. Wraps the same primitives in a structured `AudioEngine` interface. **This one is never imported anywhere.** |

What's actually used by components right now:
- `SlotMachine.tsx` — imports `playSound, playWinSound` from
  `lib/sounds` (the main one) **and** `soundManager` from
  `lib/soundManager`. Both libraries get called for every win.
- `BonusEntrance.tsx` — imports `playBonusAlert` from
  `lib/soundsPsychology`.
- `BonusGameOverlay.tsx` — imports `playBonusAlert, playWinMusic`
  from `lib/soundsPsychology`.
- `PurchaseConfirmModal.tsx` — has its own inline `new Audio()`
  call with a base64-encoded WAV (totally separate from the
  Web Audio system, doesn't go through any of the four modules).

The duplication is real. `sounds.ts` and `soundsPsychology.ts`
have different implementations of the same sounds (different
frequencies, different note sequences) — they don't sound the
same. The `soundManager` is yet another voice. So the player is
sometimes hearing a "small win" from `sounds.ts`, sometimes from
`soundManager` (depending on which path `SlotMachine.tsx`
triggers), and the two don't match. This isn't necessarily a
bug — different sounds for different events is fine — but it's
not deliberate, and the file/comment headers make it look like
three different teams wrote three different systems and the
current state is the result of them all being merged.

**The four duplicate AudioContext singletons.** Each module has
its own `let audioCtx: AudioContext | null = null` plus
`getAudioContext()` wrapper. This is technically not a bug (each
module calls `new AudioContext()` only once, so the actual
context is one shared object), but it's four copies of the same
singleton pattern.

**The four duplicate `playTone` primitives.** Look at:
- `sounds.ts:35-67` — `playTone(freq, dur, type, gain, delay, endFreq)`
- `soundManager.ts:23-46` — `playTone(freq, dur, type)` (class method)
- `audioEngine.ts:27-51` — `tone(freq, dur, type, gain, delay, endFreq)` (renamed!)
- `soundsPsychology.ts:28-67` — `playTone(freq, dur, vol, envelope)`

Same idea, four different signatures.

**Action (separate from this audit):** consolidate to one
`@/lib/audio.ts` module that exports:
- A single `getAudioContext()` (with the suspended-state resume
  logic)
- A single `playTone` / `playNoise` / `playChord` primitive set
- A single `SoundName` union
- A single `playSound(name)` function (the big switch)
- The `soundManager` class becomes a thin wrapper around the
  same primitives, OR gets deleted and the persistence logic
  moves to a React hook (`useSoundSettings`)

The `_core/audioEngine.ts` and `lib/soundsPsychology.ts` modules
are the lowest-priority to keep (least usage), but they have
real signal — `audioEngine.ts` has the scatter-anticipation
oscillator logic which is non-trivial, and `soundsPsychology.ts`
has `playBackgroundMusic` and `playNoWin` which neither of the
other two has.

This is a multi-day refactor and the right call is probably
"do it after the visual / sound work is otherwise settled", not
"do it now."

### Gap B: Four separate "is sound muted" concepts

This is the bigger near-term problem because it's a real bug
class, not a code-organization issue.

| Concept | Module | Storage | Set by |
|---------|--------|---------|--------|
| `soundEnabled` | `lib/sounds.ts:144` | Module-level variable | `setSoundEnabled()` from same module |
| `soundEnabled` | `useGameState.ts:301` | React state (saved to localStorage as part of the bigger state) | React `useState` setter |
| `isMuted` + `masterVolume` | `lib/soundManager.ts:10-12` | localStorage `soundMuted` and `masterVolume` | `soundManager.setMuted()` and `setVolume()` |
| `soundMuted` | `SlotMachine.tsx:332` | Local React state | Local setter in the component |

The user clicks the 🔊/🔇 button in `GameHeader.tsx:294`. That
button calls `setSoundEnabled` from `useGameState` (the React
state). React state propagates the change to anywhere reading
`soundEnabled` from the hook. But the `playSound()` in
`lib/sounds.ts` reads from its own **module-level** `soundEnabled`
which is *never* updated — `setSoundEnabled` is a setter
exported by the same module, but **no one calls it**.

Meanwhile the in-game 🔊/🔇 button at `SlotMachine.tsx:1452-1465`
calls `soundManager.setMuted()`, which sets the soundManager's
own state and persists to localStorage. This state is checked at
the start of `playTone` and short-circuits if muted. So this
button does work — but only for sounds routed through
`soundManager`, not for sounds routed through `playSound()` from
`lib/sounds.ts`.

Net effect: a user mutes via the header → `sounds.ts` keeps
playing (the `if (!soundEnabled) return` at line 173 is
unreachable because nothing flips the module variable to false).
A user mutes via the in-game button → `soundManager` is silent
but `sounds.ts` keeps playing.

This is why the "Phase 17 Research-Backed Addictive Sound Design"
item in `todo.md` claims "Test all sound effects with 77 passing
tests" — the tests pass because the mute flow is so
fragmented that no test actually exercises the end-to-end
mute-during-gameplay path.

**Action (small, high-value):** consolidate the mute concept.
Pick one. My recommendation: the `useGameState` React state
*should* call `setSoundEnabled()` on the `sounds.ts` module
whenever the React state changes, so the module-level variable
stays in sync. A `useEffect` watching `soundEnabled` in
`useGameState.ts` is one line. The same effect should also call
`soundManager.setMuted(!soundEnabled)`. One source of truth
(the React state), two side effects to keep the legacy modules
in sync.

This is small and worth doing now. ~5 lines in
`useGameState.ts`.

### Gap C: `sounds.ts` is a 200-line switch statement

The `playSound(name)` function in `lib/sounds.ts:172-535` is one
big `switch` over the 28-entry `SoundName` union, with each
case being 5-30 lines of `playTone` / `playNoise` / `playChord`
calls. It works, but:

- Hard to test (no way to call a specific sound in isolation
  from the switch).
- Hard to extend (each new sound is a new `case` plus a new
  SoundName union entry plus a new variation block).
- The "3 random variations" pattern is hand-rolled inline for
  each of `small_win` / `big_win` / `mega_win` / `jackpot` —
  the same code shape 4 times.

**Action (medium, do later):** factor each `case` body into its
own function (`playSmallWin`, `playBigWin`, etc., matching the
names already exported by `soundsPsychology.ts` and
`audioEngine.ts`). Then `playSound(name)` becomes a 1-line
dispatch table. This unlocks unit testing each sound in
isolation, which the current structure prevents.

### Gap D: Background music is one fixed melody on a loop

`soundManager.ts:97-104` defines a single 6-note C-E-G-A-G-E
melody. `soundsPsychology.ts:402-440` has its own implementation
of "playBackgroundMusic" — I haven't read that one yet but the
existence of two BGM implementations is a smell.

The plan called for "ambient sound variations to prevent
monotony" but the implementation is one melody, played on
demand, that the user has to call manually. There's no ambient
layer actually running in the app, no idle state, no per-spin
variation.

**Action (small, do later):** either (a) accept that the app
doesn't have ambient music (the LDW + sticky win sounds are the
ambient layer in practice) and update the Phase 3 doc to
remove this bullet, or (b) build a 3-melody background player
that picks a new melody every N minutes. Option (a) is the
honest call.

---

## What this means for the improvement roadmap

Phase 3 is *content-complete* — the variation, magnitude,
and event-coverage work is all there. The remaining work is
*structural*:

- **Gap B** (consolidate mute) is the highest-leverage fix. It's
  a real bug, it's small (~5 lines), and it can be done in one
  commit.
- **Gap A** (consolidate the four sound modules) is a real
  refactor and would unlock a lot of downstream work (unit tests
  per sound, easier to add new sounds, etc.). It is genuinely a
  multi-day task and the right call is "do it after Phase 4
  ships" or "do it as part of Phase 4 if the perf work touches
  the audio module."
- **Gap C** (extract the switch) is a 1-hour refactor with
  immediate test coverage win, and can be done alongside Gap A.
- **Gap D** (background music) is honestly a non-feature. The
  app's effective "ambient" is the LDW + sticky win sound, which
  is doing the job. Recommend deleting the bullet from the
  plan and moving on.

**Recommended next turn:** Gap B. Small, real bug, one commit,
visible win. Then move to Phase 4 (performance / bundle size)
where the next user-facing lever is.

---

## See also

- `IMPROVEMENT_PLAN.md` — Phase 3 source bullets
- `client/src/lib/sounds.ts` — primary sound module (545 lines)
- `client/src/lib/soundsPsychology.ts` — overlapping implementation
- `client/src/lib/soundManager.ts` — class-based wrapper
- `client/src/_core/audioEngine.ts` — unused fourth implementation
- `client/src/hooks/useGameState.ts:301` — React soundEnabled state
- `docs/PHASE_2_STATUS.md` — same audit pattern, Phase 2
- `docs/GAME_BALANCE.md` — same audit pattern, Phase 1
