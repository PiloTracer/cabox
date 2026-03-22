import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use DATABASE_URL_DIRECT to bypass PgBouncer for server-side queries.
// PgBouncer in transaction mode conflicts with SCRAM-SHA-256 auth in PostgreSQL 16.
// PgBouncer is still useful for connection pooling in production; in dev we
// route around it to avoid the auth mismatch.
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
