import express from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  DailyGameResponse,
  GuessRequestBody,
  GuessResponse,
  LeaderboardResponse,
  SpectrumLabListResponse,
  SpectrumLabSubmitRequest,
  SpectrumLabSubmitResponse,
  SpectrumLabVoteRequest,
  SpectrumLabVoteResponse,
  UserStatsResponse,
  SaveGameStateRequest,
  SaveGameStateResponse,
} from '../shared/types/api';
import type { LeaderboardEntry } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import type { DailyGame, GuessResult, SpectrumSubmission, UserStats } from '../shared/types';
import { computeRedditAverage, dialValueToScore, updateStreak } from '../shared/gameLogic';
import { pickDailySpectrumsForSubreddit, getDailyGameConfig } from '../shared/data/spectrums';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

const NUM_REDDIT_AVERAGE_BUCKETS = 20;
const SPECTRUM_LAB_KEY = (subredditKey: string): string => `spectrumLab:${subredditKey}`;
const USER_STATS_COLLECTION_KEY = 'userStatsCollection';

type UserStatsCollection = Record<string, UserStats>;

const getTodayDate = (): string => {
  // Use UTC date to avoid per‑region rollovers causing duplicate games.
  return new Date().toISOString().slice(0, 10) + '-dev';
};

const getSubredditKey = (): string => {
  // Prefer the internal subredditId if available, otherwise fall back to name,
  // and finally to a global default to keep keys consistent.
  const subredditId = context.subredditId;
  const subredditName = context.subredditName;

  if (subredditId) return subredditId;
  if (subredditName) return subredditName;
  return 'global';
};

const getUserKey = async (): Promise<string> => {
  // Try to use a stable userId if available; otherwise fall back to username,
  // and finally to an anonymous bucket.
  if (context.userId) {
    return context.userId;
  }

  try {
    const username = await reddit.getCurrentUsername();
    if (username) return username;
  } catch {
    // ignore – we’ll fall through to anonymous
  }

  return 'anonymous';
};

const dailyGameKey = (date: string, subredditKey: string): string =>
  `dailyGame:${date}:${subredditKey}`;

const guessBucketsKey = (date: string, subredditKey: string, roundIndex: number): string =>
  `guessBuckets:${date}:${subredditKey}:${roundIndex}`;

const userResultsKey = (date: string, subredditKey: string, userKey: string): string =>
  `userResults:${date}:${subredditKey}:${userKey}`;

const userGameStateKey = (date: string, subredditKey: string, userKey: string): string =>
  `userGameState:${date}:${subredditKey}:${userKey}`;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const dialValueToBucketIndex = (dialValue: number): number => {
  const clamped = clamp(dialValue, 0, 100);
  const bucketSize = 100 / NUM_REDDIT_AVERAGE_BUCKETS;
  const index = Math.floor(clamped / bucketSize);
  return clamp(index, 0, NUM_REDDIT_AVERAGE_BUCKETS - 1);
};

/**
 * Calculate the median of an array of numbers.
 * Used for determining community consensus target.
 */
const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 50; // Default to middle if no data

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
};

/**
 * Reconstruct all guess values from bucket data.
 * Each bucket represents a range of dial values.
 */
const reconstructGuessesFromBuckets = (buckets: number[]): number[] => {
  const guesses: number[] = [];
  const bucketSize = 100 / NUM_REDDIT_AVERAGE_BUCKETS;

  buckets.forEach((count, bucketIndex) => {
    // Use the midpoint of each bucket as the representative value
    const bucketMidpoint = (bucketIndex + 0.5) * bucketSize;
    for (let i = 0; i < count; i++) {
      guesses.push(bucketMidpoint);
    }
  });

  return guesses;
};

/**
 * Determine the active target for a round using the Hybrid Consensus Model.
 *
 * Phase 1 (Seed): Use seedTarget for first 2 hours OR until 10+ responses
 * Phase 2 (Community): Use median of all guesses after thresholds met
 */
