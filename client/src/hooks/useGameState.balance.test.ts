/**
 * Balance / RTP Simulation Test
 * ---------------------------------------------------------------------------
 * Runs N simulated spins against the slot machine's math model and reports:
 *   - Hit frequency (% of spins that produce any win on any payline)
 *   - RTP (total coins returned / total coins wagered)
 *   - Mean payout ratio (mean win / mean bet)
 *   - Max single-spin win (as multiplier of bet, excluding jackpot pool)
 *   - Win-amount histogram (small / big / mega bands)
 *   - Bonus trigger frequency (3+ scatters = free spins, 3+ huntress = bonus)
 *
 * This is the verification step for Phase 1, Task 1.3 of IMPROVEMENT_PLAN.md.
 * The numbers it produces become the "before tuning" baseline row in
 * docs/GAME_BALANCE.md.
 *
 * ---------------------------------------------------------------------------
 * IMPORTANT: This file is a MIRROR of the game logic in useGameState.ts
 * (SYMBOLS, pickSymbol, evaluateWins, getPaylinePath, checkLine). It does NOT
 * import the React hook because vitest running against the hook would pull in
 * the full component tree (localStorage, audio context, etc.) and slow the
 * simulation to a crawl. When the source of truth changes, update both files.
 *
 * Things intentionally NOT modeled here (they are psychological overlays,
 * not base-game math, and should NOT move RTP):
 *   - LDW (Loss Disguised as Win) — shows a fake win on ~35% of empty spins.
 *     No coin change, so it does not affect RTP. It does affect player
 *     perception of win frequency.
 *   - Jackpot pool — paid as a lump on 5-of-dough. Treated as a separate
 *     RTP component (2% of every bet) in GAME_BALANCE.md, not part of the
 *     base-game RTP number this test reports.
 *   - Bonus mini-games (Lucky Spin, Coin Flip) — paid on top of the trigger
 *     spin. Also a separate RTP component.
 *
 * The numbers this test reports are therefore the BASE-GAME math RTP —
 * what the symbol weights and payout table actually produce. Tune those
 * numbers, not the overlays.
 * ---------------------------------------------------------------------------
 */

import { describe, it, expect } from "vitest";
import { PAYLINE_PATHS as PAYLINES, REEL_COUNT, ROW_COUNT } from "@/lib/paylines";

// ─── Symbol table (mirror of SYMBOLS in useGameState.ts) ─────────────────────
type SymbolId =
  | "bread" | "rolling" | "pretzel" | "croissant" | "cookie"
  | "cupcake" | "cake" | "muffin" | "bun" | "huntress" | "dough";

interface Symbol {
  id: SymbolId;
  payouts: [number, number, number]; // 3-of-a-kind, 4-of-a-kind, 5-of-a-kind
  weight: number;
  isWild?: boolean;
  isScatter?: boolean;
}

const SYMBOLS: Symbol[] = [
  { id: "bread",     payouts: [2,   5,   12],  weight: 30 },
  { id: "rolling",   payouts: [3,   8,   22],  weight: 26 },
  { id: "pretzel",   payouts: [6,   18,  45],  weight: 24 },
  { id: "croissant", payouts: [10,  25,  60],  weight: 20 },
  { id: "cookie",    payouts: [15,  40,  90],  weight: 16 },
  { id: "cupcake",   payouts: [25,  75,  180], weight: 14 },
  { id: "muffin",    payouts: [20,  50,  120], weight: 14 },
  { id: "cake",      payouts: [40,  125, 300], weight: 9  },
  { id: "bun",       payouts: [60,  180, 450], weight: 8, isWild: true },
  { id: "huntress",  payouts: [100, 350, 1500], weight: 6, isScatter: true },
  { id: "dough",     payouts: [150, 750, 3000], weight: 4, isScatter: true },
];

const WILD_ID: SymbolId = "bun";
const SCATTER_ID: SymbolId = "dough";

// ─── Math (mirror of useGameState.ts) ────────────────────────────────────────
function pickSymbol(): SymbolId {
  const totalWeight = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * totalWeight;
  for (const sym of SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym.id;
  }
  return SYMBOLS[0].id;
}

