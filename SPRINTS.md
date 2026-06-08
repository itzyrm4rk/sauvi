# 🏃 SAUVI — Roadmap par Sprints

> Chaque sprint dure 2 semaines.  
> Chaque fonctionnalité est décrite avec ses scénarios pour guider l'IA de développement.

---

## Comment utiliser ce fichier avec Cursor / Windsurf

Copier le bloc du sprint en cours dans le chat de l'IA avec ce préfixe :

```
Tu travailles sur SAUVI (voir .cursorrules).
Voici le sprint en cours. Implémente les tâches dans l'ordre indiqué,
en respectant les REGLES_D_OR.md et l'arborescence de ARBORESCENCE.md.
```

---

# PHASE 1 — MVP

---

## Sprint 1 — Setup & Infrastructure

**Durée :** Semaines 1–2  
**Objectif :** Monorepo fonctionnel, CI verte, base de données connectée.

### Tâches Backend

```
TASK-S1-B01 : Initialiser le monorepo avec Turborepo
  Structure : apps/api + apps/mobile + packages/shared
  Commande : npx create-turbo@latest sauvi

TASK-S1-B02 : Initialiser NestJS 11 dans apps/api
  - TypeScript strict (tsconfig avec tous les checks activés)
  - Module racine AppModule
  - Validation des variables d'env avec Zod (config/env.validation.ts)
  - Swagger configuré sur /api/docs

TASK-S1-B03 : Configurer Prisma + PostgreSQL
  - Installation Prisma 6
  - Schéma initial (modèle User uniquement pour commencer)
  - Première migration
  - PrismaService injectable

TASK-S1-B04 : Configurer Redis
  - Connexion Redis via ioredis
  - Module cache NestJS (@nestjs/cache-manager)

TASK-S1-B05 : Setup Biome + scripts package.json
  - biome.json à la racine
  - Scripts lint/format/test dans chaque package
  - Configuration editor .vscode/settings.json

TASK-S1-B06 : Configurer GitHub Actions CI
  - .github/workflows/ci.yml (lint + tests + build)
  - Secrets de base configurés

TASK-S1-B07 : Configurer les filtres d'exception globaux
  - HttpExceptionFilter (format { error: { code, message } })
  - PrismaExceptionFilter (transformer les erreurs Prisma en HTTP)
```

### Tâches Mobile

```
TASK-S1-M01 : Initialiser Expo SDK 54 dans apps/mobile
  - npx create-expo-app --template blank-typescript
  - TypeScript strict
  - newArchEnabled: true dans app.json (obligatoire pour Reanimated 4)
  - edgeToEdgeEnabled: true pour Android 16
  - Configuration EAS (eas.json : development + preview + production)
  - Node.js 20.19.4+ requis

TASK-S1-M02 : Installer et configurer React Navigation 7
  - Stack Navigator + Bottom Tab Navigator
  - RootNavigator (switch auth/main)
  - Types de navigation dans types/navigation.types.ts

TASK-S1-M03 : Installer et configurer Redux Toolkit + RTK Query
  - Store Redux dans store/index.ts
  - baseApi RTK Query avec intercepteur refresh token
  - Persistance (redux-persist + SecureStore adapter)

TASK-S1-M04 : Implémenter le Design System SAUVI
  - constants/theme.ts (couleurs, typographie, spacing, border-radius)
  - Composants UI atomiques : Button, Input, Card, Badge, Avatar, Skeleton
  - Chargement de la police Inter (expo-font)
  - Reanimated 4.1.x + react-native-worklets (peer dep obligatoire)
  - Ne pas ajouter reanimated/plugin dans babel.config.js (géré par babel-preset-expo)
```

### Scénarios de validation Sprint 1

```
SCEN-S1-01 : npm run lint → 0 erreur Biome
SCEN-S1-02 : npm run build → build TypeScript sans erreur
SCEN-S1-03 : npx prisma migrate dev → migration appliquée
SCEN-S1-04 : GitHub Actions CI → tous les jobs passent au vert
SCEN-S1-05 : GET /api/docs → Swagger accessible
```

---

## Sprint 2 — Authentification complète

**Durée :** Semaines 3–4  
**Objectif :** Inscription, connexion, JWT, Google OAuth fonctionnels.

