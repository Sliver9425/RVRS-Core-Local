FROM node:18-alpine

WORKDIR /app

# Instalamos pnpm globalmente
RUN npm install -g pnpm

# Copiamos solo los archivos necesarios para instalar dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mqtt-bridge/package.json ./services/mqtt-bridge/

# Instalamos dependencias forzando la creación de node_modules local
RUN pnpm install --filter mqtt-bridge --prod

# Copiamos el código fuente
COPY services/mqtt-bridge/index.js ./index.js

# Aseguramos que las dependencias sean visibles para Node
ENV NODE_PATH=/app/services/mqtt-bridge/node_modules

CMD ["node", "index.js"]