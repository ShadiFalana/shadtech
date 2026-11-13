import type { Prisma } from '@prisma/client';

/** Settings created for every new tenant. Values can be changed later per tenant. */
export const DEFAULT_TENANT_SETTINGS: Array<{ key: string; value: Prisma.InputJsonValue }> = [
  { key: 'locale', value: 'ar' },
  { key: 'timezone', value: 'Asia/Hebron' },
];
