# ⚙️ SAUVI — CI avec GitHub Actions

> Phase actuelle : **CI uniquement** (lint + tests + build).
> Le déploiement (CD) sera configuré dans une phase ultérieure.

---

## Vue d'ensemble

```
Push / PR → CI (lint + tests + build + typecheck)
```

Un seul workflow actif pour l'instant. Tout merge sur `main` ou `develop`
doit passer la CI au vert. Aucun déploiement automatique n'est configuré à ce stade.

---

## Workflow CI — Lint, Tests & Build

**Fichier :** `.github/workflows/ci.yml`
**Déclencheur :** Tout push sur `main`/`develop` et toute PR vers ces branches.

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─────────────────────────────────────────
  # Job 1 : Qualité du code (Biome)
  # ─────────────────────────────────────────
  quality:
    name: Biome — Lint & Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Biome CI
        run: npx biome ci .
        # Exit 1 si lint ou format échoue → PR bloquée

  # ─────────────────────────────────────────
  # Job 2 : Tests Backend NestJS
  # ─────────────────────────────────────────
  test-api:
    name: Tests API — NestJS
    runs-on: ubuntu-latest
    needs: quality

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: sauvi_test
          POSTGRES_PASSWORD: sauvi_test
          POSTGRES_DB: sauvi_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate
        working-directory: apps/api

      - name: Run Prisma migrations (test DB)
        run: npx prisma migrate deploy
        working-directory: apps/api
        env:
          DATABASE_URL: postgresql://sauvi_test:sauvi_test@localhost:5432/sauvi_test

      - name: Run unit tests
        run: npm run test:ci
        working-directory: apps/api
        env:
          DATABASE_URL: postgresql://sauvi_test:sauvi_test@localhost:5432/sauvi_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-minimum-32-chars-long
          JWT_REFRESH_SECRET: test-refresh-secret-32-chars-long
          NODE_ENV: test

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          directory: apps/api/coverage
          flags: api
          fail_ci_if_error: false

  # ─────────────────────────────────────────
  # Job 3 : Build Backend TypeScript
  # ─────────────────────────────────────────
  build-api:
    name: Build — NestJS TypeScript
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
        working-directory: apps/api
      - run: npm run build
        working-directory: apps/api
        env:
          DATABASE_URL: postgresql://placeholder/placeholder

  # ─────────────────────────────────────────
  # Job 4 : Type Check Mobile (React Native)
  # ─────────────────────────────────────────
  typecheck-mobile:
    name: TypeCheck — React Native
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
        working-directory: apps/mobile
```

---

## Workflow Sécurité — Scan hebdomadaire (optionnel)

**Fichier :** `.github/workflows/security.yml`
Ce workflow est indépendant de la CI principale. Il tourne chaque lundi.

```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 8 * * 1'   # Chaque lundi à 8h UTC
  workflow_dispatch:        # Déclenchable manuellement depuis GitHub

jobs:
  audit:
    name: NPM Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm audit --audit-level=high
        continue-on-error: true

  secrets-scan:
    name: Scan secrets (Gitleaks)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Secrets GitHub à configurer maintenant

Dans **Settings → Secrets and variables → Actions** :

| Secret | Description | Requis pour CI |
|---|---|---|
| `DATABASE_URL_TEST` | URL PostgreSQL de test (Supabase) | ✅ Oui |
| `REDIS_URL` | URL Redis (optionnel si mock en test) | ✅ Oui |
| `JWT_SECRET` | Secret JWT access token (min 32 chars) | ✅ Oui |
| `JWT_REFRESH_SECRET` | Secret JWT refresh token (min 32 chars) | ✅ Oui |

> Les secrets production (Railway, Firebase, Cloudflare, Expo) seront ajoutés
> lors de la mise en place du CD dans une phase ultérieure.

---

## Package.json scripts (apps/api)

```json
{
  "scripts": {
    "start": "node dist/main",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --forceExit",
    "test:e2e": "jest --config jest-e2e.config.ts",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

## Package.json scripts (racine monorepo)

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

---

## Pull Request Template

**Fichier :** `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
## Description
<!-- Décrivez le changement apporté -->

## Type de changement
- [ ] feat — nouvelle fonctionnalité
- [ ] fix — correction de bug
- [ ] refactor — refactorisation sans changement fonctionnel
- [ ] test — ajout ou modification de tests
- [ ] chore — maintenance, dépendances, config

## Lié au sprint
Sprint : <!-- ex: Sprint 2 — Auth -->
Issue : <!-- ex: #42 -->

## Checklist
- [ ] Le code respecte les Règles d'Or (`REGLES_D_OR.md`)
- [ ] Les tests unitaires passent (`npm run test`)
- [ ] Biome passe sans erreur (`npm run lint`)
- [ ] Les nouveaux endpoints sont documentés Swagger
- [ ] Pas de secrets dans le code
- [ ] Screenshots ajoutés si changement d'UI

## Screenshots (si applicable)
<!-- Avant / Après -->
```
