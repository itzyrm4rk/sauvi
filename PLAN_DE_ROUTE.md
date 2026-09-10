# 🩸 SAUVI — Plan de Route

> Application mobile de don de sang d'urgence  
> Version : 2.0 | Dernière mise à jour : 2025

---

## Vue d'ensemble

| Élément | Détail |
|---|---|
| Projet | SAUVI — Don de sang d'urgence |
| Plateforme | iOS + Android (React Native / Expo) |
| Backend | NestJS + PostgreSQL + Redis + Firebase |
| Durée totale estimée | 12 mois (3 phases) |
| Méthodologie | Sprints de 2 semaines |
| Dépôt | Monorepo GitHub |

---

## Architecture des branches Git

```
main          → production (protégée, merge via PR uniquement)
develop       → intégration continue
feature/*     → nouvelles fonctionnalités (ex: feature/auth-google)
fix/*         → corrections de bugs (ex: fix/sos-notification)
release/*     → préparation des releases (ex: release/v1.0.0)
hotfix/*      → correctifs urgents sur main
```

**Règle de nommage des commits (Conventional Commits) :**
```
feat(auth): add Google OAuth login
fix(sos): prevent duplicate SOS creation
chore(deps): update NestJS to 11.x
docs(api): update Swagger SOS endpoints
test(donors): add waitlist unit tests
refactor(eligibility): extract blood compat service
```

---

## Phase 1 — MVP (Sprints 1 à 6 — Mois 1 à 3)

### Sprint 1 — Setup & Infrastructure (S1–S2)

**Objectif :** Monorepo fonctionnel, CI/CD en place, base de données connectée.

**Backend :**
- [ ] Init monorepo (`apps/api` + `apps/mobile` + `packages/shared`)
- [ ] Setup NestJS 11 + TypeScript strict
- [ ] Setup Prisma + PostgreSQL (Supabase)
- [ ] Premiers modèles Prisma : `User`, `SosAlert`, `DonorWaitlist`
- [ ] Setup Redis (cache + sessions)
- [ ] Variables d'environnement (.env + validation Zod)
- [ ] Setup Biome (lint + format)
- [ ] GitHub Actions CI : lint + tests + build

**Mobile :**
- [ ] Init Expo SDK 54 (managed workflow, New Architecture activée)
- [ ] Setup React Navigation v7 (Stack + Tab)
- [ ] Setup Redux Toolkit + RTK Query
- [ ] Configuration des thèmes (Design System SAUVI)
- [ ] Setup Expo EAS Build

**Livrable :** Monorepo buildable, CI verte, DB connectée, hello world API.

---

### Sprint 2 — Auth complète (S3–S4)

**Objectif :** Utilisateur peut s'inscrire, se connecter, avoir un JWT valide.

**Scénarios :**
```
SCEN-AUTH-01 : Nouvel utilisateur s'inscrit via email (2 étapes)
SCEN-AUTH-02 : Utilisateur se connecte via Google OAuth
SCEN-AUTH-03 : Token expiré → refresh automatique silencieux
SCEN-AUTH-04 : 5 tentatives de login échouées → blocage 15min
SCEN-AUTH-05 : Mot de passe oublié → email de réinitialisation
```

**Backend (module `auth/`) :**
- [ ] `POST /auth/register/step1` — email, nom, mot de passe
- [ ] `POST /auth/register/step2` — groupe sanguin, genre (masculin/féminin), date de naissance, ville, téléphone
- [ ] `POST /auth/login` — email + password → JWT
- [ ] `GET /auth/google` — OAuth redirect
- [ ] `GET /auth/google/callback` — callback + JWT
- [ ] `POST /auth/refresh` — refresh token
- [ ] `POST /auth/forgot-password` — envoi email reset
- [ ] `POST /auth/reset-password` — nouveau mot de passe
- [ ] Guards JWT + throttle 5 req/min sur login

**Mobile (screens S-03, S-04, S-05) :**
- [ ] Écran inscription étape 1 (S-03)
- [ ] Écran inscription étape 2 (S-04)
- [ ] Écran login (S-05)
- [ ] Persistance token (SecureStore Expo)
- [ ] Intercepteur Axios : refresh automatique

**Tests :**
- [ ] Unit : AuthService (register, login, refresh)
- [ ] E2E : flux inscription complet

---

### Sprint 3 — Profil unifié + Accueil (S5–S6)

**Objectif :** Utilisateur a un profil complet et voit l'écran d'accueil.

