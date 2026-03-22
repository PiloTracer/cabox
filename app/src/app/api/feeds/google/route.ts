import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/feeds/google — Google Merchant Center Shopping Feed
export async function GET() {
  const products = await prisma.product.findMany({
    where:   { status: 'ACTIVE' },
    include: { images: { orderBy: { position: 'asc' }, take: 5 }, category: true },
    orderBy: { featured: 'desc' },
    take:    500,
  });

  const storeUrl = process.env.NEXTAUTH_URL ?? 'https://cabox.store';
  const now      = new Date().toISOString();

  const entries = products.map((p) => {
    const price = `${Number(p.price).toFixed(2)} ${p.currency}`;
    const salePrice = p.compareAtPrice
      ? `${Number(p.compareAtPrice).toFixed(2)} ${p.currency}`
      : '';

    const additionalImages = p.images.slice(1).map((img) =>
      `<g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`
    ).join('\n        ');

    return `  <entry>
    <g:id>${escapeXml(p.id)}</g:id>
    <g:item_group_id>${escapeXml(p.id)}</g:item_group_id>
    <g:title>${escapeXml(p.nameEs)}</g:title>
    <g:description>${escapeXml(p.descriptionEs.slice(0, 5000))}</g:description>
    <g:link>${storeUrl}/es/products/${escapeXml(p.slug)}</g:link>
    <g:mobile_link>${storeUrl}/es/products/${escapeXml(p.slug)}</g:mobile_link>
    <g:image_link>${p.images[0] ? escapeXml(p.images[0].url) : ''}</g:image_link>
    ${additionalImages}
    <g:condition>new</g:condition>
    <g:availability>in stock</g:availability>
    <g:price>${escapeXml(price)}</g:price>
    ${salePrice ? `<g:sale_price>${escapeXml(salePrice)}</g:sale_price>` : ''}
    <g:brand>Cabox</g:brand>
    <g:google_product_category>Apparel &amp; Accessories</g:google_product_category>
    <g:product_type>${escapeXml(p.category?.nameEs ?? 'Moda')}</g:product_type>
    <g:shipping>
      <g:country>CR</g:country>
      <g:service>Estándar</g:service>
      <g:price>3500.00 CRC</g:price>
    </g:shipping>
  </entry>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>Cabox — Curated Fashion</title>
  <link rel="alternate" type="text/html" href="${storeUrl}"/>
  <updated>${now}</updated>
${entries}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=43200',
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
