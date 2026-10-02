/**
 * OnboardingTutorial — first-visit "how to play" overlay.
 *
 * Shown once per browser (gated on localStorage "ritd_seen_intro"), then
 * never again unless the player reopens it from the PAYS drawer. Four
 * short steps explain the core loop: bet, spin, match, and the dual
 * currency / bonus mechanics. Keyboard: Esc closes, arrows navigate.
 */
import { useEffect, useState } from "react";

const SEEN_KEY = "ritd_seen_intro";

export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return true; // if storage is blocked, don't nag every load
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, "true");
  } catch {
    /* ignore */
  }
}

interface Step {
  icon: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: "🏴‍☠️",
    title: "Welcome to Pirates Gold",
    body: "Plunder the high seas across 5 reels. Match 3 or more pirate medallions on a payline to win. No purchase necessary — sweepstakes play.",
  },
  {
    icon: "🎯",
    title: "Set your bet",
    body: "Use − / + to set your bet, then hit the big gold SPIN button (or press Space). Each spin is one bet across your active paylines.",
  },
  {
    icon: "💰",
    title: "Two currencies",
    body: "🪙 Gold coins and 💚 Sweeps coins. Gold is for fun play; Sweeps can be redeemed for prizes. Tap the pills up top to switch between them.",
  },
  {
    icon: "🔥",
    title: "Bonuses & wilds",
    body: "The skull WILD substitutes for any symbol. Land 3 treasure maps for free spins, and 6+ coins to trigger the Hold & Win bonus. Good luck!",
  },
];

export default function OnboardingTutorial({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  const finish = () => {
    markIntroSeen();
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && !last) setStep((s) => s + 1);
      else if (e.key === "ArrowLeft" && step > 0) setStep((s) => s - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, last]);

  const s = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
      onClick={finish}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 text-center"
        style={{
          background: "linear-gradient(180deg, #0d3b47 0%, #07222e 45%, #030a10 100%)",
          border: "2px solid #D4AF37",
          boxShadow: "0 0 40px rgba(255,194,71,0.35), 0 20px 60px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "3rem", lineHeight: 1 }} aria-hidden>{s.icon}</div>
        <h2
          className="font-display font-black uppercase mt-3"
          style={{ color: "#FFD700", letterSpacing: "0.06em", fontSize: "1.25rem" }}
        >
          {s.title}
        </h2>
        <p style={{ color: "#E8E8F0", fontSize: "0.9rem", lineHeight: 1.5, marginTop: 10 }}>
          {s.body}
        </p>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 999,
                background: i === step ? "#FFD700" : "rgba(212,175,55,0.35)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            onClick={finish}
            className="px-4 py-2 rounded-lg"
            style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((v) => v - 1)}
                className="px-4 py-2 rounded-lg font-bold"
                style={{ background: "#1a1000", color: "#FFD700", border: "1px solid #D4AF37" }}
              >
                Back
              </button>
            )}
            <button
              onClick={() => (last ? finish() : setStep((v) => v + 1))}
              className="px-5 py-2 rounded-lg font-black"
              style={{
                background: "linear-gradient(180deg, #D4AF37, #FFD700)",
                color: "#1a1000",
                border: "1px solid #8B6914",
              }}
            >
              {last ? "Let's play" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
