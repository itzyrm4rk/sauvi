import { z } from 'zod';

export const JoinWaitlistSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type JoinWaitlistDto = z.infer<typeof JoinWaitlistSchema>;
