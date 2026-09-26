/**
 * Meta (Instagram / Threads / Facebook) exports store UTF-8 bytes as
 * Latin-1 code points (mojibake). Re-decode them when possible.
 */
export function fixMetaEncoding(value: string): string {
  const codes = Array.from(value, (char) => char.charCodeAt(0));
  if (!codes.some((code) => code > 0x7f) || codes.some((code) => code > 0xff)) {
    return value;
  }
  try {
    const bytes = Uint8Array.from(codes);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Converts unix seconds / ISO / "15 Mar 2021" into an ISO string. */
export function toIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const seconds = Number(value);
    const ms = seconds > 1e12 ? seconds : seconds * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function fileBaseName(path: string): string {
  return path.split(/[\\/]/).pop()?.toLowerCase() ?? "";
}

export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Accepts "YYYY-MM-DD", "YYYYMMDD" or "--MM-DD"; returns null otherwise. */
export function normalizeBirthday(
  value: string | null | undefined,
): string | null {
  const clean = (value ?? "").trim().replace(/T.*$/, "");
  let match = /^(\d{4})-?(\d{2})-?(\d{2})$/.exec(clean);
  if (match) {
    // Apple uses year 1604 for "no year".
    return match[1] === "1604"
      ? `--${match[2]}-${match[3]}`
      : `${match[1]}-${match[2]}-${match[3]}`;
  }
  match = /^--(\d{2})-?(\d{2})$/.exec(clean);
  return match ? `--${match[1]}-${match[2]}` : null;
}
