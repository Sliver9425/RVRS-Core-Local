#!/bin/sh
set -e

DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"
echo "🔎 Buscando IPv4 para $DB_HOST..."

# Usamos un filtro más estricto para asegurar que solo guardamos formato IPv4 (puntos, no dos puntos)
IPV4=$(nslookup "$DB_HOST" 8.8.8.8 | grep -E 'Address:[[:space:]]*[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | awk '{print $2}' | head -n 1)

if [ -z "$IPV4" ]; then
  # Segundo intento por si el formato de salida de nslookup varía
  IPV4=$(getent ahosts "$DB_HOST" | grep -v ":" | head -n 1 | awk '{ print $1 }')
fi

if [ -z "$IPV4" ]; then
  echo "❌ Error: No se pudo encontrar una IPv4 válida para $DB_HOST"
else
  echo "✅ IPv4 REAL encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  # Limpiamos cualquier entrada previa del mismo host para evitar duplicados
  sed -i "/$DB_HOST/d" /etc/hosts || true
  echo "$IPV4 $DB_HOST" >> /etc/hosts
fi

echo "🚀 Iniciando la aplicación..."
exec "$@"