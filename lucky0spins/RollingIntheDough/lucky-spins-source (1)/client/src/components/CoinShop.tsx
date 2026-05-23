/**
 * Coin Shop - Purchase coins using Square Checkout API
 * Redirects to Square's hosted checkout page (HTTPS)
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
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

export default function CoinShop({ onClose, currency = "gold" }: CoinShopProps) {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [customAmountUsd, setCustomAmountUsd] = useState(10);
  const [customCoins, setCustomCoins] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accentColor = currency === "green" ? "#90EE90" : "#D4AF37";
  const buttonBg = currency === "green" ? "#90EE90" : "#D4AF37";

  // Fetch coin packages
  const { data: packages = [] } = trpc.shop.packages.useQuery();
  const createCheckout = trpc.shop.createCheckout.useMutation();
  const createCustomCheckout = trpc.shop.createCustomCheckout.useMutation();

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  // Handle custom amount change
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usd = parseFloat(e.target.value) || 0;
    setCustomAmountUsd(usd);
    setCustomCoins(Math.floor(usd * 100)); // 100 coins per $1
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

      // Redirect to Square Checkout
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
        amountUsd: Math.round(customAmountUsd * 100), // Convert to cents
      });

      // Redirect to Square Checkout
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
      <DialogContent className="bg-gradient-to-b from-slate-900 to-slate-950 border-yellow-600 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: accentColor }}>
            {currency === "green" ? "Buy Sweeps Coins" : "Buy Gold Coins"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600 rounded text-red-300 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!isCustomPayment ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Select a package:</p>
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`w-full p-3 rounded border-2 transition-all text-left ${
                  selectedPackage === pkg.id
                    ? `border-[${accentColor}] bg-opacity-20`
                    : "border-gray-600 hover:border-gray-400"
                }`}
                style={{
                  borderColor: selectedPackage === pkg.id ? accentColor : undefined,
                  backgroundColor: selectedPackage === pkg.id ? `${accentColor}20` : undefined,
                }}
              >
                <div className="font-bold" style={{ color: accentColor }}>
                  {pkg.displayName}
                </div>
                <div className="text-sm text-gray-400">
                  {pkg.coins + pkg.bonus} coins {pkg.bonus > 0 && `(+${pkg.bonus} bonus)`}
                </div>
                <div className="text-sm font-semibold" style={{ color: accentColor }}>
                  ${(pkg.priceUsd / 100).toFixed(2)}
                </div>
              </button>
            ))}

            <button
              onClick={() => setIsCustomPayment(true)}
              className="w-full p-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Or enter a custom amount
            </button>

            <Button
              onClick={handleBuyPackage}
              disabled={!selectedPkg || isProcessing}
              className="w-full mt-4"
              style={{ backgroundColor: buttonBg, color: "#000" }}
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

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-900"
            >
              Maybe Later
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Enter amount ($1 - $10,000):</p>
            <div className="space-y-2">
              <Input
                type="number"
                min="1"
                max="10000"
                step="0.01"
                value={customAmountUsd}
                onChange={handleCustomAmountChange}
                className="bg-slate-800 border-gray-600 text-white"
                placeholder="Enter amount in USD"
              />
              <div className="text-sm text-gray-400">
                You will receive: <span style={{ color: accentColor }}>{customCoins.toLocaleString()} coins</span>
              </div>
            </div>

            <Button
              onClick={handleBuyCustom}
              disabled={customAmountUsd < 1 || isProcessing}
              className="w-full mt-4"
              style={{ backgroundColor: buttonBg, color: "#000" }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Buy ${customCoins.toLocaleString()} Coins`
              )}
            </Button>

            <Button
              onClick={() => {
                setIsCustomPayment(false);
                setSelectedPackage(null);
              }}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-900"
            >
              Back to Packages
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-900"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center mt-4 pb-4">
          You will be redirected to Square's secure checkout page
        </div>
      </DialogContent>
    </Dialog>
  );
}
