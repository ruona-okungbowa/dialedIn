import { useEffect, useMemo, useRef, useState } from 'react';

import type { DailyGame, GuessResult } from '../../shared/types';
import type { DailyGameResponse, GuessResponse } from '../../shared/types/api';
import { useSoundHaptics } from '../hooks/useSoundHaptics';
import { RevealScreen } from './RevealScreen';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type GameScreenProps = {
  onGameComplete: (results: GuessResult[]) => void;
};

type Phase = 'playing' | 'revealing' | 'finished';

export const GameScreen = ({ onGameComplete }: GameScreenProps) => {
  const [dialValue, setDialValue] = useState(50);
  const [game, setGame] = useState<DailyGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundResults, setRoundResults] = useState<GuessResult[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [submitting, setSubmitting] = useState(false);
  const { playSound, triggerHapticFeedback } = useSoundHaptics();
  const lastDialValueRef = useRef(50);
  const dialThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map 0–100 to angle range (-60deg to +120deg for asymmetric arc)
  const minAngle = -60;
  const maxAngle = 120;

  const angle = minAngle + (clamp(dialValue, 0, 100) / 100) * (maxAngle - minAngle);

  const currentRound = useMemo(
    () => game?.rounds[currentRoundIndex] ?? null,
    [game, currentRoundIndex]
  );

  const latestResult = useMemo(() => {
    const byRound = roundResults.find((r) => r.roundIndex === currentRoundIndex);
    if (byRound) return byRound;
    return roundResults.at(-1) ?? null;
  }, [roundResults, currentRoundIndex]);

  const totalScore = useMemo(
    () => roundResults.reduce((sum, r) => sum + (typeof r.score === 'number' ? r.score : 0), 0),
    [roundResults]
  );

  useEffect(() => {
    let cancelled = false;

    const loadGame = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/daily-game');
        if (!res.ok) {
          throw new Error('Failed to load daily game');
        }

        const data = (await res.json()) as DailyGameResponse;
        if (cancelled) return;

        setGame(data.game);

        if (data.priorResults?.length) {
          setRoundResults(data.priorResults);

          if (data.priorResults.length >= 3) {
            setPhase('finished');
            onGameComplete(data.priorResults);
            return;
          }

          const nextRoundIndex = data.priorResults.length;
          setCurrentRoundIndex(nextRoundIndex);
          setDialValue(
            clamp(data.priorResults[data.priorResults.length - 1]?.dialValue ?? 50, 0, 100)
          );
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadGame();

    return () => {
      cancelled = true;
    };
  }, [onGameComplete]);

  const handleSubmitGuess = async () => {
    if (!game || currentRoundIndex > 2 || submitting || phase !== 'playing') {
      return;
    }

    playSound('dial-lock');
    triggerHapticFeedback([10, 20, 10]);

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roundIndex: currentRoundIndex,
          dialValue,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit guess');
      }

      const data = (await res.json()) as GuessResponse;
      const result = data.result;

      setRoundResults((prev) => {
        const filtered = prev.filter((r) => r.roundIndex !== result.roundIndex);
        return [...filtered, result].sort((a, b) => a.roundIndex - b.roundIndex);
      });

      // Play reveal sound after a short delay
      setTimeout(() => {
        playSound('reveal');
        triggerHapticFeedback(30);
      }, 200);

      setPhase('revealing');
    } catch (e) {
      playSound('error');
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentRoundIndex >= 2) {
      playSound('success');
      triggerHapticFeedback([20, 30, 20]);
      setPhase('finished');
      onGameComplete(roundResults);
      return;
    }

    playSound('dial-move');
    triggerHapticFeedback(10);
    const nextIndex = currentRoundIndex + 1;
    setCurrentRoundIndex(nextIndex);
    setPhase('playing');
    setDialValue(50);
    lastDialValueRef.current = 50;
  };

  // Handle dial movement with throttled sound/haptic feedback
  useEffect(() => {
    if (phase !== 'playing') return;

    const diff = Math.abs(dialValue - lastDialValueRef.current);
    if (diff > 2) {
      // Throttle sound/haptic feedback
      if (dialThrottleRef.current) {
        clearTimeout(dialThrottleRef.current);
      }

      dialThrottleRef.current = setTimeout(() => {
        playSound('dial-move');
        triggerHapticFeedback(5);
        lastDialValueRef.current = dialValue;
      }, 50);
    }

    return () => {
      if (dialThrottleRef.current) {
        clearTimeout(dialThrottleRef.current);
      }
    };
  }, [dialValue, phase, playSound, triggerHapticFeedback]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-4 py-8 px-6">
        <div className="text-sm font-medium text-white/80 dark:text-slate-300 fade-in">
          Loading today&apos;s dial...
        </div>
      </div>
    );
  }

  if (error || !game || !currentRound) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-4 py-8 px-6">
        <p className="text-sm font-semibold text-red-200 dark:text-red-300">
          {error ?? 'Something went wrong loading the daily game.'}
        </p>
        <button
          className="rounded-full bg-white/10 dark:bg-slate-800/80 px-4 py-2 text-xs font-semibold text-white dark:text-slate-200 hover:bg-white/20 dark:hover:bg-slate-700 transition-colors touch-manipulation"
          onClick={() => globalThis.location?.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen py-4 bg-gradient-purple-pink px-4 overflow-auto pb-6">
      <div className="fixed inset-0 vibrant-pattern pointer-events-none"></div>
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-teal-400/20 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-500/20 rounded-full blur-[80px]"></div>
      <div className="floating-shape top-1/4 left-12 rotate-12">
        <div className="w-16 h-16 border-8 border-white/30 rounded-2xl"></div>
      </div>
      <div className="floating-shape bottom-1/4 right-12 -rotate-12">
        <div className="w-20 h-20 border-8 border-white/30 rounded-full"></div>
      </div>
      <div className="relative z-10 w-full max-w-5xl flex justify-between items-start mb-2">
        <div className="flex flex-col gap-2">
          <div className="stat-badge px-3 py-1 flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-tight">
              Score:{totalScore}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="stat-badge px-3 py-1 flex flex-col items-end">
            <span className="text-white/70 text-[8px] font-black uppercase tracking-[0.2em]">
              Round {currentRound.roundIndex + 1} of 3
            </span>
            <div className="flex gap-1 mt-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-1 rounded-full ${
                    roundResults.some((r) => r.roundIndex === i)
                      ? 'bg-teal-400'
                      : 'bg-white/20'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-2">
        {phase === 'revealing' && latestResult ? (
          <RevealScreen
            result={latestResult}
            currentRoundIndex={currentRoundIndex}
            totalScore={totalScore}
            onNext={handleNext}
            isLastRound={currentRoundIndex >= 2}
          />
        ) : (
          <>
            <div className="prompt-card w-full max-w-md p-3 md:p-4 text-center relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                Prompt
              </div>
              <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[8px] font-black uppercase tracking-tighter mb-0.5">
                    Left
                  </span>
                  <span className="text-indigo-900 font-black text-sm md:text-base tracking-tight uppercase">
                    {game.spectrums[0]?.leftLabel ?? 'Left'}
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[8px] font-black uppercase tracking-tighter mb-0.5">
                    Right
                  </span>
                  <span className="text-indigo-900 font-black text-sm md:text-base tracking-tight uppercase">
                    {game.spectrums[0]?.rightLabel ?? 'Right'}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-2 md:p-3 border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-semibold text-[10px] mb-0.5">Where does</p>
                <h2 className="text-xl md:text-2xl font-black text-indigo-600 tracking-tight uppercase">
                  {currentRound.clue}
                </h2>
                <p className="text-slate-500 font-semibold text-[10px] mt-0.5">sit on this scale?</p>
              </div>
            </div>
            <div className="relative w-full flex flex-col items-center mt-1">
              <div className="relative w-full max-w-[320px] h-[120px] md:h-[160px] overflow-hidden mx-auto">
                <div className="absolute inset-0 spectrum-arc"></div>
                <div
                  className="needle-container absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-full z-20 pointer-events-none"
                  style={{ transformOrigin: 'bottom center' }}
                >
                  <div
                    className="needle-red w-full h-[95%] bg-red-500 rounded-t-full border-2 border-white relative"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: 'bottom center',
                      transition: 'transform 0.12s linear',
                    }}
                  >
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-8 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-14 md:w-16 md:h-16 bg-slate-800 rounded-full border-[5px] md:border-[6px] border-white z-30 shadow-2xl flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="mt-3 w-full max-w-sm px-2">
                <input
                  type="range"
                  name="range"
                  id="range"
                  value={dialValue}
                  max={100}
                  min={0}
                  onChange={(e) => setDialValue(Number((e.target as HTMLInputElement).value))}
                  className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400 border-2 border-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer md:[&::-webkit-slider-thumb]:w-8 md:[&::-webkit-slider-thumb]:h-8 md:[&::-webkit-slider-thumb]:border-4 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-yellow-400 [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none md:[&::-moz-range-thumb]:w-8 md:[&::-moz-range-thumb]:h-8"
                  aria-label="Dial value"
                />
                <div className="flex justify-between mt-1 text-white/60 font-bold text-[9px] uppercase tracking-wider">
                  <span>Leaning Left</span>
                  <span>Leaning Right</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 w-full max-w-sm mt-2 mb-3 px-2">
              {phase === 'playing' && (
                <button
                  onClick={handleSubmitGuess}
                  disabled={submitting}
                  className="chunky-button-yellow w-full py-3 md:py-3.5 rounded-3xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg md:text-xl font-black uppercase tracking-tight text-amber-950">
                    {submitting ? 'Submitting...' : 'Confirm Guess'}
                  </span>
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
