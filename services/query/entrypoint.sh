#!/bin/sh
set -e

DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"
echo "🔎 Buscando IPv4 para $DB_HOST..."

# 1. Obtenemos todas las direcciones
# 2. Filtramos para eliminar IPv6 (las que tienen :)
# 3. Filtramos para quedarnos con el formato de IP (números y puntos)
IPV4=$(nslookup "$DB_HOST" 8.8.8.8 | grep -A 1 "Name:" | grep "Address" | awk '{print $2}' | grep -v ":" | grep -E '^[0-9.]+$' | head -n 1)

if [ -z "$IPV4" ]; then
  echo "⚠️ nslookup falló, intentando con getent..."
  IPV4=$(getent ahosts "$DB_HOST" | awk '{print $1}' | grep -v ":" | grep -E '^[0-9.]+$' | head -n 1)
fi

if [ -z "$IPV4" ]; then
  echo "❌ Error: No se encontró una dirección IPv4 pura."
else
  echo "✅ IPv4 REAL encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  # Usamos append (>>) para evitar errores de permisos de re-escritura
  echo "$IPV4 $DB_HOST" >> /etc/hosts
fi

echo "🚀 Iniciando la aplicación..."
exec "$@"