# الخطوة 5 — الشركات والفروع

## الهدف

إضافة **الهيكل التنظيمي** внутри المؤسسة: شركة (Company) وفرع (Branch)، كلاهما
معزول داخل `tenant_id`. كل شركة يمكن أن تملك فروعاً. حذف شركة يحذف فروعها (cascade).

## المخطط (schema)

- `Company` (`companies`): `id, tenantId, name, code?, isActive, createdAt, updatedAt`.
  - unique `(tenantId, name)`, index `tenantId`.
- `Branch` (`branches`): `id, tenantId, companyId, name, code?, isActive, createdAt, updatedAt`.
  - unique `(companyId, name)`, index `tenantId`, `companyId`.
- `Tenant` يكتسب `companies Company[]`, `branches Branch[]`.
- مهاجرة `20261113110921_companies`.

## الصلاحيات

أضيفت 4 صلاحيات: `companies.read`, `companies.write`, `branches.read`, `branches.write`.

- owner/admin: كل الصلاحيات (admin via matrix).
- manager: read + write للشركات والفروع.
- agent/viewer: read فقط.

## endpoints

| المسار                                  | الطريقة | الصلاحية          |
| --------------------------------------- | ------- | ----------------- |
| `/api/v1/companies`                     | GET     | `companies.read`  |
| `/api/v1/companies`                     | POST    | `companies.write` |
| `/api/v1/companies/:id`                 | GET     | `companies.read`  |
| `/api/v1/companies/:id`                 | PATCH   | `companies.write` |
| `/api/v1/companies/:id`                 | DELETE  | `companies.write` |
| `/api/v1/companies/:companyId/branches` | GET     | `branches.read`   |
| `/api/v1/companies/:companyId/branches` | POST    | `branches.write`  |
| `/api/v1/companies/branches/:id`        | PATCH   | `branches.write`  |
| `/api/v1/companies/branches/:id`        | DELETE  | `branches.write`  |

كل endpoint يمر عبر `JwtAuthGuard → TenantContextGuard → PermissionsGuard` ويفلتر بـ `tenantId`
من السياق (لا يُقبل من body).

## الواجهة

- `components/CompaniesPanel.tsx`: قائمة شركات (مع عدد فروع)، إنشاء/تعديل/حذف شركة،
  توسيع لعرض الفروع، إضافة/حذف فرع.
- `DashboardPage`: لوحة "الشركات والفروع" + عنصر قائمة (بدون "قريبًا").

## التحقق

- API: create/list/get/update/delete company + branch، duplicate → 409، cross-tenant isolation،
  404 بعد الحذف.
- UI: إنشاء شركة وفرع، حذف، بدون أخطاء console.

## الخطوات التالية

- Step 6: users/memberships management UI.
- Step 8: audit log.
