const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/** "2023-06-01" -> "Jun 2023" */
export function formatMonth(isoDate) {
  return monthYear.format(new Date(`${isoDate}T00:00:00Z`));
}

/** "Jun 2023 – Jul 2025", or "Jun 2023 – present" for a current role. */
export function formatRange(start, end) {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : "present"}`;
}

/**
 * Length of a finished role, counting both the first and last month:
 * Jun 2023 to Jul 2025 is "2 yrs 2 mos". Returns "" for a current role.
 */
export function formatDuration(start, end) {
  if (!end) return "";
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  const months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth()) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? "mo" : "mos"}`);
  return parts.join(" ");
}

/** "2019-01-01" -> "2019" */
export function formatYear(isoDate) {
  return isoDate.slice(0, 4);
}
