import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createTestimonial, deleteTestimonial } from "@/actions/admin-content";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminTestimonialsPage() {
  await requirePermission("content.manage", "admin");
  const [items, total, t] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
    prisma.testimonial.count(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.testimonials"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createTestimonial}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "role", labelKey: "forms.role" },
            { name: "company", labelKey: "forms.company" },
            { name: "content", labelKey: "forms.details", textarea: true, required: true },
            { name: "rating", labelKey: "forms.value", type: "number", min: 1, max: 5, defaultValue: "5" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "company", headerKey: "forms.company", cell: (row) => row.company ?? "—" },
        { key: "rating", headerKey: "forms.value", cell: (row) => row.rating },
        { key: "content", headerKey: "forms.details", cell: (row) => row.content },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isActive ? t.common.active : t.common.inactive),
        },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteTestimonial} id={row.id} /> },
      ]}
    />
  );
}
