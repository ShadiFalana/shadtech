import { PrismaClient, type Prisma, type User } from '@prisma/client';
import { hashPassword } from '../src/auth/password.util';
import {
  DEFAULT_ROLE_KEY,
  PERMISSIONS,
  ROLES,
  WILDCARD_PERMISSION,
} from '../src/tenancy/permissions';
import { DEFAULT_TENANT_SETTINGS } from '../src/tenancy/tenant-defaults';

const prisma = new PrismaClient();

const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
  { key: 'platform.name', value: { en: 'SHADTECH', ar: 'شدتك' } },
  { key: 'schema.version', value: 1 },
  { key: 'platform.region', value: 'PS' },
];

const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@shadtech.local').trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
const tenantSlug = (process.env.SEED_TENANT_SLUG ?? 'shadtech').trim().toLowerCase();
const tenantName = process.env.SEED_TENANT_NAME ?? 'مؤسسة شدتك';

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

async function seedPermissions(): Promise<void> {
  const catalogue = [
    {
      key: WILDCARD_PERMISSION,
      group: 'system',
      description: 'كل الصلاحيات (مالك المؤسسة)',
    },
    ...PERMISSIONS,
  ];

  for (const permission of catalogue) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      create: permission,
      update: { group: permission.group, description: permission.description },
    });
  }

  console.log(`Seeded ${catalogue.length} permissions.`);
}

async function seedRoles(): Promise<void> {
  for (const role of ROLES) {
    const saved = await prisma.role.upsert({
      where: { key: role.key },
      create: { key: role.key, name: role.name, description: role.description },
      update: { name: role.name, description: role.description },
    });

    // Keep the matrix authoritative: re-running the seed syncs it exactly.
    await prisma.rolePermission.deleteMany({ where: { roleId: saved.id } });
    await prisma.rolePermission.createMany({
      data: role.permissions.map((permissionKey) => ({
        roleId: saved.id,
        permissionKey,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`Seeded ${ROLES.length} roles.`);
}

async function seedAdmin(): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Administrator already exists: ${adminEmail} (password unchanged).`);
    return existing;
  }

  const created = await prisma.user.create({
    data: {
      email: adminEmail,
      fullName: 'مدير النظام',
      passwordHash: await hashPassword(adminPassword),
    },
  });

  console.log(`Created administrator: ${adminEmail}`);
  console.log(`Development password: ${adminPassword} — change it before any real deployment.`);
  return created;
}

async function seedTenant(admin: User): Promise<void> {
  const ownerRole = await prisma.role.findUnique({ where: { key: DEFAULT_ROLE_KEY } });
  if (!ownerRole) {
    throw new Error('Owner role is missing; seed roles before tenants');
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    create: { slug: tenantSlug, name: tenantName },
    update: {},
  });

  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: admin.id, tenantId: tenant.id } },
  });

  if (membership) {
    console.log(`Membership already exists: ${adminEmail} in ${tenant.slug}.`);
  } else {
    await prisma.membership.create({
      data: { userId: admin.id, tenantId: tenant.id, roleId: ownerRole.id },
    });
    console.log(`Added ${adminEmail} as owner of ${tenant.slug}.`);
  }

  for (const setting of DEFAULT_TENANT_SETTINGS) {
    await prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: setting.key } },
      create: { tenantId: tenant.id, key: setting.key, value: setting.value },
      update: {},
    });
  }
}

async function main(): Promise<void> {
  await seedSettings();
  await seedPermissions();
  await seedRoles();
  const admin = await seedAdmin();
  await seedTenant(admin);
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
