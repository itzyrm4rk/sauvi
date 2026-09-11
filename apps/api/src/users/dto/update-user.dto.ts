import { z } from 'zod';

export const UpdateUserSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
    email: z.string().email('Adresse email invalide').optional(),
    phone: z.string().min(8, 'Numéro de téléphone invalide').optional(),
    city: z.string().min(2, 'La ville doit contenir au moins 2 caractères').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour',
  });

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
