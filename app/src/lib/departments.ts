import { prisma } from '@/lib/prisma';
import type { Department } from '@prisma/client';

/** URL segments that cannot be used as department slugs */
export const RESERVED_STORE_SEGMENTS = new Set([
  'products',
  'search',
  'checkout',
  'orders',
  'pages',
  'api',
  'admin',
  '_next',
  'en',
  'es',
  /** Avoid catching external tools (e.g. Evolution API) under /[locale]/[department] */
  'evolution',
]);

export function isValidDepartmentSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > 64) return false;
  if (RESERVED_STORE_SEGMENTS.has(slug.toLowerCase())) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function getActiveDepartments(): Promise<Department[]> {
  return prisma.department.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { nameEs: 'asc' }],
  });
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  if (!isValidDepartmentSlug(slug)) return null;
  return prisma.department.findFirst({
    where: { slug, isActive: true },
  });
}

export async function getDefaultDepartment(): Promise<Department | null> {
  return prisma.department.findFirst({
    where: { isDefault: true, isActive: true },
  });
}

/** Products linked only to General — same rule as {@link countUnclassifiedProducts}. */
async function generalDepartmentId(): Promise<string | null> {
  const general = await prisma.department.findUnique({ where: { slug: 'general' } });
  return general?.id ?? null;
}

/** Products linked only to General (single department link = general) — "Unclassified" admin filter */
export async function countUnclassifiedProducts(): Promise<number> {
  const gid = await generalDepartmentId();
  if (!gid) return 0;

  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM (
      SELECT p.id
      FROM "Product" p
      JOIN "DepartmentProduct" dp ON dp."productId" = p.id
      GROUP BY p.id
      HAVING COUNT(*) = 1 AND MAX(dp."departmentId") = ${gid}
    ) t
  `;
  return Number(rows[0]?.n ?? 0);
}

export async function findUnclassifiedProductIds(): Promise<string[]> {
  const gid = await generalDepartmentId();
  if (!gid) return [];

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id FROM "Product" p
    JOIN "DepartmentProduct" dp ON dp."productId" = p.id
    GROUP BY p.id
    HAVING COUNT(*) = 1 AND MAX(dp."departmentId") = ${gid}
  `;
  return rows.map((r) => r.id);
}
