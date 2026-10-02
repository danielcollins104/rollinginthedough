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
import { useAuth } from "@/_core/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { useRetention } from "@/hooks/useRetention";
import { DailyLoginBonus } from "@/components/DailyLoginBonus";
import { DailyStreakDisplay } from "@/components/DailyStreakDisplay";
import { LevelUp } from "@/components/LevelUp";
import { PirateHero } from "@/components/PirateHero";
import { CabinetScene } from "@/components/CabinetScene";
import { Missions } from "@/components/Missions";
import { SessionTimeReward } from "@/components/SessionTimeReward";
import ReferralScreen, { FloatingReferralBadge } from "@/components/ReferralScreen";
import { Toasts } from "@/components/Toasts";
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
        // Jewel-tone imperial palette — deep crimson + plum + midnight,
        // matching the reference's vibrantly lit play area. The Huntress
        // themed cabinet scene overlays this.
        background:
          "linear-gradient(160deg, #1a0816 0%, #280a22 20%, #3a0e2e 45%, #2a0a26 70%, #0e0418 100%)",
      }}
    >
      {/* Background hero image overlay — built from procedural SVG so the
          cabinet has a real prairie-plains atmosphere (tipi village,
          campfire, moonlit hills) like the casino-app reference. No network
          fetch, no asset CDN dependency. */}
      <CabinetScene opacity={0.85} className="absolute inset-0" />

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
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-4 relative z-10" style={{ paddingTop: "2px", paddingBottom: "2px" }}>
        <CurrencyToggle
          selectedCurrency={activeCurrency}
          goldCoins={goldCoins}
          greenCoins={greenCoins}
          onCurrencyChange={handleCurrencyChange}
        />
      </div>



      {/* Huntress Banner - Compact crimson/gold themed. The 🗡️ text glyph
          is replaced with a small 36px circular crop of the real portrait
          so the banner shows her face, not a generic sword emoji. */}
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-1 relative z-10" style={{ maxHeight: "60px" }}>
        <div
          className="rounded overflow-hidden shadow-2xl relative h-full"
          style={{
            background: "linear-gradient(135deg, #3a0e2e 0%, #5c1428 50%, #2a0a26 100%)",
            border: "1.5px solid rgba(212,175,55,0.55)",
            boxShadow:
              "0 0 18px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,220,160,0.15)",
          }}
        >
          <div className="flex items-center justify-between px-3 py-1 h-full">
            <div className="flex items-center gap-2">
              {/* Real portrait — circular crop, 36px, framed in gold ring */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1.5px solid #D4AF37",
                  boxShadow: "0 0 8px rgba(255,194,71,0.55), inset 0 0 4px rgba(0,0,0,0.4)",
                  flexShrink: 0,
                }}
              >
                <img
                  src="/pg/captain.png"
                  alt="Pirate Captain"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "50% 30%",
                    display: "block",
                  }}
                />
              </div>
              <div>
                <div className="font-display font-bold text-sm" style={{ color: "#D4AF37" }}>Pirates Gold</div>
                <div className="text-xs" style={{ color: "rgba(212,175,55,0.6)" }}>3+ Symbols = Bonus Round</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-numbers font-bold text-sm" style={{ color: "#FF6B6B" }}>SCATTER</div>
              <div className="text-xs" style={{ color: "rgba(255,107,107,0.7)" }}>Up to 1,000x</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cabinet centerpiece — the Huntress Warrior character portrait that
          dominates the upper third of the cabinet the way Serpent Gold's
          serpent head does. Full bleed inside the column, painterly SVG
          character + scene composition. */}
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-1 relative z-10 mt-2">
        <PirateHero height={280} glow />
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
      

      <DebugOverlay stats={debugStats} />

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
