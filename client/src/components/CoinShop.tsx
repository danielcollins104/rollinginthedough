/**
 * CoinShop - Premium Purchase Experience
 * High-end mobile game purchase screen aesthetic
 * Features: Quick-buy presets, first-purchase bonus, daily deals, carousel, animations
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Sparkles, Zap, Gift, Timer, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { CoinPackageCard } from "./CoinPackageCard";
import { PurchaseConfirmModal } from "./PurchaseConfirmModal";
import { ConfettiEffect } from "./ConfettiEffect";
import { CountdownTimer } from "./CountdownTimer";

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

// Premium coin packages as specified
const PREMIUM_PACKAGES: Omit<CoinPackage, "id">[] = [
  { displayName: "Pocket Change", coins: 80, bonus: 0, priceUsd: 0.99 },
  { displayName: "Getting Started", coins: 500, bonus: 50, priceUsd: 4.99 },
  { displayName: "Starter Pack", coins: 1200, bonus: 120, priceUsd: 9.99 },
  { displayName: "Best Value", coins: 3000, bonus: 300, priceUsd: 19.99, },
  { displayName: "High Roller", coins: 8000, bonus: 800, priceUsd: 49.99 },
  { displayName: "Whale Pack", coins: 20000, bonus: 2000, priceUsd: 99.99 },
];

// Dynamic daily deal - in production this would come from server
function getDailyDeal(): CoinPackage & { originalPriceUsd: number; endsAt: Date } {
  // Rotate deal based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const dealIndex = dayOfYear % PREMIUM_PACKAGES.length;
  const pkg = PREMIUM_PACKAGES[dealIndex];
  
  // Daily deal is 50% off the middle package
  return {
    id: -1,
    displayName: pkg.displayName,
    coins: pkg.coins,
    bonus: pkg.bonus,
    priceUsd: pkg.priceUsd * 0.5,
    originalPriceUsd: pkg.priceUsd,
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  };
}

export default function CoinShop({ onClose, currency = "gold" }: CoinShopProps) {
  const { user } = useAuth();
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFirstPurchaseConfetti, setShowFirstPurchaseConfetti] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const accentColor = currency === "green" ? "#90EE90" : "#D4AF37";
  
  // First purchase detection
  const [isFirstPurchase, setIsFirstPurchase] = useState(false);
  useEffect(() => {
    const purchased = localStorage.getItem("hasPurchasedCoins");
    setIsFirstPurchase(purchased !== "true");
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Daily deal
  const dailyDeal = getDailyDeal();

  // Check scrollability
  const updateScrollState = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  // Scroll carousel
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // tRPC mutations
  const createCheckout = trpc.shop.createCheckout.useMutation();
  const createCustomCheckout = trpc.shop.createCustomCheckout.useMutation();

  // Find best value package (the 3000 coins one)
  const bestValueId = PREMIUM_PACKAGES.findIndex(p => p.displayName === "Best Value") + 1;

  // Handle package selection
  const handleSelectPackage = (id: number) => {
    setSelectedPackageId(id);
    setShowConfirmModal(true);
  };

  // Handle purchase confirmation
  const handleConfirmPurchase = async () => {
    if (!user) return;

    const selectedPkg = PREMIUM_PACKAGES[selectedPackageId! - 1];
    if (!selectedPkg) return;

    setIsProcessing(true);
    setError(null);

    try {
      // For custom amounts (daily deal), use custom checkout
      if (selectedPackageId === -1) {
        const result = await createCustomCheckout.mutateAsync({
          amountUsd: Math.round(dailyDeal.priceUsd * 100),
        });
        window.location.href = result.checkoutUrl;
      } else {
        const result = await createCheckout.mutateAsync({
          packageId: selectedPackageId!,
        });
        window.location.href = result.checkoutUrl;
      }

      // Mark first purchase done
      localStorage.setItem("hasPurchasedCoins", "true");
      setIsFirstPurchase(false);

      // Show confetti
      setShowFirstPurchaseConfetti(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create checkout");
      setIsProcessing(false);
      throw err; // Re-throw to keep modal open
    }
  };

  // Get selected package for modal
  const getSelectedPackage = () => {
    if (selectedPackageId === -1) {
      return {
        name: dailyDeal.displayName,
        coins: dailyDeal.coins,
        bonus: isFirstPurchase ? dailyDeal.bonus * 2 : dailyDeal.bonus,
        price: dailyDeal.priceUsd,
      };
    }
    const pkg = PREMIUM_PACKAGES[selectedPackageId! - 1];
    return {
      name: pkg?.displayName || "",
      coins: pkg?.coins || 0,
      bonus: isFirstPurchase ? (pkg?.bonus || 0) * 2 : (pkg?.bonus || 0),
      price: (pkg?.priceUsd || 0) / 100,
    };
  };

  // Auth check
  if (!user) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-b from-slate-900 to-slate-950 border-yellow-600 text-white">
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-yellow-300 mb-2">Please Log In</h2>
            <p className="text-gray-400 mb-4">You must be logged in to purchase coins.</p>
            <Button 
              onClick={onClose} 
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedPkgInfo = getSelectedPackage();

  return (
    <>
      {/* First purchase confetti */}
      <ConfettiEffect 
        active={showFirstPurchaseConfetti} 
        intensity="medium"
        onComplete={() => setShowFirstPurchaseConfetti(false)}
      />

      {/* Confirmation modal */}
      <PurchaseConfirmModal
        isOpen={showConfirmModal}
        packageName={selectedPkgInfo.name}
        coinAmount={selectedPkgInfo.coins}
        bonusAmount={selectedPkgInfo.bonus}
        priceUsd={selectedPkgInfo.price}
        isFirstPurchase={isFirstPurchase}
        onConfirm={handleConfirmPurchase}
        onCancel={() => {
          setShowConfirmModal(false);
          setIsProcessing(false);
        }}
        accentColor={accentColor}
        currency={currency}
      />

      {/* Main CoinShop Modal */}
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent 
          className="bg-gradient-to-b from-slate-900 via-slate-800/95 to-slate-950 border-yellow-600/50 text-white p-0 max-w-2xl max-h-[95vh] overflow-hidden flex flex-col"
          style={{ boxShadow: `0 0 60px ${accentColor}20` }}
        >
          {/* ═══════════════════════════════════════ HEADER ═══════════════════════════════════════ */}
          <div className="relative px-6 pt-6 pb-4">
            {/* Background decoration */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 50%)`,
              }}
            />

            {/* Top row: Title and first purchase badge */}
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
                    boxShadow: `0 0 20px ${accentColor}40`
                  }}
                >
                  {currency === "green" ? (
                    <Zap size={24} className="text-black" />
                  ) : (
                    <Sparkles size={24} className="text-black" />
                  )}
                </div>
                <div>
                  <h2 
                    className="text-2xl font-black tracking-tight"
                    style={{ 
                      fontFamily: "'Oswald', sans-serif",
                      color: accentColor,
                      textShadow: `0 0 20px ${accentColor}40`
                    }}
                  >
                    {currency === "green" ? "Sweeps Coins" : "Gold Coins"}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {currency === "green" ? "For fun play" : "Premium currency"}
                  </p>
                </div>
              </div>

              {/* First purchase badge */}
              {isFirstPurchase && (
                <div 
                  className="px-3 py-1.5 rounded-full text-xs font-bold animate-pulse"
                  style={{ 
                    background: `linear-gradient(135deg, #D4AF37, #F5E6C8)`,
                    color: "#1a1200",
                    boxShadow: `0 0 15px ${accentColor}60`
                  }}
                >
                  <Gift size={12} className="inline mr-1" />
                  FIRST PURCHASE 2X BONUS
                </div>
              )}
            </div>

            {/* Google/Apple Pay buttons (mobile) */}
            {isMobile && (
              <div className="flex gap-2 mb-4">
                <Button 
                  className="flex-1 bg-white text-gray-800 hover:bg-gray-100 font-semibold"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Google Pay
                </Button>
                <Button 
                  className="flex-1 bg-black text-white hover:bg-gray-900 font-semibold"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple Pay
                </Button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════ FIRST PURCHASE BANNER ═══════════════════════════════════════ */}
          {isFirstPurchase && (
            <div 
              className="mx-6 mb-4 p-4 rounded-xl relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))",
                border: "2px solid #D4AF37",
                boxShadow: `0 0 30px ${accentColor}30`
              }}
            >
              {/* Animated shine */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.1) 50%, transparent 80%)",
                  animation: "shine 3s ease-in-out infinite",
                }}
              />

              <div className="relative flex items-center gap-4">
                <div className="text-4xl">🎁</div>
                <div className="flex-1">
                  <p 
                    className="text-lg font-black mb-1"
                    style={{ 
                      color: accentColor,
                      fontFamily: "'Oswald', sans-serif"
                    }}
                  >
                    DOUBLE YOUR COINS!
                  </p>
                  <p className="text-sm text-amber-200/70">
                    First purchase gets 2x bonus on all packages
                  </p>
                </div>
                <div className="text-2xl animate-bounce">✨</div>
              </div>

              <style>{`
                @keyframes shine {
                  0%, 100% { transform: translateX(-100%); }
                  50% { transform: translateX(100%); }
                }
              `}</style>
            </div>
          )}

          {/* ═══════════════════════════════════════ DAILY DEAL ═══════════════════════════════════════ */}
          <div 
            className="mx-6 mb-4 p-4 rounded-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
              border: "2px solid #EF4444",
              boxShadow: "0 0 30px rgba(239,68,68,0.2)"
            }}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: "radial-gradient(circle at 50% 50%, #EF4444, transparent 70%)",
              }}
            />

            <div className="relative flex items-center justify-between gap-4">
              {/* Deal content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{ 
                      background: "linear-gradient(135deg, #EF4444, #DC2626)",
                      color: "#fff"
                    }}
                  >
                    🔥 DEAL OF THE DAY
                  </span>
                </div>
                <div 
                  className="text-2xl font-black mb-1"
                  style={{ 
                    fontFamily: "'Oswald', sans-serif",
                    color: "#fff"
                  }}
                >
                  {(dailyDeal.coins + (isFirstPurchase ? dailyDeal.bonus * 2 : dailyDeal.bonus)).toLocaleString()} Coins
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 line-through text-sm">
                    ${dailyDeal.originalPriceUsd.toFixed(2)}
                  </span>
                  <span 
                    className="text-xl font-black"
                    style={{ 
                      fontFamily: "'Oswald', sans-serif",
                      color: "#4ADE80"
                    }}
                  >
                    ${dailyDeal.priceUsd.toFixed(2)}
                  </span>
                  <span className="text-xs text-red-400 font-semibold">
                    SAVE 50%
                  </span>
                </div>
              </div>

              {/* Countdown timer */}
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Timer size={12} />
                  Time left
                </div>
                <CountdownTimer 
                  endTime={dailyDeal.endsAt}
                  onExpire={() => {
                    // In production, refresh the deal
                    window.location.reload();
                  }}
                />
              </div>
            </div>

            {/* Buy button for daily deal */}
            <Button
              onClick={() => {
                setSelectedPackageId(-1);
                setShowConfirmModal(true);
              }}
              className="w-full mt-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold"
              style={{}}
            >
              <span className="flex items-center gap-2">
                <Zap size={16} />
                Grab This Deal
              </span>
            </Button>
          </div>

          {/* ═══════════════════════════════════════ CAROUSEL CONTROLS ═══════════════════════════════════════ */}
          {!isMobile && (
            <div className="px-6 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                All Packages
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => scrollCarousel("left")}
                  disabled={!canScrollLeft}
                  className="border-gray-700 hover:bg-gray-800 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => scrollCarousel("right")}
                  disabled={!canScrollRight}
                  className="border-gray-700 hover:bg-gray-800 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ PACKAGES CAROUSEL ═══════════════════════════════════════ */}
          <div className="relative flex-1 overflow-hidden">
            {/* Gradient fade edges (desktop) */}
            {!isMobile && (
              <>
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-800 to-transparent z-10 pointer-events-none" />
                )}
                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-800 to-transparent z-10 pointer-events-none" />
                )}
              </>
            )}

            {/* Scrollable container */}
            <div
              ref={carouselRef}
              onScroll={updateScrollState}
              className={`
                flex gap-4 px-6 pb-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory
                ${isMobile ? "py-2" : "py-2"}
              `}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Package cards */}
              {PREMIUM_PACKAGES.map((pkg, index) => {
                const isSelected = selectedPackageId === index + 1;
                return (
                  <div 
                    key={index}
                    className="flex-shrink-0"
                    style={{ 
                      width: isMobile ? "75%" : "180px",
                      scrollSnapAlign: "center"
                    }}
                  >
                    <CoinPackageCard
                      id={index + 1}
                      coins={pkg.coins}
                      bonus={pkg.bonus}
                      priceUsd={pkg.priceUsd / 100}
                      isBestValue={index + 1 === bestValueId}
                      isSelected={isSelected}
                      onSelect={handleSelectPackage}
                      accentColor={accentColor}
                      currency={currency}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peek hint for mobile */}
          {isMobile && (
            <div className="px-6 pb-2 text-center">
              <p className="text-xs text-gray-500">← Swipe to see more packages →</p>
            </div>
          )}

          {/* ═══════════════════════════════════════ FOOTER ═══════════════════════════════════════ */}
          <div 
            className="px-6 py-4 border-t border-white/10"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)"
            }}
          >
            {/* Error display */}
            {error && (
              <div className="mb-3 p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Quick buy info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CreditCard size={14} />
                Secure checkout powered by Square
              </div>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-400 hover:bg-gray-800"
              >
                Maybe Later
              </Button>
            </div>
          </div>

          {/* Hide default Radix close button */}
          <style>{`
            [data-slot="dialog-close"] { display: none !important; }
          `}</style>
        </DialogContent>
      </Dialog>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}