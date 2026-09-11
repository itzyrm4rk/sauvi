# ─── STAGE 1: Builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Installation des outils système nécessaires (OpenSSL pour Prisma)
RUN apk add --no-cache openssl libc6-compat

# Copie des fichiers racine pour la résolution des workspaces et TypeScript
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/package.json

# Installation des dépendances pour l'API et shared
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# Copie du reste des sources
COPY apps/api ./apps/api
COPY packages ./packages

# Compilation du package partagé @sauvi/shared
RUN npm run build --workspace=@sauvi/shared

# Génération du client Prisma
RUN cd apps/api && npx prisma generate

# Compilation de l'API NestJS
RUN cd apps/api && npm run build

# ─── STAGE 2: Runner Production ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl libc6-compat

# Copie des binaires compilés et node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3000

# Démarrage avec exécution automatique des migrations Prisma
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/main"]
