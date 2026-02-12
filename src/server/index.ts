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
  ModeratorPendingListResponse,
  ModeratorApproveRequest,
  ModeratorApproveResponse,
  ModeratorRejectRequest,
  ModeratorRejectResponse,
} from '../shared/types/api';
import type { LeaderboardEntry } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import type { DailyGame, GuessResult, SpectrumSubmission, UserStats } from '../shared/types';
import { computeRedditAverage, dialValueToScore, updateStreak } from '../shared/gameLogic';
import { getDailyGameConfig } from '../shared/data/spectrums';

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
const USER_VOTES_KEY = (subredditKey: string, userKey: string): string =>
  `userVotes:${subredditKey}:${userKey}`;

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
 * Check if results are currently locked (hidden until 8pm on the calendar day the game was created).
 * Returns unlock time if locked, null if unlocked.
 *
 * Important: Games are created once per calendar day. Results for that day's game
 * unlock at 8pm (20:00) on the same calendar day, regardless of when the game was created.
 */
const getResultsLockStatus = (gameCreatedAt: string): { isLocked: boolean; unlockTime: string } => {
  const createdDate = new Date(gameCreatedAt);

  // Set unlock time to 8pm (20:00) on the same calendar day the game was created
  const unlockDate = new Date(createdDate);
  unlockDate.setHours(20, 0, 0, 0); // 8pm on the same day

  const now = Date.now();

  return {
    isLocked: now < unlockDate.getTime(),
    unlockTime: unlockDate.toISOString(),
  };
};

/**
 * Calculate the final target for scoring as the median of all community guesses.
 * This is used when results are unlocked to score against community consensus.
 */
const calculateFinalTarget = (buckets: number[]): number => {
  const allGuesses = reconstructGuessesFromBuckets(buckets);
  if (allGuesses.length === 0) return 50; // Default if no guesses
  return Math.round(calculateMedian(allGuesses));
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

type UserVotes = Record<string, 'up' | 'down'>;

const getUserVotes = async (subredditKey: string, userKey: string): Promise<UserVotes> => {
  const key = USER_VOTES_KEY(subredditKey, userKey);
  const raw = await redis.get(key);

  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as UserVotes;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // ignore parse errors and fall back to empty votes
  }

  return {};
};

