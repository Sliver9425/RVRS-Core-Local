FROM node:18-slim

# Instalamos solo lo esencial para que Prisma y SSL funcionen
RUN apt-get update -y && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Instalar pnpm globalmente
RUN npm install -g pnpm

# 2. Copiar configuración raíz (Monorepo Standard)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# 3. Copiar paquetes compartidos
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config

# 4. Copiar el servicio Command
COPY services/command ./services/command

# 5. Instalar dependencias
RUN pnpm install --no-frozen-lockfile

# 6. Generar cliente de Prisma y Compilar DB
WORKDIR /app/packages/database
RUN npx prisma generate
RUN pnpm build

# 7. Compilar el servicio Command
WORKDIR /app/services/command
RUN pnpm build

# ==========================================
# ENTRYPOINT SIMPLIFICADO
# ==========================================
# Copiamos el script que ya no hace búsquedas de IP
COPY services/command/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Definimos la puerta de entrada
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Ejecutamos con pnpm start
CMD ["pnpm", "start"]