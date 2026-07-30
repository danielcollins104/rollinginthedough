# Improvements Checklist

Consolidated improvement areas for Rolling in the Dough. Verified against codebase (last check: 2026-07-29).

## Priorities

### P0 — Ready to ship (fully implemented)

- [x] Game balance & win frequency (Phases 4, 24)
- [x] Dual currency system (goldCoins/greenCoins) (Phases 8, 9, 22)
- [x] Cascading wins & bonus mini-games (Phase 3)
- [x] Cash-out system with compliance (Phase 7)
- [x] Professional casino UI (Phases 11, 13, 18)
- [x] Daily streak & loyalty system (Phase 12)
- [x] Sound design & music system (Phases 14, 17)
- [x] Square Checkout API payments + crypto (Phases 6, 21, 25, 26, 27)
- [x] Security overhaul — auth, CSRF, rate limiting, anti-cheat, encryption (Phase 28)
- [x] Login/signup UI & auth prompts (Phase 29)
- [x] Mobile responsive layout (Phase 16)
- [x] Responsive CoinShop modal scrolling & HTTPS redirect (Phase 23)

### P1 — Remaining work

- [ ] Upload to Play Store (requires developer account)
- [ ] Test cleaned-up version on clean machine

### P1 — Recently completed

- [x] Generate Play Store app icon (512x512)
- [x] Generate Play Store feature graphic (1024x500)
- [x] Capture Play Store screenshots (3)
- [x] Write Play Store listing description
- [x] Delete DebugPanel.tsx source file
- [x] Remove stale zone identifier files + debug artifact directories
- [x] Update favicon, index.html, .gitignore

### P2 — Future enhancements (no code yet)

- [ ] A/B testing framework for game mechanics
- [ ] Push notifications for promotions
- [ ] Seasonal events and holiday themes
- [ ] Tournament mode or special events
- [ ] Native mobile apps
- [ ] Blockchain/transparency features

## Quick reference

| Area | Status | Key files |
|---|---|---|
| Game engine | Done | `client/src/hooks/useGameState.ts` |
| UI polish | Done | `SlotMachine.tsx`, `Home.tsx`, `JackpotMeters.tsx` |
| Sound | Done | `sounds.ts`, `soundManager.ts`, `audioEngine.ts` |
| Auth | Done | `server/auth.ts`, `server/_core/security.ts` |
| Payments | Done (Square) | `server/routers.ts`, `server/paymentVerification.ts` |
| Streaks | Done | `server/db.ts`, `DailyStreakDisplay.tsx` |
| Animations | Done | `CoinParticles.tsx`, `BigWinOverlay.tsx` |
| Store listing | **Not started** | — |
