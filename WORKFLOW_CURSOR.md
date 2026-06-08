# 🖥️ SAUVI — Workflow Cursor : par où commencer

> Guide complet étape par étape pour lancer le développement dans Cursor.
> Inclut les prompts exacts à coller, et comment intégrer le Design System + maquettes Google Stitch.

---

## PARTIE 1 — Préparation de l'espace de travail

### Étape 1 : Installer Cursor

Télécharger Cursor sur https://cursor.sh  
Cursor est un fork de VS Code avec IA intégrée (Claude + GPT-4).  
Toutes les extensions VS Code listées dans `STACK_ET_SETUP.md` fonctionnent dans Cursor.

### Étape 2 : Créer le repo GitHub

```bash
# Sur GitHub.com : New repository → sauvi → Private → sans README
# Puis en local :
mkdir sauvi && cd sauvi
git init
git remote add origin https://github.com/TON_USERNAME/sauvi.git
```

### Étape 3 : Ouvrir dans Cursor

```bash
cursor .
```

Cursor va détecter automatiquement le `.cursorrules` à la racine et l'utiliser comme contexte permanent pour toutes les suggestions IA.

### Étape 4 : Placer les fichiers de gouvernance à la racine

```
sauvi/
├── .cursorrules          ← Contexte IA permanent
├── PLAN_DE_ROUTE.md
├── REGLES_D_OR.md
├── ARBORESCENCE.md
├── STACK_ET_SETUP.md
├── CICD.md
└── SPRINTS.md
```

Copier tous les fichiers de gouvernance à la racine avant d'écrire une seule ligne de code.

---

## PARTIE 2 — Intégration du Design System Google Stitch

### Étape 5 : Récupérer les assets de Google Stitch

Depuis Google Stitch, exporter :
- **Les maquettes PNG** (écrans S-01 à S-27)
- **Le Design System HTML** (fichier tokens / composants)
- **Les couleurs et typographie** (souvent exportés en JSON ou CSS)

Créer cette structure dans le projet :

```
sauvi/
└── design/
    ├── maquettes/
    │   ├── S-01-splash.png
    │   ├── S-02-onboarding.png
    │   ├── S-03-register-step1.png
    │   ├── S-04-register-step2.png
    │   ├── S-05-login.png
    │   ├── S-06-home.png
    │   ├── S-07-notifications.png
    │   ├── S-08-explore.png
    │   ├── S-09-sos-step1.png
    │   ├── S-10-sos-step2.png
    │   ├── S-11-sos-confirm.png
    │   ├── S-12-sos-dashboard.png
    │   ├── S-13-flyer.png
    │   ├── S-14-alert-detail.png
    │   ├── S-15-waitlist.png
    │   ├── S-16-navigation.png
    │   ├── S-17-donation-confirmed.png
    │   ├── S-18-chat.png
    │   ├── S-19-call.png
    │   ├── S-20-profile.png
    │   ├── S-21-settings.png
    │   ├── S-22-eligibility.png
    │   ├── S-23-badges.png
    │   ├── S-24-offline.png
    │   ├── S-25-error-500.png
    │   ├── S-26-error-404.png
    │   └── S-27-skeletons.png
    ├── design-system.html        ← Fichier HTML exporté de Stitch
    └── tokens.json               ← Tokens Design System (si dispo)
```

### Étape 6 : Créer le fichier theme.ts depuis les tokens Stitch

Ouvrir `design/design-system.html` dans Cursor, puis utiliser ce prompt :

---

**PROMPT CURSOR — Générer theme.ts depuis le Design System Stitch :**

