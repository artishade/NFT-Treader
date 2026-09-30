import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Trades ─────────────────────────────────────────────────────────────────
export const recentTrades = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 60;
    return await ctx.db.query("trades").withIndex("by_ts").order("desc").take(limit);
  },
});

export const tradesByUser = query({
  args: { maker: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 80;
    const byMaker = await ctx.db
      .query("trades")
      .withIndex("by_maker", (q) => q.eq("maker", args.maker))
      .order("desc")
      .take(limit);
    const asParty = await ctx.db
      .query("trades")
      .withIndex("by_ts")
      .order("desc")
      .take(400);
    const filtered = asParty.filter((t) => t.counterparty === args.maker && t.maker !== args.maker);
    const merged = [...byMaker, ...filtered].sort((a, b) => b.ts - a.ts).slice(0, limit);
    return merged;
  },
});

function fakeTxHash(): string {
  const hex = "0123456789abcdef";
  let h = "0x";
  for (let i = 0; i < 64; i++) h += hex[Math.floor(Math.random() * 16)];
  return h;
}

export const recordTrade = mutation({
  args: {
    kind: v.string(),
    collection: v.string(),
    tokenId: v.optional(v.number()),
    price: v.number(),
    marketplace: v.string(),
    maker: v.string(),
    counterparty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ts = Date.now();
    const txHash = fakeTxHash();
    const id = await ctx.db.insert("trades", { ...args, txHash, ts });
    return { id, txHash, ts };
  },
});

export const clearUserTrades = mutation({
  args: { maker: v.string() },
  handler: async (ctx, args) => {
    const mine = await ctx.db
      .query("trades")
      .withIndex("by_maker", (q) => q.eq("maker", args.maker))
      .collect();
    for (const t of mine) await ctx.db.delete(t._id);
    return mine.length;
  },
});

// ── Listings (user-created sell orders) ────────────────────────────────────
export const userListings = query({
  args: { seller: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("seller", args.seller))
      .order("desc")
      .take(100),
});

export const createListing = mutation({
  args: {
    collection: v.string(),
    tokenId: v.number(),
    seller: v.string(),
    price: v.number(),
    marketplace: v.string(),
  },
  handler: async (ctx, args) => {
    const ts = Date.now();
    const txHash = fakeTxHash();
    const id = await ctx.db.insert("listings", { ...args, ts });
    await ctx.db.insert("trades", {
      kind: "LIST",
      collection: args.collection,
      tokenId: args.tokenId,
      price: args.price,
      marketplace: args.marketplace,
      maker: args.seller,
      txHash,
      ts,
    });
    return { id, txHash, ts };
  },
});

export const cancelListing = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Watchlist ──────────────────────────────────────────────────────────────
export const watchlist = query({
  args: { user: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("user", args.user))
      .order("desc")
      .take(60),
});

export const toggleWatch = mutation({
  args: { user: v.string(), collection: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_collection", (q) =>
        q.eq("user", args.user).eq("collection", args.collection),
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("watchlist", { user: args.user, collection: args.collection, ts: Date.now() });
    return true;
  },
});

export const isWatched = query({
  args: { user: v.string(), collection: v.string() },
  handler: async (ctx, args) =>
    !!(await ctx.db
      .query("watchlist")
      .withIndex("by_user_collection", (q) =>
        q.eq("user", args.user).eq("collection", args.collection),
      )
      .first()),
});
