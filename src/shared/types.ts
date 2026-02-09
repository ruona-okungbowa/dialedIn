/**
 * A spectrum represents a conceptual range between two opposing ideas,
 * e.g. "Masterpiece ↔ Trash" for r/movies.
 */
export type Spectrum = {
  id: string;
  leftLabel: string;
  rightLabel: string;
  /**
   * Optional subreddit context (e.g. "t5_xxxxx" or "r/movies"). When present
   * this spectrum is considered subreddit-specific.
   */
  subredditId?: string;
  /**
   * Rough difficulty tier used when composing daily games.
   */
  difficulty?: 'easy' | 'medium' | 'hard';
  /**
   * Free-form tags to help grouping and selection.
   */
  tags?: string[];
};

/**
 * Configuration for a single round in the daily game.
 */
export type RoundConfig = {
  /**
   * Zero-based index within the daily game (0–2 for a 3‑round game).
   */
  roundIndex: number;
  /**
   * Human‑readable clue the user sees for this round.
   */
  clue: string;
  /**
   * Target position on the dial in the range 0–100.
   */
  target: number;
  /**
   * Maximum attainable score for this round (typically 100).
   */
  maxScore: number;
  /**
   * Optional “green band” width in dial units that counts as a strong hit.
   */
  greenBandWidth?: number;
};

/**
 * Definition of the full daily game for a given subreddit and date.
 */
export type DailyGame = {
  /**
   * ISO date string (YYYY‑MM‑DD) for which this game is valid.
   */
  date: string;
  /**
   * ISO timestamp of when this game was first created (for hybrid consensus timing).
   */
  createdAt: string;
  /**
   * Subreddit that this game is for.
   */
  subredditId: string;
  /**
   * Spectrums used across the 3 rounds (may be 1 or many).
   */
  spectrums: Spectrum[];
  /**
   * Per‑round configuration, always length 3 for the core loop.
   */
  rounds: RoundConfig[];
};

/**
 * Immutable record of a user’s guess for a particular round.
 */
export type Guess = {
  userId: string;
  roundIndex: number;
  /**
   * Position selected on the dial in the range 0–100.
   */
  dialValue: number;
  /**
   * ISO timestamp of when the guess was submitted.
   */
  createdAt: string;
};

/**
 * Result of evaluating a single guess against the target and community.
 */
export type GuessResult = {
  roundIndex: number;
  dialValue: number;
  target: number;
  /**
   * Community average as a dial value 0–100.
   */
  redditAverage: number;
  /**
   * Absolute distance between the player’s guess and the target.
   */
  distanceFromTarget: number;
  /**
   * Absolute distance between the player’s guess and the Reddit average.
   */
  distanceFromRedditAverage: number;
  /**
   * Score awarded for this round (0–maxScore).
   */
  score: number;
  /**
   * Running total score for the day after applying this round.
   */
  totalScoreAfterRound: number;
  /**
   * Convenience flag for “perfect” rounds.
   */
  isPerfect?: boolean;
};

/**
 * Streak information tracked per user.
 */
export type StreakState = {
  /**
   * Current number of consecutive successful days.
   */
  current: number;
  /**
   * Best (all‑time) streak for this user.
   */
  best: number;
};

/**
 * Aggregated user stats used for Hall of Fame and profile headers.
 */
export type UserStats = {
  userId: string;
  /** Optional display username (e.g., "spez"). When present, prefer this for UI. */
  username?: string;
  streak: StreakState;
  /**
   * Cumulative score across all games played.
   */
  totalScore: number;
  /**
   * Weekly score (resets every Monday at midnight).
   */
  weeklyScore: number;
  /**
   * ISO date string of the current week's Monday (YYYY-MM-DD).
   */
  weekStartDate: string;
  /**
   * Number of completed daily games.
   */
  gamesPlayed: number;
  /**
   * Average absolute distance from the target across all rounds.
   */
  averageDistanceToTarget: number;
  /**
   * Average absolute distance from the Reddit average across all rounds.
   */
  averageDistanceFromReddit: number;
};

/**
 * Spectrum Lab submission model – tracks community‑created spectrum ideas.
 */
export type SpectrumSubmission = {
  id: string;
  leftLabel: string;
  rightLabel: string;
  subredditId?: string;
  /**
   * Example clue for how this spectrum might be used.
   */
  sampleClue?: string;
  createdByUserId: string;
  createdAt: string;
  /**
   * Derived score used for “hottest” style sorting, typically upvotes‑downvotes.
   */
  score: number;
  upvotes: number;
  downvotes: number;
};

/**
 * Lightweight summary of a round used when building share strings, etc.
 */
export type RoundSummary = {
  roundIndex: number;
  dialValue: number;
  target: number;
  redditAverage: number;
  /**
   * Score the player earned in this round (0–maxScore).
   */
  score: number;
  /**
   * Absolute distance between guess and target for this round.
   */
  distanceFromTarget: number;
};
