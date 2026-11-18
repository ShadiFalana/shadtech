import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createBlogPost, deleteBlogPost } from "@/actions/admin-blog";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

export default async function AdminBlogPage() {
  await requirePermission("content.manage", "admin");
  const [items, total, locale, t] = await Promise.all([
    prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.blogPost.count(),
    getServerLocale(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.blog"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createBlogPost}
          fields={[
            { name: "title", labelKey: "forms.title", required: true },
            { name: "slug", labelKey: "forms.code", required: true },
            { name: "excerpt", labelKey: "sections.summary", textarea: true },
            { name: "content", labelKey: "forms.details", textarea: true, required: true },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isPublished ? t.common.active : t.common.inactive),
        },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteBlogPost} id={row.id} /> },
      ]}
    />
  );
}
