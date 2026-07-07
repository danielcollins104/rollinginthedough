/**
 * HuntressHero
 * ─────────────
 * Cabinet centerpiece illustration — a Sioux (Lakota/Dakota) huntress in
 * traditional hunting dress, stalking her prey across the prairie.
 *
 * Renders the user's real painted PNG portrait at /client/public/
 * huntress-warrior.png. Replaces the previous hand-painted SVG (1098 lines
 * of <path> d="..." tags) that the user wanted replaced with a real
 * illustration. The image was generated as 1086x1448 (3:4 portrait) with
 * a stalking crouch pose, moon rim light, copper/ember palette, and
 * traditional minimal attire — matching the original brief.
 *
 * Visual treatment here:
 *   - Image fills the centerpiece column, object-position biased to keep
 *     the head + bow + arrows in frame (the user can read her face from
 *     the cabinet)
 *   - Plum/maroon radial vignette behind her ties the image to the cabinet
 *     palette (her painted magenta sky matches the cabinet plum)
 *   - A 12px candle-yellow outer glow gives her the same "lit by candle"
 *     rim treatment as the cabinet-rim — so she reads as part of the
 *     cabinet, not a pasted-on photograph
 *   - CabinScene.tsx prairie/mountain haze still shows through any negative
 *     space (since this is a portrait crop, mostly her body fills it)
 */
import * as React from "react";

export function HuntressHero({
  height = 280,
  glow = true,
}: {
  height?: number;
  glow?: boolean;
}) {
  return (
    <div
      className="relative w-full select-none"
      style={{
        height,
        background:
          // Plum radial vignette behind the figure so her dark sky blends
          // into the cabinet and she doesn't have a hard edge.
          "radial-gradient(80% 60% at 50% 38%, #251f3d 0%, #11091e 45%, #04020a 100%)",
        overflow: "hidden",
        borderRadius: 14,
        boxShadow: glow
          // The same candle-yellow bloom as the cabinet-rim, but biased
          // warmer (more ember) so it reads as firelight on her face.
          ? "inset 0 0 80px rgba(255,138,60,0.22), inset 0 0 30px rgba(212,175,55,0.15), 0 0 24px rgba(255,194,71,0.55), 0 0 60px rgba(255,107,107,0.28)"
          : undefined,
        // A subtle plum border echoes the cabinet-rim so the centerpiece
        // reads as part of the same family, even though it isn't a
        // gold-rimmed frame.
        border: "1px solid rgba(255,194,71,0.25)",
      }}
    >
      {/* Ember particles drifting across — soft warm sparks that match
          the painted embers in the source image. Sits BEHIND the image
          so the particles don't cover her face. */}
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

      {/* The portrait itself.
          object-position biased UP (40%) so the head + bow + arrows stay
          in frame and the bottom 1/3 of the source (moccasins/grass) is
          cropped — those read as the title bar / reels below. */}
      <img
        src="/huntress-warrior.png"
        alt="Huntress Warrior — Spirit of the Plains"
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 40%",
          // Mild contrast/saturation boost so the painted image reads
          // crisply at this height and integrates with the cabinet's
          // candle-lit palette.
          filter: "contrast(1.05) saturate(1.1)",
          zIndex: 0,
        }}
      />

      {/* Top edge fade — soft gold-to-transparent at the very top so
          the image's dark sky melts into the cabinet's plum background. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "20%",
          background:
            "linear-gradient(180deg, rgba(15,6,30,0.6) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Bottom edge fade — same treatment at the bottom so her
          moccasins dissolve into the title bar below. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "25%",
          background:
            "linear-gradient(0deg, rgba(15,6,30,0.85) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}
