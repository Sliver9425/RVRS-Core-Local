# CAMBIO AQUÍ: Usamos Node 20 en lugar de 18
FROM node:20-alpine AS base

# Dependencias de sistema para Alpine
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

# --- 1. BUILDER ---
FROM base AS builder
WORKDIR /app

# Copiamos todo el monorepo
COPY . .

# Instalamos dependencias (PNPM es rápido y eficiente)
RUN pnpm install --frozen-lockfile

# Nos movemos a la carpeta del frontend
WORKDIR /app/apps/web-portal

ENV NEXT_TELEMETRY_DISABLED 1

# Construimos
RUN pnpm run build

# --- 2. RUNNER ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# --- RUTAS DE COPIA ---

# 1. Public
COPY --from=builder /app/apps/web-portal/public ./public

# 2. Standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-portal/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/apps/web-portal/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/apps/web-portal/.next/static ./apps/web-portal/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web-portal/server.js"]