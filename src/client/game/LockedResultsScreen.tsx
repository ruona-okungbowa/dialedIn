import { useEffect, useState } from 'react';
import { requestExpandedMode } from '@devvit/web/client';

type LockedResultsScreenProps = {
  unlockTime: string; // ISO timestamp
  totalScore: number;
  completedRounds: number;
  onUnlock?: () => void; // Callback when unlock time is reached
  onViewLeaderboard?: () => void; // Callback to view leaderboard
};

export const LockedResultsScreen = ({
  unlockTime,
  totalScore,
  completedRounds,
  onUnlock,
  onViewLeaderboard,
}: LockedResultsScreenProps) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const unlock = new Date(unlockTime);
      const diff = unlock.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('00:00:00');
        // Trigger unlock callback or reload
        if (onUnlock) {
          setTimeout(() => {
            onUnlock();
          }, 1000);
        } else {
          setTimeout(() => {
            globalThis.location?.reload();
          }, 1000);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [unlockTime, onUnlock]);

  const unlockDate = new Date(unlockTime);
  const unlockTimeFormatted = unlockDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="relative flex flex-col h-screen overflow-hidden px-4 sm:px-6">
      <div className="fixed inset-0 vibrant-pattern pointer-events-none"></div>
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-teal-400/20 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-500/20 rounded-full blur-[80px]"></div>

      {/* Floating decorative shapes */}
      <div className="floating-shape absolute top-1/4 left-8 lg:left-12 rotate-12 hidden lg:block">
        <div className="w-12 h-12 lg:w-16 lg:h-16 border-6 lg:border-8 border-white/30 rounded-2xl"></div>
      </div>
      <div className="floating-shape absolute bottom-1/4 right-8 lg:right-12 -rotate-12 hidden lg:block">
        <div className="w-16 h-16 lg:w-20 lg:h-20 border-6 lg:border-8 border-white/30 rounded-full"></div>
      </div>

      {/* Header Stats */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 sm:gap-3 pt-3 sm:pt-4 pb-2 sm:pb-3 flex-shrink-0">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="stat-badge px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-2 sm:gap-3">
            <span
              className="material-symbols-outlined text-yellow-300 text-lg sm:text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
            <span className="text-white font-bold text-sm sm:text-base tracking-tight">
              TOTAL SCORE: {totalScore.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
          <div className="stat-badge px-3 sm:px-4 py-1.5 sm:py-2 flex flex-col items-center">
            <span className="text-white font-bold text-sm sm:text-base leading-tight text-center">
              CHALLENGE COMPLETE
            </span>
            <span className="text-teal-300 text-[10px] sm:text-xs font-black uppercase mt-0.5 sm:mt-1 tracking-widest">
              {completedRounds} OF 3 ROUNDS DONE
            </span>
          </div>
        </div>
      </div>

      {/* Main Locked Card */}
      <main className="relative z-20 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center">
        <div className="locked-card w-full max-w-2xl p-6 sm:p-8 flex flex-col items-center text-center relative">
          {/* Locked Badge */}
          <div className="locked-badge absolute -top-3 sm:-top-4 px-5 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-white">
            <span className="text-white font-black text-base sm:text-lg uppercase tracking-widest">
              Locked
            </span>
          </div>

          {/* Lock Icon */}
          <div className="mb-3 sm:mb-4 mt-2 sm:mt-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center border-3 sm:border-4 border-red-500/40">
              <span
                className="material-symbols-outlined text-red-500 text-4xl sm:text-5xl"
                style={{ fontVariationSettings: "'wght' 700" }}
              >
                lock_clock
              </span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 mb-4 sm:mb-5">
            <span className="text-red-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase">
              Reveal In:
            </span>
            <div className="timer-text text-white text-4xl sm:text-5xl tracking-wider">
              {timeRemaining}
            </div>
          </div>

          {/* Explanation Text */}
          <div className="max-w-md px-2 sm:px-4">
            <p className="text-slate-200 text-sm sm:text-base font-medium leading-relaxed">
              Results are locked! Tune back in at{' '}
              <span className="text-yellow-400 font-bold">{unlockTimeFormatted}</span> to see the
              final community average and your rank.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md mt-4 sm:mt-4 flex flex-col gap-2 relative z-30">
          <button
            onClick={() => {
              if (onViewLeaderboard) {
                onViewLeaderboard();
              }
            }}
            className="chunky-button-yellow w-full py-3 sm:py-4 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 sm:gap-3 group"
          >
            <span className="text-base sm:text-xl font-black uppercase tracking-tight text-amber-950">
              View Daily Leaderboard
            </span>
            <span
              className="material-symbols-outlined text-xl sm:text-2xl text-amber-950 group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              leaderboard
            </span>
          </button>
        </div>
      </main>

      {/* Bottom Glow Effects */}
      <div className="fixed bottom-0 left-0 w-full h-1/4 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};
