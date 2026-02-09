import type { GuessResult } from '../../shared/types';

type GameStatus = 'playing' | 'round_end' | 'game_over';

type GameState = {
  gameId: string;
  currentRoundIndex: number;
  roundResults: GuessResult[];
  dialValue: number;
  gameStatus: GameStatus;
  totalScore: number;
};

const STORAGE_KEY = 'dialedin_game_state';

export const useGameState = () => {
  const saveState = (state: GameState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  };

  const loadState = (gameId: string): GameState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const state = JSON.parse(saved) as GameState;
      // Only return state if it matches the current game ID
      if (state.gameId === gameId) {
        return state;
      }

      // Clear old state if it's for a different game
      localStorage.removeItem(STORAGE_KEY);
      return null;
    } catch (e) {
      console.error('Failed to load game state:', e);
      return null;
    }
  };

  const clearState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear game state:', e);
    }
  };

  return { saveState, loadState, clearState };
};

export type { GameState, GameStatus };
