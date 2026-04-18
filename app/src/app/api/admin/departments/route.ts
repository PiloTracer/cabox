import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';
import { isValidDepartmentSlug, RESERVED_STORE_SEGMENTS } from '@/lib/departments';
import { sanitizeThemeJson } from '@/lib/theme';

const createSchema = z.object({
  slug: z.string().min(2).max(64),
  nameEn: z.string().min(1),
  nameEs: z.string().min(1),
  taglineEn: z.string().optional().default(''),
  taglineEs: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
  position: z.number().int().optional().default(0),
  heroImageUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  theme: z.unknown().optional(),
});

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const departments = await prisma.department.findMany({
    orderBy: [{ position: 'asc' }, { nameEs: 'asc' }],
  });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug.trim().toLowerCase();
  if (!isValidDepartmentSlug(slug)) {
    return NextResponse.json(
      {
        message: `Slug inválido o reservado (${[...RESERVED_STORE_SEGMENTS].slice(0, 6).join(', ')}, …).`,
      },
      { status: 400 },
    );
  }

  const exists = await prisma.department.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ message: 'Slug ya existe' }, { status: 409 });

  const theme = sanitizeThemeJson(parsed.data.theme);

  const dept = await prisma.department.create({
    data: {
      slug,
      nameEn: parsed.data.nameEn,
      nameEs: parsed.data.nameEs,
      taglineEn: parsed.data.taglineEn ?? '',
      taglineEs: parsed.data.taglineEs ?? '',
      isActive: parsed.data.isActive ?? true,
      position: parsed.data.position ?? 0,
      heroImageUrl: parsed.data.heroImageUrl ?? null,
      logoUrl: parsed.data.logoUrl ?? null,
      theme,
      isDefault: false,
    },
  });

  return NextResponse.json(dept, { status: 201 });
}
