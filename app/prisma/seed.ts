import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database...');

  // ── Admin User ───────────────────────────────────────────
  const passwordHash = await bcrypt.hash('cabox2026', 12);
  await prisma.user.upsert({
    where: { email: 'admin@cabox.store' },
    update: {},
    create: {
      email: 'admin@cabox.store',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log('  ✅  Admin user created (admin@cabox.store / cabox2026)');

  // ── Categories ───────────────────────────────────────────
  const womenCategory = await prisma.category.upsert({
    where: { slug: 'mujeres' },
    update: {},
    create: {
      slug: 'mujeres',
      nameEn: 'Women',
      nameEs: 'Mujeres',
    },
  });

  const menCategory = await prisma.category.upsert({
    where: { slug: 'hombres' },
    update: {},
    create: {
      slug: 'hombres',
      nameEn: 'Men',
      nameEs: 'Hombres',
    },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: {
      slug: 'accesorios',
      nameEn: 'Accessories',
      nameEs: 'Accesorios',
    },
  });
  console.log('  ✅  Categories: Mujeres, Hombres, Accesorios');

  // ── Demo Products ────────────────────────────────────────
  const products = [
    {
      sku: 'CBX-W-001',
      slug: 'blusa-lino-premium',
      nameEn: 'Premium Linen Blouse',
      nameEs: 'Blusa de Lino Premium',
      descriptionEn: 'Elegant linen blouse, perfect for any occasion. Breathable fabric ideal for Costa Rica\'s climate.',
      descriptionEs: 'Elegante blusa de lino, perfecta para cualquier ocasión. Tela transpirable ideal para el clima de Costa Rica.',
      price: 45000,
      costPrice: 18000,
      currency: 'CRC' as const,
      weight: 200,
      featured: true,
      categoryId: womenCategory.id,
      tags: ['lino', 'mujeres', 'casual', 'verano'],
    },
    {
      sku: 'CBX-W-002',
      slug: 'vestido-floral-boho',
      nameEn: 'Bohemian Floral Dress',
      nameEs: 'Vestido Floral Bohemio',
      descriptionEn: 'Flowy bohemian floral dress with adjustable straps. Great for beach or city outings.',
      descriptionEs: 'Vestido floral bohemio con tirantes ajustables. Ideal para playa o salidas en la ciudad.',
      price: 58000,
      costPrice: 22000,
      currency: 'CRC' as const,
      weight: 300,
      featured: true,
      categoryId: womenCategory.id,
      tags: ['vestido', 'floral', 'boho', 'verano'],
    },
    {
      sku: 'CBX-M-001',
      slug: 'camisa-manga-larga-slim',
      nameEn: 'Slim Fit Long Sleeve Shirt',
      nameEs: 'Camisa Manga Larga Slim Fit',
      descriptionEn: 'Slim fit long sleeve shirt in premium cotton. Available in multiple colors.',
      descriptionEs: 'Camisa manga larga slim fit en algodón premium. Disponible en varios colores.',
      price: 38000,
      costPrice: 14000,
      currency: 'CRC' as const,
      weight: 250,
      featured: false,
      categoryId: menCategory.id,
      tags: ['camisa', 'hombres', 'formal', 'slim'],
    },
    {
      sku: 'CBX-A-001',
      slug: 'bolso-cuero-tote',
      nameEn: 'Leather Tote Bag',
      nameEs: 'Bolso Tote de Cuero',
      descriptionEn: 'Spacious leather tote bag with interior pockets. Perfect for work or shopping.',
      descriptionEs: 'Bolso tote de cuero espacioso con bolsillos interiores. Perfecto para el trabajo o compras.',
      price: 85000,
      costPrice: 35000,
      currency: 'CRC' as const,
      weight: 600,
      featured: true,
      categoryId: accessoriesCategory.id,
      tags: ['bolso', 'cuero', 'accesorios', 'mujer'],
    },
    {
      sku: 'CBX-A-002',
      slug: 'cinturon-cuero-clasico',
      nameEn: 'Classic Leather Belt',
      nameEs: 'Cinturón de Cuero Clásico',
      descriptionEn: 'Classic genuine leather belt with brushed metal buckle. Unisex design.',
      descriptionEs: 'Cinturón clásico de cuero genuino con hebilla de metal cepillado. Diseño unisex.',
      price: 28000,
      costPrice: 9000,
      currency: 'CRC' as const,
      weight: 200,
      featured: false,
      categoryId: accessoriesCategory.id,
      tags: ['cinturon', 'cuero', 'accesorios', 'unisex'],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        status: 'ACTIVE',
        inventory: {
          create: { quantity: 20, type: 'RESTOCK', note: 'Initial stock' },
        },
      },
    });
  }
  console.log(`  ✅  ${products.length} demo products created`);

  // ── Shipping Zones (Costa Rica provinces) ────────────────
  const zones = [
    { nameEn: 'San José Metro', nameEs: 'Gran Área Metropolitana', provinces: ['San José', 'Alajuela', 'Cartago', 'Heredia'], baseRate: 3500, perKgRate: 500, freeAbove: 75000 },
    { nameEn: 'Pacific Coast', nameEs: 'Pacífico', provinces: ['Puntarenas', 'Guanacaste'], baseRate: 5500, perKgRate: 800, freeAbove: 100000 },
    { nameEn: 'Caribbean & North', nameEs: 'Caribe y Norte', provinces: ['Limón', 'Alajuela Norte'], baseRate: 6500, perKgRate: 1000, freeAbove: 100000 },
  ];

  for (const z of zones) {
    const existing = await prisma.shippingZone.findFirst({ where: { nameEn: z.nameEn } });
    if (!existing) {
      await prisma.shippingZone.create({ data: z });
    }
  }
  console.log('  ✅  Shipping zones created (GAM, Pacífico, Caribe)');

  console.log('\n✨  Seed complete!');
  console.log('    Login: admin@cabox.store / cabox2026');
  console.log('    ⚠️  Change the admin password after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
