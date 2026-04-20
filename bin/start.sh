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
    echo "▶  Applying prisma/schema_changes.sql + schema_population.sql (idempotent) ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec app sh -c '
      psql "$DATABASE_URL_DIRECT" -v ON_ERROR_STOP=1 -f ./prisma/schema_changes.sql &&
      psql "$DATABASE_URL_DIRECT" -v ON_ERROR_STOP=1 -f ./prisma/schema_population.sql
    '
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

# ── 5. Backup & Restore (Volume-Level) ──────────────────────
# Uses filesystem-level volume backup (cold copy of PGDATA).
# Compose names volumes: ${COMPOSE_PROJECT_NAME}_${volume_key} → here ${STORE_NAME}_…
# Dev:  key cabox_pgdata   → e.g. cabox_cabox_pgdata,   service db
# Prd:  key cabox_prd_pgdata → e.g. cabox_cabox_prd_pgdata, service postgres

BACKUP_DIR="${PROJECT_ROOT}/backup"

# Determine DB service and volume names based on environment
get_db_config() {
    if [ "$TARGET_ENV" = "prd" ]; then
        DB_SERVICE="postgres"
        DB_VOLUME="${STORE_NAME}_cabox_prd_pgdata"
    else
        DB_SERVICE="db"
        DB_VOLUME="${STORE_NAME}_cabox_pgdata"
    fi
}

# Ensure the named volume exists (avoids Docker creating an empty anonymous-style mount)
verify_db_volume() {
    if ! docker volume inspect "$DB_VOLUME" &>/dev/null; then
        echo "❌  Docker volume not found: ${DB_VOLUME}"
        echo "    Bring the stack up once (option 1) so Compose creates volumes, or check STORE_NAME."
        return 1
    fi
    return 0
}

backup() {
    header
    echo "▶  Creating database volume backup ..."
    
    get_db_config
    if ! verify_db_volume; then
        pause
        return
    fi
    mkdir -p "${BACKUP_DIR}"
    
    BACKUP_STATUS=1
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="cabox_backup_${STORE_NAME}_${TARGET_ENV}_${TIMESTAMP}"
    TAR_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    
    echo "    Target: ${DB_VOLUME}"
    echo "    Service: ${DB_SERVICE}"
    echo ""
    
    # Stop dependent services first (app, pgbouncer, nginx if exists)
    echo "    Stopping app tier ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop app 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop pgbouncer 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop nginx 2>/dev/null || true
    
    # Stop postgres to ensure filesystem consistency
    echo "    Stopping ${DB_SERVICE} ..."
    if ! COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop "${DB_SERVICE}" 2>/dev/null; then
        echo "❌  Failed to stop ${DB_SERVICE}. Is the stack running?"
        echo "    Attempting to restart app tier ..."
        COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start pgbouncer 2>/dev/null || true
        COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start app 2>/dev/null || true
        COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start nginx 2>/dev/null || true
        pause
        return
    fi
    
    echo "    Creating backup archive ..."
    
    # Create backup using temp container with volume mounted
    # This backs up the actual PostgreSQL data directory
    if docker run --rm \
        -v "${DB_VOLUME}:/pgdata:ro" \
        -v "${BACKUP_DIR}:/backup" \
        alpine:latest \
        tar -czf "/backup/${BACKUP_NAME}.tar.gz" -C /pgdata .; then
        
        # Reject empty or trivial archives (wrong volume name would create an empty new volume)
        SZ=$(stat -c%s "${TAR_FILE}" 2>/dev/null || echo 0)
        if [ ! -s "${TAR_FILE}" ] || [ "${SZ}" -lt 512 ] 2>/dev/null; then
            echo ""
            echo "❌  Backup file missing or too small — refusing to keep a useless archive."
            rm -f "${TAR_FILE}"
            BACKUP_STATUS=1
        else
            # Sanity: archive must list PG_VERSION (PostgreSQL data directory marker)
            if ! tar -tzf "${TAR_FILE}" 2>/dev/null | grep -qE '(^|/)PG_VERSION$'; then
                echo ""
                echo "❌  Archive does not look like PostgreSQL data (missing PG_VERSION)."
                rm -f "${TAR_FILE}"
                BACKUP_STATUS=1
            else
                SIZE=$(du -h "${TAR_FILE}" 2>/dev/null | cut -f1)
                echo ""
                echo "✅  Backup created successfully!"
                echo "    File: ${BACKUP_NAME}.tar.gz"
                echo "    Size: ${SIZE}"
                echo "    Location: ${BACKUP_DIR}"
                BACKUP_STATUS=0
            fi
        fi
    else
        echo ""
        echo "❌  Backup failed (docker run / tar). See errors above."
        rm -f "${TAR_FILE}"
        BACKUP_STATUS=1
    fi
    
    # Restart postgres
    echo ""
    echo "    Restarting ${DB_SERVICE} ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start "${DB_SERVICE}" 2>/dev/null || true
    
    # Wait for postgres to be healthy
    echo "    Waiting for ${DB_SERVICE} to be ready ..."
    sleep 3
    
    # Restart app tier
    echo "    Restarting app tier ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start pgbouncer 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start app 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start nginx 2>/dev/null || true
    
    if [ $BACKUP_STATUS -ne 0 ]; then
        echo ""
        echo "⚠️  Backup failed but services have been restarted."
    fi
    
    pause
}

