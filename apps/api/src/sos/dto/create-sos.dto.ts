import { CAMEROON_CITIES } from '@sauvi/shared';
import { z } from 'zod';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
const PRIORITIES = ['preventif', 'urgence_vitale'] as const;

export const CreateSosSchema = z.object({
  bloodTypeNeeded: z.enum(BLOOD_TYPES, {
    errorMap: () => ({ message: 'Groupe sanguin demande invalide' }),
  }),
  unitsNeeded: z.number().int().min(1).max(20),
  priority: z.enum(PRIORITIES, {
    errorMap: () => ({ message: 'Priorite invalide' }),
  }),
  hospitalName: z.string().min(2).max(100).trim(),
  hospitalAddress: z.string().min(5).max(200).trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.enum(CAMEROON_CITIES, {
    errorMap: () => ({ message: 'Ville non couverte par SAUVI' }),
  }),
});

export type CreateSosDto = z.infer<typeof CreateSosSchema>;