const getActiveTarget = (
  seedTarget: number,
  buckets: number[],
  gameCreatedAt: string
): { target: number; targetType: 'seed' | 'community'; communitySize: number } => {
  const totalGuesses = buckets.reduce((sum, count) => sum + count, 0);
  const hoursSinceCreation = (Date.now() - new Date(gameCreatedAt).getTime()) / (1000 * 60 * 60);

  const hasEnoughData = totalGuesses >= 10;
  const isPastSeedPhase = hoursSinceCreation >= 2;

  // Use community consensus if we have enough data AND enough time has passed
  if (hasEnoughData && isPastSeedPhase) {
    const allGuesses = reconstructGuessesFromBuckets(buckets);
    const communityMedian = calculateMedian(allGuesses);
    return {
      target: Math.round(communityMedian),
      targetType: 'community',
      communitySize: totalGuesses,
    };
  }

  // Otherwise use seed target
  return {
    target: seedTarget,
    targetType: 'seed',
    communitySize: totalGuesses,
  };
};

const getSpectrumLabForSubreddit = async (subredditKey: string): Promise<SpectrumSubmission[]> => {
  const key = SPECTRUM_LAB_KEY(subredditKey);
  const raw = await redis.get(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SpectrumSubmission[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore parse errors and treat as empty lab
  }

  return [];
};

const saveSpectrumLabForSubreddit = async (
  subredditKey: string,
  submissions: SpectrumSubmission[]
): Promise<void> => {
  const key = SPECTRUM_LAB_KEY(subredditKey);
  await redis.set(key, JSON.stringify(submissions));
};

const getAllUserStats = async (): Promise<UserStatsCollection> => {
  const raw = await redis.get(USER_STATS_COLLECTION_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as UserStatsCollection;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // ignore parse errors and fall back to empty collection
  }

  return {};
};

const saveAllUserStats = async (stats: UserStatsCollection): Promise<void> => {
  await redis.set(USER_STATS_COLLECTION_KEY, JSON.stringify(stats));
};

const getOrCreateDailyGame = async (subredditKey: string): Promise<DailyGame> => {
  const date = getTodayDate();
  const key = dailyGameKey(date, subredditKey);

  const existing = await redis.get(key);
  if (existing) {
    try {
      return JSON.parse(existing) as DailyGame;
    } catch {
      // fall through and regenerate if parsing fails
    }
  }

  // Get the daily configuration with real clues and targets
  const dailyConfig = getDailyGameConfig(date);

  if (!dailyConfig) {
    throw new Error('Failed to get daily game configuration');
  }

  // Use the spectrum from the daily config
  const spectrums: DailyGame['spectrums'] = [
    {
      ...dailyConfig.spectrum,
      subredditId: subredditKey,
    },
  ];

  // Build rounds from the daily config with seed targets
  const rounds: DailyGame['rounds'] = dailyConfig.rounds.map((round, index) => ({
    roundIndex: index,
    clue: round.clue,
    target: round.seedTarget,
    maxScore: 100,
  }));

  const game: DailyGame = {
    date,
    subredditId: subredditKey,
    createdAt: new Date().toISOString(),
    spectrums,
    rounds,
  };

  await redis.set(key, JSON.stringify(game));

  return game;
};

const getUserResultsForToday = async (
  subredditKey: string,
  userKey: string
): Promise<GuessResult[]> => {
  const date = getTodayDate();
  const key = userResultsKey(date, subredditKey, userKey);
  const raw = await redis.get(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as GuessResult[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore parse errors and treat as no data
  }

  return [];
};

const saveUserResultsForToday = async (
  subredditKey: string,
  userKey: string,
  results: GuessResult[]
): Promise<void> => {
  const date = getTodayDate();
  const key = userResultsKey(date, subredditKey, userKey);
  await redis.set(key, JSON.stringify(results));
};

type UserGameState = {
  currentRoundIndex: number;
  dialValue: number;
  gameStatus: 'playing' | 'round_end' | 'game_over';
  lastUpdated: string;
};

const getUserGameStateForToday = async (
  subredditKey: string,
  userKey: string
): Promise<UserGameState | null> => {
  const date = getTodayDate();
  const key = userGameStateKey(date, subredditKey, userKey);
  const raw = await redis.get(key);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as UserGameState;
    return parsed;
  } catch {
    return null;
  }
};

const saveUserGameStateForToday = async (
  subredditKey: string,
  userKey: string,
  state: UserGameState
): Promise<void> => {
  const date = getTodayDate();
  const key = userGameStateKey(date, subredditKey, userKey);
  await redis.set(key, JSON.stringify(state));
};

const getBucketsForToday = async (subredditKey: string, roundIndex: number): Promise<number[]> => {
  const date = getTodayDate();
  const key = guessBucketsKey(date, subredditKey, roundIndex);
  const raw = await redis.get(key);

  if (!raw) {
    return new Array(NUM_REDDIT_AVERAGE_BUCKETS).fill(0);
  }

  try {
    const parsed = JSON.parse(raw) as number[];
    if (Array.isArray(parsed) && parsed.length === NUM_REDDIT_AVERAGE_BUCKETS) {
      return parsed;
    }
  } catch {
    // ignore parse errors and re‑initialise
  }

  return new Array(NUM_REDDIT_AVERAGE_BUCKETS).fill(0);
};

const saveBucketsForToday = async (
  subredditKey: string,
  roundIndex: number,
  buckets: number[]
): Promise<void> => {
  const date = getTodayDate();
  const key = guessBucketsKey(date, subredditKey, roundIndex);
  await redis.set(key, JSON.stringify(buckets));
};

// Helper function to get the Monday of the current week
const getWeekStartDate = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days; otherwise go to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
};

