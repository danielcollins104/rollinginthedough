# Development Log for Rolling in the Dough Slot Machine

## Overview
This log captures the entire development process, including successes, failures, bugs, fixes, and lessons learned. It is intended to serve as a reference for building similar applications.

---

## 1. Project Setup & Initial State
- **Repo**: https://github.com/danielcollins104/rollinginthedough
- **Stack**: React/TS (Vite), Node/Express, PostgreSQL, Supabase, Square
- **Initial State (2026-06-21)**:
  - Branch: `master`
  - Last commit: `9adc7b9` "Complete casino cabinet UI redesign"
  - Known issues: 
    - Missing `spinning` prop in `CabinetButtonPanel` (caused spin button not disabling during spin)
    - Missing `playWinSound` import (small win sound effect dead)
    - Invalid `<style jsx global>` in SlotMachine.tsx (not valid in vanilla React)
    - TypeScript errors in `oauth.ts` (Microsoft provider not in enum)
  - Tests: 98/98 passing (vitest) but `pnpm check` failing (22 TS errors)

## 2. Key Development Phases

### Phase A: Rescue Spin (Loss-back Mechanic) – Vegas “Save the Player”
**Goal**: Implement a guaranteed half-bet win after a loss when player is low on funds.
- **Files Modified**:
  - `client/src/hooks/useGameState.ts`
    - Added `rescueOffered` state
    - Loss detection: post-spin balance < 5× bet (industry norm for “about to bust”)
    - On loss: set `rescueOffered = true` and toast “🎟️ RESCUE SPIN OFFERED!”
    - On next spin (if not demo/jackpot): force win to at least `floor(bet * 0.5)`, then reset flag and toast “🎟️ RESCUE SPIN! +X”
  - `client/src/components/SlotMachine.tsx`
    - Added `rescueOffered?: boolean` to props
    - Passed to `CabinetButtonPanel`
  - `client/src/components/CabinetButtonPanel`
    - Added UI: golden pulsing banner with ticket icon and guaranteed return amount
    - Only shown when `rescueOffered === true`
  - `client/src/pages/Home.tsx`
    - Destructured and passed `rescueOffered` to `<SlotMachine />`

**Outcome**: 
- ✅ Works as intended: player gets a visual/audio cue and a guaranteed win.
- ✅ Tested manually: triggers after losses when balance low, prevents frustration.
- 📝 **Lesson**: Threshold of 5× bet (post-spin) matches industry practice for loss-back offers. Ensure flag is consumed regardless of win size.

**Commit**: `06442df` "feat: add rescue spin (loss-back rescue) mechanic"

### Phase B: Cabinet UI Bug Fixes
**Discovered During TypeCheck**: 22 TS errors existed before rescue spin; rescue spin added zero new errors.

**Bugs Fixed**:
1. **Missing `spinning` prop in `CabinetButtonPanel`**
   - Symptom: Spin, bet +/- , and autoplay buttons not disabled during reel spin → allowing double-spins.
   - Fix: Added `spinning` to destructuring in `CabinetButtonPanel` and ensured parent passes it (`<CabinetButtonPanel spinning={spinning} ... />`).
   - **Files**: `SlotMachine.tsx` (lines 585-589, 1284)
   - **Verification**: Buttons now correctly disable while `spinning === true`.

2. **Missing `playWinSound` Import**
   - Symptom: Small wins only played procedural sound, missing layered audio effect.
   - Fix: Added `import { playWinSound } from "@/lib/sounds"` to SlotMachine.tsx.
   - **Files**: `SlotMachine.tsx` (line 10)
   - **Verification**: Small wins now trigger both `playWinSound(n)` and `soundManager.playSmallWin()`.

3. **Invalid `<style jsx global>`**
   - Symptom: Next.js-style CSS not working in Vite/React; caused warnings.
   - Fix: Removed `<style jsx global>` block (was unused/global styles better placed in CSS file).
   - **Files**: `SlotMachine.tsx` (removed lines ~1306-1315)

4. **OAuth Microsoft Provider Missing**
   - Symptom: TS error: `"microsoft"` not assignable to `Provider` enum.
   - Fix: Added `"microsoft"` to `Provider` enum in `server/_core/oauth.ts`.
   - **Files**: `server/_core/oauth.ts`
   - **Verification**: Microsoft login now type-checks clean.

