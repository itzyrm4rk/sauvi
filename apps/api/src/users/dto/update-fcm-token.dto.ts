import { z } from 'zod';

export const UpdateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1),
});

export type UpdateFcmTokenDto = z.infer<typeof UpdateFcmTokenSchema>;
