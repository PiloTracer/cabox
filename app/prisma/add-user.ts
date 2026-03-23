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
  const email = 'alejandro@aiepicstudio.com';
  const plainPassword = 'admin123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'Alejandro Castro'
    },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
      name: 'Alejandro Castro'
    }
  });
  console.log('Successfully updated/created admin:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
