/**
 * Rolling in the Dough — Game Footer
 * Legal disclaimer, sweepstakes notice, and branding
 */

export default function GameFooter() {
  return (
    <footer
      className="relative z-20 w-full mt-auto"
      style={{
        background: "linear-gradient(0deg, #050510 0%, rgba(5,5,16,0.95) 100%)",
        borderTop: "1px solid rgba(212,175,55,0.2)",
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Deco divider */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3))" }} />
          <span className="text-xs font-numbers" style={{ color: "rgba(212,175,55,0.4)" }}>◆</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.3), transparent)" }} />
        </div>

        {/* Legal text */}
        <div
          className="text-center text-xs font-body leading-relaxed"
          style={{ color: "rgba(212,175,55,0.4)" }}
        >
          <p className="mb-1">
            <strong style={{ color: "rgba(212,175,55,0.6)" }}>Rolling in the Dough</strong> is a free-to-play sweepstakes entertainment game.
          </p>
          <p className="mb-1">
            No real money is wagered, won, or exchanged. Virtual coins have no monetary value and cannot be redeemed for cash or prizes.
          </p>
          <p>
            This game is intended for adults 18+ for entertainment purposes only.
            Play responsibly. If you have concerns about gambling, visit{" "}
            <a
              href="https://www.ncpgambling.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors"
              style={{ color: "rgba(212,175,55,0.6)" }}
            >
              ncpgambling.org
            </a>
            .
          </p>
        </div>

        {/* Brand line */}
        <div className="text-center mt-3">
          <span
            className="text-xs font-numbers tracking-widest uppercase"
            style={{ color: "rgba(212,175,55,0.25)" }}
          >
            © 2026 Rolling in the Dough · Sweepstakes Entertainment
          </span>
        </div>
      </div>
    </footer>
  );
}
