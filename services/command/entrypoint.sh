#!/bin/sh
set -e

# Ya no manipulamos el DNS porque usaremos la IP directa en la DATABASE_URL
echo "🚀 Iniciando la aplicación en modo producción..."

# Ejecuta el comando definido en el CMD (pnpm start)
exec "$@"