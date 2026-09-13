import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser, getViewerUserId } from "./users";
import { generateUniqueSlug, todayInIST } from "./lib/utils";
import { getOrCreateTopic } from "./topics";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const MAX_CATEGORIES_PER_PRODUCT = 3;
const MAX_TOPICS_PER_PRODUCT = 5;
const MAX_MAKERS_PER_PRODUCT = 12;
const MAX_GALLERY_IMAGES = 10;
const FEATURED_COUNT = 5;

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

async function resolveLogoUrl(ctx: QueryCtx, product: Doc<"products">) {
  if (!product.logoStorageId) return undefined;
  return (await ctx.storage.getUrl(product.logoStorageId)) ?? undefined;
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
    categoryIds: v.array(v.id("categories")),
    topicNames: v.array(v.string()),
    makerUserIds: v.array(v.id("users")),
    logoStorageId: v.optional(v.id("_storage")),
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.categoryIds.length > MAX_CATEGORIES_PER_PRODUCT) {
      throw new Error(`Choose at most ${MAX_CATEGORIES_PER_PRODUCT} categories`);
    }
    if (args.topicNames.length > MAX_TOPICS_PER_PRODUCT) {
      throw new Error(`Add at most ${MAX_TOPICS_PER_PRODUCT} topics`);
    }
    if (args.makerUserIds.length > MAX_MAKERS_PER_PRODUCT) {
      throw new Error(`Add at most ${MAX_MAKERS_PER_PRODUCT} makers`);
    }
    if (args.galleryStorageIds && args.galleryStorageIds.length > MAX_GALLERY_IMAGES) {
      throw new Error(`Add at most ${MAX_GALLERY_IMAGES} gallery images`);
    }

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
      logoStorageId: args.logoStorageId,
      galleryStorageIds: args.galleryStorageIds,
      videoUrl: args.videoUrl,
      submitterId,
      launchDay: todayInIST(),
      upvoteCount: 0,
      isFeatured: false,
    });

    const uniqueCategoryIds = [...new Set(args.categoryIds)];
    for (const categoryId of uniqueCategoryIds) {
      await ctx.db.insert("productCategories", { productId: id, categoryId });
    }

    const uniqueTopicIds = new Set<Id<"topics">>();
    for (const rawName of args.topicNames) {
      const name = rawName.trim();
      if (!name) continue;
      uniqueTopicIds.add(await getOrCreateTopic(ctx, name));
    }
    for (const topicId of uniqueTopicIds) {
      await ctx.db.insert("productTopics", { productId: id, topicId });
    }

    const uniqueMakerIds = new Set([submitterId, ...args.makerUserIds]);
    for (const userId of uniqueMakerIds) {
      await ctx.db.insert("makers", { productId: id, userId });
    }

    return { id, slug };
  },
});

export const list = query({
  args: {
    day: v.string(),
    categorySlug: v.optional(v.string()),
    featuredOnly: v.optional(v.boolean()),
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

    const candidates = await ctx.db
      .query("products")
      .withIndex("by_launchDay_and_upvoteCount", (q) => q.eq("launchDay", args.day))
      .order("desc")
      .take(200);

    let filtered = allowedProductIds
      ? candidates.filter((product) => allowedProductIds!.has(product._id))
      : candidates;

    filtered = filtered.slice(0, args.featuredOnly ? FEATURED_COUNT : 50);

    return await Promise.all(
      filtered.map(async (product) => ({
        ...(await withViewerUpvote(ctx, product)),
        logoUrl: await resolveLogoUrl(ctx, product),
      })),
    );
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

    const categoryLinks = await ctx.db
      .query("productCategories")
      .withIndex("by_product", (q) => q.eq("productId", product._id))
      .take(10);
    const categories = await Promise.all(
      categoryLinks.map((link) => ctx.db.get("categories", link.categoryId)),
    );

    const topicLinks = await ctx.db
      .query("productTopics")
      .withIndex("by_product", (q) => q.eq("productId", product._id))
      .take(10);
    const topics = await Promise.all(
      topicLinks.map((link) => ctx.db.get("topics", link.topicId)),
    );

    const makerLinks = await ctx.db
      .query("makers")
      .withIndex("by_product", (q) => q.eq("productId", product._id))
      .take(10);
    const makers = await Promise.all(
      makerLinks.map((link) => ctx.db.get("users", link.userId)),
    );

    const galleryUrls = product.galleryStorageIds
      ? await Promise.all(product.galleryStorageIds.map((id) => ctx.storage.getUrl(id)))
      : [];

    return {
      ...(await withViewerUpvote(ctx, product)),
      logoUrl: await resolveLogoUrl(ctx, product),
      categories: categories.filter((c): c is Doc<"categories"> => c !== null),
      topics: topics.filter((t): t is Doc<"topics"> => t !== null),
      makers: makers.filter((m): m is Doc<"users"> => m !== null),
      galleryUrls: galleryUrls.filter((url): url is string => url !== null),
    };
  },
});
