import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid, type StatItem } from "@/components/workspace/stat-grid";

/** Shared shell for admin list pages: localized header, real stats, optional form, real table. */
export async function AdminResourcePage<T>({
  titleKey,
  descriptionKey,
  stats = [],
  form,
  formTitleKey,
  rows,
  columns,
  emptyKey = "common.noData",
  recordsTitleKey = "sections.records",
}: {
  titleKey: string;
  descriptionKey?: string;
  stats?: StatItem[];
  form?: React.ReactNode;
  formTitleKey?: string;
  rows: T[];
  columns: Column<T>[];
  emptyKey?: string;
  recordsTitleKey?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader titleKey={titleKey} descriptionKey={descriptionKey} />
      {stats.length > 0 && <StatGrid items={stats} />}
      {form &&
        (formTitleKey ? <SectionCard titleKey={formTitleKey}>{form}</SectionCard> : form)}
      <SectionCard titleKey={recordsTitleKey}>
        <DataTable rows={rows} columns={columns} emptyKey={emptyKey} />
      </SectionCard>
    </div>
  );
}
