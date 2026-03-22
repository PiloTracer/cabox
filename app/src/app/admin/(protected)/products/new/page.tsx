import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/admin/ProductForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Nuevo producto — Admin Cabox' };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { nameEs: 'asc' } });
  return <ProductForm categories={categories} />;
}
