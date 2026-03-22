#!/bin/bash
# ════════════════════════════════════════════════════════════
# spawn_store.sh — Launch a new isolated store stack
# Usage: ./spawn_store.sh <store_name> <app_port> <nginx_port> <db_port> <redis_port>
# Example (primary store):  ./spawn_store.sh cabox 3000 80 5432 6379
# Example (second store):   ./spawn_store.sh boutique 3100 8080 5433 6380
# ════════════════════════════════════════════════════════════
set -e

STORE_NAME=${1:?"Usage: $0 <store_name> <app_port> <nginx_port> <db_port> <redis_port>"}
APP_PORT=${2:-3000}
NGINX_PORT=${3:-80}
DB_PORT=${4:-5432}
PGBOUNCER_PORT=$((DB_PORT + 900))
REDIS_PORT=${5:-6379}

TEMPLATE="templates/env.dev.template"
ENV_FILE=".env.${STORE_NAME}"

if [ ! -f "$TEMPLATE" ]; then
  echo "❌  Template not found: $TEMPLATE"
  exit 1
fi

cp "$TEMPLATE" "$ENV_FILE"
sed -i "s/{{STORE_NAME}}/$STORE_NAME/g"           "$ENV_FILE"
sed -i "s/{{APP_PORT}}/$APP_PORT/g"               "$ENV_FILE"
sed -i "s/{{NGINX_PORT}}/$NGINX_PORT/g"           "$ENV_FILE"
sed -i "s/{{DB_PORT}}/$DB_PORT/g"                 "$ENV_FILE"
sed -i "s/{{PGBOUNCER_PORT}}/$PGBOUNCER_PORT/g"   "$ENV_FILE"
sed -i "s/{{REDIS_PORT}}/$REDIS_PORT/g"           "$ENV_FILE"

echo "✅  Generated: $ENV_FILE"
echo "⚡  Launching store '$STORE_NAME' ..."

COMPOSE_PROJECT_NAME=$STORE_NAME \
  docker compose \
    -f docker-compose.dev.yml \
    --env-file "$ENV_FILE" \
    up -d --build

echo ""
echo "🚀  Store '$STORE_NAME' is live!"
echo "    Web:        http://localhost:$NGINX_PORT"
echo "    App:        http://localhost:$APP_PORT (direct)"
echo "    DB:         localhost:$DB_PORT"
echo "    PgBouncer:  localhost:$PGBOUNCER_PORT"
echo "    Redis:      localhost:$REDIS_PORT"
echo ""
echo "📌  Stop:  COMPOSE_PROJECT_NAME=$STORE_NAME docker compose -f docker-compose.dev.yml --env-file $ENV_FILE down"
