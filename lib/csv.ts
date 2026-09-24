/** Builds a CSV string from rows + column definitions and triggers a
 *  browser download — client-side only, no server round trip or dependency. */
export function downloadCsv<T>(filename: string, rows: T[], columns: { header: string; value: (row: T) => string | number | null | undefined }[]) {
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };

  const lines = [
    columns.map((c) => escape(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escape(String(c.value(row) ?? ""))).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
