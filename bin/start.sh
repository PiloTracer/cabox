#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# bin/start.sh — Cabox Docker Environment Manager
# Usage: ./bin/start.sh [dev|prd] [store_name]
# ════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── 1. Environment Detection ──────────────────────────────────
TARGET_ENV="$1"
STORE_NAME="${2:-cabox}"

if [ -z "$TARGET_ENV" ]; then
    count=0
    [ -f "$PROJECT_ROOT/.env.dev" ] && count=$((count+1)) && FOUND_ENV="dev"
    [ -f "$PROJECT_ROOT/.env.prd" ] && count=$((count+1)) && FOUND_ENV="prd"

    if [ "$count" -eq 1 ]; then
        TARGET_ENV="$FOUND_ENV"
        echo "Auto-detected environment: $TARGET_ENV"
    elif [ "$count" -eq 0 ]; then
        echo "❌  No .env files found in $PROJECT_ROOT"
        echo "    Run: cp templates/env.dev.template .env.dev  then fill in values."
        exit 1
    else
        echo "Multiple environments found. Select one:"
        echo "  1) Development (dev)"
        echo "  2) Production (prd)"
        read -rp "Select [1-2]: " env_opt
        case $env_opt in
            1) TARGET_ENV="dev" ;;
            2) TARGET_ENV="prd" ;;
            *) echo "Invalid option"; exit 1 ;;
        esac
    fi
else
    TARGET_ENV=$(echo "$TARGET_ENV" | tr '[:upper:]' '[:lower:]')
    if [[ "$TARGET_ENV" != "dev" && "$TARGET_ENV" != "prd" ]]; then
        echo "❌  Invalid environment: $TARGET_ENV"
        echo "    Usage: ./bin/start.sh [dev|prd] [store_name]"
        exit 1
    fi
fi

# ── 2. Resolve Files ──────────────────────────────────────────
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.${TARGET_ENV}.yml"
ENV_FILE="$PROJECT_ROOT/.env.${TARGET_ENV}"

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌  Compose file not found: $COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌  Env file not found: $ENV_FILE"
    echo "    Copy and fill: cp templates/env.dev.template .env.dev"
    exit 1
fi

# Load ports from env file for display
APP_PORT=$(grep "^APP_PORT=" "$ENV_FILE" | cut -d= -f2 | tr -d '"' | tr -d "'")
NGINX_PORT=$(grep "^NGINX_PORT=" "$ENV_FILE" | cut -d= -f2 | tr -d '"' | tr -d "'")
APP_PORT="${APP_PORT:-3000}"
NGINX_PORT="${NGINX_PORT:-80}"

# Detect Docker Compose
if docker compose version &>/dev/null; then
    DC="docker compose"
elif docker-compose version &>/dev/null; then
    DC="docker-compose"
else
    echo "❌  Docker Compose not found."
    exit 1
fi

COMPOSE_CMD="COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f \"$COMPOSE_FILE\" --env-file \"$ENV_FILE\""

# ── 3. Helper Functions ───────────────────────────────────────
pause() { read -n1 -rp "Press any key to continue..." && echo; }

header() {
    clear
    echo "╔══════════════════════════════════════════════╗"
    echo "║         CABOX — Docker Manager               ║"
    echo "╠══════════════════════════════════════════════╣"
    printf  "║  Store:  %-36s║\n" "$STORE_NAME"
    printf  "║  Env:    %-36s║\n" "$TARGET_ENV"
    printf  "║  Web:    http://localhost:%-19s║\n" "$NGINX_PORT"
    printf  "║  App:    http://localhost:%-19s║\n" "$APP_PORT"
    printf  "║  Admin:  http://localhost:$NGINX_PORT/admin%-14s║\n" ""
    echo "╚══════════════════════════════════════════════╝"
    echo ""
}

up() {
    header
    echo "▶  Bringing up $STORE_NAME ($TARGET_ENV) ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build
    echo ""
    echo "✅  Stack is up!"
    echo ""
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    echo ""
    echo "    Storefront → http://localhost:$NGINX_PORT/es"
    echo "    Admin      → http://localhost:$NGINX_PORT/admin"
    echo "    Direct App → http://localhost:$APP_PORT"
    pause
}

down() {
    header
    echo "▶  Stopping $STORE_NAME ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans
    echo "✅  Stack stopped."
    pause
}

restart() {
    header
    echo "▶  Restarting $STORE_NAME ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    echo "✅  Restart complete."
    pause
}

rebuild() {
    header
    echo "▶  Force Rebuild (--no-cache) ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    echo "✅  Rebuild complete."
    pause
}

logs() {
    header
    echo "▶  Logs — $STORE_NAME app (Ctrl+C to exit)"
    echo ""
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f --tail=150 app
    pause
}

logs_all() {
    header
    echo "▶  All service logs (Ctrl+C to exit)"
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f --tail=50
    pause
}

migrate() {
    header
    echo "▶  Running Prisma migrations ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec app npx prisma migrate dev
    pause
}

seed() {
    header
    echo "▶  Running database seed ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec app npx prisma db seed
    pause
}

studio() {
    header
    echo "▶  Opening Prisma Studio (http://localhost:5555) ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec app npx prisma studio
    pause
}

shell() {
    header
    echo "▶  Opening shell in app container ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec app sh
}

status() {
    header
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    pause
}

cleanup() {
    header
    echo "▶  Cleanup (containers + orphans, volumes preserved) ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans
    docker container prune -f
    docker network prune -f
    echo "✅  Cleanup complete."
    pause
}

# ── 4. Main Menu ──────────────────────────────────────────────
while true; do
    header
    echo "  1.  Up (Build & Start)"
    echo "  2.  Down (Stop)"
    echo "  3.  Restart"
    echo "  4.  Force Rebuild (no cache)"
    echo "  5.  View App Logs"
    echo "  6.  View All Logs"
    echo "  7.  Status"
    echo "  ─────────────────────────────────────────────"
    echo "  8.  Prisma Migrate"
    echo "  9.  Prisma Seed"
    echo "  10. Prisma Studio"
    echo "  11. App Shell"
    echo "  ─────────────────────────────────────────────"
    echo "  C.  Cleanup (containers, keep volumes)"
    echo "  0.  Exit"
    echo ""
    read -rp "  Select: " opt
    case $opt in
        1)  up       ;;
        2)  down     ;;
        3)  restart  ;;
        4)  rebuild  ;;
        5)  logs     ;;
        6)  logs_all ;;
        7)  status   ;;
        8)  migrate  ;;
        9)  seed     ;;
        10) studio   ;;
        11) shell    ;;
        [cC]) cleanup ;;
        0)  exit 0   ;;
        *)           ;;
    esac
done
