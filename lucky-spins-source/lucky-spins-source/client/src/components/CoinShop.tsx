/**
 * Coin Shop - Purchase coins using Square Checkout API
 * Redirects to Square's hosted checkout page (HTTPS)
 * Features: First-purchase bonus, daily deals, quick-buy presets
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Sparkles, Zap, Gift, Timer } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface CoinPackage {
  id: number;
  displayName: string;
  coins: number;
  bonus: number;
  priceUsd: number;
}

interface CoinShopProps {
  onClose: () => void;
  currency?: "gold" | "green";
}

const QUICK_BUY_PRESETS = [
  { label: "Starter", amount: 5, coins: 500, bonus: 50 },
  { label: "Popular", amount: 20, coins: 2000, bonus: 500, badge: "BEST VALUE" },
  { label: "Pro", amount: 50, coins: 5000, bonus: 1500 },
  { label: "High Roller", amount: 100, coins: 12000, bonus: 4000 },
];

const DAILY_DEALS = [
  { label: "Daily Deal", originalPrice: 9.99, salePrice: 4.99, coins: 1000, bonus: 250, endsIn: "2h" },
  { label: "Flash Sale", originalPrice: 19.99, salePrice: 9.99, coins: 2500, bonus: 750, endsIn: "45m" },
];

export default function CoinShop({ onClose, currency = "gold" }: CoinShopProps) {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [customAmountUsd, setCustomAmountUsd] = useState(10);
  const [customCoins, setCustomCoins] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"packages" | "deals" | "quick">("packages");
  const [firstPurchaseDone, setFirstPurchaseDone] = useState(false);

  const accentColor = currency === "green" ? "#90EE90" : "#D4AF37";
  const buttonBg = currency === "green" ? "#90EE90" : "#D4AF37";

  // Check first purchase status
  useEffect(() => {
    const purchased = localStorage.getItem("hasPurchasedCoins");
    setFirstPurchaseDone(purchased === "true");
  }, []);

  // Fetch coin packages
  const { data: packages = [] } = trpc.shop.packages.useQuery();
  const createCheckout = trpc.shop.createCheckout.useMutation();
  const createCustomCheckout = trpc.shop.createCustomCheckout.useMutation();

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  // Handle custom amount change
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usd = parseFloat(e.target.value) || 0;
    setCustomAmountUsd(usd);
    setCustomCoins(Math.floor(usd * 100));
  };

  // Handle package purchase
  const handleBuyPackage = async () => {
    if (!selectedPkg || !user) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await createCheckout.mutateAsync({
        packageId: selectedPkg.id,
      });

      // Mark first purchase done
      localStorage.setItem("hasPurchasedCoins", "true");

      // Redirect to Square Checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checkout");
      setIsProcessing(false);
    }
  };

  // Handle quick buy preset
  const handleQuickBuy = async (preset: typeof QUICK_BUY_PRESETS[0]) => {
    if (!user) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await createCustomCheckout.mutateAsync({
        amountUsd: Math.round(preset.amount * 100),
      });

      localStorage.setItem("hasPurchasedCoins", "true");
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checkout");
      setIsProcessing(false);
    }
  };

  // Handle custom amount purchase
  const handleBuyCustom = async () => {
    if (!user || customAmountUsd < 1) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await createCustomCheckout.mutateAsync({
        amountUsd: Math.round(customAmountUsd * 100),
      });

      localStorage.setItem("hasPurchasedCoins", "true");
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checkout");
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-b from-slate-900 to-slate-950 border-yellow-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-300">Please Log In</DialogTitle>
          </DialogHeader>
          <p className="text-gray-300">You must be logged in to purchase coins.</p>
          <Button onClick={onClose} className="w-full bg-yellow-600 hover:bg-yellow-700">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border-yellow-600 text-white max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with tabs */}
        <DialogHeader className="pb-0">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle style={{ color: accentColor }} className="flex items-center gap-2">
              {currency === "green" ? (
                <>
                  <Zap size={20} style={{ color: accentColor }} />
                  Buy Sweeps Coins
                </>
              ) : (
                <>
                  <Sparkles size={20} style={{ color: accentColor }} />
                  Buy Gold Coins
                </>
              )}
            </DialogTitle>
            {!firstPurchaseDone && (
              <div
                className="px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse"
                style={{ background: "linear-gradient(135deg, #D4AF37, #F5E6C8)", color: "#1a1200" }}
              >
                <Gift size={12} /> FIRST PURCHASE BONUS
              </div>
            )}
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
            {[
              { key: "packages", label: "Packages" },
              { key: "deals", label: "Daily Deals" },
              { key: "quick", label: "Quick Buy" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "text-slate-900"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                style={{
                  background: activeTab === tab.key ? accentColor : "transparent",
                }}
              >
                {tab.label}
                {tab.key === "deals" && (
                  <span className="ml-1 text-xs opacity-70">🔥</span>
                )}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600 rounded text-red-300 text-sm mx-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

          {/* PACKAGES TAB */}
          {activeTab === "packages" && (
            <>
              {!firstPurchaseDone && (
                <div
                  className="p-3 rounded-lg border-2"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
                    borderColor: "#D4AF37",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🎁</div>
                    <div>
                      <p className="text-yellow-300 font-bold text-sm">First Purchase Bonus!</p>
                      <p className="text-amber-200/70 text-xs">Get up to 100% bonus on your first purchase!</p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-400">Select a package:</p>
              {packages.map((pkg) => {
                const totalCoins = pkg.coins + pkg.bonus;
                const perDollar = (totalCoins / (pkg.priceUsd / 100)).toFixed(1);
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className="w-full p-3 rounded-lg border-2 transition-all text-left relative overflow-hidden"
                    style={{
                      borderColor: selectedPackage === pkg.id ? accentColor : "#334155",
                      background: selectedPackage === pkg.id ? `${accentColor}15` : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {/* Best value badge */}
                    {pkg.bonus > pkg.coins * 0.5 && (
                      <div
                        className="absolute top-0 right-0 px-2 py-0.5 text-xs font-bold rounded-bl-lg"
                        style={{ background: "linear-gradient(135deg, #D4AF37, #F5E6C8)", color: "#1a1200" }}
                      >
                        BEST VALUE
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold" style={{ color: accentColor }}>
                          {pkg.displayName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {totalCoins.toLocaleString()} coins
                        </div>
                        {pkg.bonus > 0 && (
                          <div className="text-xs" style={{ color: "#4ADE80" }}>
                            +{pkg.bonus.toLocaleString()} bonus
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: accentColor }}>
                          ${(pkg.priceUsd / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">{perDollar}/$</div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setIsCustomPayment(true)}
                className="w-full p-2 text-sm text-gray-400 hover:text-gray-300 transition-colors border border-dashed border-gray-600 rounded-lg"
              >
                Or enter a custom amount
              </button>

              <Button
                onClick={handleBuyPackage}
                disabled={!selectedPkg || isProcessing}
                className="w-full mt-2"
                style={{ backgroundColor: buttonBg, color: "#000" }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    Buy Now
                  </>
                )}
              </Button>
            </>
          )}

          {/* DEALS TAB */}
          {activeTab === "deals" && (
            <>
              <div className="text-center py-2">
                <p className="text-yellow-300 text-sm flex items-center justify-center gap-2">
                  <Timer size={14} /> Limited Time Offers
                </p>
              </div>

              {DAILY_DEALS.map((deal, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))",
                    borderColor: "#EF4444",
                  }}
                >
                  {/* Countdown badge */}
                  <div
                    className="absolute top-0 right-0 px-2 py-0.5 text-xs font-bold rounded-bl-lg"
                    style={{ background: "#EF4444", color: "#fff" }}
                  >
                    ⏰ {deal.endsIn}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-red-400 font-bold">{deal.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {(deal.coins + deal.bonus).toLocaleString()}
                        <span className="text-sm text-gray-400 ml-1">coins</span>
                      </p>
                      <p className="text-xs text-green-400">+{deal.bonus} bonus</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 line-through text-sm">
                        ${deal.originalPrice.toFixed(2)}
                      </p>
                      <p className="text-2xl font-bold text-green-400">
                        ${deal.salePrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-red-400">SAVE {Math.round((1 - deal.salePrice / deal.originalPrice) * 100)}%</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      // Quick purchase at deal price
                      setCustomAmountUsd(deal.salePrice);
                      setCustomCoins(deal.coins + deal.bonus);
                      setIsCustomPayment(true);
                    }}
                    className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                    style={{}}
                  >
                    Grab This Deal
                  </Button>
                </div>
              ))}

              <div className="text-center py-3 text-gray-500 text-xs">
                ✨ New deals added daily! Check back tomorrow for more offers ✨
              </div>
            </>
          )}

          {/* QUICK BUY TAB */}
          {activeTab === "quick" && (
            <>
              {!firstPurchaseDone && (
                <div
                  className="p-3 rounded-lg border-2 text-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.02))",
                    borderColor: "#4ADE80",
                  }}
                >
                  <p className="text-green-400 font-bold text-sm">🎁 First-Time Buyer Offer</p>
                  <p className="text-green-300/70 text-xs">Get 20% extra coins on any quick buy!</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {QUICK_BUY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleQuickBuy(preset)}
                    disabled={isProcessing}
                    className="p-3 rounded-lg border-2 text-center transition-all hover:scale-[1.02] relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02))",
                      borderColor: preset.badge ? "#D4AF37" : "#334155",
                    }}
                  >
                    {preset.badge && (
                      <div
                        className="absolute top-0 left-0 right-0 text-xs font-bold py-0.5"
                        style={{ background: "linear-gradient(90deg, #D4AF37, #F5E6C8)", color: "#1a1200" }}
                      >
                        {preset.badge}
                      </div>
                    )}
                    <div className="font-bold text-lg" style={{ color: accentColor }}>
                      ${preset.amount}
                    </div>
                    <div className="text-white font-semibold">
                      {(preset.coins + preset.bonus).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">coins</div>
                    <div className="text-xs mt-1" style={{ color: "#4ADE80" }}>
                      +{preset.bonus} bonus
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-3 mt-3">
                <p className="text-sm text-gray-400 mb-2">Or enter custom amount:</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    step="0.01"
                    value={customAmountUsd}
                    onChange={handleCustomAmountChange}
                    className="bg-slate-800 border-gray-600 text-white flex-1"
                    placeholder="$ Amount"
                  />
                  <Button
                    onClick={handleBuyCustom}
                    disabled={customAmountUsd < 1 || isProcessing}
                    className="px-4"
                    style={{ backgroundColor: buttonBg, color: "#000" }}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Buy"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive: {customCoins.toLocaleString()} coins
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Sparkles size={12} />
            Secure checkout powered by Square
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-2 border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}