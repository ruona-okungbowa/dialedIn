import type { Spectrum } from '../types';

/**
 * Daily spectrum configurations with clues.
 * Each day has one spectrum with 3 different clues.
 *
 * IMPORTANT: Scoring is based purely on community consensus.
 * Results are locked until 8pm, then scored against the median of all player guesses.
 */
type DailySpectrumConfig = {
  day: number;
  spectrum: Spectrum;
  rounds: Array<{
    clue: string;
  }>;
};

/**
 * Complete pool of daily spectrum configurations.
 * Each entry represents one full day of gameplay (3 rounds).
 */
export const DAILY_SPECTRUM_CONFIGS: DailySpectrumConfig[] = [
  {
    day: 1,
    spectrum: {
      id: 'harmless-cancelworthy',
      leftLabel: 'Harmless',
      rightLabel: 'Cancel-worthy',
      difficulty: 'easy',
      tags: ['social', 'internet'],
    },
    rounds: [
      { clue: 'Liking your own posts' },
      { clue: 'Replying "this" to comments' },
      { clue: 'Using 😂 unironically in 2024' },
    ],
  },
  {
    day: 2,
    spectrum: {
      id: 'overrated-underrated',
      leftLabel: 'Overrated',
      rightLabel: 'Underrated',
      difficulty: 'medium',
      tags: ['opinions', 'trends'],
    },
    rounds: [{ clue: 'Air fryers' }, { clue: 'Pumpkin spice everything' }, { clue: 'Bidets' }],
  },
  {
    day: 3,
    spectrum: {
      id: 'comforting-unsettling',
      leftLabel: 'Comforting',
      rightLabel: 'Unsettling',
      difficulty: 'medium',
      tags: ['vibes', 'feelings'],
    },
    rounds: [
      { clue: 'A completely silent room' },
      { clue: 'Being home alone at night' },
      { clue: 'Empty parking lots' },
    ],
  },
  {
    day: 4,
    spectrum: {
      id: 'maincharacter-npc',
      leftLabel: 'Main Character',
      rightLabel: 'NPC',
      difficulty: 'easy',
      tags: ['personality', 'internet'],
    },
    rounds: [
      { clue: 'Wearing headphones with no music' },
      { clue: 'Saying "you too" when the waiter says enjoy your meal' },
      { clue: 'Walking into a room and forgetting why' },
    ],
  },
  {
    day: 5,
    spectrum: {
      id: 'confidence-arrogance',
      leftLabel: 'Confidence',
      rightLabel: 'Arrogance',
      difficulty: 'hard',
      tags: ['personality', 'social'],
    },
    rounds: [
      { clue: 'Talking about your achievements unprompted' },
      { clue: "Correcting someone's pronunciation" },
      { clue: 'Posting your workout stats daily' },
    ],
  },
  {
    day: 6,
    spectrum: {
      id: 'normal-unhinged',
      leftLabel: 'Normal',
      rightLabel: 'Unhinged',
      difficulty: 'easy',
      tags: ['behavior', 'quirky'],
    },
    rounds: [
      { clue: 'Eating dinner at 4pm' },
      { clue: 'Showering at night instead of morning' },
      { clue: 'Eating cereal with water instead of milk' },
    ],
  },
  {
    day: 7,
    spectrum: {
      id: 'greenflag-redflag',
      leftLabel: 'Green Flag',
      rightLabel: 'Red Flag',
      difficulty: 'hard',
      tags: ['relationships', 'dating'],
    },
    rounds: [
      { clue: 'Still friends with their ex' },
      { clue: "Checks your phone when you're not looking" },
      { clue: 'Talks about their therapist' },
    ],
  },
  {
    day: 8,
    spectrum: {
      id: 'honest-rude',
      leftLabel: 'Honest',
      rightLabel: 'Rude',
      difficulty: 'medium',
      tags: ['communication', 'social'],
    },
    rounds: [
      { clue: 'Telling someone they look tired' },
      { clue: 'Saying "I told you so"' },
      { clue: 'Giving constructive criticism unasked' },
    ],
  },
  {
    day: 9,
    spectrum: {
      id: 'selfcare-selfsabotage',
      leftLabel: 'Self-care',
      rightLabel: 'Self-sabotage',
      difficulty: 'medium',
      tags: ['mental-health', 'behavior'],
    },
    rounds: [
      { clue: 'Treating yourself when stressed' },
      { clue: 'Staying in bed all weekend' },
      { clue: 'Retail therapy after a bad day' },
    ],
  },
  {
    day: 10,
    spectrum: {
      id: 'iconic-cringe',
      leftLabel: 'Iconic',
      rightLabel: 'Cringe',
      difficulty: 'easy',
      tags: ['social-media', 'internet'],
    },
    rounds: [
      { clue: 'Posting gym selfies every day' },
      { clue: 'LinkedIn motivational posts' },
      { clue: 'Unboxing videos of everyday items' },
    ],
  },
  {
    day: 11,
    spectrum: {
      id: 'boundary-emotionalwall',
      leftLabel: 'Healthy Boundary',
      rightLabel: 'Emotional Wall',
      difficulty: 'hard',
      tags: ['relationships', 'mental-health'],
    },
    rounds: [
      { clue: 'Taking hours or days to reply' },
      { clue: 'Not sharing passwords with your partner' },
      { clue: 'Keeping your feelings to yourself' },
    ],
  },
  {
    day: 12,
    spectrum: {
      id: 'acceptable-unhinged',
      leftLabel: 'Acceptable',
      rightLabel: 'Unhinged',
      difficulty: 'easy',
      tags: ['behavior', 'public'],
    },
    rounds: [
      { clue: 'Watching TikToks on full volume in public' },
      { clue: 'FaceTiming in a restaurant' },
      { clue: 'Clipping your nails on public transit' },
    ],
  },
  {
    day: 13,
    spectrum: {
      id: 'romantic-manipulative',
      leftLabel: 'Romantic',
      rightLabel: 'Manipulative',
      difficulty: 'hard',
      tags: ['relationships', 'dating'],
    },
    rounds: [
      { clue: 'Big gestures during arguments' },
      { clue: 'Love bombing in the first week' },
      { clue: 'Surprise visits to your workplace' },
    ],
  },
  {
    day: 14,
    spectrum: {
      id: 'genius-insufferable',
      leftLabel: 'Genius',
      rightLabel: 'Insufferable',
      difficulty: 'medium',
      tags: ['personality', 'social'],
    },
    rounds: [
      { clue: 'Correcting people mid-conversation' },
      { clue: 'Starting sentences with "Actually..."' },
      { clue: 'Explaining things nobody asked about' },
    ],
  },
  {
    day: 15,
    spectrum: {
      id: 'flirting-friendliness',
      leftLabel: 'Flirting',
      rightLabel: 'Friendliness',
      difficulty: 'hard',
      tags: ['dating', 'social'],
    },
    rounds: [
      { clue: "Complimenting someone's scent" },
      { clue: 'Prolonged eye contact' },
      { clue: 'Remembering small details they mentioned' },
    ],
  },
  {
    day: 16,
    spectrum: {
      id: 'secure-clingy',
      leftLabel: 'Secure',
      rightLabel: 'Clingy',
      difficulty: 'medium',
      tags: ['relationships', 'attachment'],
    },
    rounds: [
      { clue: 'Wanting constant updates' },
      { clue: 'Getting upset when plans change' },
      { clue: 'Needing daily good morning texts' },
    ],
  },
  {
    day: 17,
    spectrum: {
      id: 'casual-serious',
      leftLabel: 'Casual',
      rightLabel: 'Serious',
      difficulty: 'easy',
      tags: ['relationships', 'dating'],
    },
    rounds: [
      { clue: "Meeting someone's parents" },
      { clue: 'Sharing your location' },
      { clue: 'Talking about future plans together' },
    ],
  },
  {
    day: 18,
    spectrum: {
      id: 'forgivable-dealbreaker',
      leftLabel: 'Forgivable',
      rightLabel: 'Dealbreaker',
      difficulty: 'hard',
      tags: ['relationships', 'boundaries'],
    },
    rounds: [
      { clue: 'Forgetting your birthday once' },
      { clue: 'Being rude to service workers' },
      { clue: 'Not texting back for a whole day' },
    ],
  },
  {
    day: 19,
    spectrum: {
      id: 'lovelanguage-control',
      leftLabel: 'Love Language',
      rightLabel: 'Control',
      difficulty: 'hard',
      tags: ['relationships', 'boundaries'],
    },
    rounds: [
      { clue: 'Sharing locations' },
      { clue: 'Wanting to know all your passwords' },
      { clue: 'Checking in multiple times a day' },
    ],
  },
  {
    day: 20,
    spectrum: {
      id: 'supportive-overbearing',
      leftLabel: 'Supportive',
      rightLabel: 'Overbearing',
      difficulty: 'medium',
      tags: ['relationships', 'family'],
    },
    rounds: [
      { clue: 'Giving unsolicited advice' },
      { clue: "Constantly asking if you're okay" },
      { clue: 'Making decisions "for your own good"' },
    ],
  },
  {
    day: 21,
    spectrum: {
      id: 'loyal-peoplepleaser',
      leftLabel: 'Loyal',
      rightLabel: 'People-pleaser',
      difficulty: 'medium',
      tags: ['personality', 'social'],
    },
    rounds: [
      { clue: "Always taking friends' sides" },
      { clue: 'Never saying no to requests' },
      { clue: 'Apologizing even when not wrong' },
    ],
  },
  {
    day: 22,
    spectrum: {
      id: 'helpful-performative',
      leftLabel: 'Helpful',
      rightLabel: 'Performative',
      difficulty: 'easy',
      tags: ['social-media', 'activism'],
    },
    rounds: [
      { clue: 'Posting donation receipts' },
      { clue: 'Filming yourself helping homeless people' },
      { clue: 'Sharing every petition you sign' },
    ],
  },
  {
    day: 23,
    spectrum: {
      id: 'relatable-tryhard',
      leftLabel: 'Relatable',
      rightLabel: 'Try-hard',
      difficulty: 'easy',
      tags: ['social-media', 'personality'],
    },
    rounds: [
      { clue: '"This is so me" captions' },
      { clue: 'Using every trending sound' },
      { clue: 'Oversharing mundane activities' },
    ],
  },
  {
    day: 24,
    spectrum: {
      id: 'based-problematic',
      leftLabel: 'Based',
      rightLabel: 'Problematic',
      difficulty: 'hard',
      tags: ['internet', 'opinions'],
    },
    rounds: [
      { clue: 'Gatekeeping hobbies' },
      { clue: 'Saying "not all men"' },
      { clue: 'Defending controversial takes' },
    ],
  },
  {
    day: 25,
    spectrum: {
      id: 'minimalism-ghosting',
      leftLabel: 'Digital Minimalism',
      rightLabel: 'Ghosting',
      difficulty: 'medium',
      tags: ['social-media', 'communication'],
    },
    rounds: [
      { clue: 'Deleting all social apps' },
      { clue: 'Not responding to group chats' },
      { clue: 'Deactivating without telling anyone' },
    ],
  },
  {
    day: 26,
    spectrum: {
      id: 'humor-brainrot',
      leftLabel: 'Internet Humor',
      rightLabel: 'Brain Rot',
      difficulty: 'easy',
      tags: ['internet', 'gen-z'],
    },
    rounds: [
      { clue: 'Overusing 💀' },
      { clue: 'Speaking in TikTok references' },
      { clue: 'Saying "slay" unironically' },
    ],
  },
  {
    day: 27,
    spectrum: {
      id: 'powermove-cryforhelp',
      leftLabel: 'Power Move',
      rightLabel: 'Cry for Help',
      difficulty: 'medium',
      tags: ['behavior', 'mental-health'],
    },
    rounds: [
      { clue: 'Going to the gym at 3am' },
      { clue: 'Posting cryptic sad quotes' },
      { clue: 'Dramatically changing your look overnight' },
    ],
  },
  {
    day: 28,
    spectrum: {
      id: 'classy-tacky',
      leftLabel: 'Classy',
      rightLabel: 'Tacky',
      difficulty: 'easy',
      tags: ['social-media', 'behavior'],
    },
    rounds: [
      { clue: 'Oversharing online' },
      { clue: 'Posting couple arguments publicly' },
      { clue: 'Humble bragging constantly' },
    ],
  },
  {
    day: 29,
    spectrum: {
      id: 'bold-reckless',
      leftLabel: 'Bold',
      rightLabel: 'Reckless',
      difficulty: 'medium',
      tags: ['life-choices', 'career'],
    },
    rounds: [
      { clue: 'Quitting a job without a backup' },
      { clue: 'Moving to a new city on a whim' },
      { clue: 'Ending a long relationship suddenly' },
    ],
  },
  {
    day: 30,
    spectrum: {
      id: 'growth-midlifecrisis',
      leftLabel: 'Growth',
      rightLabel: 'Midlife Crisis',
      difficulty: 'hard',
      tags: ['life-choices', 'identity'],
    },
    rounds: [
      { clue: 'Drastically changing your appearance' },
      { clue: 'Buying a sports car at 45' },
      { clue: 'Suddenly taking up extreme hobbies' },
    ],
  },
];

