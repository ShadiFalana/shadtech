import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
  { key: 'platform.name', value: { en: 'SHADTECH', ar: 'شدتك' } },
  { key: 'schema.version', value: 1 },
  { key: 'platform.region', value: 'PS' },
];

async function main(): Promise<void> {
  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: { value: setting.value },
    });
  }

  console.log(`Seeded ${settings.length} system settings.`);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
