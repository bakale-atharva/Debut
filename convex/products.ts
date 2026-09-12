import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser, getViewerUserId } from "./users";
import { generateUniqueSlug, todayInIST } from "./lib/utils";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

async function withViewerUpvote(ctx: QueryCtx, product: Doc<"products">) {
  const viewerUserId = await getViewerUserId(ctx);
  if (!viewerUserId) return { ...product, viewerHasUpvoted: false };

  const existing = await ctx.db
    .query("upvotes")
    .withIndex("by_product_and_user", (q) =>
      q.eq("productId", product._id).eq("userId", viewerUserId),
    )
    .unique();
  return { ...product, viewerHasUpvoted: existing !== null };
}

export const create = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    description: v.string(),
    websiteUrl: v.string(),
    pricingType: v.union(
      v.literal("free"),
      v.literal("freemium"),
      v.literal("paid"),
    ),
  },
  handler: async (ctx, args) => {
    const submitterId = await getOrCreateUser(ctx);
    const slug = await generateUniqueSlug(ctx, args.name);

    const id = await ctx.db.insert("products", {
      name: args.name,
      tagline: args.tagline,
      description: args.description,
      websiteUrl: args.websiteUrl,
      pricingType: args.pricingType,
      slug,
      logoSeed: slug,
      submitterId,
      launchDay: todayInIST(),
      upvoteCount: 0,
      isFeatured: false,
    });

    return { id, slug };
  },
});

export const list = query({
  args: { day: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_launchDay_and_upvoteCount", (q) => q.eq("launchDay", args.day))
      .order("desc")
      .take(50);

    return await Promise.all(products.map((product) => withViewerUpvote(ctx, product)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!product) return null;

    return await withViewerUpvote(ctx, product);
  },
});
