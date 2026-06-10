/**
 * Web vitals / metrics route tests
 *
 * The /api/trpc/metrics.recordWebVitals endpoint accepts
 * fire-and-forget perf monitoring data from the client. The
 * route must:
 *   1. Validate the input shape (rejects bad payloads)
 *   2. Return success even if the DB is unavailable
 *   3. Return success even if the webVitals table is not
 *      yet migrated
 *
 * The third property is critical — the client sends via
 * sendBeacon and the user can't see failure responses, so
 * the route needs to be "always success" or monitoring
 * silently dies.
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAnonContext(): { ctx: TrpcContext } {
  // The web vitals route is a public procedure (no auth),
  // so the test context has no user.
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return { ctx };
}

const validMetric = {
  metricId: "v1-1234-abc",
  name: "LCP" as const,
  value: 1234.5,
  rating: "good" as const,
  delta: 100.2,
  navigationType: "navigate" as const,
  pathname: "/",
  ts: 1700000000000,
};

describe("metrics.recordWebVitals", () => {
  it("accepts a valid LCP metric and returns ok", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.metrics.recordWebVitals(validMetric);
    expect(result).toEqual({ ok: true });
  });

  it("accepts all 4 supported metric names (LCP, CLS, INP, TTFB)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    for (const name of ["LCP", "CLS", "INP", "TTFB", "FCP"] as const) {
      const result = await caller.metrics.recordWebVitals({ ...validMetric, name });
      expect(result).toEqual({ ok: true });
    }
  });

  it("accepts optional userId (per-user metrics, future use)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.metrics.recordWebVitals({
      ...validMetric,
      userId: 42,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects unknown metric names (typos, future metrics)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error -- intentionally wrong value
      caller.metrics.recordWebVitals({ ...validMetric, name: "FOO" })
    ).rejects.toThrow();
  });

  it("rejects missing pathname (required for slicing by route)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    const { pathname, ...withoutPath } = validMetric;
    await expect(
      // @ts-expect-error -- intentionally missing required field
      caller.metrics.recordWebVitals(withoutPath)
    ).rejects.toThrow();
  });

  it("rejects empty metricId (used to dedupe — must be non-empty)", async () => {
    const { ctx } = createAnonContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.recordWebVitals({ ...validMetric, metricId: "" })
    ).rejects.toThrow();
  });
});
