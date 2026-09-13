import { query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

/**
 * Resolves the caller's `users` row, creating it on first sight from their
 * Clerk identity. Throws if the caller isn't authenticated.
 */
export async function getOrCreateUser(ctx: MutationCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const existing = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (existing) return existing._id;

  return await ctx.db.insert("users", {
    tokenIdentifier: identity.tokenIdentifier,
    name: identity.name ?? identity.email ?? "Anonymous",
    avatarUrl: identity.pictureUrl,
    email: identity.email,
  });
}

/** The caller's `users` row id, or `null` if signed out or never synced. */
export async function getViewerUserId(
  ctx: QueryCtx,
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  return user?._id ?? null;
}

/** Case-insensitive substring search over known users, for the maker picker. */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const term = args.query.trim().toLowerCase();
    if (!term) return [];

    const candidates = await ctx.db.query("users").take(200);
    return candidates
      .filter((user) => user.name.toLowerCase().includes(term))
      .slice(0, 20);
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getViewerUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get("users", userId);
  },
});
