/**
 * Login Prompt Modal
 * Displayed when users try to access Sweepstakes without being authenticated
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getOAuthUrl } from "@/const";
import AuthForm from "./AuthForm";

type Provider = "google" | "facebook" | "apple" | "microsoft";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const socialButtons: { provider: Provider; label: string; icon: string; color: string; hover: string }[] = [
  {
    provider: "google",
    label: "Continue with Google",
    icon: "G",
    color: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100",
    hover: "shadow-[0_0_12px_rgba(255,255,255,0.3)]",
  },
  {
    provider: "facebook",
    label: "Continue with Facebook",
    icon: "f",
    color: "bg-[#1877F2] text-white hover:bg-[#166FE5]",
    hover: "shadow-[0_0_12px_rgba(24,119,242,0.5)]",
  },
  {
    provider: "apple",
    label: "Continue with Apple",
    icon: "⌂",
    color: "bg-black text-white hover:bg-gray-900",
    hover: "shadow-[0_0_12px_rgba(0,0,0,0.5)]",
  },
  {
    provider: "microsoft",
    label: "Continue with Microsoft",
    icon: "⬡",
    color: "bg-[#2F2F2F] text-white hover:bg-[#404040]",
    hover: "shadow-[0_0_12px_rgba(0,122,255,0.4)]",
  },
];

export default function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
  const [authMode, setAuthMode] = useState<"social" | "email">("social");
  const [formMode, setFormMode] = useState<"login" | "signup">("login");
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  if (!isOpen) return null;

  const handleSocialLogin = (provider: Provider) => {
    setLoadingProvider(provider);
    window.location.href = getOAuthUrl(provider);
  };

  const handleAuthSuccess = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-green-500 rounded-2xl p-8 max-w-md w-full mx-4 shadow-[0_0_40px_rgba(72,199,70,0.2),0_25px_60px_rgba(0,0,0,0.5)]"
        style={{ animation: "modalSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both" }}
      >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-600/60 transition-all"
      >
        <X size={18} />
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎰</div>
        <h2 className="text-2xl font-black text-green-400 mb-1 tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
          Sweepstakes Mode
        </h2>
        <p className="text-slate-400 text-sm">Sign in to play for real prizes</p>
      </div>

      {/* Message */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-6">
        <p className="text-slate-200 text-center text-sm leading-relaxed">
          You need an account to play Sweepstakes and cash out real coins. Sign in below — it takes just seconds!
        </p>
      </div>

      {/* Auth Mode Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-slate-800/60 rounded-xl">
        <button
          onClick={() => setAuthMode("social")}
          className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-sm transition-all ${
            authMode === "social"
              ? "bg-green-500 text-white shadow-[0_0_16px_rgba(72,199,70,0.4)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Social Login
        </button>
        <button
          onClick={() => setAuthMode("email")}
          className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-sm transition-all ${
            authMode === "email"
              ? "bg-green-500 text-white shadow-[0_0_16px_rgba(72,199,70,0.4)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Email / Password
        </button>
      </div>

      {/* Social Login */}
      {authMode === "social" && (
        <div className="space-y-3">
          {socialButtons.map(({ provider, label, icon, color, hover }) => (
            <button
              key={provider}
              onClick={() => handleSocialLogin(provider)}
              disabled={loadingProvider !== null}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${color} ${hover}`}
            >
              {loadingProvider === provider ? (
                <span className="text-lg">⏳</span>
              ) : (
                <span className="text-lg font-black w-6 text-center">{icon}</span>
              )}
              <span className="flex-1 text-left">{loadingProvider === provider ? "Redirecting..." : label}</span>
              <span className="text-sm opacity-60">→</span>
            </button>
          ))}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-800 px-3 text-xs text-slate-500 uppercase tracking-widest">or</span>
            </div>
          </div>

          <button
            onClick={() => setAuthMode("email")}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-300 bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 transition-all"
          >
            Create Account with Email
          </button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-300 text-xs py-2"
          >
            Continue with Free Play (no account needed)
          </Button>
        </div>
      )}

      {/* Email/Password Auth */}
      {authMode === "email" && (
        <div className="space-y-4">
          <AuthForm
            mode={formMode}
            onSuccess={handleAuthSuccess}
            onSwitchMode={setFormMode}
          />

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-300 text-xs py-2"
          >
            Continue with Free Play (no account needed)
          </Button>
        </div>
      )}

      {/* Info */}
      <p className="text-[11px] text-slate-500 text-center mt-5 leading-relaxed">
        Free Play uses Gold Coins (no real money value). Sweepstakes uses promo coins that can be redeemed for cash prizes. 21+ only. Please play responsibly.
      </p>

      {/* Divider with provider icons */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <span className="text-xs text-slate-600">Secured by</span>
        <div className="flex gap-2">
          <span className="text-xs font-bold text-slate-500">Manus OAuth</span>
        </div>
      </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          0% { opacity: 0; transform: scale(0.92) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
