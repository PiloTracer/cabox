# Cabox — Quick Start Guide

## Prerequisites
- Docker Desktop (or Docker Engine + Compose plugin) installed and running
- Fill in your `.env.dev` — replace all `PLACEHOLDER_` values

---

## 1. First-Time Setup

```bash
# Fill in secrets (open in your editor and replace PLACEHOLDER_ values)
nano .env.dev

# Launch the stack
./bin/start.sh dev
# Select → 1 (Up)

# Once containers are running, run migrations + seed (first time only)
# Select → 8 (Prisma Migrate)
# Select → 9 (Prisma Seed)
```

---

## 2. Web App URLs

| What | URL | Notes |
|------|-----|-------|
| **Storefront (ES)** | `http://localhost/es` | Public — Spanish default |
| **Storefront (EN)** | `http://localhost/en` | Public — English |
| **Admin Dashboard** | `http://localhost/admin` | Requires login |
| **Admin Login** | `http://localhost/admin/login` | |
| **Direct App** | `http://localhost:3000` | Bypasses Nginx |
| **Prisma Studio** | `http://localhost:5555` | Select → 10 in manager |

> 💡 **Default admin credentials** (seed): `admin@cabox.store` / `cabox2026`
> Change the password immediately after first login.

---

## 3. Daily Workflow

```bash
# Start/stop/manage everything:
./bin/start.sh           # auto-detects dev env
./bin/start.sh dev       # explicit dev
./bin/start.sh prd       # production

# Multiple stores on the same machine:
./spawn_store.sh cabox    3000 80   5432 6379
./spawn_store.sh boutique 3100 8080 5433 6380
```

**Manager menu options:**
| # | Action |
|---|--------|
| 1 | Start all containers |
| 2 | Stop all containers |
| 3 | Restart |
| 4 | Force rebuild (clears Docker cache) |
| 5 | Tail app logs |
| 8 | Run database migrations |
| 9 | Seed database |
| 10 | Open Prisma Studio |
| 11 | Shell into app container |

---

## 4. Common Commands (manual)

```bash
# Run any command inside the app container
docker compose -f docker-compose.dev.yml --env-file .env.dev exec app <cmd>

# Examples
docker compose -f docker-compose.dev.yml --env-file .env.dev exec app npx prisma studio
docker compose -f docker-compose.dev.yml --env-file .env.dev exec app npm run lint
docker compose -f docker-compose.dev.yml --env-file .env.dev exec app npm run test

# View specific service logs
docker compose -f docker-compose.dev.yml --env-file .env.dev logs -f db
docker compose -f docker-compose.dev.yml --env-file .env.dev logs -f nginx
```

---

## 5. File Structure Reference

```
cabox/
├── bin/start.sh          ← THIS script — your main control panel
├── spawn_store.sh        ← Launch a second isolated store
├── .env.dev              ← Secrets (never committed)
├── docker-compose.dev.yml
├── app/                  ← Next.js app (storefront + admin)
│   ├── src/app/
│   │   ├── [locale]/     ← Public storefront (ES/EN)
│   │   └── admin/        ← Admin dashboard
│   └── prisma/
└── nginx/                ← Reverse proxy
```

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| Port already in use | Change `APP_PORT` / `NGINX_PORT` in `.env.dev` |
| DB connection error | Wait 10s for PostgreSQL to be ready, then restart app: Select 3 |
| Migration error | Make sure `DATABASE_URL_DIRECT` points directly to `db:5432` (not PgBouncer) |
| `PLACEHOLDER_` in logs | Fill that variable in `.env.dev` and restart |
| Need to wipe and start fresh | Select `C` (Cleanup), then `docker volume rm cabox_pgdata_cabox` |
