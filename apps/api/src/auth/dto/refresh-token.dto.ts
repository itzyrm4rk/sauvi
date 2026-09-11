import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Le refresh token est requis'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
