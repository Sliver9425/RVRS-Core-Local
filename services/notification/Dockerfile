FROM node:18-alpine

# Instalamos compatibilidad para librerías nativas
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 1. Copiamos archivos de configuración de dependencias
# (Copiamos el lockfile si usas npm, o pnpm-lock.yaml si usas pnpm)
COPY package*.json tsconfig.json ./

# 2. Instalamos todas las dependencias para poder compilar
RUN npm install

# 3. Copiamos el código fuente (la carpeta src)
COPY . .

# 4. Compilamos el código TS a JS usando el tsconfig
# Esto leerá 'src' y creará la carpeta 'dist' gracias a tu outDir
RUN npm run build

# 5. Comando de ejecución
# Ya no usamos ts-node, usamos node directamente sobre el archivo compilado
CMD ["node", "dist/index.js"]