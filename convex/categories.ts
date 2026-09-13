import { internalMutation, query } from "./_generated/server";
import { slugify } from "./lib/utils";

const SEED_CATEGORIES = [
  "AI",
  "SaaS",
  "Dev Tools",
  "Hardware",
  "Design",
  "Productivity",
  "Marketing",
  "Fintech",
  "Health & Fitness",
  "Education",
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").take(50);
  },
});

/** One-off seed for the curated category list. Safe to re-run — skips existing slugs. */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const name of SEED_CATEGORIES) {
      const slug = slugify(name);
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!existing) {
        await ctx.db.insert("categories", { name, slug });
      }
    }
  },
});
