#!/bin/sh
set -e

DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"
echo "🔎 Buscando IPv4 para $DB_HOST..."

# Intento 1: Usar getent (tu método actual)
IPV4=$(getent ahosts "$DB_HOST" | grep -v ":" | head -n 1 | awk '{ print $1 }')

# Intento 2: Si falla, forzar nslookup contra el DNS de Google
if [ -z "$IPV4" ]; then
  echo "⚠️ Resolución interna falló, intentando con nslookup (8.8.8.8)..."
  IPV4=$(nslookup "$DB_HOST" 8.8.8.8 | grep 'Address' | tail -n 1 | awk '{print $2}')
fi

if [ -z "$IPV4" ]; then
  echo "❌ Error: No se pudo encontrar una IPv4 para $DB_HOST"
else
  echo "✅ IPv4 encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  # Forzamos la entrada en el archivo de hosts
  echo "$IPV4 $DB_HOST" >> /etc/hosts || echo "⚠️ No se pudo escribir en /etc/hosts (permisos)"
fi

echo "🚀 Iniciando la aplicación..."
# Esto asegura que el comando 'pnpm start' se ejecute correctamente
exec "$@"