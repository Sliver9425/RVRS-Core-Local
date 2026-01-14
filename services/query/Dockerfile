FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates

RUN echo "precedence ::ffff:0:0/96 100" > /etc/gai.conf

WORKDIR /app

# Dependencias del sistema


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

COPY services/command/entrypoint.sh /usr/local/bin/entrypoint.sh

# 2. Le damos permisos de ejecución (CRÍTICO)
RUN chmod +x /usr/local/bin/entrypoint.sh

# 3. Definimos este script como la "puerta de entrada"
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# 4. El comando que se pasará al entrypoint
CMD ["npm", "start"]