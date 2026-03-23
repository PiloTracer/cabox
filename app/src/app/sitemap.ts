import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.cabox.app';

  // Get all active products
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
  });

  // Get all categories
  const categories = await prisma.category.findMany({
    select: { slug: true, createdAt: true },
  });

  // Base routes for both locales
  const routes = ['', '/products', '/about'].flatMap((route) => [
    {
      url: `${baseUrl}/es${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    },
    {
      url: `${baseUrl}/en${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    },
  ]);

  // Product routes
  const productRoutes = products.flatMap((product) => [
    {
      url: `${baseUrl}/es/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ]);

  // Category routes
  const categoryRoutes = categories.flatMap((cat) => [
    {
      url: `${baseUrl}/es/products?cat=${cat.slug}`,
      lastModified: cat.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/en/products?cat=${cat.slug}`,
      lastModified: cat.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  return [...routes, ...productRoutes, ...categoryRoutes];
}
