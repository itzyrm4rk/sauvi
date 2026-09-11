import { WaitlistStatus } from '@prisma/client';
import { z } from 'zod';

export const UpdateWaitlistSchema = z.object({
  status: z.enum([WaitlistStatus.validated, WaitlistStatus.donated]),
});

export type UpdateWaitlistDto = z.infer<typeof UpdateWaitlistSchema>;
