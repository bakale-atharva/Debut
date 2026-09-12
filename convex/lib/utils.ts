import type { MutationCtx } from "../_generated/server";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Today's date ("YYYY-MM-DD") in IST, via fixed UTC+5:30 arithmetic. */
export function todayInIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
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
