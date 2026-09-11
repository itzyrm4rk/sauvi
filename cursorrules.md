# SAUVI — Cursor Rules
# Application mobile de don de sang d'urgence
# Ces règles s'appliquent à toutes les suggestions de l'IA dans ce projet.

## Identité du projet

Tu travailles sur SAUVI, une application mobile React Native (Expo) avec un backend NestJS.
L'app connecte des familles en urgence médicale à des donneurs de sang bénévoles.
Chaque utilisateur a un profil unifié — il peut lancer un SOS ET répondre à une alerte.

## Stack technique (Expo SDK 54 — 2025/2026)

### Backend
- NestJS 11.1.x avec TypeScript 5.7.x strict
- Express v5 (défaut NestJS 11, stable depuis 2025)
- Prisma 6.x avec PostgreSQL 16 (Supabase)
- Redis 7 (cache, sessions, rate limiting)
- Socket.io 4.x via NestJS Gateways (WebSocket)
- Passport.js + JWT (access 15min + refresh 30j)
- Google OAuth 2.0 via @nestjs/passport
- Firebase Admin SDK (FCM push notifications)
- Zod pour validation runtime des DTOs
- @nestjs/schedule pour les crons (rappels carence)
- @nestjs/throttler pour le rate limiting
- Swagger (@nestjs/swagger) pour la documentation API
- Node.js 20.19.4+ (requis par NestJS 11 et Expo SDK 54)

### Frontend Mobile — Expo SDK 54
- React Native 0.81 + React 19.1 (inclus Expo SDK 54)
- **New Architecture obligatoire** (newArchEnabled: true)
- TypeScript 5.7.x strict
- React Navigation 7.x (Stack + Bottom Tabs)
- Redux Toolkit 2.x avec RTK Query (state + data fetching)
- Expo Location ~18.1.0 (géolocalisation GPS)
- Expo Notifications ~0.32.0 (push notifications FCM)
  → Configurer via plugin dans app.json (champ "notification" déprécié SDK 54)
- Expo SecureStore ~14.2.0 (stockage sécurisé des tokens JWT)
- Expo Image Picker ~17.0.0 (sélection avatar)
- Expo Sharing ~13.0.0 (partage natif iOS/Android)
- Expo Haptics ~15.0.0 (retour haptique)
- Expo Image ~3.0.0 (remplace React Native Image)
- React Native Maps ~1.20.0 (cartes + itinéraires)
- **React Native Reanimated ~4.1.0** (animations — New Arch only)
  → Ne PAS ajouter reanimated/plugin dans babel.config.js
  → Géré automatiquement par babel-preset-expo
- **react-native-worklets ~0.5.0** (peer dep obligatoire de Reanimated 4)
- React Native Gesture Handler ~2.21.0
- React Native Screens ~4.16.0
- react-native-view-shot ^4.0.0 (capture flyer en PNG)
- expo-sharing ~13.0.0 (partage natif iOS/Android)
- react-native-svg ~15.11.0
- Socket.io client ^4.8.0 (WebSocket temps réel)
- Zod ^3.24.0 (validation formulaires)
- React Hook Form ^7.54.0

### Monorepo
- Structure : apps/api (NestJS) + apps/mobile (Expo) + packages/shared (types)
- Biome 1.9.x (lint + format, remplace ESLint + Prettier)
- Turborepo 2.x
- GitHub Actions (CI uniquement pour l'instant)
- Conventional Commits

## Design System SAUVI

Couleurs :
- Primary (rouge sang) : #E24B4A
- Primary dark : #A32D2D
- Primary light : #FCEBEB
- Success (vert éligible) : #1D9E75
- Warning (ambre) : #BA7517
- Info (bleu) : #185FA5
- Background app : #F1EFE8
- Cards : #FFFFFF
- Text primary : #2C2C2A
- Text secondary : #888780
- Border : #D3D1C7

Typographie : Inter, weights 400 et 600 uniquement
Border radius : 10px inputs, 16px cards, 24px boutons primaires, 999px pills

## Règles de génération de code

### TOUJOURS faire

1. TypeScript strict — aucun `any`, aucun `as Type` sans validation préalable
2. Typer explicitement tous les paramètres de fonctions et valeurs de retour
3. Utiliser les types partagés de `packages/shared/src/types/`
4. Valider les inputs avec Zod avant tout traitement
5. Gérer les erreurs avec try/catch et retourner des erreurs typées
6. Ajouter des commentaires JSDoc sur les services et fonctions complexes
7. Écrire le test unitaire en même temps que le service (même fichier .spec.ts)
8. Utiliser `async/await` plutôt que `.then().catch()`
9. Utiliser les variables d'environnement validées via `env.ts` (jamais `process.env.X` directement)
10. Préfixer les hooks React Native avec `use`

### NE JAMAIS faire

1. Utiliser `any` ou `unknown` sans narrowing immédiat
2. Faire des appels DB dans une boucle — utiliser `findMany` avec `where: { in: [...] }`
3. Retourner `password_hash` ou tout champ sensible depuis un endpoint
4. Stocker des tokens JWT dans AsyncStorage (utiliser SecureStore)
5. Faire du `SELECT *` avec Prisma — toujours spécifier les champs avec `select:`
6. Créer un composant React Native de plus de 150 lignes sans le découper
7. Mettre de la logique métier dans un composant — extraire dans un hook
8. Hardcoder des URLs, secrets ou constantes métier dans le code
9. Ignorer les erreurs avec des catch vides `catch (_) {}`
10. Utiliser `console.log` en production — utiliser le Logger NestJS

### Pour NestJS spécifiquement

- Structure module : `module.ts` + `controller.ts` + `service.ts` + `service.spec.ts` + `dto/`
- Chaque controller doit avoir `@UseGuards(JwtAuthGuard)` sauf routes `@Public()`
- Chaque endpoint de mutation (POST/PATCH/DELETE) doit avoir `@Throttle()`
- Utiliser `@CurrentUser()` decorator pour accéder à l'utilisateur authentifié
- Les repositories Prisma sont encapsulés dans les services, jamais injectés directement dans les controllers
- Les events WebSocket suivent le format `domaine:action` (ex: `sos:created`, `waitlist:donor_joined`)

### Pour React Native / Expo spécifiquement

- Chaque écran est dans `screens/[domaine]/[NomScreen].tsx`
- Les composants réutilisables sont dans `components/[domaine]/[NomComposant].tsx`
- Chaque écran utilise un hook dédié pour sa logique : `hooks/use[NomLogique].ts`
- Les styles sont définis avec `StyleSheet.create()` dans le même fichier
- Les couleurs et tokens du Design System viennent de `constants/theme.ts`
- Toujours tester le comportement offline (cache RTK Query)
- Les animations utilisent Reanimated 4 (`useSharedValue`, `useAnimatedStyle`)
  → Ne PAS mettre reanimated/plugin dans babel.config.js (géré par babel-preset-expo)
  → react-native-worklets doit être installé explicitement (peer dep obligatoire)

## Compatibilité sanguine ABO/Rhésus

Voici la matrice complète. Quand tu génères du code lié aux notifications ou au filtrage des donneurs, utilise TOUJOURS cette référence :

```typescript
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'AB+': ['O-','O+','A-','A+','B-','B+','AB-','AB+'],
  'AB-': ['O-','B-','A-','AB-'],
  'A+':  ['O-','O+','A-','A+'],
  'A-':  ['O-','A-'],
  'B+':  ['O-','O+','B-','B+'],
  'B-':  ['O-','B-'],
  'O+':  ['O-','O+'],
  'O-':  ['O-'],
};
```

## Délais de carence médicale (sang total uniquement)

SAUVI gère UNIQUEMENT le don de sang total. Plaquettes et plasma ne sont pas dans le scope.

```typescript
// Délai de carence par genre — sang total uniquement
// gender est enregistré à l'inscription (étape 2) et ne peut plus être modifié
export const COOLDOWN_DAYS: Record<string, number> = {
  masculin: 56,  // 8 semaines
  feminin: 84,   // 12 semaines
};
```

## Villes couvertes (packages/shared/src/constants/cities.ts)

SAUVI couvre une liste FERMÉE de 9 villes du Cameroun. Tout champ ville
(inscription S-04, création SOS S-10) doit utiliser l'autocomplétion sur
cette liste exacte — jamais de saisie libre non contrainte.

```typescript
export const CAMEROON_CITIES = [
  'Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam',
  'Bertoua', 'Ebolowa', 'Ngaoundéré', 'Buea',
] as const;

export type City = (typeof CAMEROON_CITIES)[number];
```

## Structure des réponses API

Toujours respecter ce format de réponse :

```typescript
// Succès
{ data: T, meta?: PaginationMeta }

// Erreur
{ error: { code: string, message: string, details?: unknown } }

// Pagination
{ data: T[], meta: { total: number, cursor: string | null, hasMore: boolean } }
```

## Nommage — rappel rapide

- Fichiers : kebab-case (`blood-compatibility.service.ts`)
- Classes : PascalCase (`BloodCompatibilityService`)
- Variables/fonctions : camelCase (`findEligibleDonors`)
- Constantes globales : SCREAMING_SNAKE_CASE (`MAX_SOS_PER_USER`)
- Composants RN : PascalCase (`SosAlertCard.tsx`)
- Hooks : camelCase + préfixe use (`useSosWaitlist`)
- Tables DB : snake_case (`sos_alerts`)
- Routes API : kebab-case pluriel (`/sos-alerts`)
- Events WebSocket : domaine:action (`waitlist:donor_joined`)

## Contexte métier important

- Un utilisateur ne peut avoir qu'1 SOS actif à la fois
- **Notifications PUSH FCM — TOKEN DIRECT uniquement, pas de Topic.** Le filtrage
  (compatibilité ABO/Rhésus + ville + is_eligible) est fait en SQL via Prisma
  AVANT l'envoi, puis multicast sur les tokens FCM individuels résultants.
  Les Topics FCM ne sont pas utilisés : ils ne permettent pas de filtrage
  dynamique multi-critères (l'éligibilité change quotidiennement par cron,
  la compatibilité ABO dépend du groupe demandé à chaque SOS).
- **Notification IN-APP pour les utilisateurs non concernés.** Tout utilisateur
  incompatible, en carence, ou d'une autre ville reçoit une notification
  in-app (stockée en DB, PAS de push) visible dans le centre de notifications
  (S-07), avec un bouton de partage pour relayer l'alerte sur ses réseaux.
- Le chat entre famille et donneur n'est accessible qu'après validation du donneur
- Après clôture d'un SOS, le chat passe en lecture seule
- **C'est TOUJOURS la famille (demandeur) qui confirme qu'un don a eu lieu**
  (PATCH status "donated"), jamais le donneur lui-même.
- **Un donneur peut annuler sa participation à tout moment** tant que le don
  n'est pas confirmé — que son statut soit "waiting" OU "validated".
  L'annulation devient impossible uniquement une fois status "donated".
- **Tous les boutons d'appel utilisent le deep link natif** `tel:` via
  `Linking.openURL` (hook `useNativeCall` centralisé). Aucun écran d'appel
  custom in-app (pas de numéro masqué, pas de minuteur maison) — l'app
  Téléphone native du système s'ouvre directement.
- Le dashboard SOS actif (S-12), tab "Validés", expose un bouton Appeler
  (deep link natif) et un bouton Chat sur chaque donneur validé.
- Pas de QR code dans le flyer — partage texte + image uniquement.
- La génération du flyer se fait côté mobile (react-native-view-shot), pas côté serveur
- - Les avatars sont uploadés dans Supabase Storage (bucket "avatars", accès public)
  via NestJS (@supabase/supabase-js). URL publique CDN stockée dans users.avatar_url.
  Pas de conversion manuelle — les transformations d'image (resize, qualité)
  se font côté CDN Supabase via paramètres d'URL (?width=200&quality=80).
- Les flyers sont capturés localement et partagés via expo-sharing (pas de stockage serveur)

## Priorités de développement (ordre des sprints)

1. Auth (JWT + Google OAuth)
2. Profil unifié
3. Création SOS + notifications push FCM (token direct) + notifications in-app
4. Flux donneur (waitlist + validation + annulation flexible + carence)
5. Temps réel WebSocket
6. Chat intégré + appel natif (deep link tel:)
7. Générateur flyer (react-native-view-shot, sans QR code)
8. Réputation + badges
9. Explorer + carte + bouton de partage sur les SOS
10. Animations + polish
