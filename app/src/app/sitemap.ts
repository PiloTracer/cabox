import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.cabox.app';

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: {
      slug: true,
      updatedAt: true,
      primaryDepartment: { select: { slug: true } },
    },
  });

  const categories = await prisma.category.findMany({
    select: { slug: true, createdAt: true },
  });

  const locales = ['es', 'en'] as const;

  const routes = ['', '/products', '/about'].flatMap((route) =>
    locales.map((loc) => ({
      url: `${baseUrl}/${loc}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    })),
  );

  const deptRoutes = departments.flatMap((d) =>
    locales.map((loc) => ({
      url: `${baseUrl}/${loc}/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  );

  const deptProductIndexRoutes = departments.flatMap((d) =>
    locales.map((loc) => ({
      url: `${baseUrl}/${loc}/${d.slug}/products`,
      lastModified: d.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.82,
    })),
  );

  const productRoutes = products.flatMap((product) =>
    locales.map((loc) => ({
      url: `${baseUrl}/${loc}/${product.primaryDepartment.slug}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  );

  const categoryRoutes = categories.flatMap((cat) =>
    locales.map((loc) => ({
      url: `${baseUrl}/${loc}/products?cat=${cat.slug}`,
      lastModified: cat.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  );

  return [...routes, ...deptRoutes, ...deptProductIndexRoutes, ...productRoutes, ...categoryRoutes];
}
