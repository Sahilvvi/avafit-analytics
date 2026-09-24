"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from "lucide-react";
import clsx from "clsx";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Enables click-to-sort on this column; returns the raw comparable value (not the rendered node). */
  sortValue?: (row: T) => string | number;
}

export default function DataTable<T>({
  columns,
  rows,
  keyFor,
  emptyLabel = "No rows yet.",
  defaultSort,
}: {
  columns: Column<T>[];
  rows: T[];
  keyFor: (row: T) => string;
  emptyLabel?: string;
  /** Column header to sort by initially; direction defaults to descending. */
  defaultSort?: { header: string; direction?: "asc" | "desc" };
}) {
  const [sort, setSort] = useState<{ header: string; direction: "asc" | "desc" } | null>(
    defaultSort ? { header: defaultSort.header, direction: defaultSort.direction ?? "desc" } : null
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.header === sort.header);
    if (!col?.sortValue) return rows;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [rows, sort, columns]);

  if (rows.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-text-muted">
          <Inbox size={20} />
        </span>
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60">
              {columns.map((col) => {
                const isSorted = sort?.header === col.header;
                return (
                  <th
                    key={col.header}
                    className={clsx(
                      "eyebrow whitespace-nowrap px-5 py-3 font-medium",
                      col.className?.includes("text-right") && "text-right",
                      col.sortValue && "cursor-pointer select-none hover:text-text-secondary"
                    )}
                    onClick={
                      col.sortValue
                        ? () =>
                            setSort((prev) =>
                              prev?.header === col.header
                                ? { header: col.header, direction: prev.direction === "asc" ? "desc" : "asc" }
                                : { header: col.header, direction: "desc" }
                            )
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortValue ? (
                        isSorted ? (
                          sort!.direction === "asc" ? (
                            <ArrowUp size={11} className="text-accent" />
                          ) : (
                            <ArrowDown size={11} className="text-accent" />
                          )
                        ) : (
                          <ArrowUpDown size={11} className="opacity-30" />
                        )
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sorted.map((row) => (
              <tr key={keyFor(row)} className="transition-colors hover:bg-surface-2/70">
                {columns.map((col) => (
                  <td key={col.header} className={`whitespace-nowrap px-5 py-3.5 text-text-secondary ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
