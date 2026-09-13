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
