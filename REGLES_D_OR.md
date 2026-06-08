# ⚖️ SAUVI — Règles d'Or

> Ce fichier fait loi. Toute contribution (humaine ou IA) doit le respecter.  
> Dernière mise à jour : 2025

---

## 1. TypeScript — Typage strict

### 1.1 Configuration obligatoire

```json
// tsconfig.json (partagé monorepo)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 1.2 Interdictions absolues

```typescript
// ❌ INTERDIT
const foo: any = getData();
const bar = data as SomeType;        // cast sans validation
function handler(req, res) {}        // params sans types
const obj = {} as User;              // assertion sur objet vide

// ✅ OBLIGATOIRE
const foo: User = parseUser(getData());
function handler(req: Request, res: Response): void {}
```

### 1.3 Types partagés dans `packages/shared`

Tous les types utilisés à la fois par le frontend et le backend vivent dans `packages/shared/src/types/`. Jamais de duplication.

```typescript
// packages/shared/src/types/sos.types.ts
export type BloodType = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';
export type Priority = 'preventif' | 'urgence_vitale';
export type SosStatus = 'active' | 'closed' | 'fulfilled';
export type WaitlistStatus = 'waiting' | 'validated' | 'donated' | 'cancelled' | 'rejected';
// Don de sang total uniquement — plaquettes et plasma non gérés par SAUVI
export type Gender = 'masculin' | 'feminin';
export type BadgeType = 'bronze' | 'argent' | 'or';
// birthDate : ISO date string, âge minimum 18 ans validé à l'inscription
// gender détermine le délai de carence : masculin=56j, feminin=84j
```

### 1.4 Zod pour la validation runtime

Chaque DTO NestJS est validé avec Zod (pas seulement class-validator).

```typescript
// sos/dto/create-sos.schema.ts
import { z } from 'zod';
import { BloodType, Priority } from '@sauvi/shared';

export const CreateSosSchema = z.object({
  bloodTypeNeeded: z.enum(['O-','O+','A-','A+','B-','B+','AB-','AB+']),
  unitsNeeded: z.number().int().min(1).max(20),
  priority: z.enum(['preventif', 'urgence_vitale']),
  hospitalName: z.string().min(2).max(100),
  hospitalAddress: z.string().min(5).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().min(2).max(50),
});

export type CreateSosDto = z.infer<typeof CreateSosSchema>;
```

---

## 2. Conventions de nommage

### 2.1 Règle générale

| Contexte | Convention | Exemple |
|---|---|---|
| Fichiers TypeScript | `kebab-case` | `blood-compatibility.service.ts` |
| Classes | `PascalCase` | `BloodCompatibilityService` |
| Interfaces | `PascalCase` + préfixe `I` | `IUserRepository` |
| Types | `PascalCase` | `BloodType` |
| Enums | `PascalCase` | `SosStatus` |
| Variables/fonctions | `camelCase` | `findEligibleDonors()` |
| Constantes globales | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |
| Composants React Native | `PascalCase` | `SosAlertCard.tsx` |
| Hooks React | `camelCase` + préfixe `use` | `useSosWaitlist.ts` |
| Stores Redux | `camelCase` + suffixe `Slice` | `sosSlice.ts` |
| Tables Prisma | `snake_case` | `sos_alerts` |
| Colonnes DB | `snake_case` | `blood_type_needed` |
| Variables d'env | `SCREAMING_SNAKE_CASE` | `DATABASE_URL` |
| Routes API | `kebab-case` pluriel | `/sos-alerts`, `/blood-types` |

### 2.2 Nommage des fichiers NestJS

```
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.service.spec.ts        ← tests unitaires à côté du service
├── strategies/
│   ├── jwt.strategy.ts
│   └── google.strategy.ts
└── dto/
    ├── login.dto.ts
    └── register-step1.dto.ts
```

### 2.3 Nommage des composants React Native

```
components/
├── sos/
│   ├── SosButton.tsx            ← composant
│   ├── SosButton.test.tsx       ← test
│   ├── SosAlertCard.tsx
│   └── index.ts                 ← barrel export
screens/
├── home/
│   ├── HomeScreen.tsx
│   └── HomeScreen.test.tsx
```

### 2.4 Nommage des events WebSocket

Format : `domaine:action`

```typescript
// ✅ Correct
'sos:created'
'waitlist:donor_joined'
'waitlist:donor_validated'
'waitlist:donor_cancelled'
'sos:closed'
'message:sent'
'message:read'

// ❌ Interdit
'sosCreated'
'update'
'event1'
```

---

## 3. Architecture & Structure

### 3.1 Règle des modules NestJS

Chaque module est **autonome** et ne doit pas importer directement les repositories d'un autre module. La communication inter-modules se fait uniquement via les **services exportés**.

```typescript
// ✅ Correct : SosModule utilise le service de EligibilityModule
@Module({
  imports: [EligibilityModule],
})
export class SosModule {}

// ❌ Interdit : SosService importe directement EligibilityRepository
@Injectable()
export class SosService {
  constructor(private eligibilityRepo: EligibilityRepository) {} // NON
}
```

### 3.2 Règle des composants React Native

Un composant ne fait **qu'une seule chose**. Si un composant dépasse 150 lignes, il doit être découpé.

```typescript
// ✅ Correct
<SosAlertCard sos={sos} onPress={handlePress} />

