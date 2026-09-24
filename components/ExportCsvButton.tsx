"use client";

import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

export default function ExportCsvButton<T>({
  filename,
  rows,
  columns,
}: {
  filename: string;
  rows: T[];
  columns: { header: string; value: (row: T) => string | number | null | undefined }[];
}) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, rows, columns)}
      disabled={rows.length === 0}
      className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
      title="Export the current view as CSV"
    >
      <Download size={13} /> Export CSV
    </button>
  );
}