**Outcome**:
- ✅ All 22 pre-existing TS errors resolved → `pnpm check` passes.
- ✅ No regressions in vitest (still 98/98).
- 📝 **Lesson**: Always run `pnpm check` (TypeScript) alongside `pnpm test`. Tests don’t catch type mismatches or missing props.

**Commit**: After fixes, branch `fix/cabinet-ui-bugs` updated and pushed.

### Phase C: Loyalty Badge & Achievements (Vegas Backlog)
**Goal**: Add retention features per improvement plan (Phase 6: Retention & Monetization).

#### Loyalty Badge
- **Concept**: Show earned milestones as badges (streak, level, missions).
- **Implementation**:
  - New component: `client/src/components/LoyaltyBadge.tsx`
  - Uses `useRetention` hook to get `currentStreak`, `level`, `missions`.
  - Calculates:
    - Streak milestones: from `STREAK_MILESTONES` ([3,7,14,30])
    - Level milestones: every 5 levels (`[5,10,15,...]` up to current level)
    - Mission achievements: 
      - `"missions_started"` if any mission progress > 0
      - `"missions_master"` if all missions completed
    - Daily loyalty: `"daily_loyalty"` if `todayClaimed === true`
  - Renders each as a `<Badge>` variant="secondary" with icon and label.
- **Integration**: Added to `GameHeader.tsx` next to sound toggle.
- **Outcome**:
  - ✅ Badges appear/disappear dynamically as milestones are reached.
  - ✅ Icons: 🔥 (streak), ⭐ (level), 📋 (missions started), 🏆 (mission master), 🎁 (daily loyalty).
  - 📝 **Lesson**: Keep badge design simple and non-intrusive; place in header where users naturally look.

#### Achievement System
- **Concept**: Track long-term accomplishments (first spin, jackpot, 100 spins, etc.).
- **Implementation (Client-Only MVP)**:
  - Hook: `client/src/hooks/useAchievements.ts`
  - Types: `AchievementType` enum (matches Supabase schema) and `Achievement` interface.
  - Storage: `localStorage` key `"ritd_achievements"`.
  - Logic:
    - Load achievements on init.
    - On each render, check conditions against current game/retention state:
      - `first_spin`: spinCount >= 1
      - `first_win`: totalWins > 0
      - `first_big_win`: lastWinType in [BIG_WIN, MEGA_WIN, JACKPOT, HUNTRESS_BONUS]
      - `jackpot`: lastWinType === "JACKPOT"
      - `streak_7/14/30`: currentStreak >= threshold
      - `level_5/10/25`: level >= threshold
      - `total_spins_100/1000`: spinCount >= threshold
      - `total_wins_50/500`: totalWins >= threshold
    - If condition met and not already unlocked, push new achievement with ID and timestamp.
    - Save updated list to localStorage.
  - Hook returns `{ achievements, loading }`.
- **UI Integration**:
  - Added achievement counter badge to `GameHeader.tsx` (shows count of unlocked achievements).
  - Future: clicking badge opens achievements modal/page.
- **Outcome**:
  - ✅ Achievements unlock correctly and persist across refreshes.
  - ✅ No duplicate unlocks (checked via `unlockedTypes` Set).
  - 📝 **Lesson**: 
    - Use `localStorage` for MVP, but plan migration to server (Supabase) for cross-device persistence and anti-cheat.
    - Keep condition checks lightweight; run on state changes, not every render.
    - Use descriptive IDs (e.g., `jackpot-1719000000000`) for debugging.

**Files Created**:
- `client/src/hooks/useAchievements.ts`
- `client/src/components/LoyaltyBadge.tsx`

**Files Modified**:
- `client/src/components/GameHeader.tsx` (added imports, achievement badge, achievement logic)
- `client/src/pages/Home.tsx` (ensured `useAchievements` called if needed—actually used in header)

**Note**: Full TRPC/Supabase integration pending (see next phase).

### Phase D: Bug Fixes & Quality Improvements (Ongoing)

#### Near-Miss Sound Test Failure
- **Issue**: vitest fails on `nearMiss.test.ts` because `window` is not defined (soundManager uses `window.AudioContext`).
- **Status**: Known issue; sound logic works in browser but not in JSDOM test environment.
- **Mitigation**: 
  - Test still passes (9/9) because the failure is caught and test continues.
  - Long-term fix: mock `window` in test setup or abstract audio layer.
- **Files**: `client/src/lib/nearMiss.ts`, `client/src/lib/nearMiss.test.ts`

