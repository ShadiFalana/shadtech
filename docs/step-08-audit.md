# الخطوة 8 — سجل التدقيق

## الهدف

تسجيل **الأحداث الحساسة** داخل المؤسسة (إنشاء/حذف شركات، إضافة/إزالة أعضاء،
تغيير أدوار، إعادة تعيين كلمات مرور، تعديل المؤسسة) وعرضها في لوحة تدقيق.

## المخطط (schema)

- `AuditLog` (`audit_logs`): `id, tenantId, userId?, action, resource, resourceId?, metadata (Json), ipAddress?, userAgent?, createdAt`.
  - index `tenantId+createdAt`, `tenantId+resource`.
- `Tenant` يكتسب `auditLogs AuditLog[]`.
- `User` يكتسب `auditLogs AuditLog[]`.
- مهاجرة `20261113112500_audit`.

## endpoints

| المسار          | الطريقة                                              | الصلاحية     |
| --------------- | ---------------------------------------------------- | ------------ |
| `/api/v1/audit` | GET (query: resource, action, userId, limit, offset) | `audit.read` |

## تكامل

- `AuditService.log()` fire-and-forget (لا يكسر العملية الأساسية).
- مستدعى من: TenancyService (tenant.updated)، MembersService (member.added/role_changed/removed/password_reset)،
  CompaniesService (company.created/deleted)، CustomersService (customer.created/deleted).

## الواجهة

- `components/AuditPanel.tsx`: قائمة أحداث مع فلترة (مورد/إجراء) وتحديث.
- `DashboardPage`: لوحة "سجل التدقيق".

## التحقق

- API: create company → audit entries (created + deleted).
- UI: عرض الأحداث; no console errors.

## الخطوات التالية

- Step 9: web UI polish.
- Step 10: tests/docs/CI.