**Scénarios :**
```
SCEN-PROFIL-01 : Utilisateur modifie son avatar (upload R2 CDN)
SCEN-PROFIL-02 : Utilisateur change sa ville → alertes mises à jour
SCEN-PROFIL-03 : Accueil affiche badge éligibilité correct
SCEN-PROFIL-04 : Accueil en mode offline → données cachées visibles
```

**Backend (module `users/`) :**
- [ ] `GET /users/me` — profil complet
- [ ] `PATCH /users/me` — modifier profil
- [ ] `POST /users/me/avatar` — upload avatar → Cloudflare R2
- [ ] Conversion WebP avec `sharp` avant upload
- [ ] `GET /users/me/eligibility` — statut carence temps réel

**Mobile (screens S-06, S-20) :**
- [ ] Écran accueil unifié (S-06)
- [ ] Badge éligibilité dynamique
- [ ] Section "Alertes près de moi" (placeholder)
- [ ] Bottom navigation bar
- [ ] Écran profil (S-20)
- [ ] Skeleton loading sur toutes les listes

---

### Sprint 4 — Création SOS + Notifications (S7–S8)

**Objectif :** Famille peut lancer un SOS qui notifie les donneurs compatibles.

**Scénarios :**
```
SCEN-SOS-01 : Famille remplit formulaire et envoie un SOS Urgence vitale
SCEN-SOS-02 : Donneurs compatibles reçoivent la notification push
SCEN-SOS-03 : Donneur en carence ne reçoit PAS la notification
SCEN-SOS-04 : 0 donneur compatible → avertissement affiché
SCEN-SOS-05 : GPS refusé → saisie manuelle de l'hôpital
```

**Backend (modules `sos/` + `notifications/`) :**
- [ ] `POST /sos` — créer un SOS (validation groupe, poches, priorité)
- [ ] `GET /sos/active` — SOS actif de l'utilisateur
- [ ] Matrice compatibilité ABO/Rhésus (service dédié)
- [ ] Filtrage donneurs : compatibilité + ville + is_eligible
- [ ] Envoi FCM push aux donneurs filtrés (batch)
- [ ] Enregistrement FCM token : `POST /users/me/fcm-token`

**Mobile (screens S-09, S-10, S-11) :**
- [ ] Formulaire SOS étape 1 : groupe, poches, priorité (S-09)
- [ ] Localisation hôpital GPS + fallback manuel (S-10)
- [ ] Confirmation SOS avec nb donneurs estimés (S-11)
- [ ] Gestion permissions GPS (Expo Location)
- [ ] Enregistrement FCM token au démarrage (Expo Notifications)

**Tests :**
- [ ] Unit : BloodCompatibilityService (tous les cas de la matrice)
- [ ] Unit : NotificationService (filtrage donneurs)
- [ ] Integration : POST /sos → notifications envoyées

---

### Sprint 5 — Flux Donneur + Temps Réel (S9–S10)

**Objectif :** Donneur peut rejoindre une file, être validé, naviguer vers l'hôpital.

**Scénarios :**
```
SCEN-DONOR-01 : Donneur reçoit notif, ouvre détail SOS, rejoint la file
SCEN-DONOR-02 : Famille valide le donneur → donneur reçoit notif + itinéraire
SCEN-DONOR-03 : Donneur annule sa participation → liste mise à jour temps réel
SCEN-DONOR-04 : Famille ferme le SOS en attente → donneurs notifiés
SCEN-DONOR-05 : Donneur confirme don → délai carence déclenché
```

**Backend (modules `donors/` + `eligibility/`) :**
- [ ] `POST /sos/:id/waitlist` — rejoindre la file
- [ ] `DELETE /sos/:id/waitlist` — quitter la file
- [ ] `PATCH /sos/:id/waitlist/:donorId` — valider / refuser
- [ ] `POST /sos/:id/waitlist/:donorId/confirm-donation` — confirmer don
- [ ] Calcul `next_eligible_date` (genre + type de don)
- [ ] Mise à jour `is_eligible` + `last_donation_date`
- [ ] WebSocket Gateway (Socket.io) : events `waitlist:update`, `sos:closed`
- [ ] `DELETE /sos/:id` — clôturer le SOS

**Mobile (screens S-12, S-14, S-15, S-16, S-17) :**
- [ ] Dashboard SOS actif temps réel (S-12) via WebSocket
- [ ] Détail alerte SOS reçue (S-14)
- [ ] File d'attente donneur (S-15)
- [ ] Navigation GPS vers l'hôpital (S-16) — React Native Maps
- [ ] Confirmation don + animation récompense (S-17)

---

### Sprint 6 — Carence + Éligibilité + Profil complet (S11–S12)

**Objectif :** Gestion complète du délai de carence et profil unifié finalisé.