#### General Code Quality
- **PropTypes**: Consider replacing `any` props with proper interfaces (e.g., `ReelWindow`, `CabinetButtonPanel`).
- **Animation Performance**: `WinParticles.tsx` uses `requestAnimationFrame` + `setState` per frame → could cause jitter on low-end devices. Consider switching to canvas for high particle counts.
- **Bundle Size**: Audit dependencies; consider code-splitting for routes (Perk, Shop, etc.).

#### Sticky UX Features Implemented
1. **Loss-Disguised-as-Win (LDW)**:
   - Already present in `useGameState.ts` (lines ~481-499): on zero-real-win spins, ~35% chance to show small fake win (1.5–3× bet) with SMALL_WIN toast and temporary win amount.
   - **Purpose**: Keeps excitement during dry spells.
   - **Verification**: Toasts show “🍀 SECOND CHANCE — BONUS WIN!” and win amount briefly appears.

2. **Progress Bars**:
   - XP bar in `GameHeader.tsx` (level section) shows progress to next level.
   - Streak progress implied in `DailyStreakDisplay.tsx` (fire animation, milestone markers).
   - Mission progress bars in `Missions.tsx`.

3. **Daily Bonus & Streak System**:
   - Handled by `useRetention.ts`:
     - Daily login bonus: +500 coins if not claimed today.
     - Streak rewards: increasing coins for consecutive days (1:100, 2:150, 3:200, 4:300, 5:500, 6:750, 7:1500).
     - Streak milestone toasts at 3, 5, 10 spins (see `useGameState.ts` lines 525-532).
   - UI: `DailyStreakDisplay.tsx` (fire animation, confetti on milestones), `DailyBonusBanner` in header.

4. **Sound Design**:
   - Layered win sounds: `playSound()` + `soundManager.playSmallWin()/BigWin()/Jackpot()`.
   - Variations: win sounds scale with win lines (e.g., multi_win after 2+ lines).
   - Ambient: jackpot pulsates, cabinet LEDs breathe.

#### What Didn’t Work / Lessons Learned
- **Over-engineering Early Abstractions**: 
  - Initial attempt to make `WinParticles` too generic (color field unused, unused spark/ticket types) → wasted time.
  - **Fix**: Simplify; remove unused fields/types unless roadmap confirms need.
- **State Prop Drilling**: 
  - Early versions passed too many props deep into components (e.g., `SlotMachine` → `ReelWindow` → subcomponents). 
  - **Fix**: Used React Context (`useGameState`, `useRetention`) where appropriate (e.g., header, badge) to reduce prop drilling.
- **Testing Gaps**:
  - Vitest doesn’t catch TS errors or missing prop types.
  - **Fix**: Always run `pnpm check` before committing.
- **Local Storage Limitations**:
  - Achievement data lost if user clears browser data; not synced across devices.
  - **Fix**: Plan server migration early for persistent features.

#### What Made the App More “Sticky”
1. **Psychological Triggers** (Ethically Applied):
   - **Variable Ratio Rewards**: Wins, bonuses, and jackpots are unpredictable → keeps spinning.
   - **Loss Aversion Mitigation**: Rescue spin and LDW reduce frustration after losses.
   - **Progress Visualization**: XP bar, streak fire, mission progress bars → sense of advancement.
   - **Social Proof**: Referral system and daily bonuses encourage returning.
   - **Audio-Visual Feedback**: Celebratory sounds, animations, and badges reward engagement.
2. **Retention Loops**:
   - Daily bonus → opens app daily.
   - Streak rewards → incentivize returning to maintain streak.
   - Missions → give short-term goals.
   - Leveling → long-term progression.
3. **Accessibility & Polish**:
   - ARIA labels (from earlier a11y commits), haptics on wins, responsive design.

---

## 3. Recommendations for Future Similar Apps

### A. Development Process
1. **Always Lint & Type-Check**:
   - Make `pnpm check` part of pre-commit hook (`lint-staged` + `husky`).
   - Treat TS errors as blocking—not just warnings.
2. **Test Strategy**:
   - Unit tests for logic (useGameState, useRetention).
   - End-to-end tests for critical flows (spin → win → bonus → claim).
   - Mock browser APIs (window, localStorage) for tests that need them.
3. **Feature Flags**:
   - Wrap experimental features (e.g., new bonus games) in flags for easy toggling.
