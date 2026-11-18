import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createArticle, deleteArticle } from "@/actions/admin-knowledge";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

export default async function AdminKnowledgePage() {
  await requirePermission("content.manage", "admin");
  const [items, total, locale, t] = await Promise.all([
    prisma.knowledgeArticle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.knowledgeArticle.count(),
    getServerLocale(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.knowledgeBase"
      stats={[{ labelKey: "sections.records", value: total }]}
      emptyKey="empty.articles"
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createArticle}
          fields={[
            { name: "title", labelKey: "forms.title", required: true },
            { name: "slug", labelKey: "forms.code", required: true },
            { name: "category", labelKey: "forms.category" },
            { name: "content", labelKey: "forms.details", textarea: true, required: true },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        { key: "category", headerKey: "forms.category", cell: (row) => row.category ?? "—" },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isPublished ? t.common.active : t.common.inactive),
        },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteArticle} id={row.id} /> },
      ]}
    />
  );
}
