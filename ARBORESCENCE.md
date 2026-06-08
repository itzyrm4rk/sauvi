# 🗂️ SAUVI — Arborescence complète du projet

> Monorepo — Clean Architecture  
> `apps/api` (NestJS) + `apps/mobile` (Expo) + `packages/shared` (types partagés)

---

```
sauvi/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                        ← lint + tests + build (PR)
│   │   ├── deploy-api.yml                ← deploy NestJS sur Railway (main)
│   │   └── mobile-build.yml              ← EAS Build sur tag de version
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── apps/
│   │
│   ├── api/                              ← Backend NestJS
│   │   ├── src/
│   │   │   │
│   │   │   ├── main.ts                   ← Bootstrap NestJS (Helmet, CORS, Swagger, pipes)
│   │   │   ├── app.module.ts             ← Module racine
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── env.validation.ts     ← Validation Zod des variables d'env
│   │   │   │   ├── database.config.ts    ← Config Prisma/PostgreSQL
│   │   │   │   └── redis.config.ts       ← Config Redis
│   │   │   │
│   │   │   ├── common/                   ← Éléments partagés entre modules
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   └── public.decorator.ts
│   │   │   │   ├── filters/
│   │   │   │   │   ├── http-exception.filter.ts
│   │   │   │   │   └── prisma-exception.filter.ts
│   │   │   │   ├── guards/
│   │   │   │   │   └── jwt-auth.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── transform.interceptor.ts  ← Formattage réponse { data, meta }
│   │   │   │   │   └── logging.interceptor.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   └── zod-validation.pipe.ts
│   │   │   │   └── types/
│   │   │   │       └── pagination.types.ts
│   │   │   │
│   │   │   ├── prisma/
│   │   │   │   └── prisma.service.ts     ← Service Prisma injectable
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.service.spec.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   ├── jwt-refresh.strategy.ts
│   │   │   │   │   └── google.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       ├── register-step1.dto.ts
│   │   │   │       ├── register-step2.dto.ts
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── reset-password.dto.ts
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.service.spec.ts
│   │   │   │   ├── upload.service.ts     ← Upload avatar → Cloudflare R2
│   │   │   │   └── dto/
│   │   │   │       ├── update-user.dto.ts
│   │   │   │       └── user-response.dto.ts
│   │   │   │
│   │   │   ├── sos/
│   │   │   │   ├── sos.module.ts
│   │   │   │   ├── sos.controller.ts
│   │   │   │   ├── sos.service.ts
│   │   │   │   ├── sos.service.spec.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-sos.dto.ts
│   │   │   │       ├── create-sos.schema.ts   ← Schema Zod
│   │   │   │       └── sos-response.dto.ts
│   │   │   │
│   │   │   ├── donors/
│   │   │   │   ├── donors.module.ts
│   │   │   │   ├── donors.controller.ts
│   │   │   │   ├── donors.service.ts
│   │   │   │   ├── donors.service.spec.ts
│   │   │   │   └── dto/
│   │   │   │       ├── join-waitlist.dto.ts
│   │   │   │       └── update-waitlist-status.dto.ts
│   │   │   │
│   │   │   ├── eligibility/
│   │   │   │   ├── eligibility.module.ts
│   │   │   │   ├── eligibility.service.ts
│   │   │   │   ├── eligibility.service.spec.ts ← 100% couverture obligatoire
│   │   │   │   └── blood-compatibility.service.ts
│   │   │   │       └── blood-compatibility.service.spec.ts
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── notifications.service.spec.ts
│   │   │   │   └── fcm.provider.ts       ← Firebase Admin SDK
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── chat.module.ts
│   │   │   │   ├── chat.controller.ts    ← GET messages historique
│   │   │   │   ├── chat.gateway.ts       ← Socket.io Gateway
│   │   │   │   ├── chat.service.ts
│   │   │   │   └── chat.service.spec.ts
│   │   │   │
│   │   │   ├── reputation/
│   │   │   │   ├── reputation.module.ts
│   │   │   │   ├── reputation.service.ts
│   │   │   │   └── reputation.service.spec.ts
│   │   │   │
│   │   │   └── storage/
│   │   │       ├── storage.module.ts
│   │   │       └── cloudflare-r2.service.ts  ← Upload R2 via SDK S3
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma             ← Schéma Prisma complet
│   │   │   ├── migrations/               ← Migrations auto générées
│   │   │   └── seed.ts                   ← Données de test
│   │   │
│   │   ├── test/
│   │   │   └── app.e2e-spec.ts           ← Tests E2E NestJS
│   │   │
│   │   ├── .env                          ← Variables locales (gitignored)
│   │   ├── .env.example                  ← Template variables (commité)
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                           ← Frontend React Native / Expo
│       ├── src/
│       │   │
│       │   ├── app/                      ← Point d'entrée navigation
│       │   │   ├── index.tsx             ← Root navigator
│       │   │   ├── AuthNavigator.tsx     ← Stack auth (splash, onboarding, login, register)
│       │   │   ├── MainNavigator.tsx     ← Bottom tabs (home, sos, notifs, profil)
│       │   │   └── RootNavigator.tsx     ← Switch auth/main selon token
│       │   │
│       │   ├── screens/
│       │   │   ├── onboarding/
│       │   │   │   ├── SplashScreen.tsx          ← S-01
│       │   │   │   └── OnboardingScreen.tsx       ← S-02
│       │   │   ├── auth/
│       │   │   │   ├── RegisterStep1Screen.tsx    ← S-03
│       │   │   │   ├── RegisterStep2Screen.tsx    ← S-04
│       │   │   │   └── LoginScreen.tsx            ← S-05
│       │   │   ├── home/
│       │   │   │   └── HomeScreen.tsx             ← S-06
│       │   │   ├── notifications/
│       │   │   │   └── NotificationsScreen.tsx    ← S-07
│       │   │   ├── explore/
│       │   │   │   └── ExploreScreen.tsx          ← S-08
│       │   │   ├── sos/
│       │   │   │   ├── SosStep1Screen.tsx         ← S-09
│       │   │   │   ├── SosStep2Screen.tsx         ← S-10
│       │   │   │   ├── SosConfirmScreen.tsx       ← S-11
│       │   │   │   ├── SosDashboardScreen.tsx     ← S-12
│       │   │   │   └── FlyerScreen.tsx            ← S-13
│       │   │   ├── donor/
│       │   │   │   ├── AlertDetailScreen.tsx      ← S-14
│       │   │   │   ├── WaitingQueueScreen.tsx     ← S-15
│       │   │   │   ├── NavigationScreen.tsx       ← S-16
│       │   │   │   └── DonationConfirmedScreen.tsx ← S-17
│       │   │   ├── chat/
│       │   │   │   ├── ChatScreen.tsx             ← S-18
│       │   │   │   └── CallScreen.tsx             ← S-19
│       │   │   └── profile/
│       │   │       ├── ProfileScreen.tsx          ← S-20
│       │   │       ├── SettingsScreen.tsx         ← S-21
│       │   │       ├── EligibilityScreen.tsx      ← S-22
│       │   │       └── BadgesScreen.tsx           ← S-23
│       │   │
│       │   ├── components/
│       │   │   ├── ui/                   ← Composants atomiques du Design System
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Card.tsx
│       │   │   │   ├── Badge.tsx
│       │   │   │   ├── Avatar.tsx
│       │   │   │   ├── Skeleton.tsx
│       │   │   │   ├── Toast.tsx
│       │   │   │   └── index.ts          ← Barrel export
│       │   │   ├── sos/
│       │   │   │   ├── SosButton.tsx     ← Grand bouton rouge rond SOS
│       │   │   │   ├── SosAlertCard.tsx
│       │   │   │   ├── SosFlyer.tsx      ← Composant capturé par ViewShot
│       │   │   │   └── BloodTypeGrid.tsx
│       │   │   ├── donor/
│       │   │   │   ├── DonorCard.tsx
│       │   │   │   ├── WaitlistItem.tsx
│       │   │   │   └── EligibilityBadge.tsx
│       │   │   └── common/
│       │   │       ├── ErrorScreen.tsx   ← S-25, S-26
│       │   │       ├── OfflineBanner.tsx ← S-24
│       │   │       └── EmptyState.tsx
│       │   │
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useSosActive.ts
│       │   │   ├── useSosWaitlist.ts     ← WebSocket temps réel
│       │   │   ├── useEligibility.ts
│       │   │   ├── useFlyer.ts           ← ViewShot + expo-sharing
│       │   │   ├── useLocation.ts        ← Expo Location
│       │   │   ├── useNotifications.ts   ← Expo Notifications + FCM token
│       │   │   └── useChat.ts            ← Socket.io chat
│       │   │
│       │   ├── store/
│       │   │   ├── index.ts              ← Store Redux Toolkit
│       │   │   ├── slices/
│       │   │   │   ├── authSlice.ts
│       │   │   │   ├── sosSlice.ts
│       │   │   │   └── notificationsSlice.ts
│       │   │   └── api/
│       │   │       ├── baseApi.ts        ← RTK Query base (intercepteur refresh)
│       │   │       ├── authApi.ts
│       │   │       ├── usersApi.ts
│       │   │       ├── sosApi.ts
│       │   │       ├── donorsApi.ts
│       │   │       └── chatApi.ts
│       │   │
│       │   ├── constants/
│       │   │   ├── theme.ts              ← Couleurs, typo, spacing Design System
│       │   │   ├── bloodTypes.ts         ← Matrice compatibilité + labels
│       │   │   └── routes.ts             ← Noms des routes navigation
│       │   │
│       │   ├── utils/
│       │   │   ├── date.ts               ← Formatage dates (dayjs)
│       │   │   ├── blood.ts              ← Helpers compatibilité sanguine
│       │   │   └── validation.ts         ← Schemas Zod formulaires
│       │   │
│       │   └── types/
│       │       └── navigation.types.ts   ← Types des params de navigation
│       │
│       ├── assets/
│       │   ├── fonts/
│       │   │   └── Inter-*.ttf
│       │   └── images/
│       │       ├── logo.png
│       │       └── onboarding/
│       │
│       ├── app.json                      ← Config Expo
│       ├── eas.json                      ← Config EAS Build
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                           ← Types TypeScript partagés
│       ├── src/
│       │   ├── types/
│       │   │   ├── user.types.ts
│       │   │   ├── sos.types.ts
│       │   │   ├── donor.types.ts
│       │   │   ├── chat.types.ts
│       │   │   ├── notification.types.ts
│       │   │   └── index.ts              ← Barrel export
│       │   └── constants/
│       │       ├── blood-compatibility.ts
│       │       └── cooldown-days.ts
│       ├── tsconfig.json
│       └── package.json
│
├── biome.json                            ← Config Biome (lint + format)
├── .gitignore
├── .env.example                          ← Template global
├── turbo.json                            ← Config Turborepo (build cache)
├── package.json                          ← Workspace root
├── PLAN_DE_ROUTE.md
├── REGLES_D_OR.md
└── .cursorrules
```

