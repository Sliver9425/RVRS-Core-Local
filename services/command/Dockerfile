FROM node:18-alpine

WORKDIR /app

# Instalar dependencias necesarias
RUN apk add --no-cache openssl libc6-compat

# 1. Instalar pnpm globalmente
RUN npm install -g pnpm

# 2. Copiar configuración raíz
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# 3. Copiar paquetes compartidos
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config

# 4. Copiar el servicio Command
COPY services/command ./services/command

# 5. Instalar dependencias
RUN pnpm install --no-frozen-lockfile

# 6. Generar cliente de Prisma
WORKDIR /app/packages/database
RUN npx prisma generate

# ==========================================
# NUEVO 6.5: COMPILAR PAQUETE DE BASE DE DATOS
# ==========================================
# Esto crea la carpeta /app/packages/database/dist
RUN pnpm build

# 7. Compilar el servicio Command
WORKDIR /app/services/command
RUN pnpm build

# 8. EJECUTAR (Start)
CMD ["npm", "start"]