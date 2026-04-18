import { prisma } from '@/lib/prisma';
import { notFound, permanentRedirect } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/** Legacy URL `/locale/products/:slug` → canonical `/locale/:department/products/:slug` */
export default async function LegacyProductRedirect({ params }: Props) {
  const { locale, slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      primaryDepartment: { select: { slug: true } },
    },
  });

  if (!product?.primaryDepartment) notFound();

  permanentRedirect(`/${locale}/${product.primaryDepartment.slug}/products/${slug}`);
}
