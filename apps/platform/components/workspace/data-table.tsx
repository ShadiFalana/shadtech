import { Card, CardContent } from "@/components/ui/card";
import { translateKey, type Dictionary } from "@/lib/dictionaries";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import {
  DataTableClient,
  type ClientBulkAction,
  type ClientColumnMeta,
  type ClientRow,
} from "./data-table-client";

export type Column<T> = {
  key: string;
  headerKey?: string;
  header?: string;
  cell: (row: T) => React.ReactNode;
  /** Defaults to true when the column has scalar values. */
  sortable?: boolean;
  /** Defaults to true for scalar columns; contributes to the global search text. */
  searchable?: boolean;
  /** Defaults to true for low-cardinality scalar columns (e.g. status, priority). */
  filterable?: boolean;
  /** Prevent this column from being hidden in the visibility menu. */
  alwaysVisible?: boolean;
  /** Render this column hidden initially; it can still be shown by the user. */
  defaultHidden?: boolean;
  /** Optional sort/search overrides when the row value is not directly on `row[key]`. */
  sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
  searchValue?: (row: T) => string | null | undefined;
};

/** Caller-supplied, permission-aware action. Selected row keys arrive in `selectedIds`. */
export type BulkAction = ClientBulkAction;

type Scalar = string | number | boolean | Date | null | undefined;

function rawValue<T>(row: T, column: Column<T>): unknown {
  if (column.sortValue) return column.sortValue(row);
  if (row && typeof row === "object") return (row as Record<string, unknown>)[column.key];
  return undefined;
}

function isScalar(value: unknown): value is Scalar {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  );
}

function normalize(value: Scalar): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function optionLabel(value: Scalar, key: string, t: Dictionary): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? t.common.yes : t.common.no;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = String(value);
  if (key === "status" || key === "statuses") return translateKey(t, `statuses.${raw}`) ?? raw;
  if (key === "priority") return translateKey(t, `priorities.${raw}`) ?? raw;
  if (key === "role" || key === "roles") return translateKey(t, `roles.${raw}`) ?? raw;
  return raw;
}

function defaultKey<T>(row: T, columns: Column<T>[], index: number): string {
  const record = row as Record<string, unknown> | null;
  const id = record?.id;
  if (id !== undefined && id !== null) return String(id);
  const parts = columns
    .map((column) => {
      const value = record?.[column.key];
      return normalize(isScalar(value) ? value : undefined);
    })
    .filter((value) => value !== null)
    .map(String);
  return parts.length > 0 ? parts.join("|") : `row-${index}`;
}

export async function DataTable<T>({
  rows,
  columns,
  emptyKey = "common.noData",
  rowKey,
  caption,
  ariaLabel,
  bulkActions,
  pageSize = 10,
  defaultSort = null,
}: {
  rows: T[];
  columns: Column<T>[];
  emptyKey?: string;
  rowKey?: (row: T) => string;
  caption?: string;
  ariaLabel?: string;
  bulkActions?: BulkAction[];
  pageSize?: number;
  defaultSort?: { key: string; direction: "asc" | "desc" } | null;
}) {
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-sm text-muted-foreground" role="status">
          {translateKey(t, emptyKey) ?? emptyKey}
        </CardContent>
      </Card>
    );
  }

  const optionsByKey = new Map<string, { options: { value: string; label: string }[]; total: number }>();
  const scalarCounts = new Map<string, number>();

  for (const column of columns) {
    const distinct = new Map<string, { value: string; label: string }>();
    let scalarCount = 0;
    for (const row of rows) {
      const value = rawValue(row, column);
      if (!isScalar(value) || value === null || value === undefined) continue;
      scalarCount += 1;
      const normalized = String(normalize(value));
      if (!distinct.has(normalized)) {
        distinct.set(normalized, { value: normalized, label: optionLabel(value, column.key, t) });
      }
    }
    scalarCounts.set(column.key, scalarCount);
    optionsByKey.set(column.key, {
      options: Array.from(distinct.values()).slice(0, 12),
      total: distinct.size,
    });
  }

  const clientColumns: ClientColumnMeta[] = columns.map((column) => {
    const columnOptions = optionsByKey.get(column.key);
    const options = columnOptions?.options ?? [];
    const hasScalar = (scalarCounts.get(column.key) ?? 0) > 0;
    return {
      key: column.key,
      label: column.header ?? translateKey(t, column.headerKey ?? "") ?? column.key,
      sortable: column.sortable ?? (column.sortValue !== undefined || hasScalar),
      filterable: column.filterable ?? ((columnOptions?.total ?? 0) > 1 && (columnOptions?.total ?? 0) <= 12),
      alwaysVisible: column.alwaysVisible ?? false,
      defaultHidden: column.defaultHidden ?? false,
      options,
    };
  });

  const usedKeys = new Set<string>();
  const clientRows: ClientRow[] = rows.map((row, index) => {
    const base = rowKey ? rowKey(row) : defaultKey(row, columns, index);
    let key = base;
    let suffix = 2;
    while (usedKeys.has(key)) key = `${base}#${suffix++}`;
    usedKeys.add(key);

    const cells: Record<string, React.ReactNode> = {};
    const values: Record<string, string | number | boolean | null> = {};
    for (const column of columns) {
      cells[column.key] = column.cell(row);
      const raw = rawValue(row, column);
      values[column.key] = normalize(isScalar(raw) ? raw : undefined);
    }
    const searchText = columns
      .filter((column) => column.searchable !== false)
      .map((column) => {
        if (column.searchValue) return column.searchValue(row) ?? "";
        const value = rawValue(row, column);
        return isScalar(value) && value !== null && value !== undefined ? String(value) : "";
      })
      .join(" ");

    return { key, cells, values, searchText };
  });

  const labels = {
    search: t.common.search,
    filters: t.common.filters,
    all: t.common.all,
    back: t.common.back,
    next: t.common.next,
    view: t.common.view,
    results: t.sections.results,
    noResults: translateKey(t, "empty.search") ?? (translateKey(t, emptyKey) ?? emptyKey),
  };

  return (
    <DataTableClient
      rows={clientRows}
      columns={clientColumns}
      labels={labels}
      locale={locale}
      caption={caption ?? t.sections.records}
      ariaLabel={ariaLabel}
      pageSize={pageSize}
      defaultSort={
        defaultSort && clientColumns.some((column) => column.key === defaultSort.key && column.sortable)
          ? defaultSort
          : null
      }
      bulkActions={bulkActions}
    />
  );
}
