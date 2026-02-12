import { reddit, context } from '@devvit/web/server';

export type FlairType = '7-day-streak' | 'daily-winner' | 'spectrum-creator';

// Flair template IDs from your subreddit
const FLAIR_TEMPLATE_IDS: Record<FlairType, string> = {
  '7-day-streak': '970f12a6-0850-11f1-8436-5ed020876300',
  'daily-winner': '7f855d7a-0850-11f1-833a-b649968ea6db',
  'spectrum-creator': 'ab870036-0850-11f1-a89c-a65edfbddbca',
};

/**
 * Assign a flair to a user in the current subreddit using template ID
 */
export const assignUserFlair = async (username: string, flairType: FlairType): Promise<boolean> => {
  try {
    if (!context.subredditName) {
      console.error('No subreddit context available');
      return false;
    }

    const templateId = FLAIR_TEMPLATE_IDS[flairType];

    // Set user flair using template ID
    await reddit.setUserFlair({
      subredditName: context.subredditName,
      username,
      flairTemplateId: templateId,
    });

    console.log(`Assigned ${flairType} flair to user ${username}`);
    return true;
  } catch (error) {
    console.error(`Failed to assign flair to ${username}:`, error);
    return false;
  }
};