---

## Schéma Prisma complet

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum BloodType {
  O_NEG  @map("O-")
  O_POS  @map("O+")
  A_NEG  @map("A-")
  A_POS  @map("A+")
  B_NEG  @map("B-")
  B_POS  @map("B+")
  AB_NEG @map("AB-")
  AB_POS @map("AB+")
}

enum Priority {
  preventif
  urgence_vitale
}

enum SosStatus {
  active
  closed
  fulfilled
}

enum WaitlistStatus {
  waiting
  validated
  donated
  cancelled
  rejected
}



enum Gender {
  masculin
  feminin
}

enum BadgeType {
  bronze
  argent
  or
}

model User {
  id                String       @id @default(uuid())
  name              String
  email             String       @unique
  passwordHash      String?      @map("password_hash")
  googleId          String?      @unique @map("google_id")
  phone             String
  city              String
  bloodType         BloodType    @map("blood_type")
  gender            Gender
  birthDate         DateTime     @map("birth_date")
  avatarUrl         String?      @map("avatar_url")
  reputationPoints  Int          @default(0) @map("reputation_points")
  lastDonationDate  DateTime?    @map("last_donation_date")
  nextEligibleDate  DateTime?    @map("next_eligible_date")
  isEligible        Boolean      @default(true) @map("is_eligible")
  fcmToken          String?      @map("fcm_token")
  refreshToken      String?      @map("refresh_token")
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")

  sosAlerts         SosAlert[]   @relation("RequesterSos")
  waitlistEntries   DonorWaitlist[]
  sentMessages      Message[]
  badges            Badge[]

  @@map("users")
}

