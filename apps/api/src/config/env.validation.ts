import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().default(''),
  FIREBASE_PRIVATE_KEY: z.string().default(''),
  // Fournisseur email : 'gmail' | 'brevo' | 'resend' | 'dev'
  MAIL_PROVIDER: z.enum(['gmail', 'brevo', 'resend', 'dev']).default('dev'),
  FROM_EMAIL: z.string().default('sauvi.notifications@gmail.com'),
  // Gmail SMTP (App Password)
  GMAIL_USER: z.string().default(''),
  GMAIL_APP_PASSWORD: z.string().default(''),
  // Brevo SMTP
  BREVO_SMTP_USER: z.string().default(''),
  BREVO_SMTP_KEY: z.string().default(''),
  // Resend API (optionnel)
  RESEND_API_KEY: z.string().default(''),
  FRONTEND_URL: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Valide les variables d'environnement au démarrage de l'application.
 * @throws {ZodError} Si une variable requise est manquante ou invalide.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  return EnvSchema.parse(config);
}
