# 🚀 SAUVI — Guide de Déploiement Complet (A à Z)

> **Branche recommandée :** `develop` (dev/staging) ou `main` (production)  
> **Architecture Monorepo :** Turborepo + npm workspaces (`apps/api`, `apps/mobile`, `apps/landing`, `packages/shared`)  
> **Stack :** NestJS 11 · Next.js 14 · Expo React Native · Supabase PostgreSQL · Redis · Docker · Render · Vercel · GitHub Actions · Google OAuth · Firebase Storage

---

## 📋 Vue d'ensemble & Ordre Chronologique

Pour garantir un déploiement sans accroc ni régression, suivez impérativement cet ordre :

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 · Préparation Git & Validation Locale                           │
│ ÉTAPE 2 · Pipeline CI/CD GitHub Actions (Qualité, Tests & Builds)       │
│ ÉTAPE 3 · Conteneurisation Docker (Dockerfile Multi-Stage & Compose)   │
│ ÉTAPE 4 · Déploiement Backend & Redis sur Render (Depuis GitHub)        │
│ ÉTAPE 5 · Configuration Google OAuth (Local & Production Render)        │
│ ÉTAPE 6 · Hébergement de la Landing Page Next.js sur Vercel            │
│ ÉTAPE 7 · Build Mobile EAS & Hébergement APK (Firebase Storage / EAS)  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ ÉTAPE 1 · Préparation Git & Validation Locale

Avant toute manipulation distante, assurez-vous de la santé du code en local.

### 1.1 — Vérifier l'état de votre repo Git

Ouvrez un terminal à la racine du projet (`C:\Users\MARC DIDIER\sauvi`) :

```powershell
git status
git branch
```

### 1.2 — Vérification locale de tous les packages

```powershell
# 1. Vérification du formatage et du linter (Biome)
npm run lint

# 2. Compilation du package partagé
npm run build --workspace=@sauvi/shared

# 3. Validation TypeScript & build de l'API NestJS
npm run typecheck --workspace=apps/api
npm run build --workspace=apps/api

# 4. Validation TypeScript de l'application Mobile Expo
npm run typecheck --workspace=@sauvi/mobile

# 5. Validation du build de la Landing Page Next.js
npm run build --workspace=@sauvi/landing
```

---

## 🔄 ÉTAPE 2 · Notre Pipeline CI GitHub Actions (`.github/workflows/ci.yml`)

Notre pipeline d'intégration continue s'exécute automatiquement à chaque **push** et chaque **pull request** ciblant les branches `main` et `develop`.

### 2.1 — Les 5 Jobs de notre CI

| Job | Outil / Rôle | Ce qui est testé |
| :--- | :--- | :--- |
| **`quality`** | Biome CI | Vérifie la conformité du code, le linting et le formatage sans tolérer de dérive de style. |
| **`test-api`** | Jest + PostgreSQL 16 + Redis 7 | Démarre des vrais conteneurs services PostgreSQL et Redis, exécute `prisma db push`, puis lance les tests unitaires et d'intégration de l'API NestJS (`npm run test:ci`). |
| **`build-api`** | NestJS Compiler (TypeScript) | Valide la compilation complète de l'API avec `@sauvi/shared` et le client Prisma généré. |
| **`typecheck-mobile`** | TypeScript (`tsc --noEmit`) | Vérifie l'absence de toute erreur de typage dans le code React Native / Expo Mobile. |
| **`build-landing`** | Next.js Compiler (`next build`) | Valide la compilation de la Landing Page Next.js 14 pour anticiper tout échec de déploiement sur Vercel. |


### 2.2 — Déclenchement & Bonnes Pratiques CI

1. Ne poussez jamais directement sur `main` sans passer par une PR ou sans vérifier que la CI est au vert sur `develop`.
2. Vous pouvez visualiser en direct l'avancement de la CI sous l'onglet **Actions** de votre dépôt GitHub :  
   `https://github.com/<votre-user>/sauvi/actions`