/**
 * Legacy spectrum pool for backward compatibility.
 * This is derived from the daily configs above.
 */
export const SPECTRUM_POOL: Spectrum[] = DAILY_SPECTRUM_CONFIGS.map((config) => config.spectrum);

/**
 * Simple deterministic hash so that the same subreddit/date pair always
 * produces the same spectrum selection without needing extra storage.
 */
const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const codePoint = input.codePointAt(i) ?? 0;
    hash = (hash << 5) - hash + codePoint;
    hash = Math.trunc(hash); // Keep it 32‑bit
  }
  return Math.abs(hash);
};

/**
 * Pick the daily spectrum configuration based on date.
 * Uses a deterministic hash to cycle through the 30-day pool.
 */
export const pickDailySpectrumsForSubreddit = (subredditId: string, date: string): Spectrum[] => {
  // Use date to determine which day in the cycle (1-30)
  const seed = hashString(date);
  const dayIndex = seed % DAILY_SPECTRUM_CONFIGS.length;
  const config = DAILY_SPECTRUM_CONFIGS[dayIndex];

  if (!config) {
    // Fallback if something goes wrong
    return [
      {
        id: 'fallback-spectrum',
        leftLabel: 'Cold Take',
        rightLabel: 'Nuclear Take',
        subredditId,
        difficulty: 'medium',
        tags: ['fallback'],
      },
    ];
  }

  // Return the spectrum with subreddit context
  return [
    {
      id: config.spectrum.id,
      leftLabel: config.spectrum.leftLabel,
      rightLabel: config.spectrum.rightLabel,
      ...(config.spectrum.difficulty !== undefined && { difficulty: config.spectrum.difficulty }),
      ...(config.spectrum.tags !== undefined && { tags: config.spectrum.tags }),
      subredditId,
    },
  ];
};

