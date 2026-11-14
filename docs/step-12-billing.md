# الخطوة 12 — الفوترة والمبيعات

## الهدف

نظام **فواتير** (Invoice) مع بنود (InvoiceItem) ودفعات (Payment)، حالات،
وCRUD كامل، معزول داخل المؤسسة.

## المخطط (schema)

- `Invoice` (`invoices`): `id, tenantId, customerId?, number, status, issueDate, dueDate?, subtotal, tax, total, notes, createdAt, updatedAt`.
  - enum `InvoiceStatus`, unique `(tenantId, number)`.
- `InvoiceItem` (`invoice_items`): `id, tenantId, invoiceId, description, quantity, unitPrice, total, createdAt`.
- `Payment` (`payments`): `id, tenantId, invoiceId, amount, method, paidAt, notes, createdAt`.
  - enum `PaymentMethod`.
- مهاجرة `20261113123000_billing`.

## endpoints

| المسار                               | الطريقة            | الصلاحية        |
| ------------------------------------ | ------------------ | --------------- |
| `/api/v1/invoices`                   | GET (query status) | `billing.read`  |
| `/api/v1/invoices`                   | POST               | `billing.write` |
| `/api/v1/invoices/:id`               | GET                | `billing.read`  |
| `/api/v1/invoices/:id`               | PATCH              | `billing.write` |
| `/api/v1/invoices/:id`               | DELETE             | `billing.write` |
| `/api/v1/invoices/:id/items`         | POST               | `billing.write` |
| `/api/v1/invoices/:id/items/:itemId` | DELETE             | `billing.write` |
| `/api/v1/invoices/:id/payments`      | POST               | `billing.write` |

تسجيل دفعة كاملة يغيّر الحالة إلى PAID تلقائيًا. كل عملية تُسجَّل في audit log.

## الواجهة

- `components/BillingPanel.tsx`: قائمة فواتير، إنشاء، تفاصيل (بنود + دفعات)، حذف.

## الخطوات التالية

- المخزون، التقارير، تحسينات عامة.