```
Voici le Design System de l'application SAUVI exporté depuis Google Stitch :
[coller le contenu du design-system.html ou les valeurs CSS extraites]

Génère le fichier apps/mobile/src/constants/theme.ts complet en TypeScript strict.
Ce fichier doit contenir :

1. COLORS — toutes les couleurs du Design System :
   - primary: '#E24B4A' (rouge sang)
   - primaryDark: '#A32D2D'
   - primaryLight: '#FCEBEB'
   - success: '#1D9E75'
   - successLight: '#EAF3DE'
   - warning: '#BA7517'
   - warningLight: '#FAEEDA'
   - info: '#185FA5'
   - infoLight: '#E6F1FB'
   - background: '#F1EFE8'
   - card: '#FFFFFF'
   - textPrimary: '#2C2C2A'
   - textSecondary: '#888780'
   - border: '#D3D1C7'

2. TYPOGRAPHY — échelle typographique Inter :
   - display: { fontSize: 48, fontWeight: '700' }
   - h1: { fontSize: 28, fontWeight: '700' }
   - h2: { fontSize: 22, fontWeight: '600' }
   - h3: { fontSize: 17, fontWeight: '600' }
   - body: { fontSize: 15, fontWeight: '400' }
   - caption: { fontSize: 13, fontWeight: '400' }

3. SPACING — scale 4px : xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, xxxl=32

4. RADIUS — border radius : sm=6, md=10, lg=16, xl=24, full=999

5. SHADOWS — 3 niveaux + shadow SOS spéciale

Exporte chaque constante nommée ET un objet theme par défaut.
Respecte TypeScript strict (pas de any, types explicites).
```

---

### Étape 7 : Donner les maquettes à Cursor pour implémenter les écrans

Quand vous implémentez un écran, **glisser-déposer la maquette PNG** correspondante dans le chat Cursor, puis utiliser ce prompt :

---

**PROMPT CURSOR — Implémenter un écran depuis la maquette :**

```
Voici la maquette de l'écran [S-XX — Nom] de l'application SAUVI.

Contexte : voir .cursorrules pour la stack complète.

Implémente cet écran dans apps/mobile/src/screens/[dossier]/[NomScreen].tsx
en respectant :
- Le Design System de apps/mobile/src/constants/theme.ts
- TypeScript strict (aucun any)
- StyleSheet.create() pour tous les styles
- La logique dans un hook séparé hooks/use[Nom].ts
- Les composants atomiques de components/ui/ (Button, Card, Badge, etc.)
- Le comportement décrit dans SPRINTS.md pour cet écran

L'écran doit être fonctionnel avec :
- Les états loading (Skeleton)
- Les états d'erreur inline
- Les états vides (EmptyState)
- Le comportement offline si applicable

Ne pas inventer de logique métier — utiliser uniquement
ce qui est décrit dans SPRINTS.md et .cursorrules.
```

---

## PARTIE 3 — Démarrage du développement (Sprint 1)

### Étape 8 : Initialiser le monorepo

Ouvrir le terminal dans Cursor (`Ctrl+`` `) et coller :

```bash
# Installer Turborepo globalement
npm install -g turbo

# Créer la structure monorepo
npx create-turbo@latest . --package-manager npm

# L'assistant Turbo va demander la structure.
# Choisir : apps/api + apps/mobile

# Puis supprimer les apps exemples générées et créer les nôtres
rm -rf apps/docs apps/web
```

---

**PROMPT CURSOR — Setup complet Sprint 1 Backend :**

