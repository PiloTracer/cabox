import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';
import { isValidDepartmentSlug, RESERVED_STORE_SEGMENTS } from '@/lib/departments';
import { sanitizeThemeJson } from '@/lib/theme';

const patchSchema = z.object({
  slug: z.string().min(2).max(64).optional(),
  nameEn: z.string().min(1).optional(),
  nameEs: z.string().min(1).optional(),
  taglineEn: z.string().optional(),
  taglineEs: z.string().optional(),
  isActive: z.boolean().optional(),
  position: z.number().int().optional(),
  heroImageUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  theme: z.unknown().optional(),
  navOverrideJson: z.unknown().nullable().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const d = await prisma.department.findUnique({ where: { id } });
  if (!d) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(d);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  if (data.slug !== undefined) {
    const slug = data.slug.trim().toLowerCase();
    if (!isValidDepartmentSlug(slug)) {
      return NextResponse.json(
        { message: `Slug inválido o reservado.` },
        { status: 400 },
      );
    }
    if (slug !== existing.slug) {
      const conflict = await prisma.department.findUnique({ where: { slug } });
      if (conflict) return NextResponse.json({ message: 'Slug ya existe' }, { status: 409 });
    }
  }

  if (existing.slug === 'general' && data.isActive === false) {
    return NextResponse.json(
      { message: 'El departamento General no puede desactivarse.' },
      { status: 400 },
    );
  }

  const theme =
    data.theme !== undefined ? sanitizeThemeJson(data.theme) : undefined;

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(data.slug !== undefined && { slug: data.slug.trim().toLowerCase() }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
      ...(data.nameEs !== undefined && { nameEs: data.nameEs }),
      ...(data.taglineEn !== undefined && { taglineEn: data.taglineEn }),
      ...(data.taglineEs !== undefined && { taglineEs: data.taglineEs }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.heroImageUrl !== undefined && { heroImageUrl: data.heroImageUrl }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(theme !== undefined && { theme: theme as Prisma.InputJsonValue }),
      ...(data.navOverrideJson !== undefined && {
        navOverrideJson:
          data.navOverrideJson === null
            ? Prisma.DbNull
            : (data.navOverrideJson as Prisma.InputJsonValue),
      }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  if (existing.slug === 'general' || existing.isDefault) {
    return NextResponse.json(
      { message: 'No se puede eliminar el departamento General.' },
      { status: 400 },
    );
  }

  const [pCount, cCount] = await Promise.all([
    prisma.product.count({ where: { primaryDepartmentId: id } }),
    prisma.category.count({ where: { primaryDepartmentId: id } }),
  ]);
  if (pCount > 0 || cCount > 0) {
    return NextResponse.json(
      {
        message:
          'Reasigná productos y categorías que usan este departamento como principal antes de eliminarlo.',
        primaryProducts: pCount,
        primaryCategories: cCount,
      },
      { status: 409 },
    );
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
