import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Adresse email invalide').toLowerCase().trim(),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
