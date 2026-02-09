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

type StateValidationResult = {
  state: GameState | null;
  isFromPreviousDay: boolean;
  canContinuePreviousDay: boolean;
  previousDayDate?: string;
};

const STORAGE_KEY = 'dialedin_game_state';

// Extract date from gameId (format: YYYY-MM-DD-SubredditName)
const extractDateFromGameId = (gameId: string): string | null => {
  const match = gameId.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

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

  const loadStateWithDateValidation = (currentGameId: string): StateValidationResult => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return {
          state: null,
          isFromPreviousDay: false,
          canContinuePreviousDay: false,
        };
      }

      const state = JSON.parse(saved) as GameState;
      const savedDate = extractDateFromGameId(state.gameId);
      const currentDate = extractDateFromGameId(currentGameId);

      // If dates match, return the state normally
      if (savedDate === currentDate) {
        return {
          state,
          isFromPreviousDay: false,
          canContinuePreviousDay: false,
        };
      }

      // Dates differ - this is from a previous day
      const isFromPreviousDay = true;

      // Grace period: Allow completion if game is not finished
      const canContinuePreviousDay =
        state.gameStatus !== 'game_over' && state.roundResults.length < 3;

      return {
        state: canContinuePreviousDay ? state : null,
        isFromPreviousDay,
        canContinuePreviousDay,
        previousDayDate: savedDate || undefined,
      };
    } catch (e) {
      console.error('Failed to load game state:', e);
      return {
        state: null,
        isFromPreviousDay: false,
        canContinuePreviousDay: false,
      };
    }
  };

  const clearState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear game state:', e);
    }
  };

  return { saveState, loadState, loadStateWithDateValidation, clearState };
};

export type { GameState, GameStatus, StateValidationResult };
