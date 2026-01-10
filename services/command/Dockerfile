FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# 1. Instalar pnpm
RUN npm install -g pnpm

# 2. Copiar archivos de configuración raíz
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# 3. Copiar PAQUETES COMPARTIDOS (Database + TypeScript Config)
COPY packages/database ./packages/database
COPY packages/typescript-config ./packages/typescript-config

# 4. Copiar el servicio específico
# (OJO: Si estás en services/query/Dockerfile, cambia 'command' por 'query')
COPY services/command ./services/command

# 5. Instalar dependencias
RUN pnpm install

# 6. Generar Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# 7. Volver al servicio y ejecutar
# (OJO: Si estás en services/query/Dockerfile, cambia 'command' por 'query')
WORKDIR /app/services/command

EXPOSE 3001
# (Usa 3002 si es query)

CMD ["pnpm", "dev"]