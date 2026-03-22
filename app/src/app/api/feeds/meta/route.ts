import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/feeds/meta — Meta (Facebook/Instagram) Product Catalog XML Feed
export async function GET() {
  const products = await prisma.product.findMany({
    where:   { status: 'ACTIVE' },
    include: { images: { orderBy: { position: 'asc' }, take: 5 }, category: true },
    orderBy: { createdAt: 'desc' },
    take:    500,
  });

  const storeUrl = process.env.NEXTAUTH_URL ?? 'https://cabox.store';

  const items = products.map((p) => {
    const price = `${Number(p.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${p.currency}`;
    const images = p.images.map((img) => `<additional_image_link>${escapeXml(img.url)}</additional_image_link>`).join('\n');
    return `  <item>
    <id>${escapeXml(p.id)}</id>
    <title>${escapeXml(p.nameEs)}</title>
    <description>${escapeXml(p.descriptionEs.slice(0, 5000))}</description>
    <link>${storeUrl}/es/products/${escapeXml(p.slug)}</link>
    <image_link>${p.images[0] ? escapeXml(p.images[0].url) : ''}</image_link>
    ${images}
    <price>${escapeXml(price)}</price>
    <availability>${'in stock'}</availability>
    <condition>new</condition>
    <brand>Cabox</brand>
    <google_product_category>Apparel &amp; Accessories</google_product_category>
    <custom_label_0>${escapeXml(p.category?.nameEs ?? '')}</custom_label_0>
    <checkout_url>${storeUrl}/es/products/${escapeXml(p.slug)}</checkout_url>
  </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Cabox — Curated Fashion</title>
    <link>${storeUrl}</link>
    <description>Tienda de moda curada de Costa Rica</description>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=43200', // 12 hours
    },
  });
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}
