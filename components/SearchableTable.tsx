"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import DataTable, { type Column } from "./DataTable";
import ExportCsvButton from "./ExportCsvButton";

export default function SearchableTable<T>({
  rows,
  columns,
  keyFor,
  searchPlaceholder,
  searchText,
  emptyLabel,
  defaultSort,
  exportFileName,
  exportColumns,
}: {
  rows: T[];
  columns: Column<T>[];
  keyFor: (row: T) => string;
  searchPlaceholder: string;
  searchText: (row: T) => string;
  emptyLabel?: string;
  defaultSort?: { header: string; direction?: "asc" | "desc" };
  /** When set, adds an "Export CSV" button that exports the currently filtered rows. */
  exportFileName?: string;
  exportColumns?: { header: string; value: (row: T) => string | number | null | undefined }[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="field pl-10"
          />
        </div>
        <span className="font-mono text-xs text-text-muted">
          {filtered.length} / {rows.length}
        </span>
        {exportFileName && exportColumns ? (
          <ExportCsvButton filename={exportFileName} rows={filtered} columns={exportColumns} />
        ) : null}
      </div>
      <DataTable
        columns={columns}
        rows={filtered}
        keyFor={keyFor}
        emptyLabel={query ? "Nothing matches that search." : emptyLabel}
        defaultSort={defaultSort}
      />
    </div>
  );
}
