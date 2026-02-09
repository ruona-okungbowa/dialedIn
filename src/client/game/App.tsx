import { useState } from 'react';

import type { GuessResult } from '../../shared/types';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { GameScreen } from './GameScreen';
import { ResultsScreen } from './ResultsScreen';
import { SpectrumLabScreen } from '../lab/SpectrumLabScreen';
import { HallOfFameScreen } from '../hof/HallOfFameScreen';

type View = 'game' | 'results' | 'lab' | 'hof';

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors touch-manipulation"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <span className="text-lg">☀️</span>
      ) : (
        <span className="text-lg">🌙</span>
      )}
    </button>
  );
};

const AppContent = () => {
  const [view, setView] = useState<View>('game');
  const [results, setResults] = useState<GuessResult[] | null>(null);
  const [gameKey, setGameKey] = useState(0); // Force remount when starting new game

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
      {/* <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Dial it in
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Daily Wavelength Challenge
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {(() => {
              if (view === 'game') return 'Lock in your 3 rounds';
              if (view === 'results') return 'Your daily breakdown';
              if (view === 'lab') return 'Spectrum Lab';
              return 'Hall of Fame';
            })()}
          </div>
          <ThemeToggle />
          <SettingsButton />
        </div>
      </header> */}

      <main className="flex flex-1 flex-col overflow-hidden page-transition">{renderView()}</main>
    </div>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
