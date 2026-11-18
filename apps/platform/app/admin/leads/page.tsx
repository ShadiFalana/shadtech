import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createLead, deleteLead } from "@/actions/admin-leads";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminLeadsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.lead.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.leads"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createLead}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "email", labelKey: "forms.email", type: "text" },
            { name: "company", labelKey: "forms.company" },
            { name: "status", labelKey: "forms.status", defaultValue: "NEW" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "company", headerKey: "forms.company", cell: (row) => row.company ?? "—" },
        { key: "email", headerKey: "forms.email", cell: (row) => row.email ?? "—" },
        { key: "status", headerKey: "common.status", cell: (row) => row.status },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteLead} id={row.id} /> },
      ]}
    />
  );
}
