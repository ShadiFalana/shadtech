# الخطوة 11 — التذاكر والدعم (ITSM)

## الهدف

نظام **تذاكر دعم** (Ticket) مع حالات وأولويات وأنواع، تعليقات (داخلية/علنية)،
وCRUD كامل، معزول داخل المؤسسة.

## المخطط (schema)

- `Ticket` (`tickets`): `id, tenantId, title, description?, status, priority, type, assigneeId?, createdAt, updatedAt, resolvedAt?, closedAt?`.
  - enums: `TicketStatus`, `TicketPriority`, `TicketType`.
  - index `tenantId`, `tenantId+status`, `tenantId+priority`.
- `TicketComment` (`ticket_comments`): `id, tenantId, ticketId, authorId?, body, internal, createdAt`.
- `Tenant` يكتسب `tickets`, `ticketComments`. `User` يكتسب `assignedTickets`, `ticketComments`.
- مهاجرة `20261113113000_tickets`.

## endpoints

| المسار                         | الطريقة                                      | الصلاحية        |
| ------------------------------ | -------------------------------------------- | --------------- |
| `/api/v1/tickets`              | GET (query: status, priority, assigneeId, q) | `tickets.read`  |
| `/api/v1/tickets`              | POST                                         | `tickets.write` |
| `/api/v1/tickets/:id`          | GET                                          | `tickets.read`  |
| `/api/v1/tickets/:id`          | PATCH                                        | `tickets.write` |
| `/api/v1/tickets/:id`          | DELETE                                       | `tickets.write` |
| `/api/v1/tickets/:id/comments` | GET                                          | `tickets.read`  |
| `/api/v1/tickets/:id/comments` | POST                                         | `tickets.write` |

تغيير الحالة إلى RESOLVED/CLOSED يسجل الوقت تلقائيًا. كل عملية تُسجَّل في audit log.

## الواجهة

- `components/TicketsPanel.tsx`: قائمة تذاكر (فلترة/بحث)، إنشاء، تفاصيل، تعليقات، تغيير حالة.
- `DashboardPage`: لوحة "التذاكر والدعم".

## التحقق

- API: create/list/get/update/delete ticket + comments; audit entries.
- UI: إنشاء/فلترة/تعليق/حذف; no console errors.

## الخطوات التالية

- فوترة/مبيعات، مخزون، HR، إلخ (حسب الأولويات).
- اختبارات تكامل (Jest + DB).
