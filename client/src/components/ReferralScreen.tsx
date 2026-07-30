/**
 * ReferralScreen — Premium Referral Hub
 * Art Deco Gold Casino aesthetic with VIP club feel
 * Features: Code display, share buttons, stats, tiers, claim input, floating badge
 */

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Link2,
  Gift,
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { useReferral, ReferralRef } from "@/hooks/useReferral";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Art Deco Ornament ────────────────────────────────────────────────────────
function ArtDecoOrnament({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className="flex items-center gap-1 opacity-50"
      style={{ transform: flip ? "scaleX(-1)" : "none" }}
    >
      <div className="w-6 h-px" style={{ background: "linear-gradient(90deg, transparent, #D4AF37)" }} />
      <div className="text-xs font-numbers" style={{ color: "#D4AF37" }}>◆</div>
      <div className="w-3 h-px" style={{ background: "#D4AF37" }} />
      <div className="text-xs font-numbers" style={{ color: "#C8860A" }}>◇</div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  accent?: string;
}

function StatCard({ icon, value, label, accent = "#D4AF37" }: StatCardProps) {
  return (
    <div
      className="flex-1 rounded-xl p-3 text-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(13,13,32,0.8), rgba(26,26,53,0.6))`,
        border: `1px solid ${accent}40`,
        boxShadow: `0 0 20px ${accent}15`,
        minWidth: 90,
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)`,
        }}
      />
      <div className="relative">
        <div className="text-2xl mb-1">{icon}</div>
        <div
          className="text-xl font-black mb-0.5"
          style={{
            fontFamily: "'Oswald', sans-serif",
            color: accent,
            textShadow: `0 0 10px ${accent}40`,
          }}
        >
          {value}
        </div>
        <div
          className="text-xs font-numbers uppercase tracking-wide"
          style={{ color: "rgba(212,175,55,0.6)" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Referral Tier Item ───────────────────────────────────────────────────────
interface ReferralTierItemProps {
  referral: ReferralRef;
}

function ReferralTierItem({ referral }: ReferralTierItemProps) {
  const completedMilestones = referral.milestones.filter((m) => m.status === "earned");
  const pendingMilestones = referral.milestones.filter((m) => m.status === "pending");
  const totalCoins = referral.coinsEarned;

  return (
    <div
      className="rounded-xl p-4 mb-3 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(13,13,32,0.9), rgba(26,26,53,0.7))",
        border: "1px solid rgba(212,175,55,0.3)",
      }}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {referral.status === "completed" ? (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, #4ADE80, #22C55E)",
              color: "#052e16",
            }}
          >
            ✓ Complete
          </span>
        ) : (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#451a03",
            }}
          >
            ⏳ Pending
          </span>
        )}
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #B8860B)",
            color: "#1a1200",
          }}
        >
          {referral.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div
            className="font-semibold"
            style={{ color: "#F5E6C8", fontFamily: "'Playfair Display', serif" }}
          >
            {referral.username}
          </div>
          <div className="text-xs" style={{ color: "rgba(212,175,55,0.5)" }}>
            Joined {new Date(referral.referredAt).toLocaleDateString()}
          </div>
        </div>
        {totalCoins > 0 && (
          <div className="ml-auto text-right">
            <div
              className="text-lg font-black"
              style={{
                color: "#4ADE80",
                fontFamily: "'Oswald', sans-serif",
                textShadow: "0 0 10px rgba(74,222,128,0.4)",
              }}
            >
              +{totalCoins.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: "rgba(74,222,128,0.6)" }}>
              coins earned
            </div>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="space-y-2 pl-13">
        {completedMilestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span style={{ color: "#4ADE80" }}>✅</span>
            <span style={{ color: "rgba(212,175,55,0.7)" }}>{m.description}</span>
            <span
              className="ml-auto font-bold"
              style={{
                color: "#4ADE80",
                fontFamily: "'Oswald', sans-serif",
              }}
            >
              +{m.reward.toLocaleString()}
            </span>
          </div>
        ))}
        {pendingMilestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span style={{ color: "#F59E0B" }}>⏳</span>
            <span style={{ color: "rgba(212,175,55,0.5)" }}>{m.description}</span>
            <span
              className="ml-auto font-bold"
              style={{
                color: "#F59E0B",
                fontFamily: "'Oswald', sans-serif",
              }}
            >
              +{m.reward.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ReferralScreen Component ───────────────────────────────────────────
interface ReferralScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralScreen({ isOpen, onClose }: ReferralScreenProps) {
  const { user, isAuthenticated } = useAuth();
  const { code, stats, referrals, loading, error, claimReferralCode, claimRewards } = useReferral();

  const [copied, setCopied] = useState(false);
  const [claimInput, setClaimInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setClaimInput("");
      setShowClaimSuccess(false);
    }
  }, [isOpen]);

  const handleCopyCode = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  }, [code]);

  const handleCopyLink = useCallback(async () => {
    if (!code) return;
    const shareLink = `${window.location.origin}?ref=${code}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Share link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [code]);

  const handleShareTwitter = useCallback(() => {
    if (!code) return;
    const text = encodeURIComponent(
      `I'm playing Rolling in the Dough! Use my referral code ${code} to get 500 free coins when you sign up 🎰🍞`
    );
    const url = encodeURIComponent(`${window.location.origin}?ref=${code}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }, [code]);

  const handleShareSMS = useCallback(() => {
    if (!code) return;
    const message = encodeURIComponent(
      `I'm playing Rolling in the Dough! Use my referral code ${code} to get 500 free coins when you sign up 🎰🍞\n\n${window.location.origin}?ref=${code}`
    );
    window.location.href = `sms:?body=${message}`;
  }, [code]);

  const handleShareEmail = useCallback(() => {
    if (!code) return;
    const subject = encodeURIComponent("Join me on Rolling in the Dough!");
    const body = encodeURIComponent(
      `Hey!\n\nI've been playing this awesome casino game called Rolling in the Dough. Use my referral code ${code} when you sign up to get 500 free coins!\n\nYou can download it here: ${window.location.origin}?ref=${code}\n\nSee you there! 🍞🎰`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [code]);

  const handleClaimCode = useCallback(async () => {
    if (!claimInput.trim()) {
      toast.error("Please enter a referral code");
      return;
    }
    setClaiming(true);
    try {
      const result = await claimReferralCode(claimInput.trim().toUpperCase());
      if (result.success) {
        setShowClaimSuccess(true);
        setClaimInput("");
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setClaiming(false);
    }
  }, [claimInput, claimReferralCode]);

  const handleClaimRewards = useCallback(async () => {
    const result = await claimRewards();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }, [claimRewards]);

  const shareLink = code ? `${window.location.origin}?ref=${code}` : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-gradient-to-b from-slate-900 via-slate-800/95 to-slate-950 border-yellow-600/50 text-white p-0 max-w-2xl max-h-[95vh] overflow-hidden flex flex-col"
        style={{
          boxShadow: "0 0 60px rgba(212,175,55,0.2)",
          border: "2px solid rgba(212,175,55,0.4)",
        }}
      >
        {/* ═══════════════════════════════════════ HEADER ═══════════════════════════════════════ */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Background decoration */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: "linear-gradient(135deg, #D4AF3730 0%, transparent 50%)",
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: "rgba(212,175,55,0.6)" }}
          >
            <X size={18} />
          </button>

          {/* Title row */}
          <div className="relative flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #B8860B)",
                boxShadow: "0 0 20px rgba(212,175,55,0.4)",
              }}
            >
              <Gift size={24} className="text-black" />
            </div>
            <div>
              <h2
                className="text-2xl font-black tracking-tight"
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  color: "#D4AF37",
                  textShadow: "0 0 20px rgba(212,175,55,0.4)",
                }}
              >
                VIP Referral Club
              </h2>
              <p className="text-xs text-amber-200/60">Invite friends, earn rewards!</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════ REFERRAL CODE BOX ═══════════════════════════════════════ */}
        <div className="mx-6 mb-4 p-4 rounded-xl relative overflow-hidden" style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
          border: "2px solid #D4AF37",
          boxShadow: "0 0 30px rgba(212,175,55,0.2)",
        }}>
          {/* Animated shine */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.15) 50%, transparent 80%)",
              animation: "referralShine 4s ease-in-out infinite",
            }}
          />
          <div className="relative text-center">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(212,175,55,0.6)" }}>
              Your Referral Code
            </p>
            {loading ? (
              <div className="h-10 bg-slate-800/50 rounded-lg animate-pulse" />
            ) : code ? (
              <div className="flex items-center justify-center gap-3">
                <span
                  className="text-3xl font-black tracking-wider"
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    color: "#F5E6C8",
                    letterSpacing: "0.2em",
                    textShadow: "0 0 10px rgba(212,175,55,0.3)",
                  }}
                >
                  {code}
                </span>
                <Button
                  onClick={handleCopyCode}
                  size="sm"
                  className="font-bold"
                  style={{
                    background: copied
                      ? "linear-gradient(135deg, #4ADE80, #22C55E)"
                      : "linear-gradient(135deg, #D4AF37, #B8860B)",
                    color: copied ? "#052e16" : "#1a1200",
                    boxShadow: "0 0 15px rgba(212,175,55,0.3)",
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "COPIED!" : "COPY"}
                </Button>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "rgba(212,175,55,0.5)" }}>
                Sign in to get your referral code
              </p>
            )}
          </div>
          <style>{`
            @keyframes referralShine {
              0%, 100% { transform: translateX(-100%); }
              50% { transform: translateX(100%); }
            }
          `}</style>
        </div>

        {/* ═══════════════════════════════════════ SHARE BUTTONS ═══════════════════════════════════════ */}
        <div className="mx-6 mb-4">
          <p className="text-xs uppercase tracking-widest mb-3 text-center" style={{ color: "rgba(212,175,55,0.5)" }}>
            Share via
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              onClick={handleShareTwitter}
              className="flex items-center gap-2 py-3 font-semibold"
              style={{
                background: "linear-gradient(135deg, #1DA1F2, #0d8bd9)",
                color: "#fff",
                border: "none",
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
            </Button>
            <Button
              onClick={handleShareSMS}
              className="flex items-center gap-2 py-3 font-semibold"
              style={{
                background: "linear-gradient(135deg, #34C759, #28a745)",
                color: "#fff",
                border: "none",
              }}
            >
              <MessageCircle size={16} />
              SMS
            </Button>
            <Button
              onClick={handleShareEmail}
              className="flex items-center gap-2 py-3 font-semibold"
              style={{
                background: "linear-gradient(135deg, #FF9500, #e68600)",
                color: "#fff",
                border: "none",
              }}
            >
              <Mail size={16} />
              Email
            </Button>
            <Button
              onClick={handleCopyLink}
              className="flex items-center gap-2 py-3 font-semibold"
              style={{
                background: "linear-gradient(135deg, #6366F1, #4f46e5)",
                color: "#fff",
                border: "none",
              }}
            >
              <Link2 size={16} />
              Copy Link
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ STATS DASHBOARD ═══════════════════════════════════════ */}
        <div className="mx-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: "#D4AF37" }} />
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#D4AF37" }}>
              Your Referral Stats
            </h3>
          </div>
          <div className="flex gap-2">
            <StatCard
              icon="👥"
              value={loading ? "..." : (stats?.totalReferrals ?? 0)}
              label="Total Referrals"
              accent="#D4AF37"
            />
            <StatCard
              icon="🪙"
              value={loading ? "..." : (stats?.coinsEarned ?? 0).toLocaleString()}
              label="Coins Earned"
              accent="#4ADE80"
            />
            <StatCard
              icon="⏳"
              value={loading ? "..." : (stats?.pendingRewards ?? 0)}
              label="Pending"
              accent="#F59E0B"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════ REFERRAL TIERS LIST ═══════════════════════════════════════ */}
        {referrals.length > 0 && (
          <div className="mx-6 mb-4 flex-1 overflow-y-auto" style={{ maxHeight: "200px" }}>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} style={{ color: "#D4AF37" }} />
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#D4AF37" }}>
                Referral Progress
              </h3>
            </div>
            <div>
              {referrals.map((ref) => (
                <ReferralTierItem key={ref.id} referral={ref} />
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ CLAIM CODE INPUT ═══════════════════════════════════════ */}
        <div className="mx-6 mb-4 p-4 rounded-xl" style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
          border: "1px solid rgba(99,102,241,0.3)",
        }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} style={{ color: "#818CF8" }} />
            <h3 className="text-sm font-bold" style={{ color: "#818CF8" }}>
              Have a friend's code?
            </h3>
          </div>
          {showClaimSuccess ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm font-semibold" style={{ color: "#4ADE80" }}>
                Code claimed! Check your coins!
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="flex-1 font-bold tracking-wider text-center"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#F5E6C8",
                  letterSpacing: "0.1em",
                }}
                maxLength={10}
              />
              <Button
                onClick={handleClaimCode}
                disabled={claiming || !claimInput.trim()}
                className="font-bold px-4"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #4f46e5)",
                  color: "#fff",
                }}
              >
                {claiming ? "..." : "Claim"}
              </Button>
            </div>
          )}
          <p className="text-xs mt-2 text-center" style={{ color: "rgba(129,140,248,0.6)" }}>
            Get 500 coins when you use a friend's referral code!
          </p>
        </div>

        {/* ═══════════════════════════════════════ COMING SOON TEASER ═══════════════════════════════════════ */}
        <div className="mx-6 mb-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.1), transparent)",
              border: "1px solid rgba(212,175,55,0.2)",
              color: "rgba(212,175,55,0.7)",
            }}
          >
            <Clock size={14} />
            Coming soon: Cashout your referral earnings for real rewards!
          </div>
        </div>

        {/* ═══════════════════════════════════════ FOOTER ═══════════════════════════════════════ */}
        <div
          className="px-6 py-4 border-t"
          style={{
            borderColor: "rgba(212,175,55,0.1)",
            background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: "rgba(212,175,55,0.4)" }}>
              Share your code to unlock rewards
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-400 hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Hide scrollbar */}
        <style>{`
          [data-slot="dialog-content"] { scrollbar-width: thin; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

// ─── Floating Referral Badge ──────────────────────────────────────────────────
interface FloatingReferralBadgeProps {
  referralCount: number;
  onClick: () => void;
}

export function FloatingReferralBadge({ referralCount, onClick }: FloatingReferralBadgeProps) {
  if (referralCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed top-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full animate-bounce-subtle"
      style={{
        background: "linear-gradient(135deg, #D4AF37, #B8860B)",
        color: "#1a1200",
        boxShadow: "0 0 20px rgba(212,175,55,0.4)",
      }}
    >
      <Gift size={16} />
      <span className="font-bold text-sm">{referralCount} referrals</span>
      <ArrowRight size={14} />
    </button>
  );
}