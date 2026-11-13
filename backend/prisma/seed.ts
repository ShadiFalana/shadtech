import { PrismaClient, type Prisma } from '@prisma/client';
import { hashPassword } from '../src/auth/password.util';

const prisma = new PrismaClient();

const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
  { key: 'platform.name', value: { en: 'SHADTECH', ar: 'شدتك' } },
  { key: 'schema.version', value: 1 },
  { key: 'platform.region', value: 'PS' },
];

const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@shadtech.local').trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

async function seedSettings(): Promise<void> {
  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: { value: setting.value },
    });
  }

  console.log(`Seeded ${settings.length} system settings.`);
}

async function seedAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Administrator already exists: ${adminEmail} (password unchanged).`);
    return;
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      fullName: 'مدير النظام',
      passwordHash: await hashPassword(adminPassword),
    },
  });

  console.log(`Created administrator: ${adminEmail}`);
  console.log(`Development password: ${adminPassword} — change it before any real deployment.`);
}

async function main(): Promise<void> {
  await seedSettings();
  await seedAdmin();
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
