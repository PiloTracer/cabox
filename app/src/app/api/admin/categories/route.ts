import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const categorySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  nameEn: z.string().min(1),
  nameEs: z.string().min(1),
  image: z.string().url().optional().or(z.literal('')),
  parentId: z.string().optional().nullable(),
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
