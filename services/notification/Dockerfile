FROM node:18-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Al usar ../../ el contexto es la RAÍZ del monorepo.
# Por eso debemos apuntar a la ruta completa del servicio.
COPY services/notification/package*.json ./
COPY services/notification/tsconfig.json ./

RUN npm install

# Copiamos solo la carpeta del servicio
COPY services/notification/ ./

RUN npm run build
CMD ["node", "dist/index.js"]