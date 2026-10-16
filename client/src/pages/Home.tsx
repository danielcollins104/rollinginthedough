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
import CurrencyToggle, { type CurrencyType } from "@/components/CurrencyToggle";
import BottomNavBar from "@/components/BottomNavBar";
import LoginPromptModal from "@/components/LoginPromptModal";
import DailyBonusModal from "@/components/DailyBonusModal";
import OnboardingTutorial, { hasSeenIntro } from "@/components/OnboardingTutorial";
import { runPromotions } from "@/lib/promotions";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { useRetention } from "@/hooks/useRetention";
import { DailyLoginBonus } from "@/components/DailyLoginBonus";
import { DailyStreakDisplay } from "@/components/DailyStreakDisplay";
import { LevelUp } from "@/components/LevelUp";
import CitySkylineScene from "@/components/CitySkylineScene";
import { Missions } from "@/components/Missions";
import { SessionTimeReward } from "@/components/SessionTimeReward";
import ReferralScreen, { FloatingReferralBadge } from "@/components/ReferralScreen";
import { Toasts } from "@/components/Toasts";
import PracticeBoard from "@/components/PracticeBoard";
import DebugOverlay from "@/components/DebugOverlay";


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
    consecutiveWins,
    maxStreak,
    rescueOffered,
    autoplay,
    setAutoplay,
    spin,
    triggerDemoSpin,
    jackpotPool,
    soundEnabled,
    setSoundEnabled,
    paylines,
    setPaylines,
    bonusGameType,
    setBonusGameType,
    stickyBonus,
    stickyBonusSpinning,
    debugStats,
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
  const [activeCurrency, setActiveCurrency] = useState<CurrencyType>("gold");
  const [externalShowDeals, setExternalShowDeals] = useState(false);
  const [externalShowScratch, setExternalShowScratch] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [dailyBonusStreak, setDailyBonusStreak] = useState(1);
  const { isAuthenticated } = useAuth();

  // Retention hooks
  const {
    currentStreak,
    level: retentionLevel,
    xp: retentionXp,
    xpToNext: retentionXpToNext,
    lifetimeXp,
    missions,
    todayClaimed,
    shouldShowDailyLogin,
    claimDailyBonus,
    recordSpin,
    recordBonus,
    recordSpinWin,
    addXp,
    claimMissionReward,
    checkSessionReward,
  } = useRetention();

  const [showDailyLoginBonus, setShowDailyLoginBonus] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showSessionReward, setShowSessionReward] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showBoard, setShowBoard] = useState(false);

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

  // Show the how-to-play tutorial once per browser, before anything else.
  useEffect(() => {
    if (!hasSeenIntro()) {
      const t = setTimeout(() => setShowIntro(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Evaluate the local promotion schedule a few seconds after load so
  // promos don't collide with the onboarding / daily-bonus modals.
  useEffect(() => {
    const t = setTimeout(() => runPromotions(1), 4000);
    return () => clearTimeout(t);
  }, []);

  // Show daily login bonus modal on app open (once per day)
  useEffect(() => {
    if (shouldShowDailyLogin) {
      // Small delay for UX
      const t = setTimeout(() => {
        setShowDailyLoginBonus(true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [shouldShowDailyLogin]);

  // Check for 30-min session reward periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (checkSessionReward()) {
        setShowSessionReward(true);
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [checkSessionReward]);

  // Record game events for missions and XP
  useEffect(() => {
    if (spinCount > 0) {
      recordSpin();
    }
  }, [spinCount, recordSpin]);

  useEffect(() => {
    if (lastWinType === "HUNTRESS_BONUS") {
      recordBonus();
    }
  }, [lastWinType, recordBonus]);

  useEffect(() => {
    if (winAmount > 0) {
      recordSpinWin(winAmount);
      addXp(Math.floor(winAmount / 10));
    }
  }, [winAmount, recordSpinWin, addXp]);

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
      className="flex flex-col min-h-screen"
      style={{
        // Pirate's Gold night-city palette — deep purple-black with the
        // neon skyline scene layered behind the play area.
        background:
          "linear-gradient(180deg, #07030f 0%, #12061f 30%, #0c0518 60%, #050209 100%)",
      }}
    >
      {/* Neon city skyline + water reflections (procedural SVG, no assets) */}
      <CitySkylineScene opacity={1} className="absolute inset-0" />

      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

      {/* Desktop header — on mobile the glass header inside the cabinet
          carries the logo + GC/SC balances + daily bonus instead. Sign-in on
          mobile lives in the bottom MENU tray. */}
      <div className="hidden sm:block relative z-10">
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
      </div>

      {/* Currency Toggle - Compact Tab-Style */}
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-4 relative z-10" style={{ paddingTop: "2px", paddingBottom: "2px" }}>
        <CurrencyToggle
          selectedCurrency={activeCurrency}
          goldCoins={goldCoins}
          greenCoins={greenCoins}
          onCurrencyChange={handleCurrencyChange}
        />
      </div>



      {/* Main Slot Machine Area */}
      <main className="flex-grow flex items-start justify-center px-1 py-2 relative z-10">
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
          triggerDemoSpin={triggerDemoSpin}
          autoplay={autoplay}
          setAutoplay={setAutoplay}
          spinCount={spinCount}
          soundEnabled={soundEnabled}
          consecutiveWins={consecutiveWins}
          maxStreak={maxStreak}
          rescueOffered={rescueOffered}
          paylines={paylines}
          setPaylines={setPaylines}
          onCoinShop={() => setShowCoinShop(true)}
          jackpotPool={jackpotPool}
          externalShowDeals={externalShowDeals}
          externalShowScratch={externalShowScratch}
          onDealsClose={() => setExternalShowDeals(false)}
          onScratchClose={() => setExternalShowScratch(false)}
          onScratchWin={(amount) => setGoldCoins((c) => c + amount)}
          selectedCurrency={selectedCurrency}
          goldCoins={goldCoins}
          greenCoins={greenCoins}
          stickyBonus={stickyBonus}
          stickyBonusSpinning={stickyBonusSpinning}
          onDailyBonus={() => setShowDailyBonus(true)}
          level={level}
          xp={xp}
          xpToNext={xpToNext}
        />
      </main>

      <div className="hidden sm:block"><GameFooter /></div>
      <div className="sm:hidden text-center text-xs text-gray-400 py-0.5 px-2">Rolling in the Dough © 2026</div>
      {showParticles && <CoinParticles count={lastWinType === "JACKPOT" ? 80 : lastWinType === "BIG_WIN" ? 40 : 20} />}
      {showJackpot && <JackpotOverlay amount={winAmount} onClose={() => setShowJackpot(false)} />}
      {showCoinShop && <CoinShop onClose={() => setShowCoinShop(false)} currency={coinShopCurrency} />}
      {showDailyBonus && (
        <DailyBonusModal
          streak={dailyBonusStreak}
          onClose={(coins) => {
            localStorage.setItem("lastDailyBonus", Date.now().toString());
            // Update streak if they claimed (simple version)
            const newStreak = Math.min(dailyBonusStreak + 1, 7);
            localStorage.setItem("dailyStreak", newStreak.toString());
            setDailyBonusStreak(newStreak);
            if (selectedCurrency === 'gold') {
              setGoldCoins((c) => c + coins);
            } else {
              setGreenCoins((c) => c + coins);
            }
            setShowDailyBonus(false);
          }}
        />
      )}
      
      {/* Retention overlays */}
      {showDailyLoginBonus && (
        <DailyLoginBonus
          currentStreak={currentStreak}
          onClaim={() => {
            const reward = claimDailyBonus();
            if (selectedCurrency === 'gold') {
              setGoldCoins((c) => c + reward);
            } else {
              setGreenCoins((c) => c + reward);
            }
            setShowDailyLoginBonus(false);
          }}
        />
      )}
      
      {showMissions && (
        <Missions
          missions={missions}
          onClaimReward={(id) => {
            const reward = claimMissionReward(id);
            if (selectedCurrency === 'gold') {
              setGoldCoins((c) => c + reward);
            } else {
              setGreenCoins((c) => c + reward);
            }
            return reward;
          }}
          onClose={() => setShowMissions(false)}
        />
      )}
      
      {showSessionReward && (
        <SessionTimeReward
          onClaim={(coins) => {
            if (selectedCurrency === 'gold') {
              setGoldCoins((c) => c + coins);
            } else {
              setGreenCoins((c) => c + coins);
            }
          }}
          onDismiss={() => setShowSessionReward(false)}
        />
      )}
      
      <ReferralScreen isOpen={showReferral} onClose={() => setShowReferral(false)} />
      {showBoard && <PracticeBoard onClose={() => setShowBoard(false)} />}
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      {showIntro && <OnboardingTutorial onClose={() => setShowIntro(false)} />}
      {bonusGameType && (
        <BonusGameOverlay
          gameType={bonusGameType}
          onClose={(reward) => {
            setBonusGameType(null);
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
      

      {/* Debug overlay — developer-only; enable with ?debug=1 in the URL */}
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug") && (
        <DebugOverlay stats={debugStats} />
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
        onMissions={() => setShowMissions(true)}
        onReferrals={() => setShowReferral(true)}
        onBoard={() => setShowBoard(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />
      
      {/* Floating referral badge - shows when user has referrals */}
      <FloatingReferralBadge referralCount={0} onClick={() => setShowReferral(true)} />

      {/* Global toast stack — listens for window 'toast' events from anywhere */}
      <Toasts />
      
      {/* Streak display panel - shown on lg+ only (overlaps reels on small/medium screens, accessible via Missions modal) */}
      <div className="hidden lg:block absolute top-20 right-2 z-20 w-40">
        <DailyStreakDisplay
          currentStreak={currentStreak}
          level={retentionLevel}
          xp={retentionXp}
          xpToNext={retentionXpToNext}
          lifetimeXp={lifetimeXp}
        />
      </div>

    </div>
  );
}
