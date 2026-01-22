FROM node:18-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código del servicio
COPY . .

# 🔥 ESPECIFICAMOS LA RUTA ABSOLUTA DENTRO DEL CONTENEDOR
CMD ["npx", "ts-node", "/app/src/index.ts"]