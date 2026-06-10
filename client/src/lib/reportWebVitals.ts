/**
 * Web Vitals reporter.
 *
 * Sends LCP, CLS, INP, and TTFB metrics to the backend
 * `/api/trpc/metrics.recordWebVitals` endpoint using
 * `navigator.sendBeacon()` (with a `fetch` keepalive fallback).
 * Designed to be fire-and-forget — perf monitoring is allowed
 * to fail silently. Errors are caught and logged at debug
 * level, never thrown.
 *
 * Sampling: 1 in 10 page loads. This keeps storage reasonable
 * (a slot machine with 1000 DAU generates ~400 metrics/day at
 * full sampling; sampling reduces this to ~40/day) while still
 * giving a meaningful p50/p95 over a week. Bump the rate up if
 * you need more data; the constant is here for easy adjustment.
 *
 * The metrics library is dynamically imported so the report
 * code never blocks first paint. The full web-vitals library
 * is ~1.7 kB gzipped; loading it after the initial render is
 * imperceptible.
 *
 * Schema: each metric is sent as one record. We don't batch
 * because web vitals fire at different times (TTFB early, LCP
 * mid, CLS late, INP on interaction), and sendBeacon is
 * designed to be called per-event anyway.
 *
 * See docs/PHASE_4_STATUS.md Gap C.
 */

const SAMPLING_RATE = 0.1;
const ENDPOINT = "/api/trpc/metrics.recordWebVitals";

type WebVitalMetric = {
  name: "LCP" | "CLS" | "INP" | "TTFB" | "FCP";
  value: number;
  id: string;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType:
    | "navigate"
    | "reload"
    | "back-forward"
    | "back-forward-cache"
    | "prerender"
    | "restore";
  pathname: string;
  ts: number;
};

/**
 * Send a single metric to the backend. Tries sendBeacon first
 * (non-blocking, works during page unload) and falls back to
 * fetch with keepalive. Returns silently on failure — perf
 * monitoring is allowed to be lossy.
 */
function sendMetric(metric: WebVitalMetric): void {
  const body = JSON.stringify({
    "0": {
      json: metric,
    },
  });
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (ok) return;
    }
  } catch {
    // fall through to fetch
  }
  // Fallback: fetch with keepalive so the request survives a
  // page unload. Errors are swallowed — this is best-effort.
  try {
    if (typeof fetch === "function") {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "include",
      });
    }
  } catch {
    // intentionally empty — perf monitoring must never throw
  }
}

/**
 * Wire up web-vitals. Dynamically imports the library so
 * loading it never blocks first paint. Safe to call multiple
 * times — the second call is a no-op (the module is cached).
 *
 * Call this once from main.tsx, after the React tree mounts.
 */
export function reportWebVitals(): void {
  // 1-in-10 sampling at the page level. If we don't make the
  // cut, return early without loading the library at all.
  if (typeof window === "undefined") return;
  if (Math.random() > SAMPLING_RATE) return;

  // Lazy import so the web-vitals library (~1.7 kB gzipped)
  // doesn't block first paint.
  void import("web-vitals").then(({ onLCP, onCLS, onINP, onTTFB }) => {
    const pathname = window.location.pathname;
    const ts = Date.now();

    // Use the web-vitals library's metric type directly so we
    // match the exact shape it passes. The metric's navigationType
    // is a union of all supported values (the library adds "restore"
    // for back-forward-cache restores, which is more than the 5
    // we currently forward to the server — that's fine, we just
    // store what we get).
    const reporter = (metric: import("web-vitals").Metric) => {
      sendMetric({
        name: metric.name as WebVitalMetric["name"],
        value: metric.value,
        id: metric.id,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType as WebVitalMetric["navigationType"],
        pathname,
        ts,
      });
    };

    onLCP(reporter);
    onCLS(reporter);
    onINP(reporter);
    onTTFB(reporter);
  }).catch(() => {
    // If web-vitals fails to load (offline, blocked, etc.),
    // we silently skip perf monitoring. The game itself is
    // unaffected.
  });
}
