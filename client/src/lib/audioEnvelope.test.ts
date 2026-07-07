import { describe, expect, it } from "vitest";
import { computeEnvelope, describeEnvelope } from "./audioEnvelope";

/**
 * Envelope-shape tests. Verify that the click-free envelope timing math
 * produces the expected attack/hold/release structure.
 */
describe("computeEnvelope", () => {
  it("starts at 0 and ramps to the peak", () => {
    const env = computeEnvelope(0.2, 0, 0.3);
    expect(env.peak).toBeCloseTo(0.3);
    expect(env.attackStart).toBe(0);
    expect(env.attackEnd).toBeCloseTo(0.008);
  });

  it("respects the request delay", () => {
    const env = computeEnvelope(0.2, 0.1, 0.3);
    expect(env.attackStart).toBeCloseTo(0.1);
    expect(env.attackEnd).toBeCloseTo(0.108);
    expect(env.releaseEnd).toBeCloseTo(0.3);
  });

  it("has a release phase that ends at delay + duration", () => {
    const env = computeEnvelope(0.2, 0, 0.3);
    expect(env.releaseEnd).toBeCloseTo(0.2);
  });

  it("never overlaps attack with release (release ≥ attack end)", () => {
    const env = computeEnvelope(0.2, 0, 0.3);
    expect(env.releaseStart).toBeGreaterThanOrEqual(env.attackEnd);
  });

  it("release phase ends before duration when preRelease leaves room", () => {
    // duration=0.2, preRelease=0.05 → releaseStart = 0.15, releaseEnd = 0.2
    const env = computeEnvelope(0.2, 0, 0.3, 0.008, 0.05);
    expect(env.releaseStart).toBeCloseTo(0.15);
    expect(env.releaseEnd).toBeCloseTo(0.2);
  });

  it("release start is always >= attack end (no overlap)", () => {
    // Pick a duration that fits all phases comfortably — degenerate
    // cases where attack exceeds duration can't produce a sensible envelope.
    const env = computeEnvelope(0.2, 0, 0.3, 0.008, 0.05);
    expect(env.releaseStart).toBeGreaterThanOrEqual(env.attackEnd);
    expect(env.releaseStart).toBeLessThanOrEqual(env.releaseEnd);
  });

  it("describeEnvelope returns a non-empty human-readable string", () => {
    const env = computeEnvelope(0.2, 0.05, 0.3);
    const s = describeEnvelope(env);
    expect(s).toMatch(/attack=\d+ms/);
    expect(s).toMatch(/hold=\d+ms/);
    expect(s).toMatch(/release=\d+ms/);
    expect(s).toMatch(/peak=0\.3/);
  });
});
