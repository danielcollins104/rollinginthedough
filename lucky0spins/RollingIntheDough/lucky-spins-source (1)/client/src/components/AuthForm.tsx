/**
 * AuthForm Component
 * Email/password login and signup form
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AuthFormProps {
  mode: "login" | "signup";
  onSuccess?: () => void;
  onSwitchMode?: (mode: "login" | "signup") => void;
}

export default function AuthForm({ mode, onSuccess, onSwitchMode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const signupMutation = trpc.auth.signup.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email, password });
      } else {
        if (!name.trim()) {
          setError("Name is required");
          setIsLoading(false);
          return;
        }
        await signupMutation.mutateAsync({ email, password, name });
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-green-400 mb-4">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h3>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Name Field (Signup only) */}
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
          {mode === "signup" && (
            <p className="text-xs text-slate-400 mt-1">
              Min 8 chars, 1 uppercase, 1 number, 1 special char
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 rounded-lg transition"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "login" ? "Signing In..." : "Creating Account..."}
            </>
          ) : (
            mode === "login" ? "Sign In" : "Create Account"
          )}
        </Button>

        {/* Switch Mode Link */}
        <p className="text-center text-sm text-slate-400">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => onSwitchMode?.(mode === "login" ? "signup" : "login")}
            className="text-green-400 hover:text-green-300 font-semibold"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </form>
    </div>
  );
}
