import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser } from "./users";

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const product = await ctx.db.get("products", args.productId);
    if (!product) throw new Error("Product not found");

    const existing = await ctx.db
      .query("upvotes")
      .withIndex("by_product_and_user", (q) =>
        q.eq("productId", args.productId).eq("userId", userId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete("upvotes", existing._id);
      await ctx.db.patch("products", args.productId, {
        upvoteCount: product.upvoteCount - 1,
      });
      return { upvoted: false };
    }

    await ctx.db.insert("upvotes", { productId: args.productId, userId });
    await ctx.db.patch("products", args.productId, {
      upvoteCount: product.upvoteCount + 1,
    });
    return { upvoted: true };
  },
});
