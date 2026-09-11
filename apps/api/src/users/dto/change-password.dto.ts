import { z } from 'zod';

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Le mot de passe actuel doit contenir au moins 8 caractères'),
    newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string().min(8, 'Veuillez confirmer votre nouveau mot de passe'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les nouveaux mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
