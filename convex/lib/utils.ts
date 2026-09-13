import type { MutationCtx } from "../_generated/server";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Today's date ("YYYY-MM-DD") in IST, via fixed UTC+5:30 arithmetic. */
export function todayInIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The date ("YYYY-MM-DD") `daysAgo` days before today, in IST. */
export function daysAgoInIST(daysAgo: number): string {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return new Date(Date.now() + IST_OFFSET_MS - daysAgo * ONE_DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Shifts a "YYYY-MM-DD" string by `deltaDays`, without timezone drift. */
export function shiftDate(isoDate: string, deltaDays: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
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
  // The ISO week-year is the year of that week's Thursday.
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

/** Month key ("YYYY-MM") for a "YYYY-MM-DD" date. */
export function monthKeyFor(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** First and last "YYYY-MM-DD" of the calendar month containing `isoDate`. */
export function monthRangeFor(isoDate: string): { start: string; end: string } {
  const [year, month] = isoDate.split("-").map(Number);
  const start = `${isoDate.slice(0, 7)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${isoDate.slice(0, 7)}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "product";
}

/** Slugifies `name`, appending `-2`, `-3`, ... until the slug is unused. */
export async function generateUniqueSlug(
  ctx: MutationCtx,
  name: string,
): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 2;
  while (
    await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique()
  ) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}
