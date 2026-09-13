import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { slugify } from "./lib/utils";

/** Resolves a topic by name, creating it on first use. */
export async function getOrCreateTopic(
  ctx: MutationCtx,
  name: string,
): Promise<Id<"topics">> {
  const trimmed = name.trim();
  const slug = slugify(trimmed);

  const existing = await ctx.db
    .query("topics")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing) return existing._id;

  return await ctx.db.insert("topics", { name: trimmed, slug });
}
