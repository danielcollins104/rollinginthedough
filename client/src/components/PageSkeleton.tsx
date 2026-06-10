/**
 * PageSkeleton — Suspense fallback for lazy-loaded routes.
 *
 * Replaces the previous "Loading…" text node (App.tsx's
 * PageLoading) with a proper skeleton that matches the
 * app's dark "Art Deco Opulence" theme (midnight navy +
 * gold accents).
 *
 * The skeleton shows:
 *  - A header bar placeholder (where the GameHeader /
 *    page header will appear)
 *  - 2 content blocks (where the page's main content goes)
 *  - A small "Loading…" text in the corner so a sighted
 *    user has an explanation even if the skeleton doesn't
 *    resemble the final layout
 *
 * For pages with very different layouts (e.g. the legal
 * pages, /pricing), the skeleton doesn't try to match
 * perfectly — it just signals "loading" in the same
 * aesthetic as the rest of the app.
 *
 * Note: this is the fallback for *route* loading, not for
 * the Home page's first render (Home is eager-loaded and
 * useGameState initializes synchronously, so the "blank
 * frame" is <50ms and not worth a skeleton).
 *
 * See docs/PHASE_5_STATUS.md Gap F.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #050510 0%, #0a0a1a 40%, #0d0a1a 70%, #050510 100%)",
        color: "#D4AF37",
        fontFamily: "'Playfair Display', serif",
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        gap: "1.5rem",
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      {/* Header bar — matches the GameHeader position */}
      <div className="flex items-center justify-between gap-3 w-full max-w-4xl mx-auto">
        <Skeleton
          className="h-12 w-32 rounded-lg"
          style={{ background: "rgba(212,175,55,0.12)" }}
        />
        <div className="flex gap-2">
          <Skeleton
            className="h-10 w-10 rounded-full"
            style={{ background: "rgba(212,175,55,0.12)" }}
          />
          <Skeleton
            className="h-10 w-10 rounded-full"
            style={{ background: "rgba(212,175,55,0.12)" }}
          />
        </div>
      </div>

      {/* Main content area — two placeholder blocks */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-3xl mx-auto">
        <Skeleton
          className="h-16 w-3/4 rounded-xl"
          style={{ background: "rgba(212,175,55,0.10)" }}
        />
        <Skeleton
          className="h-64 w-full rounded-xl"
          style={{ background: "rgba(212,175,55,0.08)" }}
        />
        <Skeleton
          className="h-12 w-1/2 rounded-lg"
          style={{ background: "rgba(212,175,55,0.10)" }}
        />
      </div>

      {/* Loading label */}
      <div
        className="text-center text-xs uppercase tracking-widest"
        style={{ color: "rgba(212,175,55,0.5)" }}
      >
        Loading…
      </div>
    </div>
  );
}
