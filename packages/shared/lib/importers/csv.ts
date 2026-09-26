/** RFC 4180-ish CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Parses CSV into objects keyed by header. Rows before the first row
 * that satisfies `isHeader` are skipped (LinkedIn prepends notes).
 */
export function parseCsvRecords(
  text: string,
  isHeader: (cells: string[]) => boolean = () => true,
): Record<string, string>[] {
  const rows = parseCsv(text);
  const headerIndex = rows.findIndex((cells) =>
    isHeader(cells.map((c) => c.trim())),
  );
  if (headerIndex === -1) return [];

  const header = rows[headerIndex].map((c) => c.trim());
  return rows.slice(headerIndex + 1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] ?? "").trim();
    });
    return record;
  });
}
