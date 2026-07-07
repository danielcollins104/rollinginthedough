import { useEffect, useState, useCallback } from "react";

/**
 * Toast system for slot machine events. Listens for window-level
 * CustomEvents so any component can fire a toast without prop drilling.
 *
 * Event API:
 *   window.dispatchEvent(new CustomEvent('toast', {
 *     detail: { kind: 'secondChance' | 'bigWin' | 'streak' | 'retrigger' | 'levelUp', message: string }
 *   }));
 */

export type ToastKind = "secondChance" | "bigWin" | "streak" | "retrigger" | "levelUp" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastDetail {
  kind: ToastKind;
  message: string;
}

declare global {
  interface WindowEventMap {
    toast: CustomEvent<ToastDetail>;
  }
}

// Visual config per toast kind. Color + icon + duration. Single source of
// truth so the look stays consistent across the app.
const TOAST_STYLE: Record<ToastKind, { color: string; bg: string; icon: string; durationMs: number }> = {
  secondChance: { color: "#FFD700", bg: "rgba(212,175,55,0.15)", icon: "🍀", durationMs: 3500 },
  bigWin:       { color: "#FF6B35", bg: "rgba(255,107,53,0.18)",  icon: "🎉", durationMs: 4000 },
  streak:       { color: "#FFD700", bg: "rgba(255,215,0,0.18)",   icon: "🔥", durationMs: 3000 },
  retrigger:    { color: "#90EE90", bg: "rgba(144,238,144,0.15)", icon: "➕", durationMs: 4000 },
  levelUp:      { color: "#D4AF37", bg: "rgba(212,175,55,0.2)",   icon: "⭐", durationMs: 4500 },
  info:         { color: "#FFFFFF", bg: "rgba(255,255,255,0.1)",  icon: "ℹ️", durationMs: 2500 },
};

/**
 * Convenience helpers — call these from anywhere instead of building the
 * CustomEvent manually.
 */
export const toast = {
  secondChance: (msg = "SECOND CHANCE! 🍀") =>
    window.dispatchEvent(new CustomEvent<ToastDetail>("toast", { detail: { kind: "secondChance", message: msg } })),
  bigWin: (msg: string) =>
    window.dispatchEvent(new CustomEvent<ToastDetail>("toast", { detail: { kind: "bigWin", message: msg } })),
  streak: (msg: string) =>
    window.dispatchEvent(new CustomEvent<ToastDetail>("toast", { detail: { kind: "streak", message: msg } })),
  retrigger: (msg = "+5 FREE SPINS!") =>
    window.dispatchEvent(new CustomEvent<ToastDetail>("toast", { detail: { kind: "retrigger", message: msg } })),
  levelUp: (msg: string) =>
    window.dispatchEvent(new CustomEvent<ToastDetail>("toast", { detail: { kind: "levelUp", message: msg } })),
  info: (msg: string) =>
    window.dispatchEvent(new CustomEvent<ToastDetail>("toast", { detail: { kind: "info", message: msg } })),
};

export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    let nextId = 1;
    const handler = (event: CustomEvent<ToastDetail>) => {
      const id = nextId++;
      const detail = event.detail;
      setToasts(prev => [...prev, { id, kind: detail.kind, message: detail.message }]);
      const duration = TOAST_STYLE[detail.kind].durationMs;
      setTimeout(() => removeToast(id), duration);
    };
    window.addEventListener("toast", handler as EventListener);
    return () => window.removeEventListener("toast", handler as EventListener);
  }, [removeToast]);

  return (
    <div
      className="fixed left-0 right-0 bottom-20 md:bottom-6 z-[70] flex flex-col items-center gap-2 pointer-events-none px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => {
        const style = TOAST_STYLE[t.kind];
        return (
          <div
            key={t.id}
            className="font-display font-black uppercase tracking-wider shadow-2xl pointer-events-auto"
            style={{
              color: style.color,
              background: `linear-gradient(180deg, ${style.bg} 0%, rgba(0,0,0,0.85) 100%)`,
              border: `2px solid ${style.color}`,
              borderRadius: "999px",
              padding: "10px 20px",
              fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)",
              textShadow: `0 0 12px ${style.color}`,
              boxShadow: `0 4px 24px ${style.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
              animation: "toastSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
              maxWidth: "min(420px, 92vw)",
              textAlign: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ marginRight: "8px" }}>{style.icon}</span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
