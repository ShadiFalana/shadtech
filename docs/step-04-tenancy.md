# الخطوة 4 — الصلاحيات وتعدد المؤسسات

## الهدف

إضافة **العزل (tenancy)** و**الصلاحيات (RBAC)**: كل مستخدم يمكن أن ينتمي إلى أكثر من مؤسسة،
ولكل انتماء دور (مالك/مدير/مشرف/وكيل/مشاهد) يحدد ما يمكنه فعله. tenant id لا يُقبل من جسم
الطلب — يُستخرج من `X-Tenant-Id` ويُتحقق من صحة انتماء المستخدم، ثم تُطابق الصلاحيات
باستخدام `PermissionsGuard`. `TenantSetting` هي أول مورد معزول (key/value لكل مؤسسة).

## المخطط (schema)

- `Tenant` (`tenants`): `id, slug (unique), name, isActive, createdAt, updatedAt`.
- `Permission` (`permissions`): `key (PK), group, description, isSystem`.
- `Role` (`roles`): `id, key (unique), name, description, isSystem, createdAt`.
- `RolePermission` (`role_permissions`): `(roleId, permissionKey)` composite PK.
- `Membership` (`memberships`): `id, userId, tenantId, roleId, isActive, createdAt`,
  unique `(userId, tenantId)`, index `tenantId`.
- `TenantSetting` (`tenant_settings`): `tenantId + key (PK), value (Json), createdAt, updatedAt`.
- `User` يكتسب `memberships Membership[]`.

مهاجرة `20261113104505_tenancy`.

## صلاحيات وأدوار

`backend/src/tenancy/permissions.ts` (بيانات خالصة، تُستورد من seed).

- صلاحية wildcard `*` (يمنح كل الصلاحيات) — مخصصة للمالك.
- 16 صلاحية في مجموعات: `tenant.*`, `members.*`, `customers/tickets/billing/inventory/reports/audit`.
- 5 أدوار: `owner, admin, manager, agent, viewer` مع مصفوفة صلاحيات authoritative (يُعيد seed
  ضبط المصفوفة عند كل تشغيل: `deleteMany` + `createMany`).

## guards و decorators

- `@RequirePermissions(...permissions)` (`permissions.decorator.ts`) — metadata.
- `TenantContextGuard` (`tenant-context.guard.ts`): يقرأ `X-Tenant-Id` (UUID إلزامي)،
  يبحث `Membership` مع `tenant`/`role`/`permissions`، يرفض 400 إذا غاب/أُسيء، 403 إذا غير
  منتمٍ/غير نشط. يضع `request.tenant` (`TenantContext`).
- `PermissionsGuard` (`permissions.guard.ts`): يُطابق `@RequirePermissions` مع
  `request.tenant.permissions`، wildcard `*` يمرّ دائماً.
- `@CurrentTenant()` (`current-tenant.decorator.ts`): حقن `TenantContext`.

ترتيب guards: `JwtAuthGuard → TenantContextGuard → PermissionsGuard`.

## TenancyService

`backend/src/tenancy/tenancy.service.ts`:

- `listForUser(userId)` → memberships (مع role + permissions).
- `create(userId, { name, slug? })`: slug اختياري client (`[a-z0-9-]`, 3–40) أو مُولّد `t-<8 hex>`;
  transaction: tenant + membership(owner) + default settings (locale, timezone). تعارض slug → 409.
- `rename(tenantId, name)`.
- `getSettings(tenantId)` / `setSetting(tenantId, key, value)` (key pattern `^[a-z0-9][a-z0-9._-]{0,63}$`).

## endpoints

| المسار                                  | الطريقة | guards                     | الصلاحية                     |
| --------------------------------------- | ------- | -------------------------- | ---------------------------- |
| `/api/v1/tenants/mine`                  | GET     | JWT                        | — (user-scoped)              |
| `/api/v1/tenants`                       | POST    | JWT                        | — (creates owner membership) |
| `/api/v1/tenants/current`               | GET     | JWT + Tenant               | —                            |
| `/api/v1/tenants/current`               | PATCH   | JWT + Tenant + Permissions | `tenant.manage`              |
| `/api/v1/tenants/current/settings`      | GET     | JWT + Tenant + Permissions | `tenant.settings.read`       |
| `/api/v1/tenants/current/settings/:key` | PUT     | JWT + Tenant + Permissions | `tenant.settings.write`      |

## seed

- 3 system settings + 17 permissions (incl. `*`) + 5 roles + matrix.
- tenant افتراضي `shadtech` ("مؤسسة شدتك") + admin كـ owner + settings `locale=ar`, `timezone=Asia/Hebron`.
- idempotent (لا يعيد تعيين password ولا يطغى على settings/membership).

## الواجهة

- `lib/api.ts`: `setTenantIdResolver`/`getTenantId` — tenant id يُقرأ من ref (يُحدَّث during render)
  لضمان تطابق header مع child effects.
- `lib/tenancy.tsx`: `TenancyProvider` يحمّل `/tenants/mine`، يختار tenant نشط (localStorage)،
  يوفّر `switchTenant/createTenant/renameActiveTenant/hasPermission`.
- `pages/OnboardingPage.tsx`: إنشاء مؤسسة أولى.
- `components/TenantSwitcher.tsx`: تبديل المؤسسات + إنشاء جديدة.
- `components/TenantPanel.tsx`: بطاقة المؤسسة (اسم/slug/دور/صلاحيات)، تعديل الاسم (tenant.manage)،
  إعدادات معزولة (tenant.settings.read/write).
- `App.tsx`: routing: loading → guest → onboarding (no memberships) → dashboard.

## التحقق (API)

`test-tenancy.js`: login 200; mine shows `shadtech:owner:*`; current without header 400; bad uuid 400;
unknown tenant 403; settings read/write; create `test-tenant` 201; duplicate slug 409; tenant B owner;
cross-tenant isolation; rename 200; invalid setting key 400.

RBAC test: viewer يقرأ tenant (tenant.read) but settings read/write + rename → 403; manager
يقرأ/يكتب settings but rename → 403; viewer على tenant غير member → 403.

## التحقق (UI)

- admin: switcher (2 tenants) + tenant panel (rename + settings read/write) — no console errors.
- viewer: rename/settings forms hidden with notes; no 403 requests.
- onboarding: new user without membership → OnboardingPage → create tenant → dashboard.
- dark/light intact.

## تنازلات

- أدوار platform-level (global) فقط؛ per-tenant custom roles لاحقًا.
- `*` row in permissions table to satisfy FK; admin role has explicit keys, not `*`.
- Tenant id only via header; body ignored.
- Tenant members management (invite) in step 6.

## الخطوات التالية

- Step 5: companies/branches (Company, Branch) with tenant isolation.
- Step 6: users/memberships management UI.
- Step 8: audit log.
