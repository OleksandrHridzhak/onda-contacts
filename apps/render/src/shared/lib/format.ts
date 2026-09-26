const DAY_MS = 24 * 60 * 60 * 1000;

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

/** "today", "yesterday", "3 weeks ago", "in 2 days"… */
export function formatRelativeDays(days: number): string {
  const abs = Math.abs(days);
  if (abs < 7) return relativeFormatter.format(days, "day");
  if (abs < 30) return relativeFormatter.format(Math.round(days / 7), "week");
  if (abs < 365)
    return relativeFormatter.format(Math.round(days / 30), "month");
  return relativeFormatter.format(Math.round(days / 365), "year");
}

export function formatRelativeDate(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "never";
  const date = new Date(iso);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return formatRelativeDays(
    Math.round((startOfDate.getTime() - startOfToday.getTime()) / DAY_MS),
  );
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "YYYY-MM-DD" or "--MM-DD" → "12 March" / "12 March 1995". */
export function formatBirthday(birthday: string | null): string {
  if (!birthday) return "";
  const match = /^(\d{4}|-)-?(\d{2})-(\d{2})$/.exec(birthday);
  if (!match) return birthday;
  const hasYear = match[1] !== "-";
  const date = new Date(
    hasYear ? Number(match[1]) : 2000,
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(hasYear ? { year: "numeric" } : {}),
  });
}

/** Date → "YYYY-MM-DD" in local time (for <input type="date">). */
export function toDateInputValue(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
