# Secrets GitHub Actions — SAUVI

Configurer dans **Settings → Secrets and variables → Actions** :

| Secret | Description | Requis pour CI |
|---|---|---|
| `DATABASE_URL_TEST` | URL PostgreSQL de test (Supabase) | Optionnel — la CI utilise un service Postgres local |
| `REDIS_URL` | URL Redis | Optionnel — la CI utilise un service Redis local |
| `JWT_SECRET` | Secret JWT access token (min 32 chars) | Optionnel — valeurs de test dans `ci.yml` |
| `JWT_REFRESH_SECRET` | Secret JWT refresh token (min 32 chars) | Optionnel — valeurs de test dans `ci.yml` |

> Les secrets production (Railway, Firebase, Cloudflare, Expo) seront ajoutés lors de la mise en place du CD.