model SosAlert {
  id              String     @id @default(uuid())
  requesterId     String     @map("requester_id")
  bloodTypeNeeded BloodType  @map("blood_type_needed")
  unitsNeeded     Int        @map("units_needed")
  priority        Priority
  hospitalName    String     @map("hospital_name")
  hospitalAddress String     @map("hospital_address")
  latitude        Decimal    @db.Decimal(10, 7)
  longitude       Decimal    @db.Decimal(10, 7)
  city            String
  status          SosStatus  @default(active)
  createdAt       DateTime   @default(now()) @map("created_at")
  closedAt        DateTime?  @map("closed_at")

  requester       User           @relation("RequesterSos", fields: [requesterId], references: [id])
  waitlist        DonorWaitlist[]
  messages        Message[]

  @@index([city, status])
  @@index([requesterId, status])
  @@map("sos_alerts")
}

model DonorWaitlist {
  id          String         @id @default(uuid())
  sosId       String         @map("sos_id")
  donorId     String         @map("donor_id")
  status      WaitlistStatus @default(waiting)
  joinedAt    DateTime       @default(now()) @map("joined_at")
  validatedAt DateTime?      @map("validated_at")
  donatedAt   DateTime?      @map("donated_at")

  sos         SosAlert @relation(fields: [sosId], references: [id])
  donor       User     @relation(fields: [donorId], references: [id])

  @@unique([sosId, donorId])
  @@map("donor_waitlist")
}

model Message {
  id        String   @id @default(uuid())
  sosId     String   @map("sos_id")
  senderId  String   @map("sender_id")
  content   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  sos       SosAlert @relation(fields: [sosId], references: [id])
  sender    User     @relation(fields: [senderId], references: [id])

  @@index([sosId, createdAt])
  @@map("messages")
}

model Badge {
  id       String    @id @default(uuid())
  userId   String    @map("user_id")
  type     BadgeType
  earnedAt DateTime  @default(now()) @map("earned_at")

  user     User @relation(fields: [userId], references: [id])

  @@map("badges")
}
```