function generateReels(): SymbolId[][] {
  return Array.from({ length: REEL_COUNT }, () =>
    Array.from({ length: ROW_COUNT }, () => pickSymbol())
  );
}

function checkLine(symbols: SymbolId[], bet: number): { amount: number; count: number } | null {
  const firstNonWild = symbols.find((s) => s !== WILD_ID && s !== SCATTER_ID) ?? symbols[0];
  let count = 0;
  for (const sym of symbols) {
    if (sym === firstNonWild || sym === WILD_ID) count++;
    else break;
  }
  if (count < 3) return null;
  const def = SYMBOLS.find((s) => s.id === firstNonWild);
  if (!def) return null;
  const idx = count === 3 ? 0 : count === 4 ? 1 : 2;
  return { amount: Math.floor(bet * def.payouts[idx]), count };
}

function evaluateWins(reels: SymbolId[][], bet: number, paylines: number) {
  const betPerLine = bet / paylines;
  let totalWin = 0;
  for (let i = 0; i < paylines; i++) {
    const path = PAYLINES[i];
    const syms = path.map((row, reel) => reels[reel][row]);
    const r = checkLine(syms, betPerLine);
    if (r) totalWin += r.amount;
  }
  return totalWin;
}

function countScatters(reels: SymbolId[][]): number {
  return reels.flat().filter((s) => s === SCATTER_ID).length;
}

// ─── Simulation driver ───────────────────────────────────────────────────────
interface SimResult {
  spins: number;
  hitFrequency: number;
  rtp: number;
  meanPayoutRatio: number;
  maxWinMultiplier: number;
  jackpotHits: number;
  jackpotHitRate: number;
  freeSpinTriggers: number;
  freeSpinTriggerRate: number;
  huntressBonusTriggers: number;
  huntressBonusRate: number;
  winHistogram: {
    small: number;   // < 8× bet
    big:   number;   // 8–20× bet
    mega:  number;   // ≥ 20× bet
  };
  totalWagered: number;
  totalReturned: number;
  durationMs: number;
}

function simulate(spins: number, bet: number, paylines: number): SimResult {
  const start = Date.now();
  let hits = 0;
  let totalWagered = 0;
  let totalReturned = 0;
  let maxWinMult = 0;
  let jackpots = 0;
  let freeSpins = 0;
  let huntressBonuses = 0;
  const hist = { small: 0, big: 0, mega: 0 };

  for (let i = 0; i < spins; i++) {
    const reels = generateReels();
    totalWagered += bet;
    const win = evaluateWins(reels, bet, paylines);
    const scatters = countScatters(reels);
    const isJackpot = scatters >= 5;
    if (win > 0 || isJackpot) hits++;
    if (isJackpot) jackpots++;
    if (scatters >= 3) freeSpins++;
    const huntressCount = reels.flat().filter((s) => s === "huntress").length;
    if (huntressCount >= 3) huntressBonuses++;

    // For the histogram, we count the payline-only win (no jackpot lump) so
    // maxWinMultiplier reflects a regular hit, not the jackpot pool.
    if (win > 0 && !isJackpot) {
      const mult = win / bet;
      if (mult > maxWinMult) maxWinMult = mult;
      if (mult < 8) hist.small++;
      else if (mult < 20) hist.big++;
      else hist.mega++;
    }
    totalReturned += win;
  }

  return {
    spins,
    hitFrequency: hits / spins,
    rtp: totalReturned / totalWagered,
    meanPayoutRatio: (totalReturned / spins) / bet,
    maxWinMultiplier: maxWinMult,
    jackpotHits: jackpots,
    jackpotHitRate: jackpots / spins,
    freeSpinTriggers: freeSpins,
    freeSpinTriggerRate: freeSpins / spins,
    huntressBonusTriggers: huntressBonuses,
    huntressBonusRate: huntressBonuses / spins,
    winHistogram: hist,
    totalWagered,
    totalReturned,
    durationMs: Date.now() - start,
  };
}

