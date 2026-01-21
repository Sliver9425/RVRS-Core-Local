FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

# --- 1. BUILDER ---
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/web-portal
ENV NEXT_TELEMETRY_DISABLED 1
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

COPY --from=builder --chown=nextjs:nodejs /app/apps/web-portal/.next/standalone ./


COPY --from=builder --chown=nextjs:nodejs /app/apps/web-portal/.next/static ./apps/web-portal/.next/static


COPY --from=builder --chown=nextjs:nodejs /app/apps/web-portal/public ./apps/web-portal/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web-portal/server.js"]