### Scénarios métier

```
SCEN-AUTH-01 : Inscription email — étape 1
  GIVEN un visiteur non inscrit
  WHEN il POST /auth/register/step1 avec { name, email, password }
  THEN il reçoit un userId temporaire et peut passer à l'étape 2

SCEN-AUTH-02 : Inscription email — étape 2
  GIVEN un userId temporaire de l'étape 1
  WHEN il POST /auth/register/step2 avec { bloodType, city, phone }
  THEN son compte est créé, il reçoit { accessToken, refreshToken }

SCEN-AUTH-03 : Connexion email
  GIVEN un utilisateur inscrit avec email/password
  WHEN il POST /auth/login avec ses identifiants corrects
  THEN il reçoit { accessToken, refreshToken }

SCEN-AUTH-04 : Connexion Google OAuth
  GIVEN un visiteur avec un compte Google
  WHEN il GET /auth/google → callback /auth/google/callback
  THEN son profil est créé (ou retrouvé), il reçoit { accessToken, refreshToken }

SCEN-AUTH-05 : Refresh token
  GIVEN un accessToken expiré et un refreshToken valide
  WHEN il POST /auth/refresh avec le refreshToken
  THEN il reçoit un nouvel accessToken + nouveau refreshToken (rotation)

SCEN-AUTH-06 : Brute force protection
  GIVEN un attaquant essayant de deviner un mot de passe
  WHEN il fait 5 tentatives de login échouées en moins de 5 minutes
  THEN les tentatives suivantes retournent 429 Too Many Requests pendant 15min

SCEN-AUTH-07 : Token JWT invalide
  GIVEN un utilisateur avec un accessToken expiré
  WHEN il appelle n'importe quel endpoint protégé
  THEN il reçoit 401 Unauthorized avec { error: { code: 'TOKEN_EXPIRED' } }
```

### Tâches Backend

```
TASK-S2-B01 : Module auth/ complet
  Fichiers : auth.module.ts, auth.controller.ts, auth.service.ts
  
TASK-S2-B02 : Stratégies Passport
  - jwt.strategy.ts (accessToken)
  - jwt-refresh.strategy.ts (refreshToken, cookie ou header)
  - google.strategy.ts (OAuth 2.0)

TASK-S2-B03 : Endpoints auth
  POST /auth/register/step1 → { name, email, password }
  POST /auth/register/step2 → { bloodType, gender, birthDate, city, phone }
    - gender : 'masculin' | 'feminin'
    - birthDate : ISO date string, validation âge minimum 18 ans
    - gender est stocké et utilisé pour calculer le délai de carence (homme=56j, femme=84j)
  POST /auth/login
  GET  /auth/google
  GET  /auth/google/callback
  POST /auth/refresh
  POST /auth/logout
  POST /auth/forgot-password
  POST /auth/reset-password

TASK-S2-B04 : Guards et décorateurs
  - JwtAuthGuard (global sauf @Public())
  - @Public() decorator
  - @CurrentUser() decorator

TASK-S2-B05 : Rate limiting sur auth
  @Throttle : 5 tentatives login / 5min
  Stockage compteur dans Redis

TASK-S2-B06 : Tests unitaires AuthService (couverture 80%+)
  - test inscription étape 1 et 2
  - test login succès et échec
  - test refresh rotation
  - test brute force
```

### Tâches Mobile