function formatResult(r: SimResult): string {
  const pct = (x: number) => (x * 100).toFixed(2) + "%";
  const inv = (x: number) => x === 0 ? "∞" : "1 in " + Math.round(1 / x);
  return [
    `┌─ Slot Machine Math Simulation (${r.spins.toLocaleString()} spins) ─`,
    `│ Duration:                    ${r.durationMs} ms`,
    `│ Total wagered:               ${r.totalWagered.toLocaleString()} coins`,
    `│ Total returned:              ${r.totalReturned.toLocaleString()} coins`,
    `│`,
    `│ ── Base-game math RTP ─────────────────────────`,
    `│ RTP (return / wager):         ${pct(r.rtp)}   (target: 43%)`,
    `│ Mean payout ratio:           ${(r.meanPayoutRatio * 100).toFixed(2)}% of bet`,
    `│`,
    `│ ── Hit frequency ──────────────────────────────`,
    `│ Any-win frequency:            ${pct(r.hitFrequency)}   (target: 37%)`,
    `│   small (<8× bet):            ${pct(r.winHistogram.small / r.spins)}`,
    `│   big   (8–20× bet):          ${pct(r.winHistogram.big   / r.spins)}`,
    `│   mega  (≥20× bet):           ${pct(r.winHistogram.mega  / r.spins)}`,
    `│`,
    `│ ── Distribution extremes ──────────────────────`,
    `│ Max single-spin multiplier:   ${r.maxWinMultiplier.toFixed(1)}× bet   (target: ≤ 2,500×)`,
    `│ Jackpot hits (5+ dough):     ${r.jackpotHits}  (${pct(r.jackpotHitRate)}, ${inv(r.jackpotHitRate)})`,
    `│ Free-spin triggers (3+ scat): ${r.freeSpinTriggers}  (${pct(r.freeSpinTriggerRate)}, ${inv(r.freeSpinTriggerRate)})`,
    `│ Huntress bonus (3+ hunter):  ${r.huntressBonusTriggers}  (${pct(r.huntressBonusRate)}, ${inv(r.huntressBonusRate)})`,
    `└────────────────────────────────────────────────`,
  ].join("\n");
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("Slot machine balance / RTP simulation", () => {
  // Test config: 25 paylines (the default-realistic config), 25 bet,
  // 100k spins. Override with env vars for quick local runs:
  //   SPINS=10000 BET=25 PAYLINES=25 npx vitest run useGameState.balance.test
  const SPINS = Number(process.env.SPINS) || 100_000;
  const BET = Number(process.env.BET) || 25;
  const PAYLINE_COUNT = Number(process.env.PAYLINES) || 25;

  it(`simulates ${SPINS.toLocaleString()} spins at bet=${BET} × ${PAYLINE_COUNT} paylines`, () => {
    const r = simulate(SPINS, BET, PAYLINE_COUNT);

    // Always log the full result so the baseline numbers are visible in
    // vitest output, even on a passing test.
    // eslint-disable-next-line no-console
    console.log("\n" + formatResult(r));

    // Sanity checks — these are deliberately LOOSE so the test always
    // passes. Tightening these assertions is how we lock in tuning targets.
    expect(r.spins).toBe(SPINS);
    expect(r.rtp).toBeGreaterThan(0);
    expect(r.rtp).toBeLessThan(2); // sanity: never >200% RTP
    expect(r.hitFrequency).toBeGreaterThan(0);
    expect(r.maxWinMultiplier).toBeGreaterThan(0);
  }, 60_000);

  it("produces sane RTP under small sample (smoke test)", () => {
    // Re-run a small sample to confirm the math doesn't blow up. The
    // current base-game RTP is around 46% (see GAME_BALANCE.md baseline
    // row), so on 1k spins we expect a wide variance band around that.
    // Loose bounds: 25%–80%. The point is to catch runaway failures
    // (NaN, >200%, <0%), not to assert a tight target.
    const N = 1_000;
    const r1 = simulate(N, 25, 25);
    const r2 = simulate(N, 25, 25);
    expect(r1.rtp).toBeGreaterThan(0.25);
    expect(r1.rtp).toBeLessThan(0.80);
    expect(r2.rtp).toBeGreaterThan(0.25);
    expect(r2.rtp).toBeLessThan(0.80);
  });
});