restore() {
    header
    echo "▶  Database Restore — Select a backup"
    echo ""
    
    get_db_config
    if ! verify_db_volume; then
        pause
        return
    fi
    mkdir -p "${BACKUP_DIR}"
    
    # Newest first, up to 5 (nullglob: no bogus literal *.tar.gz)
    mapfile -t BACKUPS < <(shopt -s nullglob; ls -1t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | head -5)
    
    if [ ${#BACKUPS[@]} -eq 0 ]; then
        echo "❌  No backup files found in: ${BACKUP_DIR}"
        echo "    Run backup first (option B) or place .tar.gz files in backup/"
        pause
        return
    fi
    
    echo "  Available backups (most recent first):"
    echo ""
    for i in "${!BACKUPS[@]}"; do
        NUM=$((i + 1))
        FILE="${BACKUPS[$i]}"
        BASENAME=$(basename "$FILE")
        SIZE=$(du -h "$FILE" 2>/dev/null | cut -f1)
        DATE=$(stat -c "%y" "$FILE" 2>/dev/null | cut -d'.' -f1 || stat -f "%Sm" "$FILE" 2>/dev/null)
        printf "  %d) %-45s (%s)\n" "$NUM" "$BASENAME" "$SIZE"
        echo "      Created: $DATE"
        echo ""
    done
    
    echo "  0) Cancel"
    echo ""
    read -rp "  Select backup to restore [0-${#BACKUPS[@]}]: " choice
    
    # Validate selection
    if [ "$choice" = "0" ] || [ -z "$choice" ]; then
        echo "❌  Restore cancelled."
        pause
        return
    fi
    
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#BACKUPS[@]}" ]; then
        echo "❌  Invalid selection."
        pause
        return
    fi
    
    SELECTED="${BACKUPS[$((choice - 1))]}"
    SELECTED_BASENAME=$(basename "$SELECTED")
    
    echo ""
    echo "⚠️  WARNING: This will COMPLETELY OVERWRITE the current database!"
    echo "    Environment: ${TARGET_ENV}"
    echo "    Target Volume: ${DB_VOLUME}"
    echo "    Target Service: ${DB_SERVICE}"
    echo "    Backup: ${SELECTED_BASENAME}"
    echo ""
    echo "    All current data will be DESTROYED and replaced with backup contents."
    echo ""
    read -rp "  Type 'RESTORE' to confirm: " confirm
    
    if [ "$confirm" != "RESTORE" ]; then
        echo "❌  Restore cancelled (confirmation mismatch)."
        pause
        return
    fi
    
    RESTORE_PATH="${BACKUP_DIR}/${SELECTED_BASENAME}"
    if [ ! -r "${RESTORE_PATH}" ]; then
        echo "❌  Cannot read backup file: ${RESTORE_PATH}"
        pause
        return
    fi
    if ! tar -tzf "${RESTORE_PATH}" 2>/dev/null | grep -qE '(^|/)PG_VERSION$'; then
        echo "❌  Backup archive is unreadable or does not contain PostgreSQL data (PG_VERSION)."
        pause
        return
    fi
    
    echo ""
    echo "▶  Restoring from ${SELECTED_BASENAME} ..."
    
    # Stop all dependent services first
    echo "    Stopping app tier ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop app 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop pgbouncer 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop nginx 2>/dev/null || true
    
    # Stop postgres
    echo "    Stopping ${DB_SERVICE} ..."
    if ! COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop "${DB_SERVICE}" 2>/dev/null; then
        echo "❌  Failed to stop ${DB_SERVICE}"
        echo "    Restore aborted. Restarting app tier ..."
        COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start pgbouncer 2>/dev/null || true
        COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start app 2>/dev/null || true
        COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start nginx 2>/dev/null || true
        pause
        return
    fi
    
    # Remove existing volume data and restore from backup
    echo "    Wiping current data and restoring from backup ..."
    
    # postgres:16-alpine runs as uid/gid 70; tar extracts as root — must chown or Postgres will not start.
    if docker run --rm \
        -v "${DB_VOLUME}:/pgdata" \
        -v "${BACKUP_DIR}:/backup:ro" \
        alpine:latest \
        sh -c 'set -e
          rm -rf /pgdata/* /pgdata/.[!.]* /pgdata/..?* 2>/dev/null || true
          tar -xzf "/backup/$1" -C /pgdata
          chown -R 70:70 /pgdata
        ' sh "${SELECTED_BASENAME}"; then
        
        echo "    ✅ Data restored to volume (ownership set to postgres:70)"
        RESTORE_STATUS=0
    else
        echo "    ❌ Restore failed (docker run / tar / chown). See errors above."
        RESTORE_STATUS=1
    fi
    
    # Start postgres
    echo ""
    echo "    Starting ${DB_SERVICE} ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start "${DB_SERVICE}" 2>/dev/null || true
    
    # Wait for postgres
    echo "    Waiting for ${DB_SERVICE} to be ready ..."
    sleep 5
    
    # Start app tier
    echo "    Starting app tier ..."
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start pgbouncer 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start app 2>/dev/null || true
    COMPOSE_PROJECT_NAME=$STORE_NAME $DC -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start nginx 2>/dev/null || true
    
    if [ $RESTORE_STATUS -eq 0 ]; then
        echo ""
        echo "✅  Database restored successfully!"
        echo ""
        echo "    Next steps:"
        echo "    - Verify data in Prisma Studio (option 10)"
        echo "    - Run migrations if schema changed (option 8)"
    else
        echo ""
        echo "❌  Restore failed! Your database may be in an inconsistent state."
        echo "    You may need to restore again or recreate the volume."
    fi
    
    pause
}

# ── 6. Main Menu ──────────────────────────────────────────────
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
    echo "  8.  Apply SQL schema (schema_changes + schema_population)"
    echo "  9.  Prisma Seed"
    echo "  10. Prisma Studio"
    echo "  11. App Shell"
    echo "  ─────────────────────────────────────────────"
    echo "  B.  Backup Database (volume-level .tar.gz)"
    echo "  R.  Restore Database (choose from backups)"
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
        [bB]) backup  ;;
        [rR]) restore ;;
        [cC]) cleanup ;;
        0)  exit 0   ;;
        *)           ;;
    esac
done
