import { CAMEROON_CITIES } from '@sauvi/shared';
import { z } from 'zod';

export const NearbySosQuerySchema = z.object({
  city: z
    .enum(CAMEROON_CITIES, {
      errorMap: () => ({ message: 'Ville non couverte par SAUVI' }),
    })
    .optional(),
  bloodType: z
    .enum(['O_NEG', 'O_POS', 'A_NEG', 'A_POS', 'B_NEG', 'B_POS', 'AB_NEG', 'AB_POS'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type NearbySosQueryDto = z.infer<typeof NearbySosQuerySchema>;
