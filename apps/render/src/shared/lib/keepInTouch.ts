export const KEEP_IN_TOUCH_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: "No reminder" },
  { days: 7, label: "Every week" },
  { days: 14, label: "Every 2 weeks" },
  { days: 30, label: "Every month" },
  { days: 90, label: "Every 3 months" },
  { days: 180, label: "Every 6 months" },
  { days: 365, label: "Every year" },
];

export function keepInTouchLabel(days: number | null): string {
  if (!days) return KEEP_IN_TOUCH_OPTIONS[0].label;
  return (
    KEEP_IN_TOUCH_OPTIONS.find((option) => option.days === days)?.label ??
    `Every ${days} days`
  );
}

/** "overdue by 3 days" / "due today" / "due in 12 days". */
export function describeCheckIn(days: number): string {
  const plural = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
  if (days < 0) return `overdue by ${plural(-days)}`;
  if (days === 0) return "due today";
  return `due in ${plural(days)}`;
}
