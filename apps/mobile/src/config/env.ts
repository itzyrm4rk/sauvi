import { z } from 'zod';

const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Variables d'environnement Expo validées au démarrage.
 * En cas de variable manquante ou invalide, on retourne un fallback
 * plutôt que de lancer une exception non catchée qui crasherait l'app.
 */
export function getEnv(): Env {
  try {
    return EnvSchema.parse({
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    });
  } catch {
    // En cas d'env invalide (ex: build sans .env), on utilise un fallback
    // L'app reste fonctionnelle mais les requêtes API échoueront proprement.
    return {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    };
  }
}

export const env = getEnv();
