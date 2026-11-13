# الخطوة 7 — العملاء

## الهدف

سجل **العملاء** (Customer) معزول داخل المؤسسة، مع بحث وتصفية، وCRUD كامل.

## المخطط (schema)

- `Customer` (`customers`): `id, tenantId, name, email?, phone?, company?, notes?, isActive, createdAt, updatedAt`.
  - index `tenantId`, `tenantId+name`.
- `Tenant` يكتسب `customers Customer[]`.
- مهاجرة `20261113111942_customers`.

## endpoints

| المسار                  | الطريقة         | الصلاحية          |
| ----------------------- | --------------- | ----------------- |
| `/api/v1/customers`     | GET (query `q`) | `customers.read`  |
| `/api/v1/customers`     | POST            | `customers.write` |
| `/api/v1/customers/:id` | GET             | `customers.read`  |
| `/api/v1/customers/:id` | PATCH           | `customers.write` |
| `/api/v1/customers/:id` | DELETE          | `customers.write` |

بحث `q`: contains (insensitive) على name/email/phone/company.

## الواجهة

- `components/CustomersPanel.tsx`: قائمة، بحث (debounced)، إنشاء/تعديل/حذف، ملاحظات.
- `DashboardPage`: لوحة "العملاء".

## التحقق

- API: create/list/search/update/get/delete + 404.
- UI: إنشاء/بحث/تعديل/حذف; no console errors.

## الخطوات التالية

- Step 8: audit log.
- Step 9: web UI polish.