**Scénarios :**
```
SCEN-ELIG-01 : Donneur voit sa date de prochain don possible
SCEN-ELIG-02 : Donneur redevient éligible → reçoit une notif push de rappel
SCEN-ELIG-03 : Profil affiche historique dons ET historique SOS lancés
```

**Backend :**
- [ ] Cron job NestJS : vérification quotidienne `next_eligible_date` → notif FCM
- [ ] `GET /users/me/donation-history` — historique dons
- [ ] `GET /users/me/sos-history` — historique SOS lancés

**Mobile (screens S-21, S-22, S-23) :**
- [ ] Écran paramètres (S-21) — notifications globales on/off + modifier profil + déconnexion
- [ ] Écran éligibilité + timeline carence (S-22)
- [ ] Écran badges + réputation (S-23)

**Livrable Phase 1 :** APK TestFlight/Android bêta, toutes fonctionnalités MVP.

---

## Phase 2 — Enrichissement (Sprints 7 à 10 — Mois 4 à 6)

### Sprint 7 — Chat + Appel (S13–S14)

**Scénarios :**
```
SCEN-CHAT-01 : Famille envoie un message au donneur validé
SCEN-CHAT-02 : Message non envoyé (offline) → indicateur + retry
SCEN-CHAT-03 : Chat en lecture seule après clôture SOS
SCEN-CHAT-04 : Appel direct depuis le chat → deep link natif tel: (app Téléphone système)
```

- [ ] NestJS Gateway Socket.io : `message:send`, `message:read`
- [ ] `GET /sos/:id/messages` — historique messages
- [ ] Écran chat intégré (S-18)
- [ ] Hook `useNativeCall` centralisé (Linking.openURL `tel:`) — réutilisé
      partout où un bouton d'appel existe (chat, dashboard SOS tab Validés)
- [ ] Notifications push pour nouveaux messages

---

### Sprint 8 — Générateur de flyer (S15–S16)

**Scénarios :**
```
SCEN-FLYER-01 : Famille génère un flyer et le partage sur WhatsApp
SCEN-FLYER-02 : WhatsApp absent → partage texte simple proposé
```

- [ ] Composant `<SosFlyer />` React Native fidèle au Design System
- [ ] Intégration `react-native-view-shot` (capture PNG)
- [ ] Intégration `expo-sharing` (partage natif)
- [ ] Écran générateur (S-13)

---

### Sprint 9 — Système de réputation complet (S17–S18)

- [ ] Service `reputation/` NestJS : calcul points, attribution badges
- [ ] Transactions Prisma : points atomiques (éviter les doublons)
- [ ] Notifications push à l'attribution d'un badge
- [ ] Écran badges finalisé avec animations (S-23)

---

### Sprint 10 — Explorer + Notifications center + Polish (S19–S20)

- [ ] `GET /sos/nearby` — liste SOS actifs filtrés par ville
- [ ] Écran Explorer avec carte + liste SOS actifs + bouton de partage par alerte (S-08)
- [ ] Centre de notifications complet + bouton de partage sur chaque alerte SOS (S-07)
- [ ] États globaux : S-24 (offline), S-25 (500), S-26 (404), S-27 (skeletons)
- [ ] Animations et micro-interactions (Reanimated 4)
- [ ] Tests E2E Maestro : flux SOS complet

---

## Phase 3 — Croissance (Sprints 11 à 16 — Mois 7 à 12)

### Sprint 11–12 — Tableau de bord admin
- Dashboard web admin (Next.js) : stats globales, modération
- Supervision SOS actifs en temps réel
- Gestion des signalements utilisateurs

### Sprint 13–14 — Résilience & performance
- SMS de secours Twilio pour urgences vitales sans notif push
- Tests de charge (k6) sur les endpoints critiques
- Optimisation requêtes Prisma (index, pagination curseur)
- Cache Redis sur les listes de donneurs éligibles

### Sprint 15–16 — Extension géographique
- Multi-villes (Yaoundé, Bafoussam, Buéa...)
- Internationalisation i18n (français + anglais)
- Soumission App Store + Google Play (production)
- Partenariats hospitaliers (intégration directe)

---

## Métriques de succès

| Métrique | Cible MVP (M3) | Cible M6 | Cible M12 |
|---|---|---|---|
| Utilisateurs inscrits | 500 | 5 000 | 50 000 |
| SOS créés | 50 | 500 | 5 000 |
| Taux de réponse aux SOS | > 60% | > 75% | > 85% |
| Temps moyen 1er donneur | < 30 min | < 15 min | < 10 min |
| Note stores | — | > 4.0 | > 4.5 |
| Crash-free sessions | > 95% | > 98% | > 99% |
