import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/admin/ProductForm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Editar producto — Admin Cabox' };

interface Props { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { nameEs: 'asc' } }),
  ]);

  if (!product) notFound();

  const initial = {
    nameEs: product.nameEs,
    nameEn: product.nameEn,
    descriptionEs: product.descriptionEs ?? '',
    descriptionEn: product.descriptionEn ?? '',
    sku: product.sku,
    slug: product.slug,
    price: String(product.price),
    comparePrice: product.comparePrice ? String(product.comparePrice) : '',
    currency: product.currency,
    categoryId: product.categoryId ?? '',
    status: product.status,
    featured: product.featured,
    images: (product.images as string[]).join('\n'),
  };

  return <ProductForm initial={initial} productId={id} categories={categories} />;
}
