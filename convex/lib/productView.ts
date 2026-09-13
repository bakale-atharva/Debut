import { getViewerUserId } from "../users";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export async function withViewerUpvote(ctx: QueryCtx, product: Doc<"products">) {
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

export async function resolveLogoUrl(ctx: QueryCtx, product: Doc<"products">) {
  if (!product.logoStorageId) return undefined;
  return (await ctx.storage.getUrl(product.logoStorageId)) ?? undefined;
}

export type ProductBadges = {
  isProductOfDay: boolean;
  isProductOfWeek: boolean;
  isProductOfMonth: boolean;
};

/** A product is "of the day/week/month" when it holds rank 1 in its most recent snapshot for that period. */
export async function getProductBadges(
  ctx: QueryCtx,
  productId: Doc<"products">["_id"],
): Promise<ProductBadges> {
  const rankings = await ctx.db
    .query("dailyRankings")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .take(20);
  const rank1Periods = new Set(
    rankings.filter((ranking) => ranking.rank === 1).map((ranking) => ranking.period),
  );
  return {
    isProductOfDay: rank1Periods.has("day"),
    isProductOfWeek: rank1Periods.has("week"),
    isProductOfMonth: rank1Periods.has("month"),
  };
}
