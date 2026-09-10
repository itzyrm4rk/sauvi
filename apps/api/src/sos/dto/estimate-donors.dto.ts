import { CAMEROON_CITIES } from '@sauvi/shared';
import { z } from 'zod';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;

export const EstimateDonorsSchema = z.object({
  bloodTypeNeeded: z.enum(BLOOD_TYPES, {
    errorMap: () => ({ message: 'Groupe sanguin demande invalide' }),
  }),
  city: z.enum(CAMEROON_CITIES, {
    errorMap: () => ({ message: 'Ville non couverte par SAUVI' }),
  }),
});

export type EstimateDonorsDto = z.infer<typeof EstimateDonorsSchema>;
