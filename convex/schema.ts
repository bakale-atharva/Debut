import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  topics: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    tagline: v.string(),
    description: v.string(),
    websiteUrl: v.string(),
    pricingType: v.union(
      v.literal("free"),
      v.literal("freemium"),
      v.literal("paid"),
    ),
    logoSeed: v.string(), // deterministic seed for generated SVG monogram
    logoStorageId: v.optional(v.id("_storage")), // reserved for future real-logo upload
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    videoUrl: v.optional(v.string()),
    submitterId: v.id("users"),
    launchDay: v.string(), // "YYYY-MM-DD" in IST
    upvoteCount: v.number(), // denormalized counter, never derived via .collect().length
    isFeatured: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_launchDay_and_upvoteCount", ["launchDay", "upvoteCount"])
    .index("by_upvoteCount", ["upvoteCount"])
    .index("by_submitter", ["submitterId"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["launchDay", "pricingType"],
    }),

  productCategories: defineTable({
    productId: v.id("products"),
    categoryId: v.id("categories"),
  })
    .index("by_product", ["productId"])
    .index("by_category", ["categoryId"]),

  productTopics: defineTable({
    productId: v.id("products"),
    topicId: v.id("topics"),
  })
    .index("by_product", ["productId"])
    .index("by_topic", ["topicId"]),

  makers: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    role: v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),

  upvotes: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
  })
    .index("by_product_and_user", ["productId", "userId"])
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),

  comments: defineTable({
    productId: v.id("products"),
    authorId: v.id("users"),
    parentCommentId: v.optional(v.id("comments")),
    body: v.string(),
    upvoteCount: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_parent", ["parentCommentId"]),

  commentUpvotes: defineTable({
    commentId: v.id("comments"),
    userId: v.id("users"),
  }).index("by_comment_and_user", ["commentId", "userId"]),

  dailyRankings: defineTable({
    period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
    periodKey: v.string(), // "2026-09-12" | "2026-W37" | "2026-09"
    productId: v.id("products"),
    rank: v.number(),
    upvoteCountAtClose: v.number(),
  })
    .index("by_period_and_key", ["period", "periodKey"])
    .index("by_product", ["productId"]),
});
