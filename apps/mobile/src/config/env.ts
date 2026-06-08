import { z } from 'zod';

const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Variables d'environnement Expo validées au démarrage.
 * @throws {ZodError} Si une variable requise est manquante ou invalide.
 */
export function getEnv(): Env {
  return EnvSchema.parse({
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  });
}

export const env = getEnv();