```
TASK-S2-M01 : Écran Splash (S-01)
  - Logo SAUVI animé (Reanimated 4)
  - Auto-redirect après 2s vers OnboardingScreen ou HomeScreen

TASK-S2-M02 : Écran Onboarding (S-02)
  - 3 slides avec illustrations placeholders
  - Dots de pagination
  - Bouton Skip → LoginScreen
  - CTA final → RegisterStep1Screen

TASK-S2-M03 : Écran Inscription étape 1 (S-03)
  - Bouton Google OAuth (expo-auth-session)
  - Séparateur "ou s'inscrire avec un e-mail"
  - Formulaire : nom, email, mot de passe (react-hook-form + Zod)
  - Indicateur de force du mot de passe (4 segments)
  - Checkbox consentement légal
  - Lien "Déjà un compte ?"

TASK-S2-M04 : Écran Inscription étape 2 (S-04)
  - Grille 4×2 groupes sanguins (sélecteur)
  - Sélecteur genre : Masculin / Féminin (2 boutons segmentés)
  - Champ date de naissance (date picker natif expo)
  - Champ ville
  - Champ téléphone avec flag (+237 défaut)
  - Photo optionnelle (expo-image-picker)
  - CTA "Créer mon compte"
  Erreurs :
  - Groupe non sélectionné → CTA bloqué
  - Genre non sélectionné → CTA bloqué
  - Date de naissance invalide (< 18 ans) → message "Vous devez avoir 18 ans minimum"
  - Date de naissance manquante → champ requis

TASK-S2-M05 : Écran Login (S-05)
  - Bouton Google OAuth
  - Formulaire email + mot de passe
  - Lien "Mot de passe oublié ?"
  - Gestion erreur inline (identifiants incorrects)
  - Lien "Pas encore de compte ?"

TASK-S2-M06 : Hook useAuth.ts
  - login(), register(), logout(), refreshToken()
  - Persistance token dans Expo SecureStore
  - Intercepteur Axios : refresh automatique sur 401

TASK-S2-M07 : RootNavigator : redirect selon token
  - Token présent + valide → MainNavigator
  - Token absent → AuthNavigator
```

---

## Sprint 3 — Profil unifié & Accueil

**Durée :** Semaines 5–6

### Scénarios métier

```
SCEN-PROFIL-01 : Voir son profil
  GIVEN un utilisateur connecté
  WHEN il GET /users/me
  THEN il reçoit son profil complet (sans password_hash)

SCEN-PROFIL-02 : Modifier son avatar
  GIVEN un utilisateur connecté
  WHEN il POST /users/me/avatar avec une image JPEG/PNG < 5MB
  THEN l'image est convertie en WebP, uploadée sur Cloudflare R2,
       et avatar_url est mis à jour dans la DB

SCEN-PROFIL-03 : Vérifier l'éligibilité
  GIVEN un utilisateur dont next_eligible_date est dans le passé
  WHEN il GET /users/me/eligibility
  THEN il reçoit { isEligible: true, nextEligibleDate: null }

SCEN-PROFIL-04 : Accueil en offline
  GIVEN un utilisateur sans connexion réseau
  WHEN il ouvre l'app
  THEN les données cachées (profil, dernières alertes) sont visibles
       avec un banner "Hors ligne" en haut

SCEN-PROFIL-05 : Badge éligibilité accueil
  GIVEN un utilisateur en période de carence (next_eligible_date dans le futur)
  WHEN il consulte l'accueil
  THEN le badge rouge "En carence — X jours" est affiché
```

### Tâches Backend

```
TASK-S3-B01 : Module users/ complet
  GET  /users/me
  PATCH /users/me
  POST /users/me/avatar
  GET  /users/me/eligibility
  PATCH /users/me/fcm-token

TASK-S3-B02 : CloudflareR2Service (storage/)
  - Upload fichier Buffer vers R2
  - Conversion WebP avec sharp avant upload
  - Retourne URL CDN publique

TASK-S3-B03 : EligibilityService (eligibility/)
  - calculateNextEligibleDate(gender, lastDonationDate)
  - isCurrentlyEligible(nextEligibleDate)
  - Délais sang total uniquement : homme=56j, femme=84j
  - Tests 100% couverture sur tous les cas
```

### Tâches Mobile

```
TASK-S3-M01 : Écran Accueil unifié (S-06)
  - Header : avatar + "Bonjour [nom]" + icône cloche
  - Badge éligibilité dynamique (vert/rouge)
  - Grand bouton SOS rouge circulaire (pulsation Reanimated 4)
  - Section "Alertes près de moi" (placeholder liste vide)
  - Bottom navigation bar (Home · SOS · Alertes · Profil)

TASK-S3-M02 : Skeleton loading
  - Composant Skeleton.tsx réutilisable (shimmer animation)
  - Appliqué sur HomeScreen pendant le chargement

TASK-S3-M03 : Hook useEligibility.ts
  - Appel GET /users/me/eligibility
  - Cache RTK Query 5 minutes

TASK-S3-M04 : Écran Profil unifié (S-20)
  - Avatar éditable
  - Stats : nb dons · nb SOS · points
  - Badge actuel
  - Section "Mes dons" (liste vide pour l'instant)
  - Section "Mes SOS" (liste vide pour l'instant)
```

