import type { DailyGame, GuessResult, SpectrumSubmission, UserStats } from '../types';

export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type DailyGameResponse = {
  type: 'daily-game';
  game: DailyGame;
  /**
   * Optional prior per-round results for this user on today's game.
   * When present, the client can resume or show "you already played today".
   */
  priorResults?: GuessResult[];
  /**
   * Optional saved game state (dial position, current round, status).
   * Used for cross-device persistence.
   */
  savedGameState?: {
    currentRoundIndex: number;
    dialValue: number;
    gameStatus: 'playing' | 'round_end' | 'game_over';
  };
};

export type GuessRequestBody = {
  roundIndex: number;
  /**
   * Dial position selected by the player, in the range 0–100.
   */
  dialValue: number;
};

export type GuessResponse = {
  type: 'guess';
  result: GuessResult;
};

/**
 * Spectrum Lab – UGC endpoints
 */

export type SpectrumLabListResponse = {
  type: 'spectrum-lab-list';
  submissions: SpectrumSubmission[];
};

export type SpectrumLabSubmitRequest = {
  leftLabel: string;
  rightLabel: string;
  sampleClue?: string;
};

export type SpectrumLabSubmitResponse = {
  type: 'spectrum-lab-submit';
  submission: SpectrumSubmission;
};

export type SpectrumLabVoteRequest = {
  submissionId: string;
  direction: 'up' | 'down';
};

export type SpectrumLabVoteResponse = {
  type: 'spectrum-lab-vote';
  submission: SpectrumSubmission;
};

/**
 * Hall of Fame / leaderboards
 */

export type LeaderboardEntry = {
  userId: string;
  username?: string;
  totalScore: number;
  weeklyScore: number;
  streakCurrent: number;
  averageDistanceToTarget: number;
  averageDistanceFromReddit: number;
};

export type LeaderboardResponse = {
  type: 'leaderboard';
  topTotalScore: LeaderboardEntry[];
  topWeeklyScore: LeaderboardEntry[];
  topStreaks: LeaderboardEntry[];
  mostAligned: LeaderboardEntry[];
  mostControversial: LeaderboardEntry[];
};

export type UserStatsResponse = {
  type: 'user-stats';
  userId: string;
  stats: UserStats | null;
  ranks: {
    totalScoreRank?: number | undefined;
    weeklyScoreRank?: number | undefined;
    streakRank?: number | undefined;
    alignmentRank?: number | undefined;
    controversialRank?: number | undefined;
  } | null;
};

export type SaveGameStateRequest = {
  currentRoundIndex: number;
  dialValue: number;
  gameStatus: 'playing' | 'round_end' | 'game_over';
};

export type SaveGameStateResponse = {
  type: 'save-game-state';
  success: boolean;
};
