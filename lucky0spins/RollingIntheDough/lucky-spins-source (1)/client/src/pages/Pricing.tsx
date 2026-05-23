/**
 * Rolling in the Dough — Pricing Page
 * Art Deco gold/navy theme with Square Checkout API integration
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Zap, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Pricing tiers (static display only — actual packages come from DB) ───────
interface PricingTier {
  id: string;
  amount: number;
  coins: number;
  bonus: number;
  popular?: boolean;
  description: string;
}

const PRICING_TIERS: PricingTier[] = [
  { id: "starter", amount: 10, coins: 1000, bonus: 0, description: "Perfect for trying it out" },
  { id: "popular", amount: 30, coins: 3500, bonus: 500, popular: true, description: "Best value — 17% bonus coins" },
  { id: "pro", amount: 100, coins: 12500, bonus: 2500, description: "High roller — 20% bonus coins" },
  { id: "whale", amount: 1000, coins: 150000, bonus: 20000, description: "Ultimate — 13% bonus coins" },
];

export default function Pricing() {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string>("popular");
  const [customAmount, setCustomAmount] = useState(50);
  const [showCustom, setShowCustom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const createCheckout = trpc.shop.createCheckout.useMutation();
  const createCustomCheckout = trpc.shop.createCustomCheckout.useMutation();

  // Fetch packages from DB
  const { data: packages = [] } = trpc.shop.packages.useQuery();

  const handleBuyTier = async (tierId: string) => {
    if (!user) {
      toast.error("Please log in to purchase coins");
      return;
    }

    const tier = PRICING_TIERS.find(t => t.id === tierId);
    const pkg = packages.find(p => p.displayName.toLowerCase().includes(tierId.toLowerCase()));

    if (!tier || !pkg) {
      toast.error("Package not found");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createCheckout.mutateAsync({
        packageId: pkg.id,
      });
      // Redirect to Square Checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create checkout");
      setIsProcessing(false);
    }
  };

  const handleBuyCustom = async () => {
    if (!user) {
      toast.error("Please log in to purchase coins");
      return;
    }

    if (customAmount < 1 || customAmount > 10000) {
      toast.error("Amount must be between $1 and $10,000");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createCustomCheckout.mutateAsync({
        amountUsd: Math.round(customAmount * 100), // Convert to cents
      });
      // Redirect to Square Checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create checkout");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#D4AF37" }}>
          Coin Packages
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          Buy coins to play Sweepstakes or unlock premium features
        </p>
        <p className="text-gray-500 text-sm">
          All purchases are secure and processed through Square
        </p>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-lg border-2 p-6 transition-all ${
                selectedTier === tier.id
                  ? "border-yellow-500 bg-yellow-500/5"
                  : "border-gray-700 hover:border-gray-600 bg-gray-900/30"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Zap size={12} /> POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <div className="text-3xl font-bold mb-1" style={{ color: "#D4AF37" }}>
                  ${tier.amount}
                </div>
                <p className="text-gray-400 text-sm">{tier.description}</p>
              </div>

              <div className="bg-gray-800/50 rounded p-3 mb-4 text-center">
                <div className="text-2xl font-bold text-green-400">{tier.coins + tier.bonus}</div>
                <div className="text-xs text-gray-400">
                  {tier.coins} coins {tier.bonus > 0 && `+ ${tier.bonus} bonus`}
                </div>
              </div>

              <Button
                onClick={() => {
                  setSelectedTier(tier.id);
                  handleBuyTier(tier.id);
                }}
                disabled={isProcessing}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Buy Now"
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Custom Amount Section */}
        <div className="max-w-2xl mx-auto bg-gray-900/50 border-2 border-gray-700 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#D4AF37" }}>
            Custom Amount
          </h2>
          <p className="text-gray-400 mb-6">
            Enter any amount between $1 and $10,000. You'll receive 100 coins per $1 spent.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount (USD)</label>
              <div className="flex gap-2">
                <span className="text-xl font-bold text-gray-400">$</span>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-600 text-white text-lg font-bold"
                  placeholder="50.00"
                />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded p-4">
              <div className="text-sm text-gray-400 mb-1">You will receive:</div>
              <div className="text-2xl font-bold text-green-400">
                {Math.floor(customAmount * 100).toLocaleString()} coins
              </div>
              <div className="text-xs text-gray-500 mt-2">
                At 100 coins per $1
              </div>
            </div>

            <Button
              onClick={handleBuyCustom}
              disabled={customAmount < 1 || customAmount > 10000 || isProcessing}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-6 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Buy ${Math.floor(customAmount * 100).toLocaleString()} Coins`
              )}
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: "#D4AF37" }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Is my payment secure?",
                a: "Yes, all payments are processed through Square, a PCI-DSS compliant payment processor. Your card information is never stored on our servers.",
              },
              {
                q: "When will I receive my coins?",
                a: "Coins are credited instantly after successful payment. You'll be redirected back to the game to start playing immediately.",
              },
              {
                q: "Can I get a refund?",
                a: "Refunds are available within 30 days of purchase. Contact our support team for assistance.",
              },
              {
                q: "What's the difference between Gold and Sweeps coins?",
                a: "Gold coins are for free play with no real cash value. Sweeps coins can be purchased and cashed out for real money.",
              },
              {
                q: "Do you offer bulk discounts?",
                a: "Yes! Larger packages offer better value. The $1,000 package gives you 13% bonus coins.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-l-2 border-yellow-600/50 pl-4 py-2">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Check size={16} style={{ color: "#D4AF37" }} />
                  {faq.q}
                </h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center border-t border-gray-800 mt-12">
        <h2 className="text-2xl font-bold mb-4">Ready to play?</h2>
        <Link href="/">
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-6 text-lg">
            Back to Game
          </Button>
        </Link>
      </div>
    </div>
  );
}
