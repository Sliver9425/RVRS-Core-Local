#!/bin/sh
set -e

DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"
echo "🔎 Buscando IPv4 para $DB_HOST..."

# Forzamos la consulta de tipo A (solo IPv4) directamente a Google
IPV4=$(nslookup -type=A "$DB_HOST" 8.8.8.8 | grep -A 1 "Name:" | grep "Address" | awk '{print $2}' | grep -v ":" | head -n 1)

if [ -z "$IPV4" ]; then
  echo "⚠️ nslookup tipo A falló, intentando con ping..."
  # Plan C: Usar ping para ver si el sistema resuelve la IP por nosotros (tomamos solo la IP entre paréntesis)
  IPV4=$(ping -c 1 "$DB_HOST" | head -n 1 | awk -F'[()]' '{print $2}')
fi

if [ -z "$IPV4" ] || [ "$IPV4" = "8.8.8.8" ]; then
  echo "❌ Error: No se pudo encontrar una IPv4 pura."
else
  echo "✅ IPv4 REAL encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  echo "$IPV4 $DB_HOST" >> /etc/hosts
fi

echo "🚀 Iniciando la aplicación..."
exec "$@"