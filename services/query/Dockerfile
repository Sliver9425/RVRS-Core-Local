FROM node:18-alpine

WORKDIR /app

# Dependencias del sistema
RUN apk add --no-cache openssl libc6-compat

# 1. Instalar pnpm
RUN npm install -g pnpm

# 2. Copiar archivos raíz del monorepo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# 3. Copiar paquetes compartidos
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config

# 4. Copiar el servicio QUERY 
COPY services/query ./services/query

# 5. Instalar dependencias (permitiendo actualizar el lockfile)
RUN pnpm install --no-frozen-lockfile

# 6. Generar Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# ==========================================
# NUEVO 6.5: COMPILAR PAQUETE DE BASE DE DATOS
# Esto genera /app/packages/database/dist
# ==========================================
RUN pnpm build

# 7. BUILD: Compilar el servicio Query (TypeScript a JS)
WORKDIR /app/services/query
RUN pnpm build

# 8. START: Ejecutar versión compilada (node dist/index.js)
CMD ["npm", "start"]