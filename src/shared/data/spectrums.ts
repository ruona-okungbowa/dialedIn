import type { Spectrum } from '../types';

/**
 * Daily spectrum configurations with clues and seed targets.
 * Each day has one spectrum with 3 different clues.
 *
 * IMPORTANT: The "seedTarget" is only used for the first 2 hours or until
 * we have 10+ responses. After that, the COMMUNITY MEDIAN becomes the target.
 * This creates a "HiveMind" scoring system where players are rewarded for
 * being on the same wavelength as the Reddit community.
 */
type DailySpectrumConfig = {
  day: number;
  spectrum: Spectrum;
  rounds: Array<{
    clue: string;
    seedTarget: number; // Initial target for first 2 hours (0-100)
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
      { clue: 'Liking your own posts', seedTarget: 25 },
      { clue: 'Replying "this" to comments', seedTarget: 15 },
      { clue: 'Using 😂 unironically in 2024', seedTarget: 30 },
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
    rounds: [
      { clue: 'Air fryers', seedTarget: 35 },
      { clue: 'Pumpkin spice everything', seedTarget: 25 },
      { clue: 'Bidets', seedTarget: 75 },
    ],
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
      { clue: 'A completely silent room', seedTarget: 65 },
      { clue: 'Being home alone at night', seedTarget: 55 },
      { clue: 'Empty parking lots', seedTarget: 70 },
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
      { clue: 'Wearing headphones with no music', seedTarget: 70 },
      { clue: 'Saying "you too" when the waiter says enjoy your meal', seedTarget: 80 },
      { clue: 'Walking into a room and forgetting why', seedTarget: 75 },
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
      { clue: 'Talking about your achievements unprompted', seedTarget: 70 },
      { clue: "Correcting someone's pronunciation", seedTarget: 60 },
      { clue: 'Posting your workout stats daily', seedTarget: 65 },
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
      { clue: 'Eating dinner at 4pm', seedTarget: 40 },
      { clue: 'Showering at night instead of morning', seedTarget: 20 },
      { clue: 'Eating cereal with water instead of milk', seedTarget: 95 },
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
      { clue: 'Still friends with their ex', seedTarget: 55 },
      { clue: "Checks your phone when you're not looking", seedTarget: 90 },
      { clue: 'Talks about their therapist', seedTarget: 20 },
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
      { clue: 'Telling someone they look tired', seedTarget: 60 },
      { clue: 'Saying "I told you so"', seedTarget: 75 },
      { clue: 'Giving constructive criticism unasked', seedTarget: 55 },
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
      { clue: 'Treating yourself when stressed', seedTarget: 35 },
      { clue: 'Staying in bed all weekend', seedTarget: 60 },
      { clue: 'Retail therapy after a bad day', seedTarget: 50 },
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
      { clue: 'Posting gym selfies every day', seedTarget: 75 },
      { clue: 'LinkedIn motivational posts', seedTarget: 80 },
      { clue: 'Unboxing videos of everyday items', seedTarget: 70 },
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
      { clue: 'Taking hours or days to reply', seedTarget: 60 },
      { clue: 'Not sharing passwords with your partner', seedTarget: 30 },
      { clue: 'Keeping your feelings to yourself', seedTarget: 70 },
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
      { clue: 'Watching TikToks on full volume in public', seedTarget: 85 },
      { clue: 'FaceTiming in a restaurant', seedTarget: 80 },
      { clue: 'Clipping your nails on public transit', seedTarget: 95 },
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
      { clue: 'Big gestures during arguments', seedTarget: 65 },
      { clue: 'Love bombing in the first week', seedTarget: 75 },
      { clue: 'Surprise visits to your workplace', seedTarget: 70 },
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
      { clue: 'Correcting people mid-conversation', seedTarget: 75 },
      { clue: 'Starting sentences with "Actually..."', seedTarget: 70 },
      { clue: 'Explaining things nobody asked about', seedTarget: 80 },
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
      { clue: "Complimenting someone's scent", seedTarget: 60 },
      { clue: 'Prolonged eye contact', seedTarget: 55 },
      { clue: 'Remembering small details they mentioned', seedTarget: 40 },
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
      { clue: 'Wanting constant updates', seedTarget: 70 },
      { clue: 'Getting upset when plans change', seedTarget: 65 },
      { clue: 'Needing daily good morning texts', seedTarget: 60 },
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
      { clue: "Meeting someone's parents", seedTarget: 75 },
      { clue: 'Sharing your location', seedTarget: 70 },
      { clue: 'Talking about future plans together', seedTarget: 80 },
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
      { clue: 'Forgetting your birthday once', seedTarget: 30 },
      { clue: 'Being rude to service workers', seedTarget: 85 },
      { clue: 'Not texting back for a whole day', seedTarget: 40 },
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
      { clue: 'Sharing locations', seedTarget: 55 },
      { clue: 'Wanting to know all your passwords', seedTarget: 80 },
      { clue: 'Checking in multiple times a day', seedTarget: 65 },
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
      { clue: 'Giving unsolicited advice', seedTarget: 65 },
      { clue: "Constantly asking if you're okay", seedTarget: 60 },
      { clue: 'Making decisions "for your own good"', seedTarget: 75 },
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
      { clue: "Always taking friends' sides", seedTarget: 70 },
      { clue: 'Never saying no to requests', seedTarget: 75 },
      { clue: 'Apologizing even when not wrong', seedTarget: 80 },
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
      { clue: 'Posting donation receipts', seedTarget: 75 },
      { clue: 'Filming yourself helping homeless people', seedTarget: 85 },
      { clue: 'Sharing every petition you sign', seedTarget: 65 },
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
      { clue: '"This is so me" captions', seedTarget: 60 },
      { clue: 'Using every trending sound', seedTarget: 70 },
      { clue: 'Oversharing mundane activities', seedTarget: 55 },
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
      { clue: 'Gatekeeping hobbies', seedTarget: 70 },
      { clue: 'Saying "not all men"', seedTarget: 75 },
      { clue: 'Defending controversial takes', seedTarget: 60 },
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
      { clue: 'Deleting all social apps', seedTarget: 60 },
      { clue: 'Not responding to group chats', seedTarget: 70 },
      { clue: 'Deactivating without telling anyone', seedTarget: 75 },
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
      { clue: 'Overusing 💀', seedTarget: 65 },
      { clue: 'Speaking in TikTok references', seedTarget: 75 },
      { clue: 'Saying "slay" unironically', seedTarget: 55 },
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
      { clue: 'Going to the gym at 3am', seedTarget: 70 },
      { clue: 'Posting cryptic sad quotes', seedTarget: 80 },
      { clue: 'Dramatically changing your look overnight', seedTarget: 65 },
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
      { clue: 'Oversharing online', seedTarget: 75 },
      { clue: 'Posting couple arguments publicly', seedTarget: 90 },
      { clue: 'Humble bragging constantly', seedTarget: 70 },
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
      { clue: 'Quitting a job without a backup', seedTarget: 70 },
      { clue: 'Moving to a new city on a whim', seedTarget: 60 },
      { clue: 'Ending a long relationship suddenly', seedTarget: 65 },
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
      { clue: 'Drastically changing your appearance', seedTarget: 55 },
      { clue: 'Buying a sports car at 45', seedTarget: 75 },
      { clue: 'Suddenly taking up extreme hobbies', seedTarget: 65 },
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
 * Get the complete daily game configuration including rounds with clues and targets.
 * This is used by the server to generate the full DailyGame object.
 */
export const getDailyGameConfig = (date: string) => {
  const seed = hashString(date);
  const dayIndex = seed % DAILY_SPECTRUM_CONFIGS.length;
  return DAILY_SPECTRUM_CONFIGS[dayIndex];
};