const updateUserStatsAfterGameCompletion = async (
  userKey: string,
  results: GuessResult[]
): Promise<void> => {
  if (!results.length) return;

  const allStats = await getAllUserStats();
  const currentWeekStart = getWeekStartDate();

  const prev: UserStats =
    allStats[userKey] ??
    ({
      userId: userKey,
      streak: { current: 0, best: 0 },
      totalScore: 0,
      weeklyScore: 0,
      weekStartDate: currentWeekStart,
      gamesPlayed: 0,
      averageDistanceToTarget: 0,
      averageDistanceFromReddit: 0,
    } as UserStats);

  // Try to resolve a display username for this user (best-effort). If reddit
  // API call fails, fall back to existing stored username or userId.
  let resolvedUsername: string | undefined = prev.username;
  try {
    const uname = await reddit.getCurrentUsername();
    if (uname) resolvedUsername = uname;
  } catch {
    // ignore – keep prev.username or undefined
  }

  const totalScoreForDay = results.reduce(
    (sum, r) => sum + (typeof r.score === 'number' ? r.score : 0),
    0
  );

  const sumDistanceToTarget = results.reduce(
    (sum, r) => sum + Math.abs(r.distanceFromTarget ?? 0),
    0
  );

  const sumDistanceFromReddit = results.reduce(
    (sum, r) => sum + Math.abs(r.distanceFromRedditAverage ?? 0),
    0
  );

  const completedGamesPrev = prev.gamesPlayed;
  const roundsPerGame = 3;
  const totalRoundsPrev = completedGamesPrev * roundsPerGame;
  const totalRoundsNew = totalRoundsPrev + results.length;

  const averageDistanceToTarget =
    totalRoundsNew > 0
      ? (prev.averageDistanceToTarget * totalRoundsPrev + sumDistanceToTarget) / totalRoundsNew
      : prev.averageDistanceToTarget;

  const averageDistanceFromReddit =
    totalRoundsNew > 0
      ? (prev.averageDistanceFromReddit * totalRoundsPrev + sumDistanceFromReddit) / totalRoundsNew
      : prev.averageDistanceFromReddit;

  const gamesPlayed = prev.gamesPlayed + 1;
  const totalScore = prev.totalScore + totalScoreForDay;

  // Treat “good” days as those where the player averages at least 70/100.
  const hitThreshold = totalScoreForDay >= 70 * results.length;
  const streak = updateStreak(prev.streak, true, hitThreshold);

  // Weekly score handling: if the stored weekStartDate matches the current
  // week, accumulate; otherwise reset to this day's total.
  const prevWeekStart = prev.weekStartDate ?? currentWeekStart;
  let weeklyScore = prev.weeklyScore ?? 0;
  let weekStartDate = prevWeekStart;

  if (prevWeekStart === currentWeekStart) {
    weeklyScore = (weeklyScore ?? 0) + totalScoreForDay;
  } else {
    weeklyScore = totalScoreForDay;
    weekStartDate = currentWeekStart;
  }

  allStats[userKey] = {
    userId: userKey,
    ...(resolvedUsername !== undefined && { username: resolvedUsername }),
    streak,
    totalScore,
    weeklyScore,
    weekStartDate,
    gamesPlayed,
    averageDistanceToTarget,
    averageDistanceFromReddit,
  };

  await saveAllUserStats(allStats);
};

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? Number.parseInt(count, 10) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.get<{}, DailyGameResponse | { status: string; message: string }>(
  '/api/daily-game',
  async (_req, res): Promise<void> => {
    const subredditKey = getSubredditKey();

    try {
      const [game, userKey] = await Promise.all([getOrCreateDailyGame(subredditKey), getUserKey()]);

      const [priorResults, savedGameState] = await Promise.all([
        getUserResultsForToday(subredditKey, userKey),
        getUserGameStateForToday(subredditKey, userKey),
      ]);

      const response: DailyGameResponse = {
        type: 'daily-game',
        game,
      };

      if (priorResults.length) {
        response.priorResults = priorResults;
      }

      if (savedGameState) {
        response.savedGameState = {
          currentRoundIndex: savedGameState.currentRoundIndex,
          dialValue: savedGameState.dialValue,
          gameStatus: savedGameState.gameStatus,
        };
      }

      res.json(response);
    } catch (error) {
      console.error('API Daily Game Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to load daily game',
      });
    }
  }
);

