import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  monthKeyFor,
  monthRangeFor,
  shiftDate,
  todayInIST,
  weekKeyFor,
  weekRangeFor,
} from "./lib/utils";
import {
  getProductBadges,
  resolveLogoUrl,
  withViewerUpvote,
} from "./lib/productView";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type Period = Doc<"dailyRankings">["period"];

const MAX_RANKED_PER_PERIOD = 50;
const MAX_CANDIDATES_PER_RANGE = 200;

/** Products launched in [start, end] (inclusive "YYYY-MM-DD" range), ranked by upvoteCount desc. */
async function rankProductsInRange(
  ctx: MutationCtx,
  start: string,
  end: string,
) {
  const candidates = await ctx.db
    .query("products")
    .withIndex("by_launchDay_and_upvoteCount", (q) =>
      q.gte("launchDay", start).lte("launchDay", end),
    )
    .take(MAX_CANDIDATES_PER_RANGE);

  return [...candidates]
    .sort((a, b) => b.upvoteCount - a.upvoteCount)
    .slice(0, MAX_RANKED_PER_PERIOD);
}

/** Replaces every `dailyRankings` row for (period, periodKey) with a fresh ranked snapshot. */
async function replaceRankings(
  ctx: MutationCtx,
  period: Period,
  periodKey: string,
  ranked: Doc<"products">[],
) {
  const existing = await ctx.db
    .query("dailyRankings")
    .withIndex("by_period_and_key", (q) =>
      q.eq("period", period).eq("periodKey", periodKey),
    )
    .take(MAX_RANKED_PER_PERIOD);
  for (const row of existing) {
    await ctx.db.delete("dailyRankings", row._id);
  }

  for (let i = 0; i < ranked.length; i++) {
    await ctx.db.insert("dailyRankings", {
      period,
      periodKey,
      productId: ranked[i]._id,
      rank: i + 1,
      upvoteCountAtClose: ranked[i].upvoteCount,
    });
  }
}

/**
 * Snapshots day/week/month rankings for the most recently closed IST day
 * (or an explicit `day`, for backfill/manual testing). Runs nightly via
 * `crons.ts` at IST midnight, and re-snapshots the in-progress week/month
 * every night so their standings stay current through today.
 */
export const snapshotRankings = internalMutation({
  args: { day: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const closingDay = args.day ?? shiftDate(todayInIST(), -1);

    const dayRanked = await rankProductsInRange(ctx, closingDay, closingDay);
    await replaceRankings(ctx, "day", closingDay, dayRanked);

    const weekRange = weekRangeFor(closingDay);
    const weekRanked = await rankProductsInRange(
      ctx,
      weekRange.start,
      weekRange.end,
    );
    await replaceRankings(ctx, "week", weekKeyFor(closingDay), weekRanked);

    const monthRange = monthRangeFor(closingDay);
    const monthRanked = await rankProductsInRange(
      ctx,
      monthRange.start,
      monthRange.end,
    );
    await replaceRankings(ctx, "month", monthKeyFor(closingDay), monthRanked);
  },
});

export const getLeaderboard = query({
  args: {
    period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
    periodKey: v.string(),
    categorySlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let allowedProductIds: Set<Id<"products">> | null = null;
    if (args.categorySlug) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug!))
        .unique();
      if (!category) return [];

      const links = await ctx.db
        .query("productCategories")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .take(200);
      allowedProductIds = new Set(links.map((link) => link.productId));
    }

    const rankings = await ctx.db
      .query("dailyRankings")
      .withIndex("by_period_and_key", (q) =>
        q.eq("period", args.period).eq("periodKey", args.periodKey),
      )
      .take(MAX_RANKED_PER_PERIOD);
    rankings.sort((a, b) => a.rank - b.rank);

    const filtered = allowedProductIds
      ? rankings.filter((ranking) => allowedProductIds!.has(ranking.productId))
      : rankings;

    const rows = await Promise.all(
      filtered.map(async (ranking) => {
        const product = await ctx.db.get("products", ranking.productId);
        if (!product) return null;
        return {
          ...(await withViewerUpvote(ctx, product)),
          logoUrl: await resolveLogoUrl(ctx, product),
          badges: await getProductBadges(ctx, product._id),
        };
      }),
    );
    return rows.filter((row): row is NonNullable<typeof row> => row !== null);
  },
});
