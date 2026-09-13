import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser, getViewerUserId } from "./users";

const MAX_COMMENT_LENGTH = 2000;

export const create = mutation({
  args: {
    productId: v.id("products"),
    body: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (!body) throw new Error("Comment cannot be empty");
    if (body.length > MAX_COMMENT_LENGTH) {
      throw new Error(
        `Comments must be ${MAX_COMMENT_LENGTH} characters or fewer`,
      );
    }

    const product = await ctx.db.get("products", args.productId);
    if (!product) throw new Error("Product not found");

    if (args.parentCommentId) {
      const parent = await ctx.db.get("comments", args.parentCommentId);
      if (!parent || parent.productId !== args.productId) {
        throw new Error("Invalid parent comment");
      }
    }

    const authorId = await getOrCreateUser(ctx);

    return await ctx.db.insert("comments", {
      productId: args.productId,
      authorId,
      parentCommentId: args.parentCommentId,
      body,
      upvoteCount: 0,
    });
  },
});

export const listForProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .take(500);

    const makerLinks = await ctx.db
      .query("makers")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .take(20);
    const makerIds = new Set(makerLinks.map((link) => link.userId));

    const viewerUserId = await getViewerUserId(ctx);

    return await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get("users", comment.authorId);

        let viewerHasUpvoted = false;
        if (viewerUserId) {
          const existing = await ctx.db
            .query("commentUpvotes")
            .withIndex("by_comment_and_user", (q) =>
              q.eq("commentId", comment._id).eq("userId", viewerUserId),
            )
            .unique();
          viewerHasUpvoted = existing !== null;
        }

        return {
          ...comment,
          authorName: author?.name ?? "Deleted user",
          authorAvatarUrl: author?.avatarUrl,
          isMaker: makerIds.has(comment.authorId),
          viewerHasUpvoted,
        };
      }),
    );
  },
});

/** The most recent comments site-wide, for a homepage "recent discussion" widget. */
export const recent = query({
  args: {},
  handler: async (ctx) => {
    const comments = await ctx.db.query("comments").order("desc").take(5);

    const rows = await Promise.all(
      comments.map(async (comment) => {
        const [author, product] = await Promise.all([
          ctx.db.get("users", comment.authorId),
          ctx.db.get("products", comment.productId),
        ]);
        if (!product) return null;

        return {
          _id: comment._id,
          body: comment.body,
          authorName: author?.name ?? "Deleted user",
          authorAvatarUrl: author?.avatarUrl,
          productName: product.name,
          productSlug: product.slug,
        };
      }),
    );

    return rows.filter((row): row is NonNullable<typeof row> => row !== null);
  },
});

export const toggleUpvote = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const comment = await ctx.db.get("comments", args.commentId);
    if (!comment) throw new Error("Comment not found");

    const existing = await ctx.db
      .query("commentUpvotes")
      .withIndex("by_comment_and_user", (q) =>
        q.eq("commentId", args.commentId).eq("userId", userId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete("commentUpvotes", existing._id);
      await ctx.db.patch("comments", args.commentId, {
        upvoteCount: comment.upvoteCount - 1,
      });
      return { upvoted: false };
    }

    await ctx.db.insert("commentUpvotes", {
      commentId: args.commentId,
      userId,
    });
    await ctx.db.patch("comments", args.commentId, {
      upvoteCount: comment.upvoteCount + 1,
    });
    return { upvoted: true };
  },
});