router.post<{}, GuessResponse | { status: string; message: string }, GuessRequestBody>(
  '/api/guess',
  async (req, res): Promise<void> => {
    const { roundIndex, dialValue } = req.body ?? {};

    if (
      typeof roundIndex !== 'number' ||
      !Number.isInteger(roundIndex) ||
      roundIndex < 0 ||
      roundIndex > 2
    ) {
      res.status(400).json({
        status: 'error',
        message: 'roundIndex must be an integer between 0 and 2',
      });
      return;
    }

    if (typeof dialValue !== 'number' || Number.isNaN(dialValue)) {
      res.status(400).json({
        status: 'error',
        message: 'dialValue must be a number',
      });
      return;
    }

    const subredditKey = getSubredditKey();

    try {
      const [game, userKey, existingBuckets, existingResults] = await Promise.all([
        getOrCreateDailyGame(subredditKey),
        getUserKey(),
        getBucketsForToday(subredditKey, roundIndex),
        getUserResultsForToday(subredditKey, await getUserKey()),
      ]);

      const round = game.rounds[roundIndex];

      if (!round) {
        res.status(400).json({
          status: 'error',
          message: `No round configuration found for index ${roundIndex}`,
        });
        return;
      }

      const clampedDial = clamp(dialValue, 0, 100);
      const seedTarget = clamp(round.target, 0, 100);

      // HYBRID CONSENSUS MODEL: Determine active target
      // Use seed for first 2 hours OR until 10+ responses
      // Then switch to community median
      const { target, targetType, communitySize } = getActiveTarget(
        seedTarget,
        existingBuckets,
        game.createdAt
      );

      const bucketIndex = dialValueToBucketIndex(clampedDial);
      const updatedBuckets = [...existingBuckets];
      updatedBuckets[bucketIndex] = (updatedBuckets[bucketIndex] ?? 0) + 1;

      const redditAverage = computeRedditAverage(updatedBuckets);

      const score = dialValueToScore(clampedDial, target, round.maxScore);
      const distanceFromTarget = Math.abs(clampedDial - target);
      const distanceFromRedditAverage = Math.abs(clampedDial - redditAverage);

      const totalBefore = existingResults.reduce(
        (sum, r) => sum + (typeof r.score === 'number' ? r.score : 0),
        0
      );

      const result: GuessResult = {
        roundIndex,
        dialValue: clampedDial,
        target,
        redditAverage,
        distanceFromTarget,
        distanceFromRedditAverage,
        score,
        totalScoreAfterRound: totalBefore + score,
        isPerfect: score === round.maxScore,
      };

      const nextResults = [
        ...existingResults.filter((r) => r.roundIndex !== roundIndex),
        result,
      ].sort((a, b) => a.roundIndex - b.roundIndex);

      await Promise.all([
        saveBucketsForToday(subredditKey, roundIndex, updatedBuckets),
        saveUserResultsForToday(subredditKey, userKey, nextResults),
      ]);

      // When the user finishes round 3 (index 2), treat this as a completed
      // daily game and roll the per‑round results into Hall of Fame stats.
      const hasCompletedAllRounds =
        nextResults.length >= 3 &&
        nextResults.some((r) => r.roundIndex === 0) &&
        nextResults.some((r) => r.roundIndex === 1) &&
        nextResults.some((r) => r.roundIndex === 2);

      if (hasCompletedAllRounds) {
        await updateUserStatsAfterGameCompletion(userKey, nextResults);
      }

      res.json({
        type: 'guess',
        result,
      });
    } catch (error) {
      console.error('API Guess Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit guess',
      });
    }
  }
);