---

## Sprint 4 — Création SOS & Notifications Push

**Durée :** Semaines 7–8

### Scénarios métier

```
SCEN-SOS-01 : Créer un SOS Urgence vitale
  GIVEN un utilisateur connecté sans SOS actif
  WHEN il POST /sos avec { bloodTypeNeeded: "A+", unitsNeeded: 2,
       priority: "urgence_vitale", hospitalName: "CHU Laquintinie",
       city: "Douala", latitude: 4.05, longitude: 9.7 }
  THEN un SOS est créé avec status: "active"
       ET une notification push est envoyée à tous les donneurs compatibles
       (O-, O+, A-, A+) de la ville "Douala" qui sont éligibles

SCEN-SOS-02 : Blocage double SOS
  GIVEN un utilisateur avec un SOS status: "active"
  WHEN il POST /sos
  THEN il reçoit 409 Conflict { error: { code: "SOS_ALREADY_ACTIVE" } }

SCEN-SOS-03 : Filtrage notifications
  GIVEN un SOS pour groupe A+ à Douala
  WHEN les notifications sont envoyées
  THEN les donneurs O-, O+, A-, A+ de Douala sont notifiés
       ET les donneurs B+, B-, AB-, AB+ ne sont PAS notifiés
       ET les donneurs en carence ne sont PAS notifiés

SCEN-SOS-04 : GPS refusé
  GIVEN un utilisateur qui refuse les permissions de localisation
  WHEN il arrive sur l'étape 2 de création du SOS
  THEN un message "Localisation refusée" s'affiche
       ET un champ de recherche manuelle d'hôpital est proposé

SCEN-SOS-05 : Avertissement 0 donneur
  GIVEN un SOS pour groupe O- à Bafoussam où aucun donneur éligible
  WHEN l'utilisateur arrive sur l'écran de confirmation
  THEN un avertissement "Aucun donneur compatible trouvé dans votre ville"
       ET une suggestion "Partagez le flyer pour trouver des donneurs"

SCEN-SOS-06 : Estimation donneurs
  GIVEN un SOS pour groupe B+ à Douala
  WHEN l'utilisateur arrive sur l'écran de confirmation
  THEN il voit "~8 donneurs compatibles disponibles dans votre région"
```

### Tâches Backend

```
TASK-S4-B01 : BloodCompatibilityService (eligibility/)
  - BLOOD_COMPATIBILITY map complète (voir REGLES_D_OR.md)
  - getCompatibleTypes(bloodTypeNeeded: BloodType): BloodType[]
  - Tests 100% couverture sur les 8 groupes sanguins

TASK-S4-B02 : Module sos/ complet
  POST /sos                    → créer SOS
  GET  /sos/active             → SOS actif de l'utilisateur
  GET  /sos/:id                → détail d'un SOS
  DELETE /sos/:id              → clôturer un SOS
  GET  /sos/nearby?city=Douala → liste SOS actifs de la ville

TASK-S4-B03 : Module notifications/
  - FCMService : sendToDevice(token, payload), sendToMany(tokens, payload)
  - NotificationService : findEligibleDonors(sos) + envoyer les notifs
  - Endpoint : POST /users/me/fcm-token (save token)

TASK-S4-B04 : Tests d'intégration SOS
  - POST /sos → notifs envoyées aux bons donneurs
  - POST /sos → 409 si SOS déjà actif
```

### Tâches Mobile