// ❌ Interdit : logique métier dans le composant
const SosAlertCard = ({ sosId }) => {
  const [sos, setSos] = useState(null);
  useEffect(() => { fetch(`/sos/${sosId}`).then(setSos) }, []); // NON
  // ...
}
```

### 3.3 Règle des hooks

Toute logique d'état ou d'effet de bord dans un écran doit être extraite dans un hook `use*.ts`.

```typescript
// screens/home/HomeScreen.tsx
const HomeScreen = () => {
  const { sos, isLoading, launchSos } = useSosActive(); // ✅
  const { eligibility } = useEligibility(); // ✅
  // Le composant ne fait que du rendu
};
```

---

## 4. Sécurité

### 4.1 Variables d'environnement

```typescript
// ❌ JAMAIS de secrets en dur dans le code
const secret = "mon_super_secret_jwt_123";

// ✅ Validation des env vars au démarrage (NestJS)
// config/env.validation.ts
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  CLOUDFLARE_R2_ACCESS_KEY: z.string(),
  CLOUDFLARE_R2_SECRET_KEY: z.string(),
  FCM_PROJECT_ID: z.string(),
  REDIS_URL: z.string(),
});

export const env = EnvSchema.parse(process.env);
```

### 4.2 Règles JWT

- Access token : durée de vie **15 minutes**
- Refresh token : durée de vie **30 jours**, stocké en base (révocable)
- Rotation des refresh tokens à chaque utilisation
- Stockage mobile : **Expo SecureStore uniquement** (jamais AsyncStorage pour les tokens)

```typescript
// ❌ INTERDIT mobile
await AsyncStorage.setItem('token', jwt);

// ✅ OBLIGATOIRE mobile
await SecureStore.setItemAsync('access_token', jwt);
```

### 4.3 Règles des endpoints NestJS

Tout endpoint **doit** avoir :
1. Un guard (`@UseGuards(JwtAuthGuard)`) sauf les routes publiques explicitement décorées `@Public()`
2. Un rate limiter (`@Throttle()`)
3. Une validation des inputs (Zod ou class-validator)

```typescript
// ✅ Endpoint sécurisé type
@Controller('sos')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SosController {
  @Post()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 SOS/min max
  async create(
    @Body() dto: CreateSosDto,
    @CurrentUser() user: User,
  ): Promise<SosResponse> {
    return this.sosService.create(dto, user.id);
  }
}
```

### 4.4 Données sensibles

```typescript
// ❌ INTERDIT : retourner le hash du mot de passe
return this.prisma.user.findUnique({ where: { id } });

// ✅ OBLIGATOIRE : exclure les champs sensibles
return this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true, name: true, email: true,
    bloodType: true, city: true, phone: true,
    reputationPoints: true, isEligible: true,
    // password_hash: false  ← jamais sélectionné
  },
});
```

### 4.5 Upload de fichiers

```typescript
// Limites obligatoires sur tous les endpoints d'upload
@Post('avatar')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
}))
```

### 4.6 Règles CORS

```typescript
// main.ts
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://sauvi.app']
    : ['http://localhost:3000', 'http://localhost:8081'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
});
```

### 4.7 Helmet + headers de sécurité

```typescript
// main.ts — toujours en production
import helmet from 'helmet';
app.use(helmet());
```

---

## 5. Tests

### 5.1 Règle de couverture minimale

| Type | Couverture minimale |
|---|---|
| Services NestJS | 80% |
| Guards + Interceptors | 100% |
| Matrice compatibilité sang | 100% |
| Composants React Native critiques | 60% |

### 5.2 Structure d'un test unitaire NestJS

```typescript
// sos/sos.service.spec.ts
describe('SosService', () => {
  describe('create', () => {
    it('should create a SOS and notify compatible donors', async () => {
      // ARRANGE
      const dto: CreateSosDto = { bloodTypeNeeded: 'A+', ... };
      const user = createMockUser({ city: 'Douala' });
      mockDonorRepo.findEligible.mockResolvedValue([createMockDonor()]);

      // ACT
      const result = await sosService.create(dto, user.id);

      // ASSERT
      expect(result.status).toBe('active');
      expect(mockNotificationService.sendToMany).toHaveBeenCalledTimes(1);
    });

    it('should throw if user already has an active SOS', async () => {
      mockSosRepo.findActive.mockResolvedValue(createMockSos());
      await expect(sosService.create(dto, user.id))
        .rejects.toThrow(ConflictException);
    });
  });
});
```

### 5.3 Nommage des tests

Format : `should [résultat attendu] when [condition]`

```typescript
// ✅
it('should block notifications when donor is in cooldown period')
it('should return all compatible donors for AB+ recipient')
it('should throw UnauthorizedException when JWT is expired')

// ❌
it('test 1')
it('works correctly')
it('notification')
```

---

## 6. Performance

- Toutes les listes paginées avec pagination par **curseur** (pas par offset)
- Aucun `SELECT *` en base de données : toujours lister les champs explicitement
- Les requêtes Prisma complexes (jointures, agrégats) ont un **commentaire de performance** estimé
- Pas de boucle `for` avec des appels DB à l'intérieur : utiliser `findMany` avec `where: { id: { in: [...] } }`
- Chaque endpoint listé dans Sentry avec ses métriques de temps de réponse cible :

| Endpoint | Temps cible |
|---|---|
| `POST /sos` (création + notifs) | < 800ms |
| `GET /sos/nearby` | < 300ms |
| `GET /users/me` | < 100ms |
| WebSocket `waitlist:update` | < 100ms |

---

## 7. Git & Code Review

- **Aucun commit direct sur `main` ou `develop`** — toujours via Pull Request
- Une PR ne doit pas dépasser **400 lignes modifiées**. Au-delà, la découper.
- Toute PR doit avoir : description, screenshots si changement UI, checklist tests passés
- La CI doit être **verte** avant tout merge
- Les secrets ne doivent **jamais** apparaître dans un commit (utiliser `git-secrets` ou `gitleaks`)