router.post<{}, SaveGameStateResponse | { status: string; message: string }, SaveGameStateRequest>(
  '/api/save-game-state',
  async (req, res): Promise<void> => {
    const { currentRoundIndex, dialValue, gameStatus } = req.body ?? {};

    if (
      typeof currentRoundIndex !== 'number' ||
      !Number.isInteger(currentRoundIndex) ||
      currentRoundIndex < 0 ||
      currentRoundIndex > 2
    ) {
      res.status(400).json({
        status: 'error',
        message: 'currentRoundIndex must be an integer between 0 and 2',
      });
      return;
    }

    if (typeof dialValue !== 'number' || Number.isNaN(dialValue)) {
      res.status(400).json({
        status: 'error',
        message: 'dialValue must be a number',
      });
      return;
    }

    if (!['playing', 'round_end', 'game_over'].includes(gameStatus)) {
      res.status(400).json({
        status: 'error',
        message: 'gameStatus must be playing, round_end, or game_over',
      });
      return;
    }

    const subredditKey = getSubredditKey();

    try {
      const userKey = await getUserKey();

      await saveUserGameStateForToday(subredditKey, userKey, {
        currentRoundIndex,
        dialValue,
        gameStatus,
        lastUpdated: new Date().toISOString(),
      });

      res.json({
        type: 'save-game-state',
        success: true,
      });
    } catch (error) {
      console.error('API Save Game State Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to save game state',
      });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.get<{}, SpectrumLabListResponse | { status: string; message: string }>(
  '/api/spectrum-lab',
  async (_req, res): Promise<void> => {
    const subredditKey = getSubredditKey();

    try {
      const submissions = await getSpectrumLabForSubreddit(subredditKey);
      submissions.sort((a, b) => b.score - a.score);

      const response: SpectrumLabListResponse = {
        type: 'spectrum-lab-list',
        submissions,
      };

      res.json(response);
    } catch (error) {
      console.error('API Spectrum Lab List Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to load Spectrum Lab',
      });
    }
  }
);

router.post<
  {},
  SpectrumLabSubmitResponse | { status: string; message: string },
  SpectrumLabSubmitRequest
>('/api/spectrum-lab', async (req, res): Promise<void> => {
  const subredditKey = getSubredditKey();

  const leftLabel = req.body?.leftLabel?.trim();
  const rightLabel = req.body?.rightLabel?.trim();
  const sampleClue = req.body?.sampleClue?.trim();

  if (!leftLabel || !rightLabel) {
    res.status(400).json({
      status: 'error',
      message: 'leftLabel and rightLabel are required',
    });
    return;
  }

  try {
    const userKey = await getUserKey();
    const submissions = await getSpectrumLabForSubreddit(subredditKey);

    const id = `lab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const submission: SpectrumSubmission = {
      id,
      leftLabel,
      rightLabel,
      subredditId: subredditKey,
      // Explicitly omit sampleClue when empty to satisfy exactOptionalPropertyTypes.
      ...(sampleClue
        ? {
            sampleClue,
          }
        : {}),
      createdByUserId: userKey,
      createdAt: new Date().toISOString(),
      score: 0,
      upvotes: 0,
      downvotes: 0,
    };

    const next = [...submissions, submission].sort((a, b) => b.score - a.score);
    await saveSpectrumLabForSubreddit(subredditKey, next);

    const response: SpectrumLabSubmitResponse = {
      type: 'spectrum-lab-submit',
      submission,
    };

    res.json(response);
  } catch (error) {
    console.error('API Spectrum Lab Submit Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit spectrum',
    });
  }
});

router.post<
  {},
  SpectrumLabVoteResponse | { status: string; message: string },
  SpectrumLabVoteRequest
>('/api/spectrum-lab/vote', async (req, res): Promise<void> => {
  const subredditKey = getSubredditKey();
  const { submissionId, direction } = req.body ?? {};

  if (!submissionId || (direction !== 'up' && direction !== 'down')) {
    res.status(400).json({
      status: 'error',
      message: 'submissionId and direction ("up" | "down") are required',
    });
    return;
  }

  try {
    const submissions = await getSpectrumLabForSubreddit(subredditKey);
    const index = submissions.findIndex((s) => s.id === submissionId);

    if (index === -1) {
      res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
      return;
    }

    const existing = submissions[index] as SpectrumSubmission;
    const updated: SpectrumSubmission = {
      id: existing.id,
      leftLabel: existing.leftLabel,
      rightLabel: existing.rightLabel,
      ...(existing.subredditId
        ? {
            subredditId: existing.subredditId,
          }
        : {}),
      createdByUserId: existing.createdByUserId,
      createdAt: existing.createdAt,
      score: existing.score,
      upvotes: existing.upvotes,
      downvotes: existing.downvotes,
      ...(existing.sampleClue
        ? {
            sampleClue: existing.sampleClue,
          }
        : {}),
    };
    if (direction === 'up') {
      updated.upvotes = (updated.upvotes ?? 0) + 1;
    } else {
      updated.downvotes = (updated.downvotes ?? 0) + 1;
    }
    updated.score = (updated.upvotes ?? 0) - (updated.downvotes ?? 0);

    const next = [...submissions];
    next[index] = updated;
    next.sort((a, b) => b.score - a.score);

    await saveSpectrumLabForSubreddit(subredditKey, next);

    const response: SpectrumLabVoteResponse = {
      type: 'spectrum-lab-vote',
      submission: updated,
    };

    res.json(response);
  } catch (error) {
    console.error('API Spectrum Lab Vote Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to vote on spectrum',
    });
  }
});

router.get<{}, LeaderboardResponse | { status: string; message: string }>(
  '/api/leaderboard',
  async (_req, res): Promise<void> => {
    try {
      const currentWeekStart = getWeekStartDate();
      const allStats = await getAllUserStats();
      const entries = Object.values(allStats);

      const toLeaderboardEntry = (stats: UserStats): LeaderboardEntry => {
        const entry: LeaderboardEntry = {
          userId: stats.userId,
          totalScore: stats.totalScore,
          // Only count weeklyScore if it belongs to the current week; otherwise treat as 0
          weeklyScore: stats.weekStartDate === currentWeekStart ? (stats.weeklyScore ?? 0) : 0,
          streakCurrent: stats.streak.current,
          averageDistanceToTarget: stats.averageDistanceToTarget,
          averageDistanceFromReddit: stats.averageDistanceFromReddit,
        };
        if (stats.username !== undefined) {
          entry.username = stats.username;
        }
        return entry;
      };

      const byTotalScore = [...entries]
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10)
        .map(toLeaderboardEntry);

      const byWeeklyScore = [...entries]
        .map((s) => ({
          stats: s,
          score: s.weekStartDate === currentWeekStart ? (s.weeklyScore ?? 0) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((p) => toLeaderboardEntry(p.stats));

      const byStreak = [...entries]
        .sort((a, b) => b.streak.current - a.streak.current)
        .slice(0, 10)
        .map(toLeaderboardEntry);

      const mostAligned = [...entries]
        .filter((e) => e.gamesPlayed > 0)
        .sort((a, b) => a.averageDistanceToTarget - b.averageDistanceToTarget)
        .slice(0, 10)
        .map(toLeaderboardEntry);

      const mostControversial = [...entries]
        .filter((e) => e.gamesPlayed > 0)
        .sort((a, b) => b.averageDistanceFromReddit - a.averageDistanceFromReddit)
        .slice(0, 10)
        .map(toLeaderboardEntry);

      // Collect all unique user IDs that need username resolution
      const allLeaderboardEntries = [
        ...byTotalScore,
        ...byWeeklyScore,
        ...byStreak,
        ...mostAligned,
        ...mostControversial,
      ];
      const entriesNeedingUsernames = allLeaderboardEntries.filter((e) => !e.username);
      const uniqueUserIds = [...new Set(entriesNeedingUsernames.map((e) => e.userId))];

      // Fetch usernames for users who don't have them stored
      const usernameMap = new Map<string, string>();
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            // Only fetch if userId looks like a Reddit user ID (t2_ prefix)
            if (userId.startsWith('t2_')) {
              const user = await reddit.getUserById(userId);
              if (user?.username) {
                usernameMap.set(userId, user.username);
              }
            }
          } catch (error) {
            // Silently fail for individual user lookups
            console.warn(`Failed to fetch username for ${userId}:`, error);
          }
        })
      );

      // Update entries with fetched usernames
      const updateEntryUsername = (entry: LeaderboardEntry): LeaderboardEntry => {
        if (!entry.username && usernameMap.has(entry.userId)) {
          return { ...entry, username: usernameMap.get(entry.userId) };
        }
        return entry;
      };

      const response: LeaderboardResponse = {
        type: 'leaderboard',
        topTotalScore: byTotalScore.map(updateEntryUsername),
        topWeeklyScore: byWeeklyScore.map(updateEntryUsername),
        topStreaks: byStreak.map(updateEntryUsername),
        mostAligned: mostAligned.map(updateEntryUsername),
        mostControversial: mostControversial.map(updateEntryUsername),
      };

      res.json(response);
    } catch (error) {
      console.error('API Leaderboard Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to load Hall of Fame',
      });
    }
  }
);

router.get<{}, UserStatsResponse | { status: string; message: string }>(
  '/api/user-stats',
  async (_req, res): Promise<void> => {
    try {
      const userKey = await getUserKey();
      const allStats = await getAllUserStats();
      let stats = allStats[userKey] ?? null;

      // Try to fetch the current user's username if not already stored
      if (stats && !stats.username) {
        try {
          const username = await reddit.getCurrentUsername();
          if (username) {
            stats = { ...stats, username };
          }
        } catch (error) {
          // Silently fail - username is optional
          console.warn('Failed to fetch current username:', error);
        }
      }

      // If stats is null but we have a userKey, try to fetch username for display
      if (!stats) {
        try {
          const username = await reddit.getCurrentUsername();
          if (username) {
            stats = {
              userId: userKey,
              username,
              streak: { current: 0, best: 0 },
              totalScore: 0,
              weeklyScore: 0,
              weekStartDate: getWeekStartDate(),
              gamesPlayed: 0,
              averageDistanceToTarget: 0,
              averageDistanceFromReddit: 0,
            };
          }
        } catch (error) {
          // Silently fail
          console.warn('Failed to fetch username for new user:', error);
        }
      }

      const entries = Object.values(allStats);

      const rankOf = (sorted: UserStats[], userId: string): number | undefined => {
        const index = sorted.findIndex((s) => s.userId === userId);
        return index === -1 ? undefined : index + 1; // 1‑based ranks
      };

      const byTotalScore = [...entries].sort((a, b) => b.totalScore - a.totalScore);
      const byStreak = [...entries].sort((a, b) => b.streak.current - a.streak.current);
      const byAlignment = [...entries]
        .filter((e) => e.gamesPlayed > 0)
        .sort((a, b) => a.averageDistanceToTarget - b.averageDistanceToTarget);
      const byControversy = [...entries]
        .filter((e) => e.gamesPlayed > 0)
        .sort((a, b) => b.averageDistanceFromReddit - a.averageDistanceFromReddit);
      const currentWeekStart = getWeekStartDate();
      const byWeeklyScore = [...entries]
        .map((s) => ({
          stats: s,
          score: s.weekStartDate === currentWeekStart ? (s.weeklyScore ?? 0) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((p) => p.stats);

      const response: UserStatsResponse = {
        type: 'user-stats',
        userId: userKey,
        stats,
        ranks: {
          totalScoreRank: rankOf(byTotalScore, userKey),
          weeklyScoreRank: rankOf(byWeeklyScore, userKey),
          streakRank: rankOf(byStreak, userKey),
          alignmentRank: rankOf(byAlignment, userKey),
          controversialRank: rankOf(byControversy, userKey),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('API User Stats Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to load user stats',
      });
    }
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/clear-cache', async (_req, res): Promise<void> => {
  try {
    const date = getTodayDate();
    const subredditKey = getSubredditKey();

    // Clear daily game
    await redis.del(dailyGameKey(date, subredditKey));

    // Clear guess buckets for all rounds
    for (let i = 0; i < 3; i++) {
      await redis.del(guessBucketsKey(date, subredditKey, i));
    }

    res.json({
      status: 'success',
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error(`Error clearing cache: ${error}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cache',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
