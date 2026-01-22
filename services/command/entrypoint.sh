#!/bin/sh
set -e

DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"
echo "🔎 Buscando IPv4 para $DB_HOST..."

# Intento 1: comando 'host' (muy fiable para registros A)
IPV4=$(host -t A "$DB_HOST" | grep "has address" | awk '{print $4}' | head -n 1)

# Intento 2: nslookup (si host falla)
if [ -z "$IPV4" ]; then
  echo "⚠️ 'host' falló, intentando nslookup..."
  IPV4=$(nslookup "$DB_HOST" 8.8.8.8 | grep -A 1 "Name:" | grep "Address" | awk '{print $2}' | grep -v ":" | head -n 1)
fi

# Intento 3: ping (si los anteriores fallan)
if [ -z "$IPV4" ]; then
  echo "⚠️ nslookup falló, intentando ping..."
  IPV4=$(ping -c 1 "$DB_HOST" | head -n 1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -n 1)
fi

if [ -z "$IPV4" ]; then
  echo "❌ Error: No se pudo encontrar una IPv4 pura para $DB_HOST"
else
  echo "✅ IPv4 REAL encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  echo "$IPV4 $DB_HOST" >> /etc/hosts
fi

echo "🚀 Iniciando la aplicación..."
exec "$@"