/**
 * Get the complete daily game configuration including rounds with clues.
 * This is used by the server to generate the full DailyGame object.
 *
 * First checks for approved user-generated spectrums, then falls back to the default pool.
 */
export const getDailyGameConfig = (
  date: string,
  approvedSubmissions?: Array<{
    id: string;
    leftLabel: string;
    rightLabel: string;
    clues: Array<{ clue: string }>;
  }>
) => {
  // If we have approved user-generated spectrums, use one of them
  if (approvedSubmissions && approvedSubmissions.length > 0) {
    const seed = hashString(date);
    const index = seed % approvedSubmissions.length;
    const submission = approvedSubmissions[index];

    if (submission && submission.clues && submission.clues.length === 3) {
      return {
        day: -1, // Indicates user-generated
        spectrum: {
          id: submission.id,
          leftLabel: submission.leftLabel,
          rightLabel: submission.rightLabel,
          difficulty: 'medium' as const,
          tags: ['user-generated'],
        },
        rounds: submission.clues.map((c, i) => ({
          clue: c.clue,
        })),
      };
    }
  }

  // Fall back to default pool
  const seed = hashString(date);
  const dayIndex = seed % DAILY_SPECTRUM_CONFIGS.length;
  return DAILY_SPECTRUM_CONFIGS[dayIndex];
};
