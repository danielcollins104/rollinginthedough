/**
 * Login Prompt Modal
 * Displayed when users try to access Sweepstakes without being authenticated
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, X } from "lucide-react";
import { getLoginUrl } from "@/const";
import AuthForm from "./AuthForm";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
  const [authMode, setAuthMode] = useState<"oauth" | "email">("oauth");
  const [formMode, setFormMode] = useState<"login" | "signup">("login");

  if (!isOpen) return null;

  const handleOAuthLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleAuthSuccess = () => {
    // Refresh page to update auth state
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-green-500 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-400 mb-2">Sweepstakes Mode</h2>
          <p className="text-slate-300">Sign in to play for real prizes</p>
        </div>

        {/* Message */}
        <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-4 mb-6">
          <p className="text-slate-200 text-center text-sm">
            You need to be logged in to play Sweepstakes and earn real coins. Create an account or sign in to get started!
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAuthMode("oauth")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition ${
              authMode === "oauth"
                ? "bg-green-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Quick Login
          </button>
          <button
            onClick={() => setAuthMode("email")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition ${
              authMode === "email"
                ? "bg-green-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Email/Password
          </button>
        </div>

        {/* OAuth Login */}
        {authMode === "oauth" && (
          <div className="space-y-3">
            <Button
              onClick={handleOAuthLogin}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <LogIn size={20} />
              Sign In with Manus
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-slate-500 text-slate-300 hover:bg-slate-700"
            >
              Continue with Free Play
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
              variant="outline"
              className="w-full border-slate-500 text-slate-300 hover:bg-slate-700"
            >
              Continue with Free Play
            </Button>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-slate-400 text-center mt-4">
          Free Play uses Gold Coins (no real money). Sweepstakes uses real coins that can be cashed out.
        </p>
      </div>
    </div>
  );
}