const saveUserVotes = async (
  subredditKey: string,
  userKey: string,
  votes: UserVotes
): Promise<void> => {
  const key = USER_VOTES_KEY(subredditKey, userKey);
  await redis.set(key, JSON.stringify(votes));
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

  // Get approved user-generated spectrums
  const allSubmissions = await getSpectrumLabForSubreddit(subredditKey);
  let approvedSubmissions = allSubmissions
    .filter((s) => s.status === 'approved' && s.clues && s.clues.length === 3)
    .map((s) => ({
      id: s.id,
      leftLabel: s.leftLabel,
      rightLabel: s.rightLabel,
      clues: s.clues!,
    }));

  // Prevent using same spectrum twice in a row
  const lastUsedKey = `lastUsedSpectrum:${subredditKey}`;
  const lastUsed = await redis.get(lastUsedKey);
  if (lastUsed && approvedSubmissions.length > 1) {
    approvedSubmissions = approvedSubmissions.filter((s) => s.id !== lastUsed);
  }

  // Get the daily configuration with real clues and targets
  const dailyConfig = getDailyGameConfig(date, approvedSubmissions);

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

  // Build rounds from the daily config
  const rounds: DailyGame['rounds'] = dailyConfig.rounds.map((round, index) => ({
    roundIndex: index,
    clue: round.clue,
    target: 50, // Placeholder - will be calculated from community average after 8pm
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

  // Store the spectrum ID to prevent reuse tomorrow
  if (dailyConfig.day === -1) {
    // Only track user-generated spectrums (day === -1 indicates user-generated)
    await redis.set(lastUsedKey, dailyConfig.spectrum.id);
  }

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

const isModerator = async (): Promise<boolean> => {
  try {
    if (!context.subredditId) return false;

    const subreddit = await reddit.getSubredditById(context.subredditId);
    if (!subreddit) return false;

    const currentUser = await reddit.getCurrentUser();
    if (!currentUser) return false;

    const moderators = await subreddit.getModerators();
    const modList = await moderators.all();

    return modList.some((mod) => mod.username === currentUser.username);
  } catch {
    return false;
  }
};

// Helper function to get the current day date
const getCurrentDayDate = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
};

const updateUserStatsAfterGameCompletion = async (
  userKey: string,
  results: GuessResult[]
): Promise<void> => {
  if (!results.length) return;

  const allStats = await getAllUserStats();
  const currentDayDate = getCurrentDayDate();

  let prev: UserStats = allStats[userKey] ?? {
    userId: userKey,
    streak: { current: 0, best: 0 },
    totalScore: 0,
    dailyScore: 0,
    dayDate: currentDayDate,
    gamesPlayed: 0,
    averageDistanceToTarget: 0,
    averageDistanceFromReddit: 0,
  };

  // Migration: Convert old weeklyScore/weekStartDate to dailyScore/dayDate
  if ('weeklyScore' in prev || 'weekStartDate' in prev) {
    const oldData = prev as any;
    prev = {
      ...prev,
      dailyScore: 0, // Reset to 0 since we're migrating from weekly to daily
      dayDate: currentDayDate,
    };
    // Remove old fields
    delete (prev as any).weeklyScore;
    delete (prev as any).weekStartDate;
  }

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

  // Daily score handling: if the stored dayDate matches the current
  // day, use the new score; otherwise reset to this day's total.
  const prevDayDate = prev.dayDate ?? currentDayDate;
  let dailyScore = totalScoreForDay;
  let dayDate = currentDayDate;

  // If it's a different day, reset the daily score
  if (prevDayDate !== currentDayDate) {
    dailyScore = totalScoreForDay;
    dayDate = currentDayDate;
  }

  allStats[userKey] = {
    userId: userKey,
    ...(resolvedUsername !== undefined && { username: resolvedUsername }),
    streak,
    totalScore,
    dailyScore,
    dayDate,
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

      // Check if results are locked
      const lockStatus = getResultsLockStatus(game.createdAt);

      const response: DailyGameResponse = {
        type: 'daily-game',
        game,
        isLocked: lockStatus.isLocked,
        unlockTime: lockStatus.unlockTime,
      };

      if (priorResults.length) {
        // If locked, hide the actual values in prior results
        if (lockStatus.isLocked) {
          response.priorResults = priorResults.map((r) => ({
            ...r,
            target: 0,
            redditAverage: 0,
            distanceFromTarget: 0,
            distanceFromRedditAverage: 0,
            score: 0,
            totalScoreAfterRound: 0,
            isLocked: true,
          }));
        } else {
          // Results are unlocked - recalculate scores using final community average
          const recalculatedResults = await Promise.all(
            priorResults.map(async (r) => {
              // Get buckets for this round to calculate final target
              const buckets = await getBucketsForToday(subredditKey, r.roundIndex);
              const finalTarget = calculateFinalTarget(buckets);
              const redditAverage = computeRedditAverage(buckets);
              const round = game.rounds[r.roundIndex];

              if (!round) return r;

              const score = dialValueToScore(r.dialValue, finalTarget, round.maxScore);
              const distanceFromTarget = Math.abs(r.dialValue - finalTarget);
              const distanceFromRedditAverage = Math.abs(r.dialValue - redditAverage);

              return {
                ...r,
                target: finalTarget,
                redditAverage,
                distanceFromTarget,
                distanceFromRedditAverage,
                score,
                isPerfect: score === round.maxScore,
                isLocked: false,
              };
            })
          );

          // Recalculate total scores
          let runningTotal = 0;
          const resultsWithTotals = recalculatedResults.map((r) => {
            runningTotal += r.score;
            return {
              ...r,
              totalScoreAfterRound: runningTotal,
            };
          });

          // Save recalculated results
          await saveUserResultsForToday(subredditKey, userKey, resultsWithTotals);

          response.priorResults = resultsWithTotals;
        }
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

      // Check if results are locked
      const lockStatus = getResultsLockStatus(game.createdAt);

      // Update buckets with this guess
      const bucketIndex = dialValueToBucketIndex(clampedDial);
      const updatedBuckets = [...existingBuckets];
      updatedBuckets[bucketIndex] = (updatedBuckets[bucketIndex] ?? 0) + 1;

      // Save buckets immediately
      await saveBucketsForToday(subredditKey, roundIndex, updatedBuckets);

      // If results are locked, save guess without scoring
      if (lockStatus.isLocked) {
        const lockedResult: GuessResult = {
          roundIndex,
          dialValue: clampedDial,
          target: 0, // Will be calculated when unlocked
          redditAverage: 0, // Will be calculated when unlocked
          distanceFromTarget: 0,
          distanceFromRedditAverage: 0,
          score: 0,
          totalScoreAfterRound: 0,
          isLocked: true,
        };

        const nextResults = [
          ...existingResults.filter((r) => r.roundIndex !== roundIndex),
          lockedResult,
        ].sort((a, b) => a.roundIndex - b.roundIndex);

        await saveUserResultsForToday(subredditKey, userKey, nextResults);

        res.json({
          type: 'guess',
          result: lockedResult,
          isLocked: true,
          unlockTime: lockStatus.unlockTime,
        });
        return;
      }

      // Results are unlocked - calculate final target and score
      const finalTarget = calculateFinalTarget(updatedBuckets);
      const redditAverage = computeRedditAverage(updatedBuckets);
      const score = dialValueToScore(clampedDial, finalTarget, round.maxScore);
      const distanceFromTarget = Math.abs(clampedDial - finalTarget);
      const distanceFromRedditAverage = Math.abs(clampedDial - redditAverage);

      const totalBefore = existingResults.reduce(
        (sum, r) => sum + (typeof r.score === 'number' ? r.score : 0),
        0
      );

      const result: GuessResult = {
        roundIndex,
        dialValue: clampedDial,
        target: finalTarget,
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
      const userKey = await getUserKey();
      const [submissions, userVotes] = await Promise.all([
        getSpectrumLabForSubreddit(subredditKey),
        getUserVotes(subredditKey, userKey),
      ]);

      submissions.sort((a, b) => b.score - a.score);

      const response: SpectrumLabListResponse = {
        type: 'spectrum-lab-list',
        submissions,
        userVotes,
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
      status: 'pending_review',
    };

    const next = [...submissions, submission].sort((a, b) => b.score - a.score);
    await saveSpectrumLabForSubreddit(subredditKey, next);

    // Notify moderators about new submission
    try {
      await reddit.sendPrivateMessage({
        to: `/r/${context.subredditName}`,
        subject: 'New Spectrum Lab Submission',
        text: `A new spectrum needs review:\n"${leftLabel}" ↔ "${rightLabel}"\n\nVisit the Moderator Dashboard to review.`,
      });
    } catch (e) {
      console.warn('Failed to notify moderators:', e);
    }

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
    const userKey = await getUserKey();
    const [submissions, userVotes] = await Promise.all([
      getSpectrumLabForSubreddit(subredditKey),
      getUserVotes(subredditKey, userKey),
    ]);

    const index = submissions.findIndex((s) => s.id === submissionId);

    if (index === -1) {
      res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
      return;
    }

    // Check if user has already voted on this submission
    const existingVote = userVotes[submissionId];

    if (existingVote) {
      res.status(400).json({
        status: 'error',
        message: 'You have already voted on this submission',
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
      status: existing.status,
      ...(existing.clues ? { clues: existing.clues } : {}),
      ...(existing.rejectionReason ? { rejectionReason: existing.rejectionReason } : {}),
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

    // Record the user's vote
    const updatedVotes = { ...userVotes, [submissionId]: direction };

    await Promise.all([
      saveSpectrumLabForSubreddit(subredditKey, next),
      saveUserVotes(subredditKey, userKey, updatedVotes),
    ]);

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
      const currentDayDate = getCurrentDayDate();
      const subredditKey = getSubredditKey();
      const allStats = await getAllUserStats();
      let entries = Object.values(allStats);
      let needsSave = false;

      // Migration: For users with old weeklyScore, try to get their today's score from results
      const migratedStats = await Promise.all(
        entries.map(async (stats) => {
          if ((!stats.dailyScore || stats.dailyScore === 0) && 'weeklyScore' in (stats as any)) {
            try {
              const todayResults = await getUserResultsForToday(subredditKey, stats.userId);
              if (todayResults.length > 0) {
                const todayScore = todayResults.reduce(
                  (sum, r) => sum + (typeof r.score === 'number' ? r.score : 0),
                  0
                );
                const migratedStats = {
                  ...stats,
                  dailyScore: todayScore,
                  dayDate: currentDayDate,
                };
                delete (migratedStats as any).weeklyScore;
                delete (migratedStats as any).weekStartDate;
                allStats[stats.userId] = migratedStats;
                needsSave = true;
                return migratedStats;
              }
            } catch (error) {
              console.warn(`Failed to migrate stats for user ${stats.userId}:`, error);
            }
          }
          return stats;
        })
      );

      if (needsSave) {
        await saveAllUserStats(allStats);
      }

      entries = migratedStats;

      const toLeaderboardEntry = (stats: UserStats): LeaderboardEntry => {
        const entry: LeaderboardEntry = {
          userId: stats.userId,
          totalScore: stats.totalScore,
          // Only count dailyScore if it belongs to the current day; otherwise treat as 0
          dailyScore: stats.dayDate === currentDayDate ? (stats.dailyScore ?? 0) : 0,
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

      const byDailyScore = [...entries]
        .map((s) => ({
          stats: s,
          score: s.dayDate === currentDayDate ? (s.dailyScore ?? 0) : 0,
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
        ...byDailyScore,
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
          const username = usernameMap.get(entry.userId);
          if (username) {
            return { ...entry, username };
          }
        }
        return entry;
      };

      const response: LeaderboardResponse = {
        type: 'leaderboard',
        topTotalScore: byTotalScore.map(updateEntryUsername),
        topDailyScore: byDailyScore.map(updateEntryUsername),
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
      const subredditKey = getSubredditKey();
      const todayDate = getCurrentDayDate();
      const allStats = await getAllUserStats();
      let stats = allStats[userKey] ?? null;

      // Migration: If user has old weeklyScore but no dailyScore, check if they played today
      if (
        stats &&
        (!stats.dailyScore || stats.dailyScore === 0) &&
        'weeklyScore' in (stats as any)
      ) {
        // Check if they have results for today
        const todayResults = await getUserResultsForToday(subredditKey, userKey);
        if (todayResults.length > 0) {
          // Calculate today's score from their results
          const todayScore = todayResults.reduce(
            (sum, r) => sum + (typeof r.score === 'number' ? r.score : 0),
            0
          );
          stats = {
            ...stats,
            dailyScore: todayScore,
            dayDate: todayDate,
          };
          // Remove old fields
          delete (stats as any).weeklyScore;
          delete (stats as any).weekStartDate;
          // Save the migrated stats
          allStats[userKey] = stats;
          await saveAllUserStats(allStats);
        }
      }

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
              dailyScore: 0,
              dayDate: todayDate,
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
      const byDailyScore = [...entries]
        .map((s) => ({
          stats: s,
          score: s.dayDate === todayDate ? (s.dailyScore ?? 0) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((p) => p.stats);

      const response: UserStatsResponse = {
        type: 'user-stats',
        userId: userKey,
        stats,
        ranks: {
          totalScoreRank: rankOf(byTotalScore, userKey),
          dailyScoreRank: rankOf(byDailyScore, userKey),
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

// Moderator endpoints
router.get<{}, { isModerator: boolean } | { status: string; message: string }>(
  '/api/moderator/check',
  async (_req, res): Promise<void> => {
    try {
      const isMod = await isModerator();
      res.json({ isModerator: isMod });
    } catch (error) {
      console.error('API Moderator Check Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check moderator status',
      });
    }
  }
);

router.get<{}, ModeratorPendingListResponse | { status: string; message: string }>(
  '/api/moderator/pending',
  async (_req, res): Promise<void> => {
    const subredditKey = getSubredditKey();

    try {
      if (!(await isModerator())) {
        res.status(403).json({
          status: 'error',
          message: 'Moderator access required',
        });
        return;
      }

      const submissions = await getSpectrumLabForSubreddit(subredditKey);
      const pending = submissions.filter((s) => s.status === 'pending_review');

      const response: ModeratorPendingListResponse = {
        type: 'moderator-pending-list',
        submissions: pending,
      };

      res.json(response);
    } catch (error) {
      console.error('API Moderator Pending List Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to load pending submissions',
      });
    }
  }
);

router.post<
  {},
  ModeratorApproveResponse | { status: string; message: string },
  ModeratorApproveRequest
>('/api/moderator/approve', async (req, res): Promise<void> => {
  const subredditKey = getSubredditKey();
  const { submissionId, clues } = req.body ?? {};

  if (!submissionId || !clues || !Array.isArray(clues) || clues.length !== 3) {
    res.status(400).json({
      status: 'error',
      message: 'submissionId and exactly 3 clues are required',
    });
    return;
  }

  // Validate clues
  for (const clue of clues) {
    if (!clue.clue) {
      res.status(400).json({
        status: 'error',
        message: 'Each clue must have a clue string',
      });
      return;
    }
  }

  try {
    if (!(await isModerator())) {
      res.status(403).json({
        status: 'error',
        message: 'Moderator access required',
      });
      return;
    }

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
      ...existing,
      status: 'approved',
      clues,
    };

    const next = [...submissions];
    next[index] = updated;

    await saveSpectrumLabForSubreddit(subredditKey, next);

    const response: ModeratorApproveResponse = {
      type: 'moderator-approve',
      submission: updated,
    };

    res.json(response);
  } catch (error) {
    console.error('API Moderator Approve Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve submission',
    });
  }
});

router.post<
  {},
  ModeratorRejectResponse | { status: string; message: string },
  ModeratorRejectRequest
>('/api/moderator/reject', async (req, res): Promise<void> => {
  const subredditKey = getSubredditKey();
  const { submissionId, rejectionReason } = req.body ?? {};

  if (!submissionId) {
    res.status(400).json({
      status: 'error',
      message: 'submissionId is required',
    });
    return;
  }

  try {
    if (!(await isModerator())) {
      res.status(403).json({
        status: 'error',
        message: 'Moderator access required',
      });
      return;
    }

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
      ...existing,
      status: 'rejected',
      ...(rejectionReason ? { rejectionReason } : {}),
    };

    const next = [...submissions];
    next[index] = updated;

    await saveSpectrumLabForSubreddit(subredditKey, next);

    const response: ModeratorRejectResponse = {
      type: 'moderator-reject',
      submission: updated,
    };

    res.json(response);
  } catch (error) {
    console.error('API Moderator Reject Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject submission',
    });
  }
});

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
