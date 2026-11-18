"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ClientColumnMeta = {
  key: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  alwaysVisible: boolean;
  defaultHidden: boolean;
  options: { value: string; label: string }[];
};

/** Pre-rendered row payload. Cell content is produced on the server, never on the client. */
export type ClientRow = {
  key: string;
  cells: Record<string, ReactNode>;
  searchText: string;
  values: Record<string, string | number | boolean | null>;
};

/**
 * Bulk actions are supplied by the caller (permission checks happen there).
 * The selected row keys are sent to that action in `selectedIds`; no action is invented here.
 */
export type ClientBulkAction = {
  key: string;
  label: string;
  action: (formData: FormData) => void | Promise<void>;
};

export type DataTableLabels = {
  search: string;
  filters: string;
  all: string;
  back: string;
  next: string;
  view: string;
  results: string;
  noResults: string;
};

function compareValues(
  a: string | number | boolean | null,
  b: string | number | boolean | null,
  locale: string,
) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), locale, { numeric: true, sensitivity: "base" });
}

export function DataTableClient({
  rows,
  columns,
  labels,
  locale,
  caption,
  ariaLabel,
  pageSize = 10,
  defaultSort = null,
  bulkActions = [],
}: {
  rows: ClientRow[];
  columns: ClientColumnMeta[];
  labels: DataTableLabels;
  locale: string;
  caption: string;
  ariaLabel?: string;
  pageSize?: number;
  defaultSort?: { key: string; direction: "asc" | "desc" } | null;
  bulkActions?: ClientBulkAction[];
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(defaultSort);
  const [page, setPage] = useState(1);
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter((column) => column.defaultHidden).map((column) => column.key)),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visibleColumns = columns.filter((column) => !hidden.has(column.key));
  const hasControls = rows.length > 0;

  const filteredRows = (() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    const matched = rows.filter((row) => {
      if (needle && !row.searchText.toLocaleLowerCase(locale).includes(needle)) return false;
      for (const [key, value] of Object.entries(filters)) {
        if (value && String(row.values[key] ?? "") !== value) return false;
      }
      return true;
    });
    if (!sort) return matched;
    return [...matched].sort((left, right) => {
      const result = compareValues(left.values[sort.key] ?? null, right.values[sort.key] ?? null, locale);
      return sort.direction === "asc" ? result : -result;
    });
  })();

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(start, start + pageSize);

  function resetPage() {
    setPage(1);
  }

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
    resetPage();
  }

  function toggleColumn(key: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else if (visibleColumns.length > 1) {
        next.add(key);
      }
      return next;
    });
  }

  function setFilter(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    resetPage();
  }

  function toggleSelected(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allPageSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.key));

  function toggleAllOnPage() {
    setSelected((current) => {
      const next = new Set(current);
      pageRows.forEach((row) => {
        if (allPageSelected) next.delete(row.key);
        else next.add(row.key);
      });
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-sm dark:border-white/10 dark:bg-[#24272D]">
      {hasControls && (
        <div className="flex flex-wrap items-end gap-3 border-b border-[#E4E7EC] p-3 dark:border-white/10">
          <div className="min-w-48 flex-1">
            <label
              htmlFor={`${id}-search`}
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {labels.search}
            </label>
            <Input
              id={`${id}-search`}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder={labels.search}
            />
          </div>

          {columns.some((column) => column.filterable) && (
            <fieldset className="flex flex-wrap items-end gap-3">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {labels.filters}
              </legend>
              {columns
                .filter((column) => column.filterable)
                .map((column) => (
                  <div key={column.key} className="min-w-36">
                    <label
                      htmlFor={`${id}-filter-${column.key}`}
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {column.label}
                    </label>
                    <select
                      id={`${id}-filter-${column.key}`}
                      value={filters[column.key] ?? ""}
                      onChange={(event) => setFilter(column.key, event.target.value)}
                      className="h-8 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="">{labels.all}</option>
                      {column.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </fieldset>
          )}

          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center rounded-lg border border-input px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&::-webkit-details-marker]:hidden">
              {labels.view}
              {hidden.size > 0 && (
                <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 text-xs tabular-nums text-primary">
                  {hidden.size}
                </span>
              )}
            </summary>
            <div className="absolute end-0 z-20 mt-2 w-56 rounded-lg border border-[#E4E7EC] bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#24272D]">
              <fieldset>
                <legend className="sr-only">
                  {labels.filters} · {labels.view}
                </legend>
                {columns.map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted focus-within:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={!hidden.has(column.key)}
                      disabled={column.alwaysVisible}
                      onChange={() => toggleColumn(column.key)}
                    />
                    <span className="truncate">{column.label}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          </details>

          <p className="ms-auto text-xs text-muted-foreground" aria-live="polite">
            {labels.results}: {filteredRows.length}
          </p>
        </div>
      )}

      {bulkActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E4E7EC] p-3 dark:border-white/10">
          {bulkActions.map((bulkAction) => (
            <form key={bulkAction.key} action={bulkAction.action}>
              <input type="hidden" name="selectedIds" value={Array.from(selected).join(",")} />
              <Button type="submit" size="sm" variant="outline" disabled={selected.size === 0}>
                {bulkAction.label}
              </Button>
            </form>
          ))}
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {labels.results}: {selected.size}
          </p>
        </div>
      )}

      {filteredRows.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">{labels.noResults}</p>
      ) : (
        <Table aria-label={ariaLabel}>
          <TableCaption className={caption ? undefined : "sr-only"}>{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {bulkActions.length > 0 && (
                <TableHead scope="col" className="w-8">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={allPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label={labels.all}
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sort?.key === column.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className="whitespace-nowrap text-muted-foreground"
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {column.label}
                      <span aria-hidden="true" className="ms-1 text-xs">
                        {sort?.key === column.key ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.key}>
                {bulkActions.length > 0 && (
                  <TableCell>
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={selected.has(row.key)}
                      onChange={() => toggleSelected(row.key)}
                      aria-label={`${labels.view}: ${row.key}`}
                    />
                  </TableCell>
                )}
                {visibleColumns.map((column) => (
                  <TableCell key={column.key} className="align-top">
                    {row.cells[column.key] ?? "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {filteredRows.length > pageSize && (
        <nav
          className="flex items-center justify-between gap-3 border-t border-[#E4E7EC] p-3 text-xs text-muted-foreground dark:border-white/10"
          aria-label={labels.filters}
        >
          <span className="tabular-nums">
            {start + 1}–{Math.min(start + pageSize, filteredRows.length)} / {filteredRows.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              {labels.back}
            </Button>
            <span className="tabular-nums" aria-live="polite">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              {labels.next}
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
