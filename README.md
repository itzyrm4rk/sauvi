# 🩸 SAUVI — Plateforme Solidaire de Don de Sang d'Urgence

<p align="center">
  <strong>Connecter les donneurs de sang compatibles avec les patients en situation d'urgence vitale au Cameroun.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📌 Présentation

**SAUVI** est une application mobile conçue pour répondre à la pénurie critique de poches de sang dans les hôpitaux du Cameroun. En cas d'urgence médicale (accidents de la circulation, hémorragies de la délivrance, anémies sévères, chirurgies lourdes), SAUVI permet de lancer une alerte SOS géolocalisée et de mobiliser instantanément les donneurs compatibles les plus proches, dans les 10 régions du pays.

---

## ✨ Fonctionnalités Clés

### 🚨 1. Alertes SOS & Matching Sanguin Intelligent
- **Filtrage par compatibilité ABO/Rhésus** : Calcul automatique des compatibilités donneurs/receveurs (ex : O- pour tous, AB+ comme receveur universel).
- **Ciblage géographique par région** : Diffusion aux donneurs de la même ville que l'hôpital.
- **Estimation en direct** : Visualisation du nombre de donneurs potentiels disponibles avant la publication du SOS.
- **Niveaux d'urgence** : Urgence vitale, Besoin préventif.
- **Génération & Partage de Flyer SOS** : Création d'affiches visuelles percutantes partageables sur les réseaux sociaux.

### 🩺 2. Gestion Médicale Réelle Multi-Unités (1 Don = 1 Poche de 450 mL)
- **Règle médicale stricte** : Respect du volume standard prélevable chez un adulte (~450 mL par personne). L'application interdit qu'un donneur unique fournisse plus d'une poche.
- **Calculateur de volume dynamique** : Affichage automatique du volume total requis et du nombre exact de donneurs distincts nécessaires.
- **Tableau de bord de collecte en temps réel** : Compteur dynamique (`X / Y poches validées`), jauge visuelle et clôture automatique en statut `fulfilled`.

### 👥 3. File d'Attente Sécurisée & Suivi en Direct
- **WebSockets Socket.io** : Mise à jour instantanée de la liste des volontaires en temps réel.
- **Calcul de distance GPS** : Formule Haversine entre la position du donneur et l'hôpital.

### 💬 4. Messagerie Instantanée & Archivage Pérenne
- **Chat temps réel sécurisé** avec messages archivés consultables après la fin de l'alerte.
- **Appel téléphonique** Possibilité d'appeler via Click-to-Call
- **Protection de la vie privée** : Désactivation automatique de l'appel téléphonique et du chat dès qu'un SOS est clôturé.

### 🔔 5. Notifications Hybrides (Push FCM + Canaux Dédiés + In-App)
- **Canaux Android spécialisés** : sauvi-sos-channel, sauvi-chat-channel, sauvi-system-channel.
- **Bannière In-App (Toast interactif)** avec détection de présence pour éviter les notifications superflues.

### 🩸 6. Périodes de Carence & Badges de Réputation
- **Période de carence biologique** : 56 jours (hommes) et 84 jours (femmes) avec réactivation automatique par cron nocturne.
- **Système de Badges & Réputation anti-farming** : Niveaux de fidélité (Cœur de Bronze à Légende SAUVI).

### 🌐 7. Landing Page Moderne (Next.js 14)
- **Présentation & Téléchargement APK direct** 

---

## 🏛️ Architecture du Monorepo

```
sauvi/
├── .github/
│   └── workflows/ci.yml              # Pipeline CI/CD GitHub Actions (Biome, Tests, Builds)
├── apps/
│   ├── api/                          # Backend NestJS 11 & Prisma ORM
│   │   ├── Dockerfile                # Build conteneurisé multi-stage pour Render
│   │   ├── prisma/                   # Schéma PostgreSQL Supabase & migrations
│   │   └── src/                      # Auth, SOS, Donors, Chat, Users, Reputation, Mail
│   ├── mobile/                       # Application Mobile Expo 52 / React Native
│   │   ├── app.json                  # Métadonnées Expo (bundle ID, deep linking sauvi://)
│   │   ├── eas.json                  # Profils de build APK Android (development, preview, production)
│   │   └── src/                      # Screens, Components UI, RTK Query, Store, Hooks
│   └── landing/                      # Landing Page Next.js 14 App Router
│       ├── src/app/                  # Layout, page d'accueil, globals.css 
(Modern CSS)
│       └── next.config.js            # Configuration optimisée pour Vercel
├── packages/
│   └── shared/                       # Types TypeScript partagés, Villes camerounaises, Logique ABO
├── docker-compose.yml                # Environnement local isolé (API NestJS + Redis 7)
|
└── turbo.json                        # Orchestration Turborepo des tâches de build
```

---

## 🛠️ Stack Technique

| Domaine | Technologies |
|---|---|
| **Mobile** | React Native, Expo 52, TypeScript strict, Redux Toolkit, RTK Query, React Navigation, Socket.io-client, Expo Location, Expo Notifications, Lucide React Native |
| **Backend API** | NestJS 11, Prisma ORM, PostgreSQL (Supabase), Redis 7 (BullMQ), Socket.io, Firebase Admin SDK (FCM), Google OAuth 2.0, Nodemailer |
| **Web & Landing** | Next.js 14 (App Router), React 18, Lucide React, CSS moderne responsive, Vercel |
| **Infra & Déploiement** | Docker multi-stage, Render (API + Redis), Vercel (Landing), GitHub Actions (CI/CD) |
| **Qualité & Linter** | Biome CI (Lint & Format), TypeScript 5.7, Turborepo 2.3 |

---

## 🚀 Démarrage Rapide en Local

### Prérequis
- [Node.js](https://nodejs.org/) v20+ ou v22+
- [npm](https://www.npmjs.com/) v10+ ou v11+
- [Docker Desktop](https://www.docker.com/) (recommandé pour Redis et l'API)

### 1. Installation des dépendances du monorepo
```bash
npm install
```

### 2. Compilation du package partagé
```bash
npm run build --workspace=@sauvi/shared
```

### 3. Variables d'environnement
Créez les fichiers `.env` à partir des exemples :
- `apps/api/.env` (voir `apps/api/.env.example`)
- `apps/mobile/.env` (voir `apps/mobile/.env.example`)

### 4. Lancer les services en développement

```bash
# Lancer tous les services simultanément via Turborepo
npm run dev

# OU lancer chaque service individuellement :
npm run dev --workspace=@sauvi/api       # API NestJS sur http://localhost:3000
npm run dev --workspace=@sauvi/landing   # Landing page sur http://localhost:3001
npm run start --workspace=@sauvi/mobile   # App Mobile Expo Metro Bundler
```

### 5. Tester avec Docker & Redis localement
```bash
docker compose up -d
docker compose logs -f api
```

---

## 🧪 Qualité & Pipeline CI (`.github/workflows/ci.yml`)

Le projet intègre une suite de vérifications continues s'exécutant sur chaque commit :

```bash
# Linter & Formateur Biome
npm run lint

# Typechecking TypeScript
npm run typecheck

# Tests automatisés de l'API
npm run test --workspace=apps/api
```

---

## 📄 Licence & Droits d'Auteur

© 2026 **Marc ATANGANA**. Tous droits réservés.
