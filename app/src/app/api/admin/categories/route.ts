import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guard';

const categorySchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().default(''),
  descriptionEs: z.string().default(''),
  descriptionEn: z.string().default(''),
  slug: z.string().min(1),
  parentId: z.string().nullable().default(null)
});

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { children: { select: { id: true, nameEs: true, nameEn: true } }, _count: { select: { products: true } } },
    where: { parentId: null },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ message: 'Slug already exists' }, { status: 409 });

  const category = await prisma.category.create({
    data: {
      slug: parsed.data.slug,
      nameEn: parsed.data.nameEn,
      nameEs: parsed.data.nameEs,
      image: parsed.data.image || null,
      parentId: parsed.data.parentId ?? null,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
