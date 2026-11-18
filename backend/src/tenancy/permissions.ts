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
  { key: 'services.read', group: 'services', description: 'عرض خدمات IT' },
  { key: 'services.write', group: 'services', description: 'إدارة خدمات IT' },
  { key: 'orders.read', group: 'orders', description: 'عرض الطلبات' },
  { key: 'orders.write', group: 'orders', description: 'إدارة الطلبات' },
  { key: 'chatbot.read', group: 'chatbot', description: 'استخدام المساعد الذكي' },
  { key: 'reports.read', group: 'reports', description: 'عرض التقارير' },
  { key: 'audit.read', group: 'audit', description: 'عرض سجل التدقيق' },

  // Companies and branches (step 5)
  { key: 'companies.read', group: 'companies', description: 'عرض الشركات' },
  { key: 'companies.write', group: 'companies', description: 'إدارة الشركات' },
  { key: 'branches.read', group: 'branches', description: 'عرض الفروع' },
  { key: 'branches.write', group: 'branches', description: 'إدارة الفروع' },
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
  'companies.read',
  'companies.write',
  'branches.read',
  'branches.write',
  'customers.read',
  'customers.write',
  'tickets.read',
  'tickets.write',
  'billing.read',
  'billing.write',
  'inventory.read',
  'inventory.write',
  'services.read',
  'services.write',
  'orders.read',
  'orders.write',
  'chatbot.read',
  'reports.read',
];

const agentPermissions = [
  'tenant.read',
  'companies.read',
  'branches.read',
  'customers.read',
  'customers.write',
  'tickets.read',
  'tickets.write',
  'inventory.read',
  'services.read',
  'orders.read',
  'orders.write',
  'chatbot.read',
  'reports.read',
];

const viewerPermissions = [
  'tenant.read',
  'companies.read',
  'branches.read',
  'customers.read',
  'tickets.read',
  'billing.read',
  'inventory.read',
  'services.read',
  'orders.read',
  'chatbot.read',
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
