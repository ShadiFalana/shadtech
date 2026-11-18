import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminAssessmentsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.iTAssessment.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.iTAssessment.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.assessments"
      stats={[{ labelKey: "sections.records", value: total }]}
      rows={items}
      columns={[
        { key: "company", headerKey: "forms.company", cell: (row) => row.companyName ?? "—" },
        { key: "email", headerKey: "forms.email", cell: (row) => row.email ?? "—" },
        { key: "score", headerKey: "forms.value", cell: (row) => row.score ?? "—" },
        { key: "summary", headerKey: "sections.summary", cell: (row) => row.summary ?? "—" },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
      ]}
    />
  );
}
