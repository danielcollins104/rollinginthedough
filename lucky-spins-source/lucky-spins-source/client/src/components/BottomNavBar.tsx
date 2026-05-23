/**
 * BottomNavBar — Professional casino app bottom navigation
 * Matches Slotomania / Jackpot Party bottom nav standards
 */

import { toast } from "sonner";

interface Props {
  onShop: () => void;
  onRules: () => void;
  onDeals: () => void;
  onScratch: () => void;
  onMissions: () => void;
  onReferrals: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface NavItem {
  icon: string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  badge?: number;
}

export default function BottomNavBar({
  onShop,
  onRules,
  onDeals,
  onScratch,
  onMissions,
  onReferrals,
  soundEnabled,
  onToggleSound,
}: Props) {
  const items: NavItem[] = [
    {
      icon: "🏠",
      label: "Lobby",
      onClick: () => toast.info("More games coming soon!"),
    },
    {
      icon: "🎁",
      label: "Deals",
      onClick: onDeals,
      badge: 1,
    },
    {
      icon: "💰",
      label: "Shop",
      onClick: onShop,
      highlight: true,
    },
    {
      icon: "📋",
      label: "Missions",
      onClick: onMissions,
    },
    {
      icon: "🎰",
      label: "Scratch",
      onClick: onScratch,
    },
    {
      icon: "👥",
      label: "Refer",
      onClick: onReferrals,
    },
    {
      icon: soundEnabled ? "🔊" : "🔇",
      label: soundEnabled ? "Sound" : "Muted",
      onClick: onToggleSound,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      style={{
        background: "linear-gradient(180deg, rgba(5,5,16,0.98) 0%, rgba(3,3,10,1) 100%)",
        borderTop: "1px solid rgba(212,175,55,0.4)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.8)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-all active:scale-95"
            style={{
              background: item.highlight
                ? "linear-gradient(180deg, rgba(212,175,55,0.15), transparent)"
                : "transparent",
              borderRight: i < items.length - 1 ? "1px solid rgba(212,175,55,0.1)" : "none",
              minHeight: "52px",
            }}
          >
            {item.badge && (
              <div
                className="absolute top-1 right-1/4 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "#FF4444",
                  color: "#FFFFFF",
                  fontSize: "0.6rem",
                  zIndex: 1,
                }}
              >
                {item.badge}
              </div>
            )}
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{item.icon}</span>
            <span
              className="font-numbers uppercase tracking-wide"
              style={{
                fontSize: "0.55rem",
                color: item.highlight ? "#D4AF37" : "rgba(212,175,55,0.6)",
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