```
TASK-S4-M01 : Écran SOS étape 1 (S-09)
  - Grille sélection groupe sanguin
  - Stepper nombre de poches (min 1, max 20)
  - Toggle priorité : "Préventif" (ambre) / "Urgence vitale" (rouge)
  - Description courte de chaque niveau de priorité
  - CTA "Suivant" désactivé si groupe non sélectionné

TASK-S4-M02 : Écran SOS étape 2 — Localisation (S-10)
  - Demande permission GPS (expo-location)
  - Map preview avec pin (React Native Maps)
  - Nom hôpital auto-détecté avec checkmark vert
  - Champ recherche manuelle (fallback si GPS refusé)
  - CTA "Confirmer la localisation"

TASK-S4-M03 : Écran Confirmation SOS (S-11)
  - Récap : groupe sanguin, nb poches, priorité, hôpital
  - Info box vert "~X donneurs compatibles" (ou avertissement si 0)
  - CTA rouge "Lancer le SOS maintenant"
  - CTA ghost "Modifier"

TASK-S4-M04 : Enregistrement FCM token
  - Hook useNotifications.ts
  - Demande permission au démarrage
  - Sauvegarde token via PATCH /users/me/fcm-token
  - Gestion notification reçue en foreground
```

---

## Sprint 5 — Flux Donneur & Temps Réel

**Durée :** Semaines 9–10

### Scénarios métier

```
SCEN-DONOR-01 : Rejoindre une file d'attente
  GIVEN un donneur éligible qui reçoit une notif SOS A+
  WHEN il POST /sos/:id/waitlist
  THEN il est ajouté à la liste avec status: "waiting"
       ET la famille reçoit une notification "Nouveau donneur disponible"
       ET le dashboard de la famille se met à jour en temps réel (WebSocket)

SCEN-DONOR-02 : Famille valide un donneur
  GIVEN un donneur avec status "waiting" dans la liste
  WHEN la famille PATCH /sos/:id/waitlist/:donorId { status: "validated" }
  THEN le donneur reçoit une notification push "Vous avez été sélectionné"
       ET le donneur voit l'itinéraire vers l'hôpital
       ET le numéro de la famille est accessible

SCEN-DONOR-03 : Donneur confirme son don
  GIVEN un donneur avec status "validated"
  WHEN il POST /sos/:id/waitlist/:donorId/confirm-donation
  THEN son status passe à "donated"
       ET last_donation_date = now()
       ET next_eligible_date = now() + délai selon genre et type
       ET is_eligible = false
       ET +50 points de réputation ajoutés (transaction atomique)
       ET la famille reçoit une notification "Don confirmé !"

SCEN-DONOR-04 : Donneur annule sa participation
  GIVEN un donneur avec status "waiting"
  WHEN il DELETE /sos/:id/waitlist
  THEN son status passe à "cancelled"
       ET la liste de la famille est mise à jour en temps réel

SCEN-DONOR-05 : Clôture du SOS
  GIVEN une famille avec un SOS status "active"
  WHEN elle DELETE /sos/:id
  THEN le SOS passe à status "closed"
       ET tous les donneurs "waiting" reçoivent "Ce SOS est clôturé"
       ET l'event WebSocket "sos:closed" est émis

SCEN-DONOR-06 : WebSocket temps réel
  GIVEN un dashboard SOS ouvert par la famille
  WHEN un donneur rejoint la liste
  THEN la liste se met à jour immédiatement SANS refresh de page
```

### Tâches Backend

```
TASK-S5-B01 : Module donors/ complet
  POST   /sos/:id/waitlist                              → rejoindre
  DELETE /sos/:id/waitlist                              → quitter
  PATCH  /sos/:id/waitlist/:donorId                     → valider/refuser
  POST   /sos/:id/waitlist/:donorId/confirm-donation    → confirmer don
  GET    /sos/:id/waitlist                              → liste d'attente

TASK-S5-B02 : ChatGateway (NestJS WebSocket Gateway)
  Événements émis par le serveur :
  - "waitlist:update" → payload: { sosId, waitlist: DonorWaitlistItem[] }
  - "sos:closed"      → payload: { sosId }
  - "sos:donor_joined"  → payload: { sosId, donor }
  
  Authentification WebSocket : JWT dans handshake.auth.token

TASK-S5-B03 : Calcul carence dans EligibilityService
  - updateDonorEligibility(userId, gender)
  - Calcule next_eligible_date : masculin=56j, feminin=84j (sang total uniquement)
  - gender est récupéré depuis le profil utilisateur (enregistré à l'inscription)
  - Met à jour is_eligible = false
  - Déclenche après confirm-donation

TASK-S5-B04 : Système réputation (reputation/)
  - addPoints(userId, action: ReputationAction) — transaction Prisma atomique
  - Actions : JOINED_WAITLIST(+5), VALIDATED(+10), DONATED(+50),
              DONATED_URGENCY(+100 bonus), DONATED_O_NEG(+75 bonus)
  - checkBadgeUnlock(userId) → attribue badge si palier atteint
```