3. Si un job échoue (ex: test API ou typecheck), le déploiement sur Render ou Vercel ne doit pas avoir lieu.

---

## 🐳 ÉTAPE 3 · Conteneurisation Docker de l'API

L'API NestJS est packagée dans une image Docker multi-stage optimisée pour la production.

### 3.1 — Fichier `apps/api/Dockerfile`

Le build s'exécute avec le contexte à la **racine du monorepo** pour accéder à `packages/shared` :

```dockerfile
# ─── STAGE 1: Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Copie des manifestes racine pour la résolution des workspaces
COPY package.json package-lock.json turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/package.json

# Installation des dépendances API et shared
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# Copie des sources
COPY apps/api ./apps/api
COPY packages ./packages

# Génération du client Prisma & build NestJS
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npm run build

# ─── STAGE 2: Runner Production ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3000

# Migration automatique de la base Supabase puis démarrage
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/main"]
```

### 3.2 — Validation locale avec `docker-compose.yml`

Pour tester l'API et Redis ensemble sur votre machine :

```powershell
# Démarrer l'API et Redis
docker compose up -d

# Vérifier les logs de démarrage NestJS
docker compose logs -f api

# Stopper après vérification
docker compose down
```

---

## ☁️ ÉTAPE 4 · Déploiement Backend sur Render

### 4.1 — Faut-il laisser Render construire l'image ou pousser une image pré-construite ?

> **💡 Réponse & Recommandation :**  
> **Il est FORTEMENT RECOMMANDÉ de laisser Render construire l'image Docker lui-même à partir de votre code source GitHub.**

#### Pourquoi laisser Render construire depuis GitHub ?
1. **Simplicité & Automatisation totale :** Aucun compte Docker Hub ou GitHub Container Registry (GHCR) à gérer, aucun secret ou token de registry à configurer.
2. **Déploiement Continu Natif :** Dès que vous faites `git push origin develop` (ou `main`), Render détecte le commit, lance la construction du Dockerfile et déploie le nouveau conteneur sans aucune manipulation manuelle.
3. **Traçabilité :** Chaque build sur Render est directement associé au commit Git et au hash exact du code source.

*(L'approche alternative consistant à construire l'image dans GitHub Actions et à la pousser sur un registre ne devient utile que si vos temps de build sur Render dépassent les limites du plan gratuit, ce qui n'est pas le cas ici).*

### 4.2 — Créer le Redis sur Render

1. Rendez-vous sur [dashboard.render.com](https://dashboard.render.com).
2. Cliquez sur **New +** → **Redis**.
3. Nom : `sauvi-redis`
4. Plan : **Free**
5. Région : **Frankfurt (EU)**
6. Cliquez sur **Create Redis** et copiez l'**Internal Redis URL** (ex: `redis://red-xxxx:6379`).

### 4.3 — Créer le Web Service API sur Render

1. Cliquez sur **New +** → **Web Service**.
2. Sélectionnez votre dépôt GitHub `sauvi`.
3. Configurez les options suivantes :
   - **Name :** `sauvi-api`
   - **Region :** **Frankfurt (EU)** *(même région que Redis)*
   - **Branch :** `develop` (ou `main`)
   - **Runtime :** **Docker**
   - **Dockerfile Path :** `apps/api/Dockerfile`
   - **Docker Context :** `.` *(le point désigne la racine du monorepo)*
   - **Instance Type :** **Free**
4. Déroulez la section **Environment Variables** et saisissez :

| Variable | Exemple / Valeur |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | Votre URL Supabase poolée (`postgresql://...:6543/postgres?pgbouncer=true...`) |
| `DIRECT_URL` | Votre URL Supabase directe (`postgresql://...:5432/postgres`) |
| `REDIS_URL` | L'URL interne Render (`redis://red-xxxx:6379`) |
| `JWT_SECRET` | Clé secrète 32+ caractères |
| `JWT_REFRESH_SECRET` | Clé secrète refresh 32+ caractères |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `GOOGLE_CLIENT_ID` | Rempli avec les identifiants Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Rempli avec les identifiants Google Cloud |
| `GOOGLE_CALLBACK_URL` | `https://sauvi-api.onrender.com/api/auth/google/callback` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service-role Supabase |
| `FIREBASE_PROJECT_ID` | Votre ID projet Firebase |
| `FIREBASE_CLIENT_EMAIL` | Email de service Firebase Admin SDK |
| `FIREBASE_PRIVATE_KEY` | Clé privée Firebase avec `\n` |
| `MAIL_PROVIDER` | `gmail` (ou `smtp`) |
| `FROM_EMAIL` | `sauvi.notifications@gmail.com` |
| `GMAIL_USER` | Votre compte Gmail |
| `GMAIL_APP_PASSWORD` | Mot de passe d'application Google (16 lettres) |
| `FRONTEND_URL` | `https://sauvi-landing.vercel.app` |

5. Cliquez sur **Create Web Service**. Render va cloner votre repo, compiler le Dockerfile et démarrer l'API.

---

## 🔑 ÉTAPE 5 · Configuration Google OAuth (Local & Production)

Dans SAUVI, le flux OAuth redirige le mobile via le deep link `sauvi://auth/callback`.

### 5.1 — Flux d'authentification
1. L'application mobile ouvre le navigateur : `GET https://sauvi-api.onrender.com/api/auth/google?redirect_uri=sauvi://auth/callback`.
2. Le backend NestJS enregistre `sauvi://auth/callback` dans le paramètre sécurisé `state`.
3. L'utilisateur valide son compte sur Google.
4. Google rappelle l'API NestJS sur l'URI HTTPS autorisée (`/api/auth/google/callback`).
5. L'API émet les tokens JWT et redirige vers `sauvi://auth/callback?accessToken=...`.
6. L'application mobile capte le deep link et connecte l'utilisateur.

### 5.2 — Configuration Google Cloud Console

Dans [Google Cloud Console](https://console.cloud.google.com/apis/credentials) > Identifiants OAuth 2.0 Web :
- **Origines JavaScript autorisées :**
  - `http://localhost:3000`
  - `https://sauvi-api.onrender.com`
  - `https://sauvi-landing.vercel.app`
- **URI de redirection autorisés :**
  - `http://localhost:3000/api/auth/google/callback` (Local)
  - `https://sauvi-api.onrender.com/api/auth/google/callback` (Production)

> ⚠️ Ne mettez jamais `sauvi://` dans Google Cloud Console (Google refuse les schémas non-HTTP). C'est le backend NestJS qui effectue le relais vers le mobile.

---

## 🌐 ÉTAPE 6 · Hébergement de la Landing Page Next.js sur Vercel

Notre landing page (`apps/landing`) est une application **Next.js 14 App Router** moderne avec Tailwind CSS, badges dynamiques, guide d'installation et capture d'écran mobile.

### 6.1 — Déployer sur Vercel depuis le Dashboard (Méthode Recommandée)

1. Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous avec votre compte GitHub.
2. Cliquez sur **Add New...** → **Project**.
3. Importez votre dépôt GitHub `sauvi`.
4. Configurez le projet :
   - **Framework Preset :** `Next.js` *(détecté automatiquement)*
   - **Root Directory :** Cliquez sur *Edit* et sélectionnez **`apps/landing`** *(Indispensable dans notre monorepo !)*
   - **Build & Development Settings :** Laissez les valeurs par défaut (Build Command: `next build`, Output Directory: `.next`).
   - **Environment Variables (Optionnel) :**
     - `NEXT_PUBLIC_APK_DOWNLOAD_URL` : L'URL de téléchargement direct de l'APK (voir Étape 7).
5. Cliquez sur **Deploy**.
6. Vercel compile et déploie le site en ~45 secondes et vous attribue une URL (ex: `https://sauvi-landing.vercel.app`).
7. Tout nouveau commit poussé sur GitHub déclenchera automatiquement un nouveau déploiement Vercel.

---

## 📱 ÉTAPE 7 · Build Mobile EAS & Hébergement de l'APK

### 7.1 — Est-il possible et recommandé d'utiliser Google Firebase Storage pour héberger l'APK ?

> **💡 Analyse & Verdict :**  
> **OUI, c'est 100% possible et tout à fait recommandé**, avec les précisions suivantes :

#### Avantages de Firebase Storage :
1. **Écosystème unifié :** SAUVI utilise déjà Firebase pour les notifications push FCM (`FIREBASE_PROJECT_ID`), votre console Google Firebase est donc déjà active.
2. **CDN Google mondial à très haute vitesse :** Téléchargement direct, rapide et sans ralentissement pour les utilisateurs sur mobile en Afrique ou en Europe.
3. **URL persistante :** Vous pouvez obtenir une URL publique permanente qui ne change pas, même si vous remplacez l'APK par une version plus récente.

#### Quotas & Bonnes pratiques :
- **Plan Spark (Gratuit) :** Firebase offre 5 Go de stockage et **1 Go/jour de téléchargement** gratuit. Si votre APK pèse 50 Mo, cela permet ~20 téléchargements par jour gratuitement.
- Si vous dépassez 20 téléchargements/jour, passez au plan **Blaze** (paiement à l'usage : seulement ~$0.12 par Go supplémentaire, soit quelques centimes pour des centaines de téléchargements).

---

### 7.2 — Procédure : Uploader l'APK sur Firebase Storage & Obtenir le Lien

1. Allez sur la [Console Firebase](https://console.firebase.google.com/) et ouvrez votre projet SAUVI.
2. Dans le menu de gauche, cliquez sur **Storage** (puis *Commencer* si ce n'est pas encore fait).
3. Créez un dossier nommé `apk` ou `releases`.
4. Cliquez sur **Importer un fichier** et envoyez votre fichier `sauvi.apk`.
5. Cliquez sur le fichier uploadé, puis dans le volet droit :
   - Déroulez la section **Informations sur le fichier**.
   - Cliquez sur **Créer un jeton d'accès** (ou copiez le lien sous **URL de téléchargement**).
   - Ce lien a la forme suivante :  
     `https://firebasestorage.googleapis.com/v0/b/<votre-projet>.appspot.com/o/apk%2Fsauvi.apk?alt=media&token=xxxx-xxxx`
6. *(Optionnel - Accès 100% public)* Dans l'onglet **Règles** de Firebase Storage, vous pouvez autoriser la lecture publique sur le dossier apk :
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /apk/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
7. Collez cette URL dans la variable `NEXT_PUBLIC_APK_DOWNLOAD_URL` sur Vercel (ou directement dans le lien du bouton de téléchargement de la landing page).

---

### 7.3 — Générer le fichier APK avec Expo EAS

Dans votre terminal :

```powershell
# 1. Aller dans le workspace mobile
cd C:\Users\MARC DIDIER\sauvi\apps\mobile

# 2. Lancer le build de l'APK autonome
eas build -p android --profile preview
```

Une fois le build terminé, EAS affiche un lien direct vers l'APK :
- Vous pouvez télécharger l'APK généré pour le déposer sur Firebase Storage.
- Ou utiliser directement le lien de téléchargement fourni par EAS.

---

## 🛠️ Résumé des Commandes Quotidiennes

| Action | Commande |
| :--- | :--- |
| **Vérifier le style & linter** | `npm run lint` |
| **Compiler l'ensemble du monorepo** | `npm run build` |
| **Tester localement avec Docker** | `docker compose up -d` |
| **Consulter les logs Docker API** | `docker compose logs -f api` |
| **Pousser sur GitHub (déclenche la CI)** | `git push origin develop` |
| **Tester la landing page en local** | `npm run dev --workspace=@sauvi/landing` |
| **Compiler un nouvel APK Android** | `cd apps/mobile && eas build -p android --profile preview` |
