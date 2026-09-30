// ── Data layer: Convex first, local fallback ───────────────────────────────
// Convex is the source of truth when a reachable VITE_CONVEX_URL is
// configured. Otherwise (and as a safety net on failures) the same API is
// served from localStorage so trading, listings and watchlists always work.

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  localRecordTrade, localRecentTrades, localTradesByUser, localClearUserTrades,
  localCreateListing, localUserListings, localCancelListing,
  localWatchlist, localToggleWatch, localIsWatched,
  type TradeRow, type ListingRow, type WatchRow,
} from "./localStore";

const CONVEX_CONFIGURED = !!import.meta.env.VITE_CONVEX_URL;

function useConvexAvailable(): boolean {
  const convex = useConvex();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!CONVEX_CONFIGURED) return;
    let cancelled = false;
    convex
      .query(api.trades.recentTrades, { limit: 1 })
      .then(() => !cancelled && setOk(true))
      .catch(() => !cancelled && setOk(false));
    return () => {
      cancelled = true;
    };
  }, [convex]);
  return CONVEX_CONFIGURED && ok;
}

// ── Trades ─────────────────────────────────────────────────────────────────
export function useRecentTrades(limit = 40): Array<TradeRow> {
  const available = useConvexAvailable();
  const rows = useQuery(
    api.trades.recentTrades,
    available ? { limit } : "skip",
  );
  return useMemo(() => {
    if (available && rows) return rows as TradeRow[];
    return localRecentTrades(limit);
  }, [available, rows, limit]);
}

export function useTradesByUser(maker: string | null, limit = 80): Array<TradeRow> {
  const available = useConvexAvailable();
  const rows = useQuery(
    api.trades.tradesByUser,
    available && maker ? { maker, limit } : "skip",
  );
  return useMemo(() => {
    if (!maker) return [];
    if (available && rows) return rows as TradeRow[];
    return localTradesByUser(maker, limit);
  }, [available, rows, maker, limit]);
}

export function useRecordTrade() {
  const available = useConvexAvailable();
  const convexRecord = useMutation(api.trades.recordTrade);
  return useMemo(
    () => async (input: Parameters<typeof convexRecord>[0]) => {
      if (available) {
        try {
          return await convexRecord(input);
        } catch {
          /* fall through to local */
        }
      }
      return localRecordTrade(input);
    },
    [available, convexRecord],
  );
}

export function useClearUserTrades() {
  const available = useConvexAvailable();
  const convexClear = useMutation(api.trades.clearUserTrades);
  return useMemo(
    () => async (maker: string) => {
      localClearUserTrades(maker);
      if (available) {
        try {
          await convexClear({ maker });
        } catch {
          /* local already cleared */
        }
      }
    },
    [available, convexClear],
  );
}

// ── Listings ───────────────────────────────────────────────────────────────
export function useUserListings(seller: string | null): Array<ListingRow> {
  const available = useConvexAvailable();
  const rows = useQuery(api.trades.userListings, available && seller ? { seller } : "skip");
  return useMemo(() => {
    if (!seller) return [];
    if (available && rows) return rows as ListingRow[];
    return localUserListings(seller);
  }, [available, rows, seller]);
}

export function useCreateListing() {
  const available = useConvexAvailable();
  const convexCreate = useMutation(api.trades.createListing);
  return useMemo(
    () => async (input: Parameters<typeof convexCreate>[0]) => {
      if (available) {
        try {
          return await convexCreate(input);
        } catch {
          /* fall through */
        }
      }
      return localCreateListing(input);
    },
    [available, convexCreate],
  );
}

export function useCancelListing() {
  const available = useConvexAvailable();
  const convexCancel = useMutation(api.trades.cancelListing);
  return useMemo(
    () => async (id: string) => {
      localCancelListing(id);
      if (available) {
        try {
          await convexCancel({ id: id as Parameters<typeof convexCancel>[0]["id"] });
        } catch {
          /* local already removed */
        }
      }
    },
    [available, convexCancel],
  );
}

// ── Watchlist ──────────────────────────────────────────────────────────────
export function useWatchlist(user: string | null): Array<WatchRow> {
  const available = useConvexAvailable();
  const rows = useQuery(api.trades.watchlist, available && user ? { user } : "skip");
  return useMemo(() => {
    if (!user) return [];
    if (available && rows) return rows as WatchRow[];
    return localWatchlist(user);
  }, [available, rows, user]);
}

export function useToggleWatch() {
  const available = useConvexAvailable();
  const convexToggle = useMutation(api.trades.toggleWatch);
  return useMemo(
    () => async (user: string, collection: string) => {
      const localResult = localToggleWatch(user, collection);
      if (available) {
        try {
          await convexToggle({ user, collection });
        } catch {
          /* keep local result */
        }
      }
      return localResult;
    },
    [available, convexToggle],
  );
}

export function useIsWatched(user: string | null, collection: string | undefined): boolean {
  const available = useConvexAvailable();
  const watched = useQuery(
    api.trades.isWatched,
    available && user && collection ? { user, collection } : "skip",
  );
  if (!user || !collection) return false;
  if (available && watched !== undefined) return watched;
  return localIsWatched(user, collection);
}