```
Je commence le développement de SAUVI. Contexte complet dans .cursorrules.

Initialise le backend NestJS dans apps/api/ avec la structure
définie dans ARBORESCENCE.md.

Génère dans l'ordre :

1. apps/api/package.json avec toutes les dépendances de STACK_ET_SETUP.md
   (NestJS 11, Prisma 6, Redis, JWT, Passport, Google OAuth, Sharp,
   AWS SDK S3, Firebase Admin, Zod, Swagger, Throttler, Schedule)

2. apps/api/tsconfig.json avec TypeScript strict complet
   (strict, noImplicitAny, strictNullChecks, noUncheckedIndexedAccess,
   exactOptionalPropertyTypes, noImplicitReturns)

3. apps/api/src/config/env.validation.ts
   Validation Zod de TOUTES les variables d'env listées dans .env.example
   (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, GOOGLE_CLIENT_ID,
   GOOGLE_CLIENT_SECRET, CLOUDFLARE_*, FIREBASE_*, SENDGRID_*, etc.)
   Export : const env = EnvSchema.parse(process.env)

4. apps/api/src/main.ts
   Bootstrap NestJS avec : Helmet, CORS, ValidationPipe global,
   TransformInterceptor global, HttpExceptionFilter global,
   Swagger sur /api/docs, port depuis env.PORT

5. apps/api/src/app.module.ts
   Import : ConfigModule (global), ThrottlerModule (Redis store),
   PrismaModule, CacheModule (Redis)

6. apps/api/src/prisma/prisma.service.ts
   PrismaService injectable avec onModuleInit + enableShutdownHooks

7. apps/api/src/common/filters/http-exception.filter.ts
   Format de réponse : { error: { code: string, message: string, details?: unknown } }

8. apps/api/src/common/filters/prisma-exception.filter.ts
   Transforme les erreurs Prisma P2002 (unique) en 409 Conflict,
   P2025 (not found) en 404 NotFound

9. apps/api/src/common/interceptors/transform.interceptor.ts
   Enveloppe toutes les réponses dans { data: T, meta?: M }

10. apps/api/src/common/decorators/current-user.decorator.ts
    @CurrentUser() decorator qui extrait l'utilisateur du request JWT

11. apps/api/src/common/decorators/public.decorator.ts
    @Public() decorator pour marquer les routes sans auth

12. apps/api/prisma/schema.prisma
    Schéma COMPLET avec UNIQUEMENT sang total (supprimer plaquettes et plasma).
    Pas de pauseMode. Le délai de carence est :
    - masculin : 56 jours
    - feminin : 84 jours
    Modèles : User, SosAlert, DonorWaitlist, Message, Badge
    Voir ARBORESCENCE.md pour les champs exacts.
    IMPORTANT : retirer DonationType et pauseMode.
    Ajouter birthDate (DateTime, obligatoire) et gender ('masculin'|'feminin', obligatoire).

13. .env.example complet à la racine de apps/api/

Génère chaque fichier complet, pas de placeholder ni de "// TODO".
```

---

**PROMPT CURSOR — Setup complet Sprint 1 Mobile :**

```
Contexte SAUVI dans .cursorrules.

Initialise le frontend React Native dans apps/mobile/ avec Expo SDK 54.

Expo SDK 54 — informations clés :
- React Native 0.81 + React 19.1
- New Architecture obligatoire (newArchEnabled: true)
- Reanimated 4.1.x (pas 3.x) + react-native-worklets peer dep obligatoire
- Ne PAS ajouter reanimated/plugin dans babel.config.js (géré par babel-preset-expo)
- edgeToEdgeEnabled: true requis sur Android (Android 16)
- expo-notifications configuré via plugin dans app.json (champ notification déprécié)
- Node.js minimum 20.19.4
- Toujours utiliser "npx expo install [package]" pour les packages Expo

Génère dans l'ordre :

1. apps/mobile/package.json
   Avec toutes les dépendances mobile de STACK_ET_SETUP.md
   (expo ~54.0.0, react-navigation 7, redux-toolkit 2, RTK Query,
   expo-location ~18.1.0, expo-notifications ~0.32.0,
   expo-secure-store ~14.2.0, expo-image-picker ~17.0.0,
   expo-sharing ~13.0.0, expo-haptics ~15.0.0, expo-image ~3.0.0,
   expo-font ~14.0.0, expo-splash-screen ~31.0.0, expo-status-bar ~3.0.0,
   react-native-reanimated ~4.1.0, react-native-worklets ~0.5.0,
   react-native-gesture-handler ~2.21.0, react-native-screens ~4.16.0,
   react-native-safe-area-context ~5.4.0,
   react-native-maps ~1.20.0, react-native-view-shot ^4.0.0,
   react-native-qrcode-svg ^6.3.0, react-native-svg ~15.11.0,
   socket.io-client ^4.8.0, react-hook-form ^7.54.0, zod ^3.24.0,
   axios ^1.7.0, dayjs ^1.11.13)

2. apps/mobile/app.json
   Config Expo SDK 54 : name "SAUVI", slug "sauvi", version "1.0.0",
   scheme "sauvi", newArchEnabled: true, edgeToEdgeEnabled: true (Android),
   plugins: expo-font, expo-secure-store, expo-location, expo-notifications
   (via plugin — PAS via champ notification), expo-image-picker

3. apps/mobile/src/constants/theme.ts
   Design System SAUVI COMPLET :
   COLORS, TYPOGRAPHY (Inter), SPACING, RADIUS, SHADOWS
   Valeurs exactes depuis REGLES_D_OR.md et les mockups

4. apps/mobile/src/constants/bloodTypes.ts
   BLOOD_TYPES : labels, couleurs affichage pour chaque groupe
   BLOOD_COMPATIBILITY : matrice complète depuis .cursorrules
   COOLDOWN_DAYS : { masculin: 56, feminin: 84 } (sang total uniquement)

5. apps/mobile/src/constants/routes.ts
   Enum ou objet ROUTES avec tous les noms d'écrans (S-01 à S-27)

6. apps/mobile/src/store/index.ts + store/api/baseApi.ts
   Store Redux Toolkit avec RTK Query
   baseApi : intercepteur qui tente un refresh automatique sur 401
   Persistance via redux-persist + Expo SecureStore adapter

7. apps/mobile/src/app/RootNavigator.tsx
   Switch entre AuthNavigator et MainNavigator selon le token dans SecureStore

8. apps/mobile/src/app/AuthNavigator.tsx
   Stack : Splash → Onboarding → Login → RegisterStep1 → RegisterStep2

9. apps/mobile/src/app/MainNavigator.tsx
   Bottom Tabs : Home · SOS · Notifications · Profile
   + Stack modaux pour les écrans SOS, Donor, Chat

10. apps/mobile/src/components/ui/
    Composants atomiques COMPLETS :
    - Button.tsx (variants: primary, secondary, ghost, disabled)
    - Input.tsx (avec label, error state, icône optionnelle)
    - Card.tsx (shadow raised + elevated)
    - Badge.tsx (variants: success, warning, danger, info, gray)
    - Avatar.tsx (initiales + image, tailles sm/md/lg)
    - Skeleton.tsx (shimmer animation avec Reanimated 4 useSharedValue)
    - Toast.tsx (success/error/warning, auto-dismiss)
    - EmptyState.tsx (illustration + titre + sous-titre + CTA optionnel)

Génère chaque fichier complet avec TypeScript strict.
```

