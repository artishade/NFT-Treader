// ── Local persistence layer ────────────────────────────────────────────────
// Mirrors the Convex trades/listings/watchlist API on top of localStorage so
// trading, listings and watchlists work even without a reachable Convex
// deployment. When VITE_CONVEX_URL is reachable, Convex is used first and
// local storage is the fallback.

export interface TradeRow {
  _id: string;
  kind: string;
  collection: string;
  tokenId?: number;
  price: number;
  marketplace: string;
  maker: string;
  counterparty?: string;
  txHash: string;
  ts: number;
}

export interface ListingRow {
  _id: string;
  collection: string;
  tokenId: number;
  seller: string;
  price: number;
  marketplace: string;
  ts: number;
}

export interface WatchRow {
  _id: string;
  user: string;
  collection: string;
  ts: number;
}

const KEYS = {
  trades: "obsidian.trades",
  listings: "obsidian.listings",
  watch: "obsidian.watch",
  holdings: "obsidian.holdings",
};

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows.slice(-500)));
  } catch {
    /* storage full or unavailable */
  }
}

function uid(): string {
  return "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fakeTxHash(): string {
  const hex = "0123456789abcdef";
  let h = "0x";
  for (let i = 0; i < 64; i++) h += hex[Math.floor(Math.random() * 16)];
  return h;
}

export interface TradeInput {
  kind: string;
  collection: string;
  tokenId?: number;
  price: number;
  marketplace: string;
  maker: string;
  counterparty?: string;
}

export function localRecordTrade(input: TradeInput): { id: string; txHash: string; ts: number } {
  const ts = Date.now();
  const txHash = fakeTxHash();
  const row: TradeRow = { _id: uid(), ...input, txHash, ts };
  write(KEYS.trades, [...read<TradeRow>(KEYS.trades), row]);
  return { id: row._id, txHash, ts };
}

export function localRecentTrades(limit = 60): TradeRow[] {
  return read<TradeRow>(KEYS.trades)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);
}

export function localTradesByUser(maker: string, limit = 80): TradeRow[] {
  return localRecentTrades(400).filter(
    (t) => t.maker === maker || t.counterparty === maker,
  ).slice(0, limit);
}

export function localClearUserTrades(maker: string): number {
  const rows = read<TradeRow>(KEYS.trades);
  const keep = rows.filter((t) => t.maker !== maker);
  write(KEYS.trades, keep);
  return rows.length - keep.length;
}

export interface ListingInput {
  collection: string;
  tokenId: number;
  seller: string;
  price: number;
  marketplace: string;
}

export function localCreateListing(input: ListingInput): { id: string; txHash: string; ts: number } {
  const ts = Date.now();
  const txHash = fakeTxHash();
  const row: ListingRow = { _id: uid(), ...input, ts };
  write(KEYS.listings, [...read<ListingRow>(KEYS.listings), row]);
  localRecordTrade({
    kind: "LIST",
    collection: input.collection,
    tokenId: input.tokenId,
    price: input.price,
    marketplace: input.marketplace,
    maker: input.seller,
  });
  return { id: row._id, txHash, ts };
}

export function localUserListings(seller: string): ListingRow[] {
  return read<ListingRow>(KEYS.listings)
    .filter((l) => l.seller === seller)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 100);
}

export function localCancelListing(id: string) {
  write(
    KEYS.listings,
    read<ListingRow>(KEYS.listings).filter((l) => l._id !== id),
  );
}

export function localWatchlist(user: string): WatchRow[] {
  return read<WatchRow>(KEYS.watch)
    .filter((w) => w.user === user)
    .sort((a, b) => b.ts - a.ts);
}

export function localToggleWatch(user: string, collection: string): boolean {
  const rows = read<WatchRow>(KEYS.watch);
  const existing = rows.find((w) => w.user === user && w.collection === collection);
  if (existing) {
    write(KEYS.watch, rows.filter((w) => w._id !== existing._id));
    return false;
  }
  write(KEYS.watch, [...rows, { _id: uid(), user, collection, ts: Date.now() }]);
  return true;
}

export function localIsWatched(user: string, collection: string): boolean {
  return read<WatchRow>(KEYS.watch).some((w) => w.user === user && w.collection === collection);
}

// ── Holdings (tokens acquired through the terminal) ──────────────────────
export function localAddHolding(itemId: string) {
  const rows = read<string>(KEYS.holdings);
  if (!rows.includes(itemId)) write(KEYS.holdings, [...rows, itemId]);
}

export function localHoldings(): string[] {
  return read<string>(KEYS.holdings);
}

export function localRemoveHolding(itemId: string) {
  write(
    KEYS.holdings,
    read<string>(KEYS.holdings).filter((h) => h !== itemId),
  );
}
