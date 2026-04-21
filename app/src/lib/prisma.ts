import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use DATABASE_URL_DIRECT to bypass PgBouncer for server-side queries.
// PgBouncer in transaction mode conflicts with SCRAM-SHA-256 auth in PostgreSQL 16.
// PgBouncer is still useful for connection pooling in production; in dev we
// route around it to avoid the auth mismatch.
// Empty-string env vars must not win over fallbacks (?? only skips null/undefined).
function firstNonEmpty(...vals: (string | undefined)[]): string | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

const url =
  firstNonEmpty(process.env.DATABASE_URL_DIRECT, process.env.DATABASE_URL) ??
  'postgresql://dummy:dummy@localhost:5432/dummy';

// Prisma still validates schema `env("DATABASE_URL")` / `env("DATABASE_URL_DIRECT")` in some paths.
if (!String(process.env.DATABASE_URL ?? '').trim()) process.env.DATABASE_URL = url;
if (!String(process.env.DATABASE_URL_DIRECT ?? '').trim()) process.env.DATABASE_URL_DIRECT = url;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
