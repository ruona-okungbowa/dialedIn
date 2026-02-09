import { useState, useEffect } from 'react';

import type { GuessResult } from '../../shared/types';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { GameScreen } from './GameScreen';
import { ResultsScreen } from './ResultsScreen';
import { SpectrumLabScreen } from '../lab/SpectrumLabScreen';
import { HallOfFameScreen } from '../hof/HallOfFameScreen';
import { OnboardingScreen } from '../onboarding/OnboardingScreen';

type View = 'onboarding' | 'game' | 'results' | 'lab' | 'hof';

const ONBOARDING_KEY = 'dialedin_onboarding_completed';

const AppContent = () => {
  const [view, setView] = useState<View>('game');
  const [results, setResults] = useState<GuessResult[] | null>(null);
  const [gameKey, setGameKey] = useState(0); // Force remount when starting new game
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
      setView('onboarding');
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
    setView('game');
  };

  const handleGameComplete = (gameResults: GuessResult[]) => {
    setResults(gameResults);
    setView('results');
  };

  const handlePlayAgain = () => {
    setGameKey((prev) => prev + 1); // Force GameScreen to remount with fresh state
    setView('game');
  };

  const renderView = () => {
    switch (view) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
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
