# Do not act on these concerns yet

The following concerns were identified during the client codebase investigation. These are recorded for tracking purposes only; no changes are to be made until explicitly requested.

## Gambling Integrity & Security
- ~~**Client-side RNG**: Resolved — spin outcome generation moved to server-side using `crypto.randomInt()` in `server/game.ts`. Client now calls `trpc.game.spin` for authoritative results.~~

## Technical Debt & Performance
- **God Component**: `src/components/SlotMachine.tsx` is extremely large (~2,000 lines) and handles too many responsibilities, likely leading to performance bottlenecks and maintainability issues.
- **Accessibility**: Initial scan suggests a lack of comprehensive ARIA labels, focus management for modals, and keyboard handlers for the main game loop.
