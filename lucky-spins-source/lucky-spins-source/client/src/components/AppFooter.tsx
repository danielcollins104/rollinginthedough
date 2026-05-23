import { Link } from "wouter";

export default function AppFooter() {
  return (
    <footer
      className="border-t border-slate-700"
      style={{ background: "linear-gradient(180deg, rgba(5,5,16,0.8) 0%, rgba(3,3,10,0.9) 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-amber-400 mb-2">Rolling in the Dough</h3>
            <p className="text-slate-400 text-sm">
              Free sweepstakes slot machine game with dual currency system and exciting bonus rounds.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-semibold text-slate-200 mb-4">Quick Links</h4>
            <nav className="space-y-2">
              <Link href="/pricing">
                <a className="text-slate-400 hover:text-amber-400 transition-colors text-sm">
                  Pricing
                </a>
              </Link>
              <Link href="/terms">
                <a className="text-slate-400 hover:text-amber-400 transition-colors text-sm">
                  Terms of Service
                </a>
              </Link>
              <Link href="/privacy">
                <a className="text-slate-400 hover:text-amber-400 transition-colors text-sm">
                  Privacy Policy
                </a>
              </Link>
              <a
                href="mailto:support@luckyslots.com"
                className="text-slate-400 hover:text-amber-400 transition-colors text-sm block"
              >
                Contact Support
              </a>
            </nav>
          </div>

          {/* Responsible Gaming */}
          <div>
            <h4 className="text-lg font-semibold text-slate-200 mb-4">Responsible Gaming</h4>
            <p className="text-slate-400 text-sm mb-3">
              This is a sweepstakes game, not gambling. If you have concerns about gaming, contact:
            </p>
            <a
              href="tel:1-800-522-4700"
              className="text-amber-400 hover:text-amber-300 transition-colors text-sm font-semibold"
            >
              1-800-522-4700
            </a>
            <p className="text-slate-500 text-xs mt-2">
              National Council on Problem Gambling
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-slate-700 pt-6 mb-6">
          <p className="text-slate-500 text-xs text-center">
            Rolling in the Dough is a free-to-play sweepstakes game. No purchase necessary. Gold Coins have no monetary value. Only Sweeps Coins can be redeemed for real-world prizes. Must be 18+ to participate.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center border-t border-slate-700 pt-6">
          <p className="text-slate-500 text-sm">
            © 2026 Rolling in the Dough. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Last Updated: March 23, 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
