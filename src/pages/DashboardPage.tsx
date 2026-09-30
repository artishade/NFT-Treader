import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, LayoutGrid, Rows3, Flame, Activity as ActivityIcon, Star, Zap,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { MarketTicker, Sparkline } from "@/components/Ticker";
import { NftArt } from "@/components/NftArt";
import { Badge, ChainDot, Stat, EmptyState } from "@/components/ui";
import { TradeModal } from "@/components/TradeModal";
import { useWallet } from "@/lib/wallet";
import { useRecentTrades, useWatchlist, useToggleWatch } from "@/lib/store";
import {
  COLLECTIONS, MARKETPLACES, activityFeed, collectionBySlug, itemsForCollection, priceHistory,
  marketplaceBySlug, type Activity, type Chain, type Collection, type NftItem,
} from "@/lib/market";
import { fmtPrice, fmtCompact, fmtPct, timeAgo, fmtUsd, ethToUsd, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "volume" | "floor" | "change" | "supply";
type Tab = "market" | "collections" | "activity";
type Scope = "all" | "watchlist";
const CHAINS: Chain[] = ["Ethereum", "Base", "Polygon", "Arbitrum", "Solana", "Bitcoin"];

export default function DashboardPage() {
  const { address } = useWallet();
  const [tab, setTab] = useState<Tab>("market");
  const [scope, setScope] = useState<Scope>("all");
  const [q, setQ] = useState("");
  const [chain, setChain] = useState<Chain | "All">("All");
  const [mk, setMk] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tradeItem, setTradeItem] = useState<NftItem | null>(null);
  const [sweep, setSweep] = useState<NftItem[]>([]);
  const [sweepOpen, setSweepOpen] = useState(false);

  const trades = useRecentTrades(40);
  const watchRows = useWatchlist(address);
  const watchedSlugs = useMemo(() => new Set((watchRows ?? []).map((w) => w.collection)), [watchRows]);

  const feed: Activity[] = useMemo(() => {
    if (trades && trades.length > 0) {
      return trades.map((t) => ({
        id: t._id,
        kind: t.kind as Activity["kind"],
        collection: t.collection,
        tokenId: t.tokenId,
        price: t.price,
        marketplace: t.marketplace,
        maker: t.maker,
        taker: t.counterparty ?? "",
        ts: t.ts,
      }));
    }
    return activityFeed(36);
  }, [trades]);

  const filtered = useMemo(() => {
    let list = COLLECTIONS;
    if (scope === "watchlist") list = list.filter((c) => watchedSlugs.has(c.slug));
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(needle) || c.symbol.toLowerCase().includes(needle),
      );
    }
    if (chain !== "All") list = list.filter((c) => c.chain === chain);
    if (mk !== "all") list = list.filter((c) => c.bestMarketplace === mk || MARKETPLACES.find((m) => m.slug === mk)?.chains.includes(c.chain));
    const dir = sortDir;
    return [...list].sort((a, b) => {
      switch (sort) {
        case "floor": return (a.floor - b.floor) * dir;
        case "change": return (a.change24h - b.change24h) * dir;
        case "supply": return (a.supply - b.supply) * dir;
        default: return (a.volume24h - b.volume24h) * dir;
      }
    });
  }, [scope, watchedSlugs, q, chain, mk, sort, sortDir]);

  const marketItems = useMemo(() => {
    // aggregate best-deal items across the top collections by 24h volume
    const top = [...COLLECTIONS].sort((a, b) => b.volume24h - a.volume24h).slice(0, 6);
    return top.flatMap((c) => itemsForCollection(c.slug, 6).sort((a, b) => a.price - b.price));
  }, []);

  const stats = useMemo(() => {
    const vol = COLLECTIONS.reduce((s, c) => s + c.volume24h, 0);
    const sales = feed.filter((a) => a.kind === "BUY").length;
    const floors = COLLECTIONS.reduce((s, c) => s + c.floor, 0);
    return { vol, sales, floors };
  }, [feed]);

  const toggleSweep = (item: NftItem) => {
    setSweep((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item],
    );
  };

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/"><Logo /></Link>
          <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setTab("collections"); }}
              placeholder="Search collections…"
              className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 font-mono text-xs outline-none transition placeholder:text-muted-foreground/60 focus:border-acid/60"
            />
          </div>
          <WalletButton />
        </div>
      </header>

      <MarketTicker items={feed.slice(0, 16)} className="sticky top-16 z-30" />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* stat row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Aggregate 24h vol" value={`${fmtCompact(stats.vol)} Ξ`} sub={`≈ ${fmtUsd(ethToUsd(stats.vol))}`} />
          <Stat label="Terminal trades" value={fmtCompact(128_540 + stats.sales)} sub="routed all-time" />
          <Stat label="Collections indexed" value={COLLECTIONS.length} sub={`${CHAINS.length} chains`} />
          <Stat label="Marketplaces live" value={MARKETPLACES.length} sub="one orderbook" />
        </div>

        {/* tabs + filters */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            {(["market", "collections", "activity"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition",
                  tab === t ? "bg-acid text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "collections" && (
            <>
              <div className="flex rounded-lg bg-muted p-1">
                {(["all", "watchlist"] as Scope[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition",
                      scope === s ? "bg-card text-acid" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s === "watchlist" ? <Star className="h-3 w-3" /> : null}
                    {s}
                  </button>
                ))}
              </div>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value as Chain | "All")}
                className="rounded-lg border border-border bg-input px-2.5 py-2 font-mono text-xs outline-none focus:border-acid/60"
              >
                <option value="All">All chains</option>
                {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={mk}
                onChange={(e) => setMk(e.target.value)}
                className="rounded-lg border border-border bg-input px-2.5 py-2 font-mono text-xs outline-none focus:border-acid/60"
              >
                <option value="all">All marketplaces</option>
                {MARKETPLACES.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
              <select
                value={`${sort}:${sortDir}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split(":");
                  setSort(s as SortKey);
                  setSortDir(Number(d) as -1 | 1);
                }}
                className="rounded-lg border border-border bg-input px-2.5 py-2 font-mono text-xs outline-none focus:border-acid/60"
              >
                <option value="volume:-1">Volume ↓</option>
                <option value="floor:-1">Floor ↓</option>
                <option value="floor:1">Floor ↑</option>
                <option value="change:-1">24h change ↓</option>
                <option value="change:1">24h change ↑</option>
                <option value="supply:-1">Supply ↓</option>
              </select>
            </>
          )}

          <div className="ml-auto flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setView("grid")}
              className={cn("rounded-md p-1.5 transition", view === "grid" ? "bg-card text-acid" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("rounded-md p-1.5 transition", view === "list" ? "bg-card text-acid" : "text-muted-foreground hover:text-foreground")}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── MARKET tab: aggregated best deals ─────────────────────────── */}
        {tab === "market" && (
          <>
            <div className="mt-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">Best deals across all marketplaces</h2>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  Lowest live listings, pooled from every venue · sweep in one click
                </p>
              </div>
              <Badge variant="acid" className="hidden sm:flex"><Flame className="h-3 w-3" /> Hot</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {marketItems.map((item) => {
                const c = collectionBySlug(item.collection);
                if (!c) return null;
                const inSweep = sweep.some((i) => i.id === item.id);
                return (
                  <div key={item.id} className="panel group overflow-hidden transition hover:border-acid/50">
                    <button className="relative block w-full text-left" onClick={() => setTradeItem(item)}>
                      <NftArt seed={item.vibe} accent={c.accent} className="aspect-square w-full rounded-none" rounded={false} />
                      <span className="absolute left-1.5 top-1.5"><ChainDot chain={item.chain} /></span>
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-acid backdrop-blur">
                        {marketplaceBySlug(item.marketplace).short}
                      </span>
                    </button>
                    <div className="p-2.5">
                      <Link to={`/collection/${item.collection}`} className="block truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-acid">
                        {c.symbol} #{item.tokenId}
                      </Link>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-display text-sm font-semibold text-acid">{fmtPrice(item.price)} Ξ</span>
                        <span className="font-mono text-[10px] text-muted-foreground">R {item.rarity}</span>
                      </div>
                      <button
                        onClick={() => toggleSweep(item)}
                        className={cn(
                          "mt-2 w-full rounded-md border py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide transition",
                          inSweep ? "border-acid/60 bg-acid-dim text-acid" : "border-border text-muted-foreground hover:border-acid/50 hover:text-acid",
                        )}
                      >
                        {inSweep ? "In sweep ✓" : "Add to sweep"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── COLLECTIONS tab ───────────────────────────────────────────── */}
        {tab === "collections" && (
          filtered.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={<Star className="h-8 w-8" />}
                title={scope === "watchlist" ? "Watchlist is empty" : "No collections match"}
                hint={scope === "watchlist" ? "Star collections from the grid to track them here." : "Try clearing filters or search."}
              />
            </div>
          ) : view === "grid" ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {filtered.map((c) => (
                <CollectionCard key={c.slug} c={c} watched={watchedSlugs.has(c.slug)} />
              ))}
            </div>
          ) : (
            <div className="panel mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Collection</th>
                    <th className="px-4 py-3 text-right font-medium">Floor</th>
                    <th className="px-4 py-3 text-right font-medium">24h</th>
                    <th className="px-4 py-3 text-right font-medium">Volume</th>
                    <th className="px-4 py-3 text-right font-medium">Supply</th>
                    <th className="px-4 py-3 text-right font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.slug} className="border-b border-border/50 transition hover:bg-acid-dim/40">
                      <td className="px-4 py-2.5">
                        <Link to={`/collection/${c.slug}`} className="flex items-center gap-3">
                          <NftArt seed={c.vibe} accent={c.accent} className="h-9 w-9" />
                          <div>
                            <div className="font-display font-medium">{c.name}</div>
                            <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                              <ChainDot chain={c.chain} className="h-1.5 w-1.5" /> {c.chain}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtPrice(c.floor)} Ξ</td>
                      <td className={cn("px-4 py-2.5 text-right font-mono", c.change24h >= 0 ? "text-acid" : "text-down")}>{fmtPct(c.change24h)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtCompact(c.volume24h)} Ξ</td>
                      <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{fmtCompact(c.supply)}</td>
                      <td className="px-4 py-2.5"><div className="ml-auto w-20"><Sparkline data={priceHistory(c.slug, 14).map((p) => p.floor)} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── ACTIVITY tab ──────────────────────────────────────────────── */}
        {tab === "activity" && (
          <div className="panel mt-5 divide-y divide-border/60">
            {feed.map((a) => {
              const c = collectionBySlug(a.collection);
              const m = marketplaceBySlug(a.marketplace);
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", a.kind === "BUY" || a.kind === "MINT" ? "bg-acid-dim text-acid" : "bg-muted text-muted-foreground")}>
                    <ActivityIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {a.kind} · <span className="text-acid">{c?.name ?? a.collection}</span>
                      {a.tokenId !== undefined ? ` #${a.tokenId}` : ""}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {m.name} · {shortAddr(a.maker)} → {shortAddr(a.taker)} · {timeAgo(a.ts)} ago
                    </div>
                  </div>
                  <span className="font-mono font-semibold">{fmtPrice(a.price)} Ξ</span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* sweep cart bar */}
      {sweep.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[min(680px,calc(100%-2rem))]">
          <div className="flex items-center gap-3 rounded-xl border border-acid/40 bg-card/95 px-4 py-3 shadow-glow backdrop-blur">
            <div className="flex -space-x-2">
              {sweep.slice(0, 4).map((i) => {
                const c = collectionBySlug(i.collection);
                return <NftArt key={i.id} seed={i.vibe} accent={c?.accent ?? "#C6F53F"} className="h-9 w-9 ring-2 ring-card" />;
              })}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold">
                Sweep {sweep.length} item{sweep.length > 1 ? "s" : ""} · {fmtPrice(sweep.reduce((s, i) => s + i.price, 0))} Ξ
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">Atomic cross-market fill · MEV protected</div>
            </div>
            <button onClick={() => setSweep([])} className="rounded-md px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground transition hover:text-down">
              Clear
            </button>
            <button
              onClick={() => setSweepOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-acid px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-background transition hover:bg-acid-bright"
            >
              <Zap className="h-3.5 w-3.5" /> Sweep
            </button>
          </div>
        </div>
      )}

      {tradeItem && <TradeModal item={tradeItem} onClose={() => setTradeItem(null)} />}
      {sweepOpen && (
        <TradeModal
          items={sweep}
          onClose={() => {
            setSweepOpen(false);
            setSweep([]);
          }}
        />
      )}
    </div>
  );
}

// ── Collection card ────────────────────────────────────────────────────────
function CollectionCard({ c, watched }: { c: Collection; watched: boolean }) {
  const { address } = useWallet();
  const toggleWatch = useToggleWatch();
  const hist = useMemo(() => priceHistory(c.slug, 14).map((p) => p.floor), [c.slug]);

  return (
    <div className="panel group overflow-hidden transition hover:border-acid/50">
      <Link to={`/collection/${c.slug}`} className="relative block">
        <NftArt seed={c.vibe} accent={c.accent} className="aspect-[16/10] w-full rounded-none" rounded={false} />
        <span className="absolute left-2 top-2"><ChainDot chain={c.chain} /></span>
        <span className="absolute right-2 top-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-acid backdrop-blur">
          {marketplaceBySlug(c.bestMarketplace).short}
        </span>
      </Link>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/collection/${c.slug}`} className="min-w-0">
            <div className="truncate font-display text-sm font-semibold group-hover:text-acid">{c.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{c.symbol} · {c.category}</div>
          </Link>
          <button
            onClick={() => address && toggleWatch(address, c.slug)}
            disabled={!address}
            title={address ? "Toggle watchlist" : "Connect wallet to watchlist"}
            className={cn("rounded-md p-1 transition", watched ? "text-acid" : "text-muted-foreground/50 hover:text-acid", !address && "opacity-40")}
          >
            <Star className={cn("h-4 w-4", watched && "fill-acid")} />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px]">
          <span className="text-muted-foreground">Floor</span>
          <span className="font-semibold">{fmtPrice(c.floor)} Ξ</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between font-mono text-[11px]">
          <span className="text-muted-foreground">24h vol</span>
          <span className="flex items-center gap-1">
            <span className={cn(c.change24h >= 0 ? "text-acid" : "text-down")}>{fmtPct(c.change24h)}</span>
            <span className="text-muted-foreground">{fmtCompact(c.volume24h)} Ξ</span>
          </span>
        </div>
        <Sparkline data={hist} className="mt-1.5" />
      </div>
    </div>
  );
}
