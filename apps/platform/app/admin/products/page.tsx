import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createProduct, createProductCategory, deleteProduct } from "@/actions/admin-products";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { SectionCard } from "@/components/workspace/section-card";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminProductsPage() {
  await requirePermission("content.manage", "admin");
  const [products, categories, total, locale] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { order: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { order: "asc" } }),
    prisma.product.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.products"
      stats={[{ labelKey: "sections.records", value: total }]}
      form={
        <div className="space-y-6">
          <SectionCard titleKey="admin.productCategories">
            <AdminForm
              action={createProductCategory}
              fields={[
                { name: "name", labelKey: "forms.name", required: true },
                { name: "slug", labelKey: "forms.code", required: true },
              ]}
            />
          </SectionCard>
          <SectionCard titleKey="admin.products">
            <AdminForm
              action={createProduct}
              fields={[
                { name: "name", labelKey: "forms.name", required: true },
                { name: "slug", labelKey: "forms.code", required: true },
                { name: "description", labelKey: "forms.description", textarea: true, required: true },
                {
                  name: "categoryId",
                  labelKey: "forms.category",
                  options: [
                    { value: "none", label: "—" },
                    ...categories.map((category) => ({ value: category.id, label: category.name })),
                  ],
                },
              ]}
            />
          </SectionCard>
        </div>
      }
      rows={products}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "category", headerKey: "forms.category", cell: (row) => row.category?.name ?? "—" },
        { key: "availability", headerKey: "common.status", cell: (row) => row.availability },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteProduct} id={row.id} /> },
      ]}
    />
  );
}
