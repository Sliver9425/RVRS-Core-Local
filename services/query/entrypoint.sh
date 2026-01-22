#!/bin/sh
set -e

# URL de tu base de datos
DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"

echo "🔎 Buscando IPv4 para $DB_HOST..."

# Extracción precisa: buscamos la línea de 'Address' que viene después del 'Name' del host
IPV4=$(nslookup "$DB_HOST" 8.8.8.8 | grep -A 1 "Name:.*$DB_HOST" | grep "Address" | awk '{print $2}' | head -n 1)

# Plan B: Si nslookup falla o devuelve algo vacío
if [ -z "$IPV4" ]; then
  echo "⚠️ nslookup falló, intentando con getent..."
  IPV4=$(getent hosts "$DB_HOST" | awk '{print $1}' | head -n 1)
fi

# Validación final para evitar capturar la IP del DNS (8.8.8.8)
if [ -z "$IPV4" ] || [ "$IPV4" = "8.8.8.8" ]; then
  echo "❌ Error: No se pudo encontrar una IPv4 válida para la base de datos."
else
  echo "✅ IPv4 REAL encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  # Importante: Usamos >> (append) para evitar el error "Device or resource busy" de sed
  echo "$IPV4 $DB_HOST" >> /etc/hosts
fi

echo "🚀 Iniciando la aplicación..."
# Ejecuta el comando definido en el Dockerfile (pnpm start)
exec "$@"