---

**PROMPT CURSOR — Schéma Prisma SAUVI (sang total uniquement) :**

```
Génère apps/api/prisma/schema.prisma pour SAUVI.

IMPORTANT — Règles spécifiques :
- L'application gère UNIQUEMENT le don de sang total
- Supprimer tout ce qui concerne plaquettes et plasma
- Pas de pauseMode, pas de mode pause
- Le délai de carence est déterminé UNIQUEMENT par le genre :
  masculin = 56 jours, feminin = 84 jours
- Pas de champ donationType dans User
- gender est OBLIGATOIRE (non nullable) : valeurs 'masculin' | 'feminin'
- birthDate est OBLIGATOIRE (DateTime) : validation âge minimum 18 ans dans le service

Modèles complets :
- User (gender obligatoire, birthDate obligatoire, sans donationType, sans pauseMode)
- SosAlert
- DonorWaitlist
- Message
- Badge

Ajouter les index appropriés :
- users : index sur (city, isEligible) pour le filtrage des donneurs
- sos_alerts : index sur (city, status), (requesterId, status)
- messages : index sur (sosId, createdAt)

Générer aussi apps/api/prisma/seed.ts avec :
- 5 utilisateurs test avec différents groupes sanguins à Douala
  (genres et dates de naissance variés)
- 1 SOS actif exemple
```

---

## PARTIE 4 — Workflow quotidien dans Cursor

### Comment travailler sur un sprint

**1. Ouvrir Cursor Chat** (`Ctrl+L` ou `Cmd+L`)

**2. Pour démarrer une tâche :**

```
Je travaille sur SAUVI, Sprint [N], tâche [TASK-SN-BXX ou MXX].
Voici ce que je dois implémenter : [coller la description de la tâche depuis SPRINTS.md]

Génère le fichier complet [chemin exact depuis ARBORESCENCE.md].
Respecte .cursorrules, REGLES_D_OR.md et TypeScript strict.
Génère aussi le fichier de test correspondant.
```

**3. Pour implémenter un écran avec sa maquette :**
- Glisser la PNG de `design/maquettes/S-XX-nom.png` dans le chat Cursor
- Utiliser le prompt de l'Étape 7

**4. Pour débugger une erreur :**

