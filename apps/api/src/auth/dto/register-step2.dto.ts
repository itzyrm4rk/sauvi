import { z } from 'zod';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
const GENDERS = ['masculin', 'feminin'] as const;
const MIN_AGE_YEARS = 18;

/**
 * Vérifie que la date de naissance correspond à un âge minimum de 18 ans.
 */
function isAtLeast18(birthDateStr: string): boolean {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return age - 1 >= MIN_AGE_YEARS;
  }
  return age >= MIN_AGE_YEARS;
}

export const RegisterStep2Schema = z.object({
  bloodType: z.enum(BLOOD_TYPES, {
    errorMap: () => ({ message: 'Groupe sanguin invalide' }),
  }),
  gender: z.enum(GENDERS, {
    errorMap: () => ({ message: 'Genre invalide — doit être "masculin" ou "feminin"' }),
  }),
  birthDate: z
    .string()
    .datetime({ message: 'Date de naissance invalide — format ISO attendu' })
    .refine(isAtLeast18, {
      message: 'Vous devez avoir au moins 18 ans pour vous inscrire',
    }),
  city: z
    .string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(50, 'La ville ne peut pas dépasser 50 caractères')
    .trim(),
  phone: z
    .string()
    .min(8, 'Numéro de téléphone invalide')
    .max(20, 'Numéro de téléphone trop long')
    .regex(
      /^\+?[0-9\s-]+$/,
      'Numéro de téléphone invalide — seuls chiffres, espaces, tirets et + sont autorisés',
    ),
});

export type RegisterStep2Dto = z.infer<typeof RegisterStep2Schema>;
