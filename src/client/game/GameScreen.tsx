import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import type { DailyGame, GuessResult } from '../../shared/types';
import type { DailyGameResponse, GuessResponse } from '../../shared/types/api';
import { useSoundHaptics } from '../hooks/useSoundHaptics';
import { useGameState } from '../hooks/useGameState';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type GameScreenProps = {
  onGameComplete: (results: GuessResult[], isLocked?: boolean, unlockTime?: string) => void;
};

type Phase = 'playing' | 'finished';

export const GameScreen = ({ onGameComplete }: GameScreenProps) => {
  const [dialValue, setDialValue] = useState(50);
  const [game, setGame] = useState<DailyGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundResults, setRoundResults] = useState<GuessResult[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlayingPreviousDay, setIsPlayingPreviousDay] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState<string | null>(null);
  const { playSound, triggerHapticFeedback } = useSoundHaptics();
  const { saveState, loadStateWithDateValidation, clearState } = useGameState();
  const lastDialValueRef = useRef(50);
  const dialThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

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

  // Helper function to save state and broadcast to other tabs
  const saveAndBroadcastState = useCallback(
    (stateData: {
      gameId: string;
      currentRoundIndex: number;
      roundResults: GuessResult[];
      dialValue: number;
      gameStatus: 'playing' | 'round_end' | 'game_over';
      totalScore: number;
    }) => {
      // Save to localStorage
      saveState(stateData);

      // Broadcast to other tabs
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'STATE_UPDATE',
          data: stateData,
        });
      }
    },
    [saveState]
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
        setIsLocked(data.isLocked || false);
        setUnlockTime(data.unlockTime || null);
        const gameId = `${data.game.date}-${data.game.subredditId}`;

        // Use date validation to check if saved state is from previous day
        const validation = loadStateWithDateValidation(gameId);

        if (validation.isFromPreviousDay && validation.canContinuePreviousDay) {
          // User has incomplete game from previous day - allow them to finish
          setIsPlayingPreviousDay(true);

          const savedState = validation.state!;
          setRoundResults(savedState.roundResults);
          setCurrentRoundIndex(savedState.currentRoundIndex);
          setDialValue(clamp(savedState.dialValue, 0, 100));
          setPhase('playing');
        } else if (validation.isFromPreviousDay && !validation.canContinuePreviousDay) {
          // Previous day's game was complete - clear it and start fresh
          clearState();

          // Check if there are server-side results for today
          // Check if there are server-side results for today
          const resultsToRestore = data.priorResults ?? [];
          if (resultsToRestore.length > 0) {
            setRoundResults(resultsToRestore);
            if (resultsToRestore.length >= 3) {
              setPhase('finished');
              // Check if results are unlocked now (even if they were locked before)
              const isCurrentlyLocked =
                data.isLocked && new Date(data.unlockTime || 0) > new Date();
              onGameComplete(resultsToRestore, isCurrentlyLocked, data.unlockTime);
            } else {
              setCurrentRoundIndex(resultsToRestore.length);
              setDialValue(50);
              setPhase('playing');
            }
          }
        } else if (validation.state) {
          // Same day - restore state normally
          const savedState = validation.state;
          setRoundResults(savedState.roundResults);

          if (savedState.roundResults.length >= 3) {
            setPhase('finished');
            // Check if results are unlocked now (even if they were locked before)
            const isCurrentlyLocked = data.isLocked && new Date(data.unlockTime || 0) > new Date();
            onGameComplete(savedState.roundResults, isCurrentlyLocked, data.unlockTime);
          } else {
            setCurrentRoundIndex(savedState.currentRoundIndex);
            setDialValue(clamp(savedState.dialValue, 0, 100));
            setPhase('playing');
          }
        } else {
          // No saved state - check server results or start fresh
          const resultsToRestore = data.priorResults ?? [];
          if (resultsToRestore.length > 0) {
            setRoundResults(resultsToRestore);
            if (resultsToRestore.length >= 3) {
              setPhase('finished');
              // Check if results are unlocked now (even if they were locked before)
              const isCurrentlyLocked =
                data.isLocked && new Date(data.unlockTime || 0) > new Date();
              onGameComplete(resultsToRestore, isCurrentlyLocked, data.unlockTime);
            } else {
              setCurrentRoundIndex(resultsToRestore.length);
              setDialValue(50);
              setPhase('playing');
            }
          } else {
            // Fresh game
            clearState();
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Cross-tab synchronization using BroadcastChannel
  useEffect(() => {
    if (!game) return;

    // Create broadcast channel for cross-tab communication
    const channel = new BroadcastChannel('dialedin-game-sync');
    broadcastChannelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      const gameId = `${game.date}-${game.subredditId}`;

      // Only sync if it's for the current game
      if (data.gameId !== gameId) return;

      if (type === 'STATE_UPDATE') {
        // Update state from other tab
        setCurrentRoundIndex(data.currentRoundIndex);
        setDialValue(clamp(data.dialValue, 0, 100));

        if (data.roundResults) {
          setRoundResults(data.roundResults);
        }

        if (data.gameStatus === 'game_over' && data.roundResults?.length >= 3) {
          setPhase('finished');
        } else {
          setPhase('playing');
        }
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [game]);

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
        const updated = [...filtered, result].sort((a, b) => a.roundIndex - b.roundIndex);

        // Save state after guess
        if (game) {
          const totalScore = updated.reduce((sum, r) => sum + (r.score ?? 0), 0);
          saveAndBroadcastState({
            gameId: `${game.date}-${game.subredditId}`,
            currentRoundIndex,
            roundResults: updated,
            dialValue,
            gameStatus: 'round_end',
            totalScore,
          });

          // Save to server
          fetch('/api/save-game-state', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              currentRoundIndex,
              dialValue,
              gameStatus: 'round_end',
            }),
          }).catch((e) => console.error('Failed to save game state to server:', e));
        }

        return updated;
      });

      // If this was the last round, go straight to completion
      if (currentRoundIndex >= 2) {
        playSound('success');
        triggerHapticFeedback([20, 30, 20]);

        setTimeout(() => {
          setPhase('finished');
          onGameComplete(
            [...roundResults.filter((r) => r.roundIndex !== result.roundIndex), result].sort(
              (a, b) => a.roundIndex - b.roundIndex
            ),
            isLocked,
            unlockTime || undefined
          );
        }, 500);
      } else {
        // Move to next round
        playSound('dial-move');
        triggerHapticFeedback(10);
        const nextIndex = currentRoundIndex + 1;
        setCurrentRoundIndex(nextIndex);
        setDialValue(50);
        lastDialValueRef.current = 50;

        // Save state after moving to next round
        if (game) {
          const totalScore = roundResults.reduce((sum, r) => sum + (r.score ?? 0), 0);
          saveAndBroadcastState({
            gameId: `${game.date}-${game.subredditId}`,
            currentRoundIndex: nextIndex,
            roundResults,
            dialValue: 50,
            gameStatus: 'playing',
            totalScore,
          });
        }
      }
    } catch (e) {
      playSound('error');
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
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

  // Ensure dragging state is cleared if the pointer/touch ends outside the input
  useEffect(() => {
    if (!isDragging) return;

    const clear = () => setIsDragging(false);

    window.addEventListener('pointerup', clear);
    window.addEventListener('touchend', clear);

    return () => {
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('touchend', clear);
    };
  }, [isDragging]);

  // Save dial position to localStorage and server when user stops moving it (debounced)
  useEffect(() => {
    if (phase !== 'playing' || !game) return;

    const saveTimer = setTimeout(() => {
      const totalScore = roundResults.reduce((sum, r) => sum + (r.score ?? 0), 0);

      // Save to localStorage and broadcast to other tabs
      saveAndBroadcastState({
        gameId: `${game.date}-${game.subredditId}`,
        currentRoundIndex,
        roundResults,
        dialValue,
        gameStatus: 'playing',
        totalScore,
      });

      // Save to server (fire-and-forget, non-blocking)
      setTimeout(() => {
        fetch('/api/save-game-state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentRoundIndex,
            dialValue,
            gameStatus: 'playing',
          }),
        }).catch((e) => console.error('Failed to save game state to server:', e));
      }, 0);
    }, 1000); // Save 1 second after user stops moving dial

    return () => clearTimeout(saveTimer);
  }, [dialValue, phase, game, currentRoundIndex, roundResults, saveAndBroadcastState]);

  if (loading) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
        <div className="fixed inset-0 vibrant-pattern pointer-events-none"></div>
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-orange-500/20 rounded-full blur-[100px]"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-12">
            <div className="loading-circle w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-4 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/20"></div>
              <div className="spinning-needle absolute bottom-1/2 left-1/2 -translate-x-1/2 w-4 h-[45%] md:h-[45%] z-20">
                <div className="w-full h-full bg-red-500 rounded-t-full border-2 border-white shadow-lg relative">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                </div>
              </div>
              <div className="absolute w-12 h-12 bg-slate-800 rounded-full border-4 border-white z-30 shadow-xl flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="absolute -inset-8 bg-white/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
          </div>
          <h1
            className="text-white text-4xl md:text-5xl uppercase tracking-tight mb-4 font-black"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Loading Game...
          </h1>
          <div className="pulse-text flex flex-col items-center gap-4">
            <p className="text-white/80 font-bold text-lg md:text-xl">
              Finding the perfect wavelength for you...
            </p>
            <div className="flex gap-3">
              <div className="w-4 h-4 bg-teal-400 rounded-full"></div>
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 w-full h-1/4 pointer-events-none overflow-hidden">
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pink-400/20 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-[120px]"></div>
        </div>
      </div>
    );
  }

  if (error || !game || !currentRound) {
    return (
      <div className="relative flex flex-col items-center justify-center py-8 px-6 overflow-hidden">
        <div className="fixed inset-0 vibrant-pattern pointer-events-none"></div>
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-indigo-900/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-purple-900/30 rounded-full blur-[100px]"></div>
        <main className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center gap-12">
          <div className="relative flex flex-col items-center">
            <div className="glitch-dial flex items-end justify-center pb-4">
              <div className="glitch-line top-1/4 left-0"></div>
              <div className="glitch-line top-1/2 left-4 w-3/4"></div>
              <div className="glitch-line top-2/3 right-0 w-1/2"></div>
              <div className="flex flex-col items-center mb-4">
                <div className="flex gap-8 mb-2">
                  <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                </div>
                <div className="w-12 h-4 border-t-4 border-white/40 rounded-[50%]"></div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-24 bg-red-500/40 origin-bottom rotate-[75deg] rounded-full"></div>
            </div>
            <div className="w-32 h-12 bg-indigo-950 border-x-8 border-b-8 border-white/10 rounded-b-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
              <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute bottom-5 left-1/2 w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="bungee-font text-5xl md:text-7xl text-white tracking-tighter drop-shadow-2xl">
              LOST THE <br />
              <span className="text-orange-400">SIGNAL...</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
              {error ??
                "We couldn't reach the mental frequency. Please check your connection or try again."}
            </p>
          </div>
          <div className="w-full max-w-sm">
            <button
              onClick={() => globalThis.location?.reload()}
              className="chunky-button-orange w-full py-6 rounded-3xl flex items-center justify-center gap-4 group"
            >
              <span className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-md">
                Test Your Wavelength
              </span>
              <span className="material-symbols-outlined text-4xl text-white group-hover:rotate-180 transition-transform duration-500">
                sync
              </span>
            </button>
          </div>
        </main>
        <div className="fixed bottom-0 left-0 w-full h-1/4 pointer-events-none overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-indigo-900/40 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-pink-900/40 rounded-full blur-[120px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-start h-full py-4 bg-gradient-purple-pink px-4 overflow-hidden pb-6">
      <div className="fixed inset-0 vibrant-pattern pointer-events-none"></div>
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-teal-400/20 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-500/20 rounded-full blur-[80px]"></div>
      <div className="relative z-10 w-full max-w-5xl flex justify-between items-start mb-2">
        <div className="flex flex-col gap-2">
          <div className="stat-badge px-3 py-1 flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-tight">Score: {totalScore}</span>
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
                    roundResults.some((r) => r.roundIndex === i) ? 'bg-teal-400' : 'bg-white/20'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-2">
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
                  transition: isDragging ? 'none' : 'transform 0.12s linear',
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
              onInput={(e) => setDialValue(Number((e.currentTarget as HTMLInputElement).value))}
              onPointerDown={() => setIsDragging(true)}
              onPointerUp={() => setIsDragging(false)}
              onPointerCancel={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              style={{ touchAction: 'none' }}
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
      </main>
    </div>
  );
};