```
Erreur dans SAUVI (contexte dans .cursorrules) :
[coller l'erreur complète]

Fichier concerné : [chemin]
[coller le code]

Analyse et corrige. Génère aussi un test qui aurait détecté ce bug.
```

**5. Pour faire une code review avant commit :**

```
Review ce code SAUVI avant commit.
Fichier : [chemin]
[coller le code]

Vérifie :
1. TypeScript strict (pas de any implicite)
2. Sécurité (pas de données sensibles exposées, guards en place)
3. Respect REGLES_D_OR.md (nommage, structure)
4. Tests présents et pertinents
5. Performance (pas de N+1, pagination si liste)
6. Gestion des erreurs exhaustive
```

### Structure de session de travail recommandée

```
Matin (2h) :
  → 1 tâche backend complète (service + tests)

Après-midi (2h) :
  → 1 écran mobile complet (screen + hook + composants)

Fin de journée (30min) :
  → git commit + push
  → vérifier que la CI est verte
  → noter les blocages pour le lendemain
```

---

## PARTIE 5 — Intégration complète Design System Stitch

### Méthode recommandée : le dossier design/ comme source de vérité

**Étape A — Nommer les maquettes exactement** comme dans la liste ci-dessus (S-01 à S-27) pour que Cursor les retrouve facilement.

**Étape B — Créer un fichier design/README.md** avec les instructions :

```markdown
# Design SAUVI — Source de vérité

## Comment utiliser ces fichiers

Pour implémenter un écran :
1. Ouvrir la maquette PNG correspondante (S-XX-nom.png)
2. Glisser dans Cursor Chat
3. Utiliser le prompt d'implémentation standard

## Design System
- Couleurs : voir theme.ts (générés depuis design-system.html)
- Typographie : Inter (chargée via expo-font)
- Spacing : multiples de 4px
- Composants : voir apps/mobile/src/components/ui/
```

**Étape C — Référencer les maquettes dans SPRINTS.md**

Chaque tâche d'écran mobile dans SPRINTS.md indique le fichier maquette :

```
TASK-S2-M03 : Écran Inscription étape 1 (S-03)
Maquette : design/maquettes/S-03-register-step1.png
```

**Étape D — Prompt Cursor pour extraire les tokens du HTML Stitch**

Si Google Stitch exporte un fichier HTML avec les variables CSS :

```
Ouvre design/design-system.html et extrais :
1. Toutes les variables CSS (--color-*, --font-*, --spacing-*, --radius-*)
2. Tous les composants définis (boutons, cards, inputs, etc.)

Puis :
- Mets à jour apps/mobile/src/constants/theme.ts avec les valeurs exactes
- Génère apps/mobile/src/components/ui/ en reproduisant
  fidèlement chaque composant en React Native
- Si une valeur du HTML diffère de REGLES_D_OR.md,
  utilise la valeur du HTML (source de vérité Stitch)
```

---

## PARTIE 6 — Checklist avant premier commit

```
□ .cursorrules à la racine
□ Tous les fichiers de gouvernance présents
□ design/maquettes/ avec les 27 PNG
□ design/design-system.html présent
□ apps/api/prisma/schema.prisma sans plaquettes/plasma
□ apps/mobile/src/constants/theme.ts généré depuis Stitch
□ .github/workflows/ci.yml configuré
□ .env.example commité (sans vraies valeurs)
□ .gitignore inclut .env, node_modules, .expo, dist
□ npm run lint → 0 erreur Biome
□ npx prisma generate → succès
□ Premier commit : "chore: init monorepo SAUVI"
```

---

## PARTIE 7 — Commandes de démarrage rapide

```bash
# Depuis la racine du monorepo

# Installer toutes les dépendances
npm install

# Démarrer le backend (NestJS)
cd apps/api && npm run start:dev

# Démarrer le frontend (Expo)
cd apps/mobile && npx expo start

# Lancer les tests
npm run test

# Lint + format
npm run lint
npm run lint:fix

# Générer Prisma client après modification du schema
cd apps/api && npx prisma generate

# Créer une migration Prisma
cd apps/api && npx prisma migrate dev --name nom_de_la_migration

# Ouvrir Prisma Studio (interface DB visuelle)
cd apps/api && npx prisma studio
```
