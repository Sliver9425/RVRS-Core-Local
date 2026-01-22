FROM node:18-alpine

# Instalamos pnpm globalmente dentro del contenedor
RUN npm install -g pnpm

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiamos solo el lockfile y el package.json para aprovechar el caché de capas
COPY package.json pnpm-lock.yaml* tsconfig.json ./

# Instalamos dependencias usando pnpm
RUN pnpm install

# Copiamos el código fuente
COPY . .

# Compilamos TypeScript a JavaScript (esto crea la carpeta /dist)
RUN pnpm build

# Comando de ejecución para producción
CMD ["node", "dist/index.js"]