import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide').toLowerCase().trim(),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
