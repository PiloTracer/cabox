import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱  Seeding database...');

  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword) {
    throw new Error(
      'ADMIN_SEED_PASSWORD env var is required for seeding. ' +
        'Add it to .env.dev (min 12 chars). It will be hashed — never stored plaintext.',
    );
  }
  const passwordHash = await bcrypt.hash(seedPassword, 12);
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@cabox.store';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log(`  ✅  Admin user created (${adminEmail})`);

  const deptSeeds = [
    { slug: 'general', nameEn: 'General', nameEs: 'General', isDefault: true, position: 0 },
    { slug: 'outlet', nameEn: 'Outlet', nameEs: 'Outlet', isDefault: false, position: 1 },
    { slug: 'bisuteria', nameEn: 'Fashion Jewelry', nameEs: 'Bisutería', isDefault: false, position: 2 },
    { slug: 'home', nameEn: 'Home', nameEs: 'Hogar', isDefault: false, position: 3 },
    { slug: 'tools', nameEn: 'Tools', nameEs: 'Herramientas', isDefault: false, position: 4 },
  ] as const;

  for (const d of deptSeeds) {
    await prisma.department.upsert({
      where: { slug: d.slug },
      update: {
        nameEn: d.nameEn,
        nameEs: d.nameEs,
        position: d.position,
        ...(d.isDefault ? { isDefault: true } : {}),
      },
      create: {
        slug: d.slug,
        nameEn: d.nameEn,
        nameEs: d.nameEs,
        isDefault: d.isDefault,
        position: d.position,
        theme: {},
      },
    });
  }
  const general = await prisma.department.findUniqueOrThrow({ where: { slug: 'general' } });
  console.log('  ✅  Departments: general, outlet, bisuteria, home, tools');

  const womenCategory = await prisma.category.upsert({
    where: { slug: 'mujeres' },
    update: { primaryDepartmentId: general.id },
    create: {
      slug: 'mujeres',
      nameEn: 'Women',
      nameEs: 'Mujeres',
      primaryDepartmentId: general.id,
    },
  });

  const menCategory = await prisma.category.upsert({
    where: { slug: 'hombres' },
    update: { primaryDepartmentId: general.id },
    create: {
      slug: 'hombres',
      nameEn: 'Men',
      nameEs: 'Hombres',
      primaryDepartmentId: general.id,
    },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: { primaryDepartmentId: general.id },
    create: {
      slug: 'accesorios',
      nameEn: 'Accessories',
      nameEs: 'Accesorios',
      primaryDepartmentId: general.id,
    },
  });

  for (const c of [womenCategory, menCategory, accessoriesCategory]) {
    await prisma.departmentCategory.upsert({
      where: {
        departmentId_categoryId: {
          departmentId: general.id,
          categoryId: c.id,
        },
      },
      create: { departmentId: general.id, categoryId: c.id, position: 0 },
      update: {},
    });
  }
  console.log('  ✅  Categories: Mujeres, Hombres, Accesorios');

  const products = [
    {
      sku: 'CBX-W-001',
      slug: 'blusa-lino-premium',
      nameEn: 'Premium Linen Blouse',
      nameEs: 'Blusa de Lino Premium',
      descriptionEn:
        "Elegant linen blouse, perfect for any occasion. Breathable fabric ideal for Costa Rica's climate.",
      descriptionEs:
        'Elegante blusa de lino, perfecta para cualquier ocasión. Tela transpirable ideal para el clima de Costa Rica.',
      price: 45000,
      costPrice: 18000,
      currency: 'CRC' as const,
      weight: 200,
      featured: true,
      primaryCategoryId: womenCategory.id,
      tags: ['lino', 'mujeres', 'casual', 'verano'],
    },
    {
      sku: 'CBX-W-002',
      slug: 'vestido-floral-boho',
      nameEn: 'Bohemian Floral Dress',
      nameEs: 'Vestido Floral Bohemio',
      descriptionEn:
        'Flowy bohemian floral dress with adjustable straps. Great for beach or city outings.',
      descriptionEs:
        'Vestido floral bohemio con tirantes ajustables. Ideal para playa o salidas en la ciudad.',
      price: 58000,
      costPrice: 22000,
      currency: 'CRC' as const,
      weight: 300,
      featured: true,
      primaryCategoryId: womenCategory.id,
      tags: ['vestido', 'floral', 'boho', 'verano'],
    },
    {
      sku: 'CBX-M-001',
      slug: 'camisa-manga-larga-slim',
      nameEn: 'Slim Fit Long Sleeve Shirt',
      nameEs: 'Camisa Manga Larga Slim Fit',
      descriptionEn:
        'Slim fit long sleeve shirt in premium cotton. Available in multiple colors.',
      descriptionEs:
        'Camisa manga larga slim fit en algodón premium. Disponible en varios colores.',
      price: 38000,
      costPrice: 14000,
      currency: 'CRC' as const,
      weight: 250,
      featured: false,
      primaryCategoryId: menCategory.id,
      tags: ['camisa', 'hombres', 'formal', 'slim'],
    },
    {
      sku: 'CBX-A-001',
      slug: 'bolso-cuero-tote',
      nameEn: 'Leather Tote Bag',
      nameEs: 'Bolso Tote de Cuero',
      descriptionEn:
        'Spacious leather tote bag with interior pockets. Perfect for work or shopping.',
      descriptionEs:
        'Bolso tote de cuero espacioso con bolsillos interiores. Perfecto para el trabajo o compras.',
      price: 85000,
      costPrice: 35000,
      currency: 'CRC' as const,
      weight: 600,
      featured: true,
      primaryCategoryId: accessoriesCategory.id,
      tags: ['bolso', 'cuero', 'accesorios', 'mujer'],
    },
    {
      sku: 'CBX-A-002',
      slug: 'cinturon-cuero-clasico',
      nameEn: 'Classic Leather Belt',
      nameEs: 'Cinturón de Cuero Clásico',
      descriptionEn:
        'Classic genuine leather belt with brushed metal buckle. Unisex design.',
      descriptionEs:
        'Cinturón clásico de cuero genuino con hebilla de metal cepillado. Diseño unisex.',
      price: 28000,
      costPrice: 9000,
      currency: 'CRC' as const,
      weight: 200,
      featured: false,
      primaryCategoryId: accessoriesCategory.id,
      tags: ['cinturon', 'cuero', 'accesorios', 'unisex'],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        slug: p.slug,
        nameEn: p.nameEn,
        nameEs: p.nameEs,
        descriptionEn: p.descriptionEn,
        descriptionEs: p.descriptionEs,
        price: p.price,
        costPrice: p.costPrice,
        currency: p.currency,
        weight: p.weight,
        featured: p.featured,
        tags: p.tags,
        status: 'ACTIVE',
        stock: 20,
        primaryCategoryId: p.primaryCategoryId,
        primaryDepartmentId: general.id,
        inventory: {
          create: { quantity: 20, type: 'RESTOCK', note: 'Initial stock' },
        },
        categories: {
          create: [{ categoryId: p.primaryCategoryId, position: 0 }],
        },
        departments: {
          create: [{ departmentId: general.id, position: 0 }],
        },
      },
    });
  }
  console.log(`  ✅  ${products.length} demo products created`);

  const zones = [
    {
      nameEn: 'San José Metro',
      nameEs: 'Gran Área Metropolitana',
      provinces: ['San José', 'Alajuela', 'Cartago', 'Heredia'],
      baseRate: 3500,
      perKgRate: 500,
      freeAbove: 75000,
    },
    {
      nameEn: 'Pacific Coast',
      nameEs: 'Pacífico',
      provinces: ['Puntarenas', 'Guanacaste'],
      baseRate: 5500,
      perKgRate: 800,
      freeAbove: 100000,
    },
    {
      nameEn: 'Caribbean & North',
      nameEs: 'Caribe y Norte',
      provinces: ['Limón', 'Alajuela Norte'],
      baseRate: 6500,
      perKgRate: 1000,
      freeAbove: 100000,
    },
  ];

  for (const z of zones) {
    const existing = await prisma.shippingZone.findFirst({ where: { nameEn: z.nameEn } });
    if (!existing) {
      await prisma.shippingZone.create({ data: z });
    }
  }
  console.log('  ✅  Shipping zones created (GAM, Pacífico, Caribe)');

  console.log('\n✨  Seed complete!');
  console.log(`    Login: ${process.env.ADMIN_EMAIL ?? 'admin@cabox.store'} / [ADMIN_SEED_PASSWORD from .env.dev]`);
  console.log('    ⚠️  Change the admin password immediately after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
