#!/bin/sh
set -e

if [ -z "$DATABASE_URL_DIRECT" ]; then
  echo "⚠️  DATABASE_URL_DIRECT is not set; skipping schema_changes.sql / schema_population.sql"
else
  echo "⏳ Applying prisma/schema_changes.sql (idempotent DDL)..."
  psql "$DATABASE_URL_DIRECT" -v ON_ERROR_STOP=1 -f ./prisma/schema_changes.sql
  echo "⏳ Applying prisma/schema_population.sql (idempotent data + constraints)..."
  psql "$DATABASE_URL_DIRECT" -v ON_ERROR_STOP=1 -f ./prisma/schema_population.sql
fi

echo "🌱 Seeding database (if needed)..."
npx prisma db seed 2>/dev/null || true

echo "🚀 Starting application..."
exec "$@"