### Tâches Mobile

```
TASK-S5-M01 : Écran Dashboard SOS actif (S-12)
  - Header "SOS ACTIF" badge rouge + bouton clôturer
  - Tabs : "En attente" · "Validés" · "Refusés"
  - DonorCard : avatar initiales, nom, groupe, distance, badge éligibilité
  - Swipe right → valider, swipe left → refuser (react-native-gesture-handler)
  - Bouton "Partager le flyer" (navigue vers S-13)
  - Connexion WebSocket → mise à jour temps réel liste

TASK-S5-M02 : Écran Détail alerte SOS (S-14)
  - Groupe sanguin en 48px bold rouge
  - Badge priorité (rouge/ambre)
  - Nom hôpital + adresse + distance
  - Compteur "X donneurs déjà en attente"
  - CTA "Rejoindre la liste d'attente" (vert) ou "En carence" (grisé)

TASK-S5-M03 : Écran File d'attente donneur (S-15)
  - Confirmation inscription avec animation
  - Position dans la file (#X)
  - Info box "La famille sera notifiée"
  - Bouton "Annuler ma participation" (rouge ghost)

TASK-S5-M04 : Écran Navigation vers l'hôpital (S-16)
  - Map plein écran avec itinéraire (React Native Maps)
  - Info strip : hôpital + ETA
  - Bottom sheet : adresse + bouton "Appeler la famille"

TASK-S5-M05 : Écran Confirmation don + récompense (S-17)
  - Checkmark animé vert (Reanimated 4)
  - "+50 points" animé en ambre
  - Badge débloqué si palier atteint
  - CTA "Retour à l'accueil"

TASK-S5-M06 : Hook useSosWaitlist.ts
  - Connexion Socket.io avec JWT
  - Écoute "waitlist:update" → dispatch Redux
  - Écoute "sos:closed" → notification locale + navigation
```

---

## Sprint 6 — Éligibilité, Carence & Paramètres

**Durée :** Semaines 11–12

### Scénarios métier

```
SCEN-ELIG-01 : Visualiser la timeline de carence
  GIVEN un donneur qui a donné du sang il y a 20 jours (genre masculin)
  WHEN il consulte l'écran Éligibilité (S-22)
  THEN il voit une barre de progression : 20/56 jours écoulés
       ET "Disponible dans 36 jours"
       ET la date exacte de prochain don

SCEN-ELIG-02 : Redevenir éligible
  GIVEN un donneur dont next_eligible_date = aujourd'hui
  WHEN le cron quotidien tourne à minuit
  THEN is_eligible = true
       ET une notification push lui est envoyée :
          "Vous pouvez à nouveau donner votre sang !"

SCEN-ELIG-03 : Paramètres — toggle notifications global
  GIVEN un utilisateur qui ne veut plus recevoir de notifications
  WHEN il désactive les notifications dans les paramètres
  THEN le FCM token est supprimé côté serveur
       ET il ne reçoit plus aucune notification SAUVI
```

### Tâches Backend

```
TASK-S6-B01 : Cron job NestJS (@nestjs/schedule)
  - checkEligibilityDaily() : tourne tous les jours à 00:05
  - Requête : users WHERE next_eligible_date <= today AND is_eligible = false
  - Pour chaque utilisateur : is_eligible = true + envoi notif FCM

TASK-S6-B02 : Historiques
  GET /users/me/donation-history  → liste dons avec date, hôpital, points
  GET /users/me/sos-history       → liste SOS lancés avec date, statut
```

### Tâches Mobile

```
TASK-S6-M01 : Écran Paramètres (S-21)
  - Section Notifications : toggle global on/off (supprime le FCM token si off)
  - Section Compte : modifier profil, changer mot de passe, déconnexion

TASK-S6-M02 : Écran Éligibilité & Carence (S-22)
  - Carte statut (vert "Éligible" ou rouge "En carence")
  - Barre de progression timeline (rouge = écoulé, gris = restant)
  - Date dernier don + date prochain don calculée depuis le genre de l'utilisateur
  - Rappel du genre et du délai : "Masculin — 56 jours entre chaque don"
  - SAUVI gère uniquement le sang total

TASK-S6-M03 : Écran Badges & Réputation (S-23)
  - Points totaux en grand
  - Barre progression vers prochain badge
  - Grille badges : débloqués (colorés) + verrouillés (grisés + cadenas)
  - Bouton "Partager" pour son meilleur badge

TASK-S6-M04 : Historiques dans le profil (S-20)
  - Section "Mes dons" avec items date + hôpital + points
  - Section "Mes SOS" avec items date + groupe + statut
```

**Livrable Phase 1 :** APK TestFlight / Internal Android avec toutes les features MVP.

---

# PHASE 2 — ENRICHISSEMENT

---

## Sprint 7 — Chat intégré

**Durée :** Semaines 13–14

### Scénarios métier

```
SCEN-CHAT-01 : Envoyer un message
  GIVEN une famille dont un donneur a status "validated"
  WHEN elle envoie un message via le chat Socket.io
  THEN le donneur reçoit le message en temps réel
       ET une notification push "Nouveau message de la famille"

SCEN-CHAT-02 : Chat lecture seule après clôture
  GIVEN un SOS clôturé
  WHEN un utilisateur consulte le chat
  THEN les messages sont visibles mais le champ de saisie est désactivé
       ET un banner "Ce SOS est clôturé — conversation archivée" est affiché

SCEN-CHAT-03 : Message non envoyé (offline)
  GIVEN un utilisateur sans connexion réseau
  WHEN il envoie un message
  THEN l'indicateur ⚠ apparaît sur le message
       ET un bouton "Réessayer" est proposé
```

### Tâches

```
TASK-S7-B01 : ChatGateway Socket.io (chat/)
  Events : message:send, message:read, typing:start, typing:stop
  Accès : seulement si donorId est "validated" pour ce sosId
  
TASK-S7-B02 : ChatController
  GET /sos/:id/messages?cursor=...  → pagination curseur

TASK-S7-M01 : Écran Chat (S-18)
  - Bulles messages (left = autre, right = moi)
  - Indicateur "lu" (double check)
  - Indicateur de frappe "..."
  - Header : nom + bouton appel téléphonique
  - Banner lecture seule si SOS clôturé

TASK-S7-M02 : Écran Appel sortant (S-19)
  - Numéro masqué (06•• ••• •••)
  - Bouton raccrocher
  - Durée appel

TASK-S7-M03 : Hook useChat.ts
  - Connexion Socket.io canal chat
  - sendMessage(), markAsRead()
  - Gestion offline : queue de messages en attente
```

---

## Sprint 8 — Générateur de Flyer

**Durée :** Semaines 15–16

### Scénarios métier

```
SCEN-FLYER-01 : Partager sur WhatsApp
  GIVEN un SOS actif avec groupe A+ à CHU Laquintinie
  WHEN la famille génère et partage le flyer
  THEN une image PNG est générée localement via react-native-view-shot
       ET expo-sharing ouvre la feuille de partage native
       ET l'image contient : logo SAUVI, "A+" en grand, hôpital, QR code

SCEN-FLYER-02 : QR code fonctionnel
  GIVEN un flyer partagé sur WhatsApp
  WHEN un destinataire scanne le QR code
  THEN il est redirigé vers le deep link de l'alerte dans l'app
       OU vers la page de téléchargement si l'app n'est pas installée

SCEN-FLYER-03 : WhatsApp non installé
  GIVEN un téléphone sans WhatsApp
  WHEN la famille essaie de partager
  THEN la feuille de partage native iOS/Android s'ouvre
       avec toutes les apps disponibles (SMS, etc.)
```

### Tâches

```
TASK-S8-M01 : Composant <SosFlyer /> (components/sos/)
  - Design fidèle au Design System SAUVI
  - Props : bloodType, unitsNeeded, priority, hospitalName, sosId
  - QR code via react-native-qrcode-svg

TASK-S8-M02 : Hook useFlyer.ts
  - captureFlyer(ref) → uri PNG via react-native-view-shot
  - shareFlyer(uri) → expo-sharing
  - Gestion erreur si capture échoue (fallback message texte)

TASK-S8-M03 : Écran Flyer (S-13)
  - Aperçu du flyer (composant rendu visible)
  - Bouton "Partager sur WhatsApp" (deeplink whatsapp://send?...)
  - Bouton "Autres apps" (expo-sharing)
```

