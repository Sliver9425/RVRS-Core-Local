FROM node:18-alpine

# Instalamos dependencias necesarias para compilar módulos si hiciera falta
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos todo (incluyendo devDependencies como ts-node y typescript)
RUN npm install

# Copiamos el resto del código del servicio
COPY . .

# Exponemos el puerto si fuera necesario (opcional para este servicio)
# EXPOSE 3005 

# 🔥 CAMBIO CLAVE: Usamos npx para asegurar que encuentre ts-node
CMD ["npx", "ts-node", "src/index.ts"]