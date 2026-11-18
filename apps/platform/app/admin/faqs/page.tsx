import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createFaq, deleteFaq } from "@/actions/admin-content";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";

export default async function AdminFaqsPage() {
  await requirePermission("content.manage", "admin");
  const [items, total] = await Promise.all([
    prisma.fAQ.findMany({ orderBy: { order: "asc" } }),
    prisma.fAQ.count(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.faqs"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createFaq}
          fields={[
            { name: "question", labelKey: "forms.subject", required: true },
            { name: "answer", labelKey: "forms.message", textarea: true, required: true },
            { name: "category", labelKey: "forms.category" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "question", headerKey: "forms.subject", cell: (row) => row.question },
        { key: "answer", headerKey: "forms.message", cell: (row) => row.answer },
        { key: "category", headerKey: "forms.category", cell: (row) => row.category ?? "—" },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteFaq} id={row.id} /> },
      ]}
    />
  );
}
