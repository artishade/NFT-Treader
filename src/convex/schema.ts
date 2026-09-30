import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trades: defineTable({
    kind: v.string(), // BUY | SELL | LIST | OFFER
    collection: v.string(),
    tokenId: v.optional(v.number()),
    price: v.number(), // ETH
    marketplace: v.string(),
    maker: v.string(), // wallet address
    counterparty: v.optional(v.string()),
    txHash: v.string(),
    ts: v.number(),
  })
    .index("by_ts", ["ts"])
    .index("by_maker", ["maker"])
    .index("by_collection", ["collection"]),

  listings: defineTable({
    collection: v.string(),
    tokenId: v.number(),
    seller: v.string(),
    price: v.number(),
    marketplace: v.string(),
    ts: v.number(),
  })
    .index("by_seller", ["seller"])
    .index("by_collection", ["collection"]),

  watchlist: defineTable({
    user: v.string(),
    collection: v.string(),
    ts: v.number(),
  })
    .index("by_user", ["user"])
    .index("by_user_collection", ["user", "collection"]),
});
