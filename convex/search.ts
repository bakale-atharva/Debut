import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  getProductBadges,
  resolveLogoUrl,
  withViewerUpvote,
} from "./lib/productView";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const MAX_RESULTS = 30;
const MAX_SIMILAR = 6;
const TRENDING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const MAX_RECENT_UPVOTES_SCANNED = 500;

const filterArgs = {
  categorySlug: v.optional(v.string()),
  pricingType: v.optional(
    v.union(v.literal("free"), v.literal("freemium"), v.literal("paid")),
  ),
  day: v.optional(v.string()),
};

/** Product ids in a category, or `null` when no category filter is active. */
async function categoryProductIds(
  ctx: QueryCtx,
  categorySlug: string | undefined,
): Promise<Set<Id<"products">> | null> {
  if (!categorySlug) return null;
  const category = await ctx.db
    .query("categories")
    .withIndex("by_slug", (q) => q.eq("slug", categorySlug))
    .unique();
  if (!category) return new Set();

  const links = await ctx.db
    .query("productCategories")
    .withIndex("by_category", (q) => q.eq("categoryId", category._id))
    .take(200);
  return new Set(links.map((link) => link.productId));
}

async function hydrateProduct(ctx: QueryCtx, product: Doc<"products">) {
  return {
    ...(await withViewerUpvote(ctx, product)),
    logoUrl: await resolveLogoUrl(ctx, product),
    badges: await getProductBadges(ctx, product._id),
  };
}

/** Full-text search over product names, backed by the `search_products` search index. */
export const search = query({
  args: { term: v.string(), ...filterArgs },
  handler: async (ctx, args) => {
    const term = args.term.trim();
    if (!term) return [];

    const allowedProductIds = await categoryProductIds(ctx, args.categorySlug);

    const hits = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) => {
        let builder = q.search("name", term);
        if (args.day) builder = builder.eq("launchDay", args.day);
        if (args.pricingType)
          builder = builder.eq("pricingType", args.pricingType);
        return builder;
      })
      .take(MAX_RESULTS);

    const filtered = allowedProductIds
      ? hits.filter((product) => allowedProductIds.has(product._id))
      : hits;

    return await Promise.all(
      filtered.map((product) => hydrateProduct(ctx, product)),
    );
  },
});

/** Products with the most upvotes in the last `TRENDING_WINDOW_MS` — the default, query-less discovery view. */
export const trending = query({
  args: filterArgs,
  handler: async (ctx, args) => {
    const cutoff = Date.now() - TRENDING_WINDOW_MS;
    const recentUpvotes = await ctx.db
      .query("upvotes")
      .withIndex("by_creation_time", (q) => q.gte("_creationTime", cutoff))
      .order("desc")
      .take(MAX_RECENT_UPVOTES_SCANNED);

    const counts = new Map<Id<"products">, number>();
    for (const upvote of recentUpvotes) {
      counts.set(upvote.productId, (counts.get(upvote.productId) ?? 0) + 1);
    }

    const allowedProductIds = await categoryProductIds(ctx, args.categorySlug);
    const ranked = [...counts.entries()]
      .filter(
        ([productId]) => !allowedProductIds || allowedProductIds.has(productId),
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_RESULTS);

    const candidates = await Promise.all(
      ranked.map(([productId]) => ctx.db.get("products", productId)),
    );
    const products = candidates.filter(
      (product): product is Doc<"products"> => {
        if (!product) return false;
        if (args.day && product.launchDay !== args.day) return false;
        if (args.pricingType && product.pricingType !== args.pricingType)
          return false;
        return true;
      },
    );

    return await Promise.all(
      products.map((product) => hydrateProduct(ctx, product)),
    );
  },
});

/** Products sharing the most categories/topics with `productId`, ranked by overlap count. */
export const similar = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const categoryLinks = await ctx.db
      .query("productCategories")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .take(10);
    const topicLinks = await ctx.db
      .query("productTopics")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .take(10);

    const sharedCount = new Map<Id<"products">, number>();
    const tally = async (peers: { productId: Id<"products"> }[]) => {
      for (const peer of peers) {
        if (peer.productId === args.productId) continue;
        sharedCount.set(
          peer.productId,
          (sharedCount.get(peer.productId) ?? 0) + 1,
        );
      }
    };

    for (const link of categoryLinks) {
      const peers = await ctx.db
        .query("productCategories")
        .withIndex("by_category", (q) => q.eq("categoryId", link.categoryId))
        .take(50);
      await tally(peers);
    }
    for (const link of topicLinks) {
      const peers = await ctx.db
        .query("productTopics")
        .withIndex("by_topic", (q) => q.eq("topicId", link.topicId))
        .take(50);
      await tally(peers);
    }

    const ranked = [...sharedCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SIMILAR);

    const candidates = await Promise.all(
      ranked.map(([productId]) => ctx.db.get("products", productId)),
    );
    const products = candidates.filter(
      (product): product is Doc<"products"> => product !== null,
    );

    return await Promise.all(
      products.map((product) => hydrateProduct(ctx, product)),
    );
  },
});
