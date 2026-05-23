/**
 * Rolling in the Dough — Main Game Page
 * Design: Art Deco Opulence (Gilded Bakery)
 * Colors: Midnight Navy, Rich Gold, Amber, Cream
 * Typography: Playfair Display, Oswald, Cormorant Garamond
 */

import { useCallback, useEffect, useRef, useState } from "react";
import SlotMachine from "@/components/SlotMachine";
import GameHeader from "@/components/GameHeader";
import GameFooter from "@/components/GameFooter";
import CoinParticles from "@/components/CoinParticles";
import JackpotOverlay from "@/components/JackpotOverlay";
import CoinShop from "@/components/CoinShop";
import BonusGameOverlay from "@/components/BonusGameOverlay";
// Debug panel removed for production
import CurrencyToggle, { type CurrencyType } from "@/components/CurrencyToggle";
import BottomNavBar from "@/components/BottomNavBar";
import AppFooter from "@/components/AppFooter";
import LoginPromptModal from "@/components/LoginPromptModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";

export default function Home() {
  const {
    coins,
    bet,
    setBet,
    reels,
    spinning,
    winAmount,
    winLines,
    lastWinType,
    freeSpins,
    totalWins,
    spinCount,
    level,
    xp,
    xpToNext,
    autoplay,
    setAutoplay,
    spin,
    jackpotPool,
    soundEnabled,
    setSoundEnabled,
    paylines,
    setPaylines,
    bonusGameType,
    setBonusGameType,
    goldCoins,
    setGoldCoins,
    greenCoins,
    setGreenCoins,
    selectedCurrency,
    setSelectedCurrency,
  } = useGameState();

  const [showJackpot, setShowJackpot] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [coinShopCurrency, setCoinShopCurrency] = useState<'gold' | 'green'>('gold');
  const [freePlayMode, setFreePlayMode] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<CurrencyType>("gold");
  const [externalShowDeals, setExternalShowDeals] = useState(false);
  const [externalShowScratch, setExternalShowScratch] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleCurrencyChange = (currency: CurrencyType) => {
    // If switching to green (Sweeps), check if user is authenticated
    if (currency === "green") {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }
      if (greenCoins === 0) {
        setCoinShopCurrency('green');
        setShowCoinShop(true);
        return;
      }
    }
    setActiveCurrency(currency);
    setSelectedCurrency(currency);
  };
  const [debugStats, setDebugStats] = useState({
    totalSpins: 0,
    totalWins: 0,
    winRate: 0,
    totalCoinsWon: 0,
    totalCoinsBet: 0,
    netProfit: 0,
    rtp: 0,
    cascades: 0,
    bonusGames: 0,
    freeSpinsTriggered: 0,
    jackpotsHit: 0,
  });

  useEffect(() => {
    if (lastWinType === "JACKPOT") {
      setShowJackpot(true);
      setShowParticles(true);
      const t = setTimeout(() => setShowJackpot(false), 6000);
      const t2 = setTimeout(() => setShowParticles(false), 7000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    } else if (winAmount > 0) {
      setShowParticles(true);
      const t = setTimeout(() => setShowParticles(false), 3000);
      return () => clearTimeout(t);
    }
  }, [lastWinType, winAmount, spinCount]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(160deg, #050510 0%, #0a0a1a 40%, #0d0a1a 70%, #050510 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Background hero image overlay */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663349960110/ayNoVaN9cNAqmUHUzZ966J/ritd-hero-bg-FzGNyPyAATYm9thgu9JZxr.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: "#D4AF37",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `coinFall ${Math.random() * 10 + 8}s linear ${Math.random() * 10}s infinite`,
            }}
          />
        ))}
      </div>

      <GameHeader
        coins={selectedCurrency === 'gold' ? goldCoins : greenCoins}
        level={level}
        xp={xp}
        xpToNext={xpToNext}
        totalWins={totalWins}
        jackpotPool={jackpotPool}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Currency Toggle - Compact Tab-Style */}
      <div className="w-full max-w-4xl mx-auto px-4 mb-1 relative z-10 flex justify-center">
        <CurrencyToggle
          selectedCurrency={activeCurrency}
          goldCoins={goldCoins}
          greenCoins={greenCoins}
          onCurrencyChange={handleCurrencyChange}
        />
      </div>



      {/* Huntress Banner - Professional Casino Style */}
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 mb-1 sm:mb-2 relative z-10">
        <div
          className="rounded-lg overflow-hidden shadow-2xl relative"
          style={{
            background: "linear-gradient(135deg, #0d0d20, #1a1a35)",
            border: "2px solid #D4AF37",
            boxShadow: "0 0 30px rgba(212,175,55,0.3), inset 0 0 30px rgba(212,175,55,0.1)",
          }}
        >
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663349960110/ayNoVaN9cNAqmUHUzZ966J/ritd-huntress-banner-GnGRDCVgJWhBE4Xv2oVVHf.webp"
            alt="Rolling in the Dough - Huntress Warrior"
            className="w-full h-auto block"
            style={{ display: "block", maxHeight: "clamp(80px, 20vw, 200px)", objectFit: "cover" }}
          />
          {/* Gradient overlay with game info */}
          <div
            className="absolute inset-0 flex items-end justify-between px-3 py-2"
            style={{
              background: "linear-gradient(to right, rgba(5,5,16,0.85) 0%, transparent 40%, transparent 60%, rgba(5,5,16,0.85) 100%)",
            }}
          >
            <div>
              <div className="font-display font-black text-gold-gradient" style={{ fontSize: "clamp(0.8rem, 2.5vw, 1.2rem)" }}>Huntress Warrior</div>
              <div className="font-numbers text-xs" style={{ color: "rgba(212,175,55,0.7)" }}>3+ Symbols = Bonus Round</div>
            </div>
            <div className="text-right">
              <div className="font-numbers font-bold" style={{ color: "#FF6B6B", fontSize: "clamp(0.7rem, 2vw, 1rem)" }}>🗡️ SCATTER</div>
              <div className="font-numbers text-xs" style={{ color: "rgba(255,107,107,0.7)" }}>Up to 1,000x</div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-2 sm:px-4 py-1 sm:py-3 relative z-10 overflow-hidden">
        <SlotMachine
          reels={reels}
          spinning={spinning}
          winAmount={winAmount}
          winLines={winLines}
          lastWinType={lastWinType}
          freeSpins={freeSpins}
          coins={selectedCurrency === 'gold' ? goldCoins : greenCoins}
          bet={bet}
          setBet={setBet}
          spin={spin}
          autoplay={autoplay}
          setAutoplay={setAutoplay}
          spinCount={spinCount}
          soundEnabled={soundEnabled}
          paylines={paylines}
          setPaylines={setPaylines}
          onCoinShop={() => setShowCoinShop(true)}
          jackpotPool={jackpotPool}
          externalShowDeals={externalShowDeals}
          externalShowScratch={externalShowScratch}
          onDealsClose={() => setExternalShowDeals(false)}
          onScratchClose={() => setExternalShowScratch(false)}
          selectedCurrency={selectedCurrency}
        />
      </main>

      <div className="hidden sm:block"><GameFooter /></div>
      <div className="sm:hidden text-center text-xs text-gray-400 py-1 px-2">Rolling in the Dough © 2026</div>

      {showParticles && <CoinParticles count={lastWinType === "JACKPOT" ? 80 : lastWinType === "BIG_WIN" ? 40 : 20} />}
      {showJackpot && <JackpotOverlay amount={winAmount} onClose={() => setShowJackpot(false)} />}
      {showCoinShop && <CoinShop onClose={() => setShowCoinShop(false)} currency={coinShopCurrency} />}
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      {bonusGameType && (
        <BonusGameOverlay
          gameType={bonusGameType}
          onClose={(reward) => {
            setBonusGameType(null);
            setDebugStats((prev) => ({ ...prev, bonusGames: prev.bonusGames + 1 }));
            // Award bonus game coins to the active currency
            if (reward > 0) {
              if (selectedCurrency === 'gold') {
                setGoldCoins((c) => c + reward);
              } else {
                setGreenCoins((c) => c + reward);
              }
            }
          }}
        />
      )}
      


      {/* Mobile Bottom Navigation */}
      <BottomNavBar
        onShop={() => {
          setCoinShopCurrency('gold');
          setShowCoinShop(true);
        }}
        onRules={() => {
          const btn = document.querySelector('[data-paytable-toggle]');
          if (btn) (btn as HTMLButtonElement).click();
        }}
        onDeals={() => setExternalShowDeals(true)}
        onScratch={() => setExternalShowScratch(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* App Footer */}
      <AppFooter />
    </div>
  );
}
