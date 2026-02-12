import { reddit } from '@devvit/web/server';

type CreatePostOptions = {
  title?: string;
};

export const createPost = async (options?: CreatePostOptions) => {
  const title = options?.title || 'dialedin-game';

  return await reddit.submitCustomPost({
    title,
  });
};
