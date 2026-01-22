#!/bin/sh
set -e

DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"
echo "🔎 Buscando IPv4 para $DB_HOST..."

# Usamos una forma más limpia de extraer la IP de nslookup
# Buscamos la línea que sigue a 'Name:' y extraemos la dirección
IPV4=$(nslookup "$DB_HOST" 8.8.8.8 | grep -A 1 "Name:" | grep "Address" | awk '{print $2}' | head -n 1)

if [ -z "$IPV4" ]; then
  echo "⚠️ nslookup falló, intentando con getent..."
  IPV4=$(getent hosts "$DB_HOST" | awk '{print $1}' | head -n 1)
fi

if [ -z "$IPV4" ] || [ "$IPV4" = "8.8.8.8" ]; then
  echo "❌ Error: No se pudo encontrar una IPv4 válida."
else
  echo "✅ IPv4 REAL encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  # Usamos >> para añadir al final sin intentar renombrar el archivo (evita el error de sed)
  echo "$IPV4 $DB_HOST" >> /etc/hosts
fi

echo "🚀 Iniciando la aplicación..."
exec "$@"