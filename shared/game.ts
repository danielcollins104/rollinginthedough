export type SymbolId =
  | "bread"
  | "rolling"
  | "pretzel"
  | "croissant"
  | "cookie"
  | "cupcake"
  | "cake"
  | "muffin"
  | "bun"
  | "huntress"
  | "dough"
  | "empty"

export interface Symbol {
  id: SymbolId
  emoji: string
  name: string
  color: string
  bgColor: string
  payouts: [number, number, number]
  weight: number
  isWild?: boolean
  isScatter?: boolean
}

export const SYMBOLS: Symbol[] = [
  { id: "bread",    emoji: "🍞", name: "Fresh Bread",           color: "#D4AF37", bgColor: "#1a1200", payouts: [2, 5, 12],   weight: 30 },
  { id: "rolling",  emoji: "🥖", name: "Baguette",              color: "#C8860A", bgColor: "#1a0e00", payouts: [3, 8, 22],   weight: 26 },
  { id: "pretzel",  emoji: "🥨", name: "Soft Pretzel",          color: "#E8A020", bgColor: "#1a1000", payouts: [6, 18, 45],  weight: 24 },
  { id: "croissant", emoji: "🥐", name: "Butter Croissant",      color: "#D4AF37", bgColor: "#1a1200", payouts: [10, 25, 60], weight: 20 },
  { id: "cookie",   emoji: "🍪", name: "Chocolate Chip Cookie",  color: "#F5E6C8", bgColor: "#1a1500", payouts: [15, 40, 90], weight: 16 },
  { id: "cupcake",  emoji: "🧁", name: "Pink Cupcake",          color: "#FF6B6B", bgColor: "#2a0a0a", payouts: [25, 75, 180], weight: 14 },
  { id: "cake",     emoji: "🎂", name: "Celebration Cake",      color: "#FFD700", bgColor: "#1a1000", payouts: [40, 125, 300], weight: 9 },
  { id: "muffin",   emoji: "🧁", name: "Blueberry Muffin",      color: "#88CCFF", bgColor: "#001a2a", payouts: [20, 50, 120], weight: 14 },
  { id: "bun",      emoji: "🫓", name: "Sweet Bun",             color: "#90EE90", bgColor: "#001a00", payouts: [60, 180, 450], weight: 8,  isWild: true },
  { id: "huntress", emoji: "👑", name: "Bakery Queen",          color: "#FF6B6B", bgColor: "#2a0a0a", payouts: [100, 350, 1500], weight: 6, isScatter: true },
  { id: "dough",    emoji: "🍞", name: "Rolling in the Dough",  color: "#FFD700", bgColor: "#1a1000", payouts: [150, 750, 3000], weight: 4, isScatter: true },
]

export type WinType = "SMALL_WIN" | "BIG_WIN" | "MEGA_WIN" | "JACKPOT" | "HUNTRESS_BONUS" | null

export interface WinLine {
  row: number
  symbols: SymbolId[]
  amount: number
  count: number
  cells?: { reelIdx: number; rowIdx: number }[]
}

export const REEL_COUNT = 5
export const ROW_COUNT = 3
export const JACKPOT_SEED = 5000
export const JACKPOT_CONTRIBUTION = 0.02
export const FREE_SPIN_TRIGGER = 3
export const FREE_SPIN_COUNT = 10
export const HUNTRESS_BONUS_TRIGGER = 3
export const BET_OPTIONS = [10, 25, 50, 100, 200]

export type Volatility = "LOW" | "MEDIUM" | "HIGH"

export type SelectedCurrency = "gold" | "green"

export interface SpinResult {
  reels: SymbolId[][]
  winAmount: number
  winLines: WinLine[]
  winType: WinType
  freeSpinsAdded: number
  isJackpot: boolean
  isHuntressBonus: boolean
  goldCoins: number
  greenCoins: number
  jackpotPool: number
}

export function getPaylinePath(paylineIndex: number): number[] {
  const paylines: number[][] = [
    [0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2],
    [0, 0, 1, 0, 0],
    [2, 2, 1, 2, 2],
    [0, 0, 0, 1, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [2, 2, 2, 1, 1],
    [2, 1, 2, 1, 2],
    [2, 2, 1, 1, 1],
    [1, 2, 2, 2, 1],
    [2, 1, 1, 1, 2],
    [0, 1, 2, 1, 0],
    [1, 0, 1, 2, 1],
    [1, 2, 1, 0, 1],
    [0, 2, 0, 2, 0],
    [2, 0, 2, 0, 2],
    [0, 1, 0, 1, 0],
    [2, 1, 2, 1, 2],
    [1, 0, 2, 0, 1],
    [1, 2, 0, 2, 1],
    [0, 0, 2, 2, 2],
  ]
  return paylines[paylineIndex % paylines.length]
}

export function checkLine(symbols: SymbolId[], bet: number): { amount: number; count: number } | null {
  const wildId: SymbolId = "bun"
  const scatterId: SymbolId = "dough"

  const firstNonWild = symbols.find((s) => s !== wildId && s !== scatterId) ?? symbols[0]
  let count = 0
  for (const sym of symbols) {
    if (sym === firstNonWild || sym === wildId) {
      count++
    } else {
      break
    }
  }

  if (count < 3) return null

  const symDef = SYMBOLS.find((s) => s.id === firstNonWild)
  if (!symDef) return null

  const payoutIndex = count === 3 ? 0 : count === 4 ? 1 : 2
  const multiplier = symDef.payouts[payoutIndex]
  const amount = Math.floor(bet * multiplier)

  return { amount, count }
}

export function evaluateWins(reels: SymbolId[][], bet: number, paylines: number): { winLines: WinLine[]; totalWin: number } {
  const winLines: WinLine[] = []
  let totalWin = 0
  const betPerLine = bet / paylines

  for (let i = 0; i < paylines; i++) {
    const path = getPaylinePath(i)
    const pathSymbols = path.map((rowIdx, reelIdx) => reels[reelIdx][rowIdx])
    const result = checkLine(pathSymbols, betPerLine)
    if (result) {
      winLines.push({ row: i, symbols: pathSymbols, amount: result.amount, count: result.count })
      totalWin += result.amount
    }
  }

  return { winLines, totalWin }
}

export function countScatters(reels: SymbolId[][]): number {
  return reels.flat().filter((s) => s === "dough").length
}

export function getWinType(amount: number, bet: number, isJackpot: boolean): WinType {
  if (isJackpot) return "JACKPOT"
  if (amount === 0) return null
  const multiplier = amount / bet
  if (multiplier >= 20) return "MEGA_WIN"
  if (multiplier >= 8) return "BIG_WIN"
  return "SMALL_WIN"
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1))
}

export function computeXpGain(bet: number, winAmount: number): number {
  return Math.floor(bet / 10) + (winAmount > 0 ? Math.floor(winAmount / 20) : 0)
}

export function computeXp(xp: number, level: number, gain: number): { xp: number; level: number } {
  let newXp = xp + gain
  let newLevel = level
  while (newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel)
    newLevel++
  }
  return { xp: newXp, level: newLevel }
}
