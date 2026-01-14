#!/bin/sh
set -e

# URL de tu base de datos (sin el puerto ni protocolo)
DB_HOST="db.fzhnevqdagmsqibnaovb.supabase.co"

echo "🔎 Buscando IPv4 para $DB_HOST..."

# Usamos getent para obtener todas las IPs y filtramos solo la IPv4 (la que no tiene dos puntos :)
IPV4=$(getent ahosts $DB_HOST | grep -v ":" | head -n 1 | awk '{ print $1 }')

if [ -z "$IPV4" ]; then
  echo "❌ Error: No se pudo encontrar una IPv4 para $DB_HOST"
else
  echo "✅ IPv4 encontrada: $IPV4"
  echo "🛠️ Inyectando en /etc/hosts..."
  # Aquí ocurre la magia: forzamos que el dominio apunte a la IP v4
  echo "$IPV4 $DB_HOST" >> /etc/hosts
fi

echo "🚀 Iniciando la aplicación..."
# Ejecuta el comando que le pasemos al contenedor (npm start, node dist/server.js, etc.)
exec "$@"