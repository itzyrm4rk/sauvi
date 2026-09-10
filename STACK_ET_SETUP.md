# 🛠️ SAUVI — Stack & Setup

> Extensions VS Code / Cursor indispensables et bibliothèques 2025/2026
> Stack alignée sur **Expo SDK 54** + **React Native 0.81** + **NestJS 11.x**

---

## Versions cibles

| Technologie | Version | Notes |
|---|---|---|
| **Expo SDK** | **54.x** | React Native 0.81 + React 19.1 — New Architecture only |
| **React Native** | **0.81.x** | Inclus via Expo SDK 54 |
| **React** | **19.1.x** | Inclus via Expo SDK 54 |
| **Node.js** | **20.19.4+** | Minimum requis par Expo SDK 54 |
| **NestJS** | **11.1.x** | Express v5 par défaut, Node.js 20+ requis |
| **TypeScript** | **5.7.x** | strict mode obligatoire |
| **Prisma** | **6.x** | Dernière version stable |
| **Turborepo** | **2.x** | Monorepo build cache |
| **Biome** | **1.9.x** | Lint + format (remplace ESLint + Prettier) |

> ⚠️ **New Architecture obligatoire** : Reanimated 4 et d'autres libs SDK 54
> ne supportent plus la Legacy Architecture. Le projet démarre directement en New Arch.

---

## Extensions VS Code / Cursor

### Indispensables (installer en priorité)

| Extension | ID | Utilité |
|---|---|---|
| **Biome** | `biomejs.biome` | Lint + format natif (remplace ESLint + Prettier) |
| **Prisma** | `Prisma.prisma` | Coloration syntaxe, autocomplétion schema.prisma |
| **Thunder Client** | `rangav.vscode-thunder-client` | Test API REST intégré (remplace Postman) |
| **GitLens** | `eamodio.gitlens` | Historique Git inline, blame, comparaisons |
| **GitHub Actions** | `github.vscode-github-actions` | Validation + autocomplétion des workflows YAML |
| **Error Lens** | `usernamehako.errorlens` | Affiche les erreurs TypeScript inline dans le code |
| **Pretty TypeScript Errors** | `yoavbls.pretty-ts-errors` | Rend les erreurs TS lisibles |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | Renomme les balises JSX en paires |
| **Import Cost** | `wix.vscode-import-cost` | Affiche le poids des imports inline |
| **DotENV** | `mikestead.dotenv` | Coloration syntaxe des fichiers .env |
| **REST Client** | `humao.rest-client` | Tester les endpoints depuis des fichiers .http |

### React Native / Expo

| Extension | ID | Utilité |
|---|---|---|
| **React Native Tools** | `msjsdiag.vscode-react-native` | Debug RN, Expo integration |
| **Expo Tools** | `expo.vscode-expo-tools` | Autocomplétion app.json, diagnostics |
| **ES7+ React Snippets** | `dsznajder.es7-react-js-snippets` | Snippets `rafce`, `useS`, etc. |

### NestJS / Backend

| Extension | ID | Utilité |
|---|---|---|
| **NestJS Files** | `AbhijoyBasak.nestjs-files` | Génère module/controller/service d'un clic |
| **Path Intellisense** | `christian-kohler.path-intellisense` | Autocomplétion des chemins d'import |

### Productivité

| Extension | ID | Utilité |
|---|---|---|
| **Todo Tree** | `Gruntfuggly.todo-tree` | Liste tous les TODO/FIXME du projet |
| **Conventional Commits** | `vivaxy.vscode-conventional-commits` | Guide pour rédiger des commits normalisés |
| **Code Spell Checker** | `streetsidesoftware.code-spell-checker` | Correcteur orthographique dans le code |

### Settings VS Code recommandés

```json
// .vscode/settings.json (commiter dans le repo)
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.rulers": [100],
  "files.exclude": {
    "**/node_modules": true,
    "**/.expo": true,
    "**/dist": true
  }
}
```

---

## Bibliothèques Backend (NestJS 11.x)

### Core NestJS

```json
{
  "@nestjs/core": "^11.1.0",
  "@nestjs/common": "^11.1.0",
  "@nestjs/platform-express": "^11.1.0",
  "@nestjs/config": "^4.0.0",
  "@nestjs/schedule": "^5.0.0",
  "@nestjs/throttler": "^6.0.0",
  "@nestjs/swagger": "^8.1.0",
  "@nestjs/websockets": "^11.1.0",
  "@nestjs/platform-socket.io": "^11.1.0"
}
```

> NestJS 11 utilise **Express v5** par défaut (stable depuis 2025).
> Requiert **Node.js 20.19.4+**.

### Auth

```json
{
  "@nestjs/passport": "^11.0.0",
  "@nestjs/jwt": "^11.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "passport-google-oauth20": "^2.0.0",
  "bcrypt": "^5.1.1"
}
```

### Base de données

```json
{
  "@prisma/client": "^6.0.0",
  "prisma": "^6.0.0"
}
```

> Prisma 6.x — version stable, support PostgreSQL 16, Supabase, migrations.

### Cache & Sessions

```json
{
  "@nestjs/cache-manager": "^3.0.0",
  "cache-manager": "^6.0.0",
  "ioredis": "^5.4.1"
}
```

### Validation & Transformation

```json
{
  "zod": "^3.24.0",
  "class-transformer": "^0.5.1",
  "class-validator": "^0.14.1"
}
```

### Fichiers & Médias

```json
{
  "@supabase/supabase-js": "^2.47.0"
}
```

> `sharp` est utilisé **uniquement** pour la conversion d'avatars en WebP avant upload R2.
> Les flyers sont générés côté mobile (react-native-view-shot).

### Notifications & Email

```json
{
  "firebase-admin": "^13.0.0",
  "nodemailer": "^6.9.16",
  "@sendgrid/mail": "^8.1.4"
}
```

### Temps réel

```json
{
  "socket.io": "^4.8.0"
}
```

### Utilitaires

```json
{
  "dayjs": "^1.11.13",
  "helmet": "^8.0.0",
  "compression": "^1.7.5"
}
```

---

## Bibliothèques Frontend (Expo SDK 54 — React Native 0.81)

> ⚠️ Toujours utiliser `npx expo install [package]` pour les packages Expo.
> Cette commande installe automatiquement la version compatible avec le SDK installé.

### Core Navigation

```json
{
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/native-stack": "^7.0.0",
  "@react-navigation/bottom-tabs": "^7.0.0",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "~5.4.0"
}
```

### State Management & Data Fetching

```json
{
  "@reduxjs/toolkit": "^2.5.0",
  "react-redux": "^9.2.0",
  "redux-persist": "^6.0.0"
}
```

### Expo SDK 54 — Packages officiels

```json
{
  "expo": "~54.0.0",
  "expo-location": "~18.1.0",
  "expo-notifications": "~0.32.0",
  "expo-secure-store": "~14.2.0",
  "expo-image-picker": "~17.0.0",
  "expo-sharing": "~13.0.0",
  "expo-font": "~14.0.0",
  "expo-splash-screen": "~31.0.0",
  "expo-status-bar": "~3.0.0",
  "expo-haptics": "~15.0.0",
  "expo-image": "~3.0.0",
  "expo-linking": "~8.0.0"
}
```

> `expo-image` remplace `<Image>` de React Native pour de meilleures performances.
> `expo-haptics` pour le retour haptique sur les actions importantes.

### Animations — Reanimated 4 (New Architecture only)

```json
{
  "react-native-reanimated": "~4.1.0",
  "react-native-worklets": "~0.5.0",
  "react-native-gesture-handler": "~2.21.0"
}
```

> **Reanimated 4** est la version compatible Expo SDK 54.
> `react-native-worklets` est une **dépendance peer obligatoire** de Reanimated 4 —
> doit être installé explicitement.
> Ne plus ajouter `react-native-reanimated/plugin` dans `babel.config.js` —
> c'est géré automatiquement par `babel-preset-expo`.

### Cartes & Localisation

```json
{
  "react-native-maps": "~1.20.0"
}
```

### Génération Flyer

```json
{
  "react-native-view-shot": "^4.0.0",
  "react-native-svg": "~15.11.0"
}
```

### Chat & Temps Réel

```json
{
  "socket.io-client": "^4.8.0"
}
```

### Formulaires & Validation

```json
{
  "react-hook-form": "^7.54.0",
  "zod": "^3.24.0",
  "@hookform/resolvers": "^3.9.0"
}
```

### Utilitaires

```json
{
  "axios": "^1.7.0",
  "dayjs": "^1.11.13",
  "react-native-keyboard-aware-scroll-view": "^0.9.5"
}
```

### Dev Dependencies (racine monorepo)

```json
{
  "@biomejs/biome": "^1.9.4",
  "turbo": "^2.3.0",
  "typescript": "^5.7.0"
}
```

---

## Configuration Biome

```json
// biome.json (racine monorepo)
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn",
        "noConsoleLog": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "useConst": "error",
        "noVar": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "jsxSingleQuote": true
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      ".expo",
      "prisma/migrations",
      "coverage"
    ]
  }
}
```

---

## Configuration Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Configuration app.json (Expo SDK 54)

```json
{
  "expo": {
    "name": "SAUVI",
    "slug": "sauvi",
    "version": "1.0.0",
    "scheme": "sauvi",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "app.sauvi.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "app.sauvi.mobile",
      "edgeToEdgeEnabled": true
    },
    "plugins": [
      "expo-font",
      "expo-secure-store",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "SAUVI a besoin de votre position pour détecter l'hôpital le plus proche."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#E24B4A"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "SAUVI a besoin d'accéder à vos photos pour votre avatar."
        }
      ]
    ]
  }
}
```

> ⚠️ `newArchEnabled: true` est **obligatoire** pour Reanimated 4.
> `edgeToEdgeEnabled: true` est **requis** sur Android 16 (ciblé par SDK 54).
> La configuration des notifications se fait via le **plugin expo-notifications**
> (le champ `notification` dans app.json est déprécié depuis SDK 54).

---

## .env.example

```bash
# ===========================
# SAUVI — Variables d'environnement
# Copier en .env et remplir les valeurs
# ===========================

# Application
NODE_ENV=development
PORT=3000

# Base de données (Supabase PostgreSQL 16)
DATABASE_URL="postgresql://user:password@host:5432/sauvi_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="minimum-32-caracteres-secret-jwt-access"
JWT_REFRESH_SECRET="minimum-32-caracteres-secret-jwt-refresh"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Cloudflare R2 (CDN avatars)
SUPABASE_URL="https://votre-projet.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key"
# La DATABASE_URL Supabase est déjà présente — rien à ajouter

# Firebase (FCM Push Notifications)
FIREBASE_PROJECT_ID="sauvi-app"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@sauvi-app.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email (SendGrid)
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
FROM_EMAIL="noreply@sauvi.app"

# Frontend URL (pour les redirections OAuth)
FRONTEND_URL="exp://localhost:8081"
```
