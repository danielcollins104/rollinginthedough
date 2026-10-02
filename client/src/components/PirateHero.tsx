/**
 * PirateHero
 * ───────────
 * Cabinet centerpiece illustration for the PIRATES GOLD theme.
 *
 * Uses the generated captain medallion (/pg/captain.png) as a large
 * floating emblem over a deep-sea gradient, so the lobby reads as
 * "treasure saloon on the water" rather than a pasted-on square.
 */
import * as React from "react";

export function PirateHero({
  height = 280,
  glow = true,
}: {
  height?: number;
  glow?: boolean;
}) {
  const medallion = Math.min(height - 24, 240);
  return (
    <div
      className="relative w-full select-none"
      style={{
        height,
        background:
          "radial-gradient(80% 70% at 50% 30%, #0d3b47 0%, #07222e 45%, #030a10 100%)",
        overflow: "hidden",
        borderRadius: 14,
        boxShadow: glow
          ? "inset 0 0 80px rgba(255,194,71,0.18), inset 0 0 30px rgba(212,175,55,0.12), 0 0 24px rgba(255,194,71,0.45), 0 0 60px rgba(0,180,200,0.22)"
          : undefined,
        border: "1px solid rgba(255,194,71,0.25)",
      }}
    >
      {/* Ambient ember + spray particles */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle 1.2px at 18% 32%, rgba(255,194,71,0.7), transparent 70%)," +
            "radial-gradient(circle 1px at 76% 22%, rgba(255,138,60,0.7), transparent 70%)," +
            "radial-gradient(circle 1.4px at 88% 58%, rgba(255,194,71,0.6), transparent 70%)," +
            "radial-gradient(circle 1px at 22% 78%, rgba(255,138,60,0.6), transparent 70%)," +
            "radial-gradient(circle 1.2px at 56% 88%, rgba(255,194,71,0.6), transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Captain medallion */}
      <img
        src="/pg/captain.png"
        alt="Pirates Gold — captain of the fleet"
        draggable={false}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: medallion,
          height: medallion,
          objectFit: "cover",
          borderRadius: "50%",
          filter:
            "contrast(1.06) saturate(1.1) drop-shadow(0 0 18px rgba(255,194,71,0.45))",
          zIndex: 0,
        }}
      />

      {/* Top + bottom fades so the emblem melts into the cabinet */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "22%",
          background: "linear-gradient(180deg, rgba(3,10,16,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "26%",
          background: "linear-gradient(0deg, rgba(3,10,16,0.85) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}