---

## Sprint 9 — Explorer & Centre de notifications

**Durée :** Semaines 17–18

```
TASK-S9-B01 : GET /sos/nearby?city=Douala
  Retourne les SOS actifs de la ville, triés par priorité puis date

TASK-S9-M01 : Écran Explorer (S-08)
  - Carte React Native Maps avec pins SOS actifs
  - Filtres chips par groupe sanguin
  - Liste SOS actifs en dessous de la carte
  - Bouton de partage sur chaque card SOS de la liste :
    → expo-sharing : partage un lien deep link + texte descriptif du SOS
    → format : "🩸 Besoin urgent de [groupe] à [hôpital] — [ville]. Téléchargez SAUVI : [lien]"

TASK-S9-M02 : Centre de notifications (S-07)
  - Liste chronologique
  - Filtres : Tous · SOS · Confirmations · Système
  - Marquer tout comme lu
  - Bouton de partage sur chaque notification de type SOS :
    → même logique que l'Explorer (expo-sharing avec texte + deep link)
  - État vide illustré

TASK-S9-M03 : États globaux
  - OfflineBanner (S-24) : détection réseau + retry auto
  - ErrorScreen 500 (S-25) : illustration + réessayer
  - ExpiredLinkScreen 404 (S-26) : lien SOS expiré
  - Skeleton loading généralisé sur tous les écrans (S-27)
```

---

## Sprint 10 — Polish & Animations

**Durée :** Semaines 19–20

```
TASK-S10-M01 : Animations Reanimated 4
  - Bouton SOS : pulsation rouge en mode urgence vitale
  - Splash screen : goutte qui tombe
  - Confirmation don : confetti + checkmark
  - Points +50 : animation fly-up
  - Badges débloqués : animation scale + glow

TASK-S10-M02 : Micro-interactions
  - Haptic feedback sur actions importantes (Expo Haptics)
  - Transitions d'écrans fluides (React Navigation shared element)
  - Pull-to-refresh sur toutes les listes

TASK-S10-M03 : Tests E2E Maestro
  - Flux complet inscription → lancer SOS → clôturer
  - Flux complet notif → rejoindre file → confirmer don

TASK-S10-M04 : Performance
  - Lazy loading des écrans (React Navigation lazy: true)
  - Optimisation images (expo-image au lieu de Image)
  - Mémoïsation composants lourds (React.memo + useMemo)
```

---

# PHASE 3 — CROISSANCE (Sprints 11–16)

```
Sprint 11–12 : Dashboard admin (Next.js) — stats, modération, supervision SOS
Sprint 13–14 : Résilience — SMS Twilio, tests de charge k6, cache Redis avancé
Sprint 15–16 : Extension géo — multi-villes, i18n (fr + en), stores publics
```

---

## Guide d'utilisation avec l'IA (Cursor / Windsurf)

### Prompt de démarrage d'un sprint

```
Je travaille sur SAUVI (voir .cursorrules pour le contexte complet).
Je commence le Sprint [N] — [Nom du sprint].

Commence par implémenter [TASK-SN-B01 ou TASK-SN-M01] en respectant :
- L'arborescence définie dans ARBORESCENCE.md
- Les conventions de nommage de REGLES_D_OR.md
- TypeScript strict (aucun any)
- Le test unitaire correspondant dans le même dossier

Génère les fichiers complets dans l'ordre : module → service → controller → tests.
```

### Prompt de review de code

```
Review ce code en tant qu'expert NestJS/React Native.
Vérifie :
1. Respect des REGLES_D_OR.md (typage, nommage, sécurité)
2. Gestion des erreurs exhaustive
3. Tests présents et pertinents
4. Pas de fuite de données sensibles
5. Performance (pas de N+1 queries, pagination)
```

### Prompt de debug

```
Contexte SAUVI (voir .cursorrules).
J'ai l'erreur suivante : [coller l'erreur].
Le code concerné est : [coller le code].
Analyse la cause racine et propose un fix avec les tests correspondants.
```
