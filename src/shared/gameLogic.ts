import type { RoundSummary, StreakState } from './types';

export const MAX_ROUND_SCORE = 100;

/**
 * Clamp a numeric value between a minimum and maximum.
 */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Convert a dial value and a target (both in the range 0–100) into a score.
 *
 * The score decays smoothly with distance: close guesses retain most of the
 * available points, while far‑off guesses drop quickly towards 0.
 */
export const dialValueToScore = (
  dialValue: number,
  target: number,
  maxScore: number = MAX_ROUND_SCORE
): number => {
  const clampedDial = clamp(dialValue, 0, 100);
  const clampedTarget = clamp(target, 0, 100);

  const distance = Math.abs(clampedDial - clampedTarget); // 0–100
  const maxDistance = 50; // symmetric around 50; anything worse is “maximally wrong”

  const normalized = clamp(distance, 0, maxDistance) / maxDistance; // 0–1

  // Quadratic falloff so that near‑misses feel well‑rewarded.
  const rawScore = maxScore * (1 - normalized * normalized);

  return Math.round(clamp(rawScore, 0, maxScore));
};

/**
 * Compute the Reddit community average dial position from per‑segment buckets.
 *
 * Each entry in `buckets` represents the number of guesses that landed in
 * that segment. We treat each segment’s center as an evenly spaced point
 * between 0 and 100 and compute a weighted average.
 */
export const computeRedditAverage = (buckets: number[]): number => {
  if (!buckets.length) {
    // Neutral center when there is no data yet.
    return 50;
  }

  const total = buckets.reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return 50;
  }

  const segmentSize = 100 / buckets.length;

  let weightedSum = 0;

  buckets.forEach((count, index) => {
    // Use the center of the segment as the representative value.
    const center = (index + 0.5) * segmentSize;
    weightedSum += center * count;
  });

  return clamp(weightedSum / total, 0, 100);
};

/**
 * Update a user’s streak given whether they played today and whether they
 * met the “hit” threshold for streak continuation.
 *
 * Date bookkeeping is intentionally kept out of this helper so that callers
 * can decide what “playedToday” means based on their own notion of “today”.
 */
export const updateStreak = (
  prev: StreakState,
  playedToday: boolean,
  hitThreshold: boolean
): StreakState => {
  if (!playedToday) {
    // No change to streak if the user hasn’t played yet.
    return prev;
  }

  if (!hitThreshold) {
    // Played but missed the threshold – streak resets.
    return {
      current: 0,
      best: prev.best,
    };
  }

  const current = prev.current + 1;
  const best = Math.max(prev.best, current);

  return {
    current,
    best,
  };
};

/**
 * Derive a compact “Wavelength String” suitable for sharing in comments.
 *
 * Example output:
 *   "[🟢🟢🟡🔴] I was 92% on the Wavelength today!"
 *
 * The exact emoji band is intentionally simple and based on per‑round scores:
 *   - ≥ 90: 🟢
 *   - ≥ 60: 🟡
 *   - else: 🔴
 */
export const buildWavelengthString = (rounds: RoundSummary[]): string => {
  if (!rounds.length) {
    return '[—] I played Dialed In today!';
  }

  const emojis = rounds
    .map((round) => {
      if (round.score >= 90) return '🟢';
      if (round.score >= 60) return '🟡';
      return '🔴';
    })
    .join('');

  const maxPossibleTotal = rounds.length * MAX_ROUND_SCORE;
  const actualTotal = rounds.reduce((sum, round) => sum + round.score, 0);

  const pct =
    maxPossibleTotal > 0 ? Math.round(clamp((actualTotal / maxPossibleTotal) * 100, 0, 100)) : 0;

  return `[${emojis}] I was ${pct}% on the Wavelength today!`;
};

/**
 * Generate a histogram visualization of community guesses using block characters.
 *
 * @param buckets - Array of guess counts per segment (e.g., 10 segments across 0-100)
 * @returns ASCII/emoji histogram string
 */
const buildHistogram = (buckets: number[]): string => {
  if (!buckets.length || buckets.every((count) => count === 0)) {
    return '▂▂▂▂▂▂';
  }

  const maxCount = Math.max(...buckets);
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  return buckets
    .map((count) => {
      if (count === 0) return blocks[0];
      const normalized = count / maxCount;
      const blockIndex = Math.min(blocks.length - 1, Math.floor(normalized * blocks.length));
      return blocks[blockIndex];
    })
    .join('');
};

/**
 * Enhanced version of buildWavelengthString that includes community consensus visualization.
 *
 * Example output:
 *   Dialed In - Jan 24, 2026
 *   [🟢🟢🟡🔴] 92% Score
 *   Round 1: My Guess: 85 | Community: ▂▃▆█▄▂
 *   Round 2: My Guess: 70 | Community: █▆▃▂
 *   Round 3: My Guess: 30 | Community: ▂▃█▆
 *
 * @param rounds - Array of round summaries with player guesses and scores
 * @param bucketsByRound - Optional array of bucket data for each round (for community visualization)
 * @param date - Optional date string for the game
 * @returns Multi-line shareable string with community visualization
 */
export const buildEnhancedWavelengthString = (
  rounds: RoundSummary[],
  bucketsByRound?: number[][],
  date?: string
): string => {
  if (!rounds.length) {
    return 'I played Dialed In today!';
  }

  const emojis = rounds
    .map((round) => {
      if (round.score >= 90) return '🟢';
      if (round.score >= 60) return '🟡';
      return '🔴';
    })
    .join('');

  const maxPossibleTotal = rounds.length * MAX_ROUND_SCORE;
  const actualTotal = rounds.reduce((sum, round) => sum + round.score, 0);

  const pct =
    maxPossibleTotal > 0 ? Math.round(clamp((actualTotal / maxPossibleTotal) * 100, 0, 100)) : 0;

  // Format date if provided
  const dateStr = date
    ? new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  let result = `Dialed In - ${dateStr}\n`;
  result += `[${emojis}] ${pct}% Score\n`;

  // Add per-round breakdown with community visualization
  if (bucketsByRound && bucketsByRound.length === rounds.length) {
    rounds.forEach((round, index) => {
      const buckets = bucketsByRound[index];
      if (buckets) {
        const histogram = buildHistogram(buckets);
        result += `Round ${round.roundIndex + 1}: My Guess: ${Math.round(round.dialValue)} | Community: ${histogram}\n`;
      }
    });
  } else {
    // Fallback without community data
    rounds.forEach((round) => {
      result += `Round ${round.roundIndex + 1}: My Guess: ${Math.round(round.dialValue)} | Score: ${round.score}\n`;
    });
  }

  return result.trim();
};
