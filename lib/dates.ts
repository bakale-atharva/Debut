const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Today's date ("YYYY-MM-DD") in IST, via fixed UTC+5:30 arithmetic. */
export function todayInIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Shifts a "YYYY-MM-DD" string by `deltaDays`, without client timezone drift. */
export function shiftDate(isoDate: string, deltaDays: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

/** Formats a "YYYY-MM-DD" string for display, without client timezone drift. */
export function formatDisplayDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Monday ("YYYY-MM-DD") of the ISO-8601 week containing `isoDate`. */
function isoWeekMonday(isoDate: string): Date {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum);
  return date;
}

/** ISO-8601 week key ("YYYY-Www") for a "YYYY-MM-DD" date, via fixed UTC arithmetic (no Intl). */
export function weekKeyFor(isoDate: string): string {
  const monday = isoWeekMonday(isoDate);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const isoYear = thursday.getUTCFullYear();

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week1Monday = isoWeekMonday(jan4.toISOString().slice(0, 10));
  const weekNum =
    Math.round((monday.getTime() - week1Monday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${isoYear}-W${String(weekNum).padStart(2, "0")}`;
}

/** Start (Monday) and end (Sunday) "YYYY-MM-DD" of the ISO week containing `isoDate`. */
export function weekRangeFor(isoDate: string): { start: string; end: string } {
  const monday = isoWeekMonday(isoDate);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

/** Shifts an ISO week key ("YYYY-Www") by `deltaWeeks`. */
export function shiftWeek(weekKey: string, deltaWeeks: number): string {
  const [yearStr, weekStr] = weekKey.split("-W");
  const jan4 = new Date(Date.UTC(Number(yearStr), 0, 4));
  const week1Monday = isoWeekMonday(jan4.toISOString().slice(0, 10));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (Number(weekStr) - 1 + deltaWeeks) * 7);
  return weekKeyFor(monday.toISOString().slice(0, 10));
}

/** Formats an ISO week key ("YYYY-Www") for display, e.g. "Sep 8 – Sep 14, 2026". */
export function formatWeekLabel(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split("-W");
  const jan4 = new Date(Date.UTC(Number(yearStr), 0, 4));
  const week1Monday = isoWeekMonday(jan4.toISOString().slice(0, 10));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (Number(weekStr) - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: withYear ? "numeric" : undefined,
      timeZone: "UTC",
    });
  return `${fmt(monday, false)} – ${fmt(sunday, true)}`;
}

/** Month key ("YYYY-MM") for a "YYYY-MM-DD" date. */
export function monthKeyFor(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** Shifts a "YYYY-MM" month key by `deltaMonths`. */
export function shiftMonth(monthKey: string, deltaMonths: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + deltaMonths, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Formats a "YYYY-MM" month key for display, e.g. "September 2026". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
