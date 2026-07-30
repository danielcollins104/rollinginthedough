import { type SymbolId, type WinLine, getPaylinePath } from "@shared/game";
import { getSymbol, isWildSymbol, isWinningCell } from "@/lib/reelHelpers";
import SymbolIcon from "./SymbolIcon";
import ReelStrip from "./ReelStrip";

interface ReelGridProps {
  displayGrid: SymbolId[][];
  reelDone: boolean[];
  spinning: boolean;
  showWin: boolean;
  cascadeActive: boolean;
  cascadeWinningCells: Set<string>;
  cascadeAnimatingCells: Set<string>;
  scatterSlowdownActive: boolean;
  scatterFanfareActive: boolean;
  wildLockAnimating: boolean;
  stickyWildCells: Set<string>;
  nearMissCells: Set<string>;
  nearMissAnimating: boolean;
  winLines: WinLine[];
}

export default function ReelGrid({
  displayGrid,
  reelDone,
  spinning,
  showWin,
  cascadeActive,
  cascadeWinningCells,
  cascadeAnimatingCells,
  scatterSlowdownActive,
  scatterFanfareActive,
  wildLockAnimating,
  stickyWildCells,
  nearMissCells,
  nearMissAnimating,
  winLines,
}: ReelGridProps) {
  return (
    <>
      {/* Scatter fanfare overlay */}
      {scatterFanfareActive && (
        <div
          className="absolute inset-0 pointer-events-none z-25 rounded"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,107,107,0.15) 0%, transparent 60%)",
            animation: "scatterFanfare 0.5s ease-out",
          }}
        />
      )}

      {/* Reels */}
      <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: "repeat(5, 1fr)", minHeight: "120px" }}>
        {displayGrid.map((reel, reelIdx) => (
          <div
            key={reelIdx}
            className={`reel-container rounded relative ${scatterSlowdownActive && reelIdx === 2 ? 'scatter-slowdown-reel' : ''} ${wildLockAnimating && stickyWildCells.has(`${reelIdx}-${getPaylinePath(0)[reelIdx]}`) ? 'wild-lock-shake' : ''}`}
              style={{
                minHeight: "120px",
                height: "100%",
                maxHeight: "300px",
                transition: "box-shadow 0.3s ease",
                boxShadow: reelDone[reelIdx] && showWin && !cascadeActive && reel.some((_, rowIdx) => isWinningCell(reelIdx, rowIdx, winLines))
                  ? "0 0 25px rgba(255,215,0,0.5), inset 0 0 20px rgba(255,215,0,0.08)"
                  : "inset 0 0 30px rgba(0,0,0,0.9), 0 0 6px rgba(212,175,55,0.1)",
              }}
          >
            <ReelStrip symbols={reel} spinning={spinning} done={reelDone[reelIdx]} />

            {reel.map((symId, rowIdx) => {
              const isWin = showWin && !cascadeActive && isWinningCell(reelIdx, rowIdx, winLines);
              const isCascadeWinner = cascadeWinningCells.has(`${reelIdx}-${rowIdx}`);
              const isCascadeAnimating = cascadeAnimatingCells.has(`${reelIdx}-${rowIdx}`);
              const isStickyWild = stickyWildCells.has(`${reelIdx}-${rowIdx}`);
              const isNearMiss = nearMissCells.has(`${reelIdx}-${rowIdx}`);
              const sym = getSymbol(symId);

              return (
                <div
                  key={rowIdx}
                  className={`
                    flex items-center justify-center transition-all duration-300 
                    ${isWin ? "cell-win-glow symbol-win" : ""}
                    ${isCascadeWinner ? "cascade-disappear" : ""}
                    ${isCascadeAnimating && !isCascadeWinner ? "cascade-fall" : ""}
                    ${isStickyWild && wildLockAnimating ? "sticky-wild-lock" : ""}
                    ${isStickyWild && !wildLockAnimating ? "sticky-wild-glow" : ""}
                    ${isNearMiss && nearMissAnimating ? "near-miss-gold" : ""}
                    ${symId === 'empty' ? "empty-cell" : ""}
                  `}
                  style={{
                    flex: "1 1 0%",
                    minHeight: 0,
                    background: isWin
                      ? `radial-gradient(circle at center, ${sym.bgColor}ff 0%, #050510 100%)`
                      : isCascadeWinner
                      ? `radial-gradient(circle at center, ${sym.bgColor}66 0%, #050510 100%)`
                      : `radial-gradient(circle at center, ${sym.bgColor}55 0%, #030310 100%)`,
                    borderBottom: rowIdx < 2 ? "1px solid rgba(212,175,55,0.1)" : "none",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isWin && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle, ${sym.color}30, transparent 70%)`,
                      }}
                    />
                  )}
                  {isStickyWild && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "radial-gradient(circle, rgba(76,175,80,0.4), transparent 70%)",
                        animation: "stickyWildPulse 0.8s ease-in-out infinite",
                      }}
                    />
                  )}
                  {isNearMiss && nearMissAnimating && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "radial-gradient(circle, rgba(255,215,0,0.5), transparent 70%)",
                      }}
                    />
                  )}
                  {symId !== 'empty' && (
                    <SymbolIcon
                      symbolId={symId}
                      size={32}
                      className={`${isWin ? 'symbol-win-pop symbol-bounce' : ''}`}
                      style={{
                        filter: isWin
                          ? `drop-shadow(0 0 8px ${sym.color}) drop-shadow(0 0 16px ${sym.color}88) brightness(1.5)`
                          : isStickyWild
                          ? `drop-shadow(0 0 12px #90EE90) drop-shadow(0 0 24px #90EE90)`
                          : isNearMiss && nearMissAnimating
                          ? `drop-shadow(0 0 10px #FFD700) brightness(1.3)`
                          : 'none',
                        transition: 'filter 0.3s ease',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