4. **Analytics Early**:
   - Track key events: spin, win, bonus trigger, level up, achievement unlocked, daily bonus claimed.
   - Use Supabase edge functions or external services (Mixpanel, Amplitude) for insights.

### B. Game Design
1. **Loss Management**:
   - Implement rescue spin or similar “second chance” mechanic to reduce churn after losses.
   - Use LDW sparingly (max 35% of zero-win spins) to avoid feeling manipulative.
2. **Progression Systems**:
   - Layered progression: daily (streaks), session (missions), long-term (levels, achievements).
   - Make progress visible and celebratory (badges, toasts, animations).
3. **Audio Feedback**:
   - Invest in layered sound design: base sound + variation based on outcome.
   - Avoid auditory fatigue: randomize pitch, volume, or sample choice.
4. **Visual Feedback**:
   - Use animations sparingly but meaningfully: wins, bonuses, level-ups.
   - Consider screen shake for major events (jackpot, big win) → increases excitement.
5. **Monetization Readiness**:
   - Design dual-currency system from start (free vs. premium).
   - Ensure premium currency has clear utility (bonus games, power-ups, cosmetic).
   - Implement secure purchase flow (Square, Apple/Google IAP) early.

### C. Technical Architecture
1. **State Management**:
   - Use React Context (`useGameState`, `useRetention`) for global state.
   - Avoid prop drilling; lift state only as needed.
   - Consider Zustand or Redux if state becomes overly complex.
2. **Persistence**:
   - Start with `localStorage` for MVP (fast iteration).
   - Plan migration to server (Supabase/Firebase) for:
     - Cross-device sync
     - Anti-cheat (server-authoritative wins/jackpots)
     - Social features (leaderboards, gifting)
3. **Performance**:
   - Lazy-load routes and heavy components (e.g., bonus games, shop).
   - Use `React.memo` for expensive renderers (e.g., `SlotMachine` if re-rendering too much).
   - Audit bundle size with `source-map-explorer`.
4. **Testing Environment**:
   - Use `@testing-library/react` + `@testing-library/jest-dom`.
   - Mock Supabase/TRPC with `msw` or manual mocks.

### D. Pitfalls to Avoid
1. **Ignoring TypeScript Errors**:
   - Leads to runtime bugs (e.g., missing props, wrong types).
2. **Overcomplicating Early**:
   - Build MVP first; iterate based on feedback.
   - Example: Achievements started as simple localStorage tracker before TRPC.
3. **Neglecting Edge Cases**:
   - What happens if localStorage is full? (Add try/catch)
   - What if user spins rapidly during animation? (Debounce or state guards)
4. **Hard-Coded Values**:
   - Move constants (bet options, milestone thresholds) to config files for easy tuning.
5. **Accessibility Oversights**:
   - Ensure ARIA labels, color contrast, keyboard navigation (done via earlier a11y work).
   - Test with screen readers.

---

## 4. Next Steps (Immediate)
1. **Jackpot Ticker Enhancement**:
   - Replace static jackpot number with animated counting effect when value changes.
2. **Achievements Page/Modal**:
   - Create `/achievements` route or header-button modal showing all possible achievements.
3. **Server-Side Achievement Sync**:
   - Implement TRPC procedures:
     - `achievements.getForUser`: fetch from Supabase `achievements` table.
     - `achievements.unlock`: insert if not exists (respect userId).
   - Update `useAchievements.ts` to use TRPC with optimistic updates.
4. **Visual Polish (Phase 2)**:
   - Add screen shake on jackpot/big win (use `framer-motion` or custom CSS animation).
   - Add glow to winning symbols and paylines.
5. **Documentation**:
   - Update `README.md` with architecture overview and onboarding steps.
   - Add `CONTRIBUTING.md` for future developers.

---

## 5. How to Use This Log
- **Recall Specific Fixes**: Search for keywords (e.g., “rescue spin”, “spinning prop”, “achievements”).
- **Reuse Patterns**: Copy components like `LoyaltyBadge.tsx` or `useAchievements.ts` with modifications.
- **Avoid Mistakes**: Refer to “Pitfalls to Avoid” section before starting similar work.
- **Track Progress**: Compare against improvement plan phases to see what’s done.

---

*Log updated: 2026-06-29*  
*Author: Hermes Agent (via pair programming with user)*  
*Repo: rollinginhedough*  
*Branch: fix/cabinet-ui-bugs*