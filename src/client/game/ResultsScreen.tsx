import { useEffect, useState } from 'react';
import type { GuessResult, RoundSummary } from '../../shared/types';
import { buildWavelengthString, buildEnhancedWavelengthString } from '../../shared/gameLogic';

type ResultsScreenProps = {
  results: GuessResult[] | null;
  onPlayAgain?: () => void;
  bucketsByRound?: number[][];
  gameDate?: string;
};

export const ResultsScreen = ({ results, bucketsByRound, gameDate }: ResultsScreenProps) => {
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilNext(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!results?.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-white text-center">Complete all 3 rounds to see your results!</p>
      </div>
    );
  }

  const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);

  const getDialRotation = (value: number) => {
    return -90 + (value / 100) * 180;
  };

  const handleShare = async () => {
    if (!results?.length) return;

    // Convert GuessResult[] to RoundSummary[]
    const roundSummaries: RoundSummary[] = results.map((result) => ({
      roundIndex: result.roundIndex,
      dialValue: result.dialValue,
      target: result.target,
      redditAverage: result.redditAverage,
      score: result.score,
      distanceFromTarget: result.distanceFromTarget,
    }));

    // Debug logging
    console.log('Share button clicked');
    console.log('bucketsByRound:', bucketsByRound);
    console.log('gameDate:', gameDate);
    console.log('roundSummaries:', roundSummaries);

    // Generate the shareable text - always use enhanced format
    const shareText = buildEnhancedWavelengthString(roundSummaries, bucketsByRound, gameDate);

    console.log('Generated share text:', shareText);
    console.log('Share text length:', shareText.length);
    console.log('Share text includes newlines:', shareText.includes('\n'));
    console.log('Number of newlines:', (shareText.match(/\n/g) || []).length);

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(shareText);
      console.log('Successfully copied to clipboard');
      setCopyStatus('copied');

      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyStatus('error');

      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-y-auto py-4 px-3 pb-20">
      <div className="fixed inset-0 vibrant-pattern pointer-events-none"></div>

      <div className="floating-shape top-10 left-5 md:left-10 rotate-12 hidden md:block">
        <span
          className="material-symbols-outlined text-white text-5xl md:text-6xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      </div>
      <div className="floating-shape bottom-20 right-5 md:right-10 -rotate-12 hidden md:block">
        <span
          className="material-symbols-outlined text-white text-6xl md:text-7xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          workspace_premium
        </span>
      </div>

      <main className="relative z-10 w-full max-w-2xl flex flex-col gap-4">
        <div className="text-center mb-2">
          <div className="flex justify-center items-center gap-2 mb-1">
            <span
              className="material-symbols-outlined text-white text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
            <h1 className="text-white font-black text-2xl md:text-4xl tracking-tighter uppercase italic">
              Session Complete!
            </h1>
            <span
              className="material-symbols-outlined text-white text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
          </div>
          <p className="text-white/80 font-bold text-xs md:text-sm tracking-wide uppercase">
            Your Performance Summary
          </p>
        </div>

        <div className="glass-card w-full p-4 md:p-6 text-center flex flex-col items-center gap-4">
          <div>
            <p className="text-white/70 font-bold text-xs uppercase tracking-[0.2em] mb-1">
              Total Score
            </p>
            <div
              className="text-yellow-400 font-black text-4xl md:text-6xl leading-none"
              style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}
            >
              {totalScore.toLocaleString()}{' '}
              <span className="text-xl md:text-3xl uppercase tracking-tighter text-white/90">
                pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 w-full">
            {results.map((result) => (
              <div
                key={result.roundIndex}
                className="bg-white/10 rounded-2xl p-3 border border-white/10 flex items-center justify-between"
              >
                <span className="text-white/50 font-bold text-xs uppercase">
                  Round {result.roundIndex + 1}
                </span>

                <div className="relative w-20 h-10 overflow-hidden">
                  <div className="absolute inset-0 spectrum-arc opacity-60"></div>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white z-10 origin-bottom"
                    style={{
                      transform: `translateX(-50%) rotate(${getDialRotation(result.target)}deg)`,
                    }}
                  ></div>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-[90%] bg-yellow-400 rounded-t-full z-20 origin-bottom shadow-lg"
                    style={{
                      transform: `translateX(-50%) rotate(${getDialRotation(result.dialValue)}deg)`,
                    }}
                  ></div>
                </div>

                <div className="text-white font-bold text-sm">{result.score} pts</div>
              </div>
            ))}
          </div>

          <p className="text-white/90 font-medium text-xs md:text-sm italic">
            You've dialed in for today! Come back tomorrow.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 bg-gray-400 shadow-[0_6px_0px_#6b7280] cursor-not-allowed"
            disabled
          >
            <span className="text-base md:text-xl font-black uppercase tracking-tight text-slate-800">
              See You Tomorrow!
            </span>
            <span className="material-symbols-outlined text-base md:text-xl text-slate-800">
              event_upcoming
            </span>
          </button>
          <button
            onClick={handleShare}
            className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              copyStatus === 'copied'
                ? 'bg-green-500 shadow-[0_6px_0px_#16a34a]'
                : copyStatus === 'error'
                  ? 'bg-red-500 shadow-[0_6px_0px_#dc2626]'
                  : 'bg-[#2dd4bf] shadow-[0_6px_0px_#6b7280] active:shadow-[0_2px_0px_#6b7280] active:translate-y-1'
            }`}
          >
            <span className="text-base md:text-xl font-black uppercase tracking-tight text-slate-800">
              {copyStatus === 'copied'
                ? 'Copied!'
                : copyStatus === 'error'
                  ? 'Failed to Copy'
                  : 'Share to Comments'}
            </span>
            <span className="material-symbols-outlined text-base md:text-xl text-slate-800">
              {copyStatus === 'copied' ? 'check_circle' : 'share'}
            </span>
          </button>
          <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/20 mx-auto">
            <p className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Next challenge in{' '}
              <span className="text-yellow-400 tabular-nums">{timeUntilNext}</span>
            </p>
          </div>
        </div>
        <button className="outline-2 outline-white w-full py-3 rounded-3xl text-white font-black text-base md:text-xl uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">leaderboard</span>
          Hall of Fame
        </button>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-32 pointer-events-none overflow-hidden opacity-50">
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};
