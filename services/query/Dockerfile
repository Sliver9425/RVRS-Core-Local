FROM node:18-slim

# 1. Instalamos lo mínimo (quitamos ping/dnsutils porque usaremos IP directa)
RUN apt-get update -y && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Instalación de pnpm
RUN npm install -g pnpm

# 3. Copiar configuración raíz
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# 4. Copiar paquetes compartidos
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config

# 5. Copiar el servicio QUERY (Asegúrate de copiar el del servicio correcto)
COPY services/query ./services/query

# 6. Instalar dependencias
RUN pnpm install --no-frozen-lockfile

# 7. Generar Prisma y Build de base de datos
WORKDIR /app/packages/database
RUN npx prisma generate
RUN pnpm build

# 8. Compilar el servicio Query
WORKDIR /app/services/query
RUN pnpm build

# ==========================================
# ENTRYPOINT (Sin parches de red manuales)
# ==========================================

# IMPORTANTE: Copiamos el entrypoint del directorio de query
COPY services/query/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Usamos pnpm start para mantener consistencia con el monorepo
CMD ["pnpm", "start"]