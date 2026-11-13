/**
 * Permission catalogue and role templates.
 *
 * These are pure data so the seed script can import them without booting Nest.
 * `*` is reserved for the tenant owner and grants every permission.
 */

export const WILDCARD_PERMISSION = '*';

export interface PermissionDefinition {
  key: string;
  group: string;
  description: string;
}

export const PERMISSIONS: PermissionDefinition[] = [
  // Tenant
  { key: 'tenant.read', group: 'tenant', description: 'عرض بيانات المؤسسة' },
  { key: 'tenant.manage', group: 'tenant', description: 'تعديل بيانات المؤسسة' },
  { key: 'tenant.settings.read', group: 'tenant', description: 'قراءة إعدادات المؤسسة' },
  { key: 'tenant.settings.write', group: 'tenant', description: 'تعديل إعدادات المؤسسة' },

  // Members and roles
  { key: 'members.read', group: 'members', description: 'عرض أعضاء المؤسسة' },
  { key: 'members.manage', group: 'members', description: 'إدارة الأعضاء والأدوار' },

  // Business modules (endpoints arrive in later steps)
  { key: 'customers.read', group: 'customers', description: 'عرض العملاء' },
  { key: 'customers.write', group: 'customers', description: 'إدارة العملاء' },
  { key: 'tickets.read', group: 'tickets', description: 'عرض التذاكر' },
  { key: 'tickets.write', group: 'tickets', description: 'إدارة التذاكر' },
  { key: 'billing.read', group: 'billing', description: 'عرض الفواتير' },
  { key: 'billing.write', group: 'billing', description: 'إدارة الفواتير' },
  { key: 'inventory.read', group: 'inventory', description: 'عرض المخزون' },
  { key: 'inventory.write', group: 'inventory', description: 'إدارة المخزون' },
  { key: 'reports.read', group: 'reports', description: 'عرض التقارير' },
  { key: 'audit.read', group: 'audit', description: 'عرض سجل التدقيق' },
];

export interface RoleDefinition {
  key: string;
  name: string;
  description: string;
  permissions: string[];
}

const managerPermissions = [
  'tenant.read',
  'tenant.settings.read',
  'tenant.settings.write',
  'members.read',
  'customers.read',
  'customers.write',
  'tickets.read',
  'tickets.write',
  'billing.read',
  'billing.write',
  'inventory.read',
  'inventory.write',
  'reports.read',
];

const agentPermissions = [
  'tenant.read',
  'customers.read',
  'customers.write',
  'tickets.read',
  'tickets.write',
  'inventory.read',
  'reports.read',
];

const viewerPermissions = [
  'tenant.read',
  'customers.read',
  'tickets.read',
  'billing.read',
  'inventory.read',
  'reports.read',
];

export const ROLES: RoleDefinition[] = [
  {
    key: 'owner',
    name: 'مالك المؤسسة',
    description: 'صلاحيات كاملة على المؤسسة وإعداداتها وأعضائها.',
    permissions: [WILDCARD_PERMISSION],
  },
  {
    key: 'admin',
    name: 'مدير',
    description: 'إدارة كاملة للمؤسسة عدا ملكية الحساب.',
    permissions: PERMISSIONS.map((permission) => permission.key),
  },
  {
    key: 'manager',
    name: 'مشرف',
    description: 'إدارة العمل اليومي والإعدادات دون إدارة الأعضاء.',
    permissions: managerPermissions,
  },
  {
    key: 'agent',
    name: 'وكيل دعم',
    description: 'العمل على العملاء والتذاكر والمخزون.',
    permissions: agentPermissions,
  },
  {
    key: 'viewer',
    name: 'مشاهد',
    description: 'اطلاع للقراءة فقط.',
    permissions: viewerPermissions,
  },
];

export const DEFAULT_ROLE_KEY = 'owner';
