/**
 * CountdownTimer - Live countdown timer component
 * Used for daily deal countdowns
 */

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: Date;
  onExpire?: () => void;
  className?: string;
  showLabels?: boolean;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(endTime: Date): TimeLeft {
  const now = new Date().getTime();
  const target = endTime.getTime();
  const total = target - now;

  if (total <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

export function CountdownTimer({ 
  endTime, 
  onExpire,
  className = "",
  showLabels = true 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endTime));
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endTime);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire, hasExpired]);

  if (hasExpired) {
    return (
      <div className={className}>
        <span className="text-red-500 font-bold text-sm">EXPIRED</span>
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5 bg-gradient-to-r from-red-600/20 to-orange-600/20 px-2 py-1 rounded-lg border border-red-500/30">
        {/* Hours */}
        <div className="text-center">
          <div 
            className="text-xl font-black tabular-nums"
            style={{ 
              fontFamily: "'Oswald', sans-serif",
              color: "#EF4444",
              textShadow: "0 0 10px rgba(239,68,68,0.5)"
            }}
          >
            {pad(timeLeft.hours)}
          </div>
          {showLabels && (
            <div className="text-[10px] text-red-400/60 uppercase tracking-wider">hrs</div>
          )}
        </div>

        <span className="text-red-500 font-bold text-xl mx-0.5">:</span>

        {/* Minutes */}
        <div className="text-center">
          <div 
            className="text-xl font-black tabular-nums"
            style={{ 
              fontFamily: "'Oswald', sans-serif",
              color: "#EF4444",
              textShadow: "0 0 10px rgba(239,68,68,0.5)"
            }}
          >
            {pad(timeLeft.minutes)}
          </div>
          {showLabels && (
            <div className="text-[10px] text-red-400/60 uppercase tracking-wider">min</div>
          )}
        </div>

        <span className="text-red-500 font-bold text-xl mx-0.5">:</span>

        {/* Seconds */}
        <div className="text-center">
          <div 
            className="text-xl font-black tabular-nums"
            style={{ 
              fontFamily: "'Oswald', sans-serif",
              color: "#EF4444",
              textShadow: "0 0 10px rgba(239,68,68,0.5)"
            }}
          >
            {pad(timeLeft.seconds)}
          </div>
          {showLabels && (
            <div className="text-[10px] text-red-400/60 uppercase tracking-wider">sec</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CountdownTimer;