import { useState, useEffect } from 'react';

import type { GuessResult } from '../../shared/types';
import { GameScreen } from './GameScreen';
import { ResultsScreen } from './ResultsScreen';
import { LockedResultsScreen } from './LockedResultsScreen';
import { UnlockedRevealScreen } from './UnlockedRevealScreen';
import { SpectrumLabScreen } from '../lab/SpectrumLabScreen';
import { HallOfFameScreen } from '../hof/HallOfFameScreen';
import { OnboardingScreen } from '../onboarding/OnboardingScreen';

type View = 'onboarding' | 'game' | 'results' | 'locked' | 'unlocked' | 'lab' | 'hof';

const ONBOARDING_KEY = 'dialedin_onboarding_completed';

const AppContent = () => {
  const [view, setView] = useState<View>('game');
  const [results, setResults] = useState<GuessResult[] | null>(null);
  const [gameKey, setGameKey] = useState(0); // Force remount when starting new game
  const [unlockTime, setUnlockTime] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      setView('onboarding');
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setView('game');
  };

  const handleGameComplete = (
    gameResults: GuessResult[],
    isLocked?: boolean,
    unlockTimeIso?: string
  ) => {
    setResults(gameResults);

    // Calculate total score (will be 0 if locked)
    const total = gameResults.reduce((sum, r) => sum + (r.score || 0), 0);
    setTotalScore(total);

    if (isLocked && unlockTimeIso) {
      setUnlockTime(unlockTimeIso);
      setView('locked');
    } else {
      // Results are unlocked, show swipeable reveal
      setView('unlocked');
    }
  };

  const handleUnlock = () => {
    // When timer reaches zero, transition to unlocked reveal
    setView('unlocked');
  };

  const handlePlayAgain = () => {
    setGameKey((prev) => prev + 1); // Force GameScreen to remount with fresh state
    setView('game');
  };

  const renderView = () => {
    switch (view) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      case 'locked':
        return (
          <LockedResultsScreen
            unlockTime={unlockTime || new Date().toISOString()}
            totalScore={totalScore}
            completedRounds={results?.length || 0}
            onUnlock={handleUnlock}
          />
        );
      case 'unlocked':
        return <UnlockedRevealScreen results={results || []} onComplete={() => setView('hof')} />;
      case 'results':
        return <ResultsScreen results={results} onPlayAgain={handlePlayAgain} />;
      case 'lab':
        return <SpectrumLabScreen />;
      case 'hof':
        return <HallOfFameScreen />;
      case 'game':
      default:
        return <GameScreen key={gameKey} onGameComplete={handleGameComplete} />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-transparent overflow-hidden transition-colors duration-300">
      <main className="flex flex-1 flex-col overflow-hidden page-transition">{renderView()}</main>
    </div>
  );
};

export const App = () => {
  return <AppContent />;
};
