import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide').toLowerCase().trim(),
  otp: z
    .string()
    .min(6, 'Le code doit contenir 6 chiffres')
    .max(6, 'Le code doit contenir 6 chiffres'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
