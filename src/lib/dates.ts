export function parseIsoDateToUtcMidnight(iso: string): Date {
  // Expect YYYY-MM-DD
  return new Date(`${iso}T00:00:00.000Z`);
}

export function formatDateIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function daysBetweenInclusive(startIso: string, endIso: string): number {
  const start = parseIsoDateToUtcMidnight(startIso);
  const end = parseIsoDateToUtcMidnight(endIso);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export function addDaysIso(startIso: string, days: number): string {
  const d = parseIsoDateToUtcMidnight(startIso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateIso(d);
}

export function dayOffset(startIso: string, dateIso: string): number {
  const start = parseIsoDateToUtcMidnight(startIso);
  const d = parseIsoDateToUtcMidnight(dateIso);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

