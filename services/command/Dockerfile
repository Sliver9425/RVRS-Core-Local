FROM node:18-slim

# Instalamos netcat y procps por si necesitamos debug, además de lo básico
RUN apt-get update -y && apt-get install -y \
    openssl \
    ca-certificates \
    netcat-openbsd \
    dnsutils \
    host \
    iputils-ping \
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
# PARCHE DE RED IPV4 (NUEVO)
# ==========================================
# 1. Copiamos el script dentro de la imagen
COPY services/command/entrypoint.sh /usr/local/bin/entrypoint.sh

# 2. Le damos permisos de ejecución (CRÍTICO)
RUN chmod +x /usr/local/bin/entrypoint.sh

# 3. Definimos este script como la "puerta de entrada"
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# 4. El comando que se pasará al entrypoint
CMD ["pnpm", "start"]