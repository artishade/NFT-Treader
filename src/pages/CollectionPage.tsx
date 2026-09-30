import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, Layers, Tag, BarChart3, Star, ShoppingBag, Eye,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { NftArt } from "@/components/NftArt";
import { Badge, ChainDot, Stat, EmptyState } from "@/components/ui";
import { TradeModal } from "@/components/TradeModal";
import { Sparkline } from "@/components/Ticker";
import { useWallet } from "@/lib/wallet";
import { useIsWatched, useToggleWatch } from "@/lib/store";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { collectionBySlug, itemsForCollection, priceHistory, marketplaceBySlug } from "@/lib/market";
import { fmtPrice, fmtCompact, fmtPct, fmtUsd, ethToUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const c = slug ? collectionBySlug(slug) : undefined;
  const { address } = useWallet();
  const [buying, setBuying] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 30>(30);

  const items = useMemo(() => (c ? itemsForCollection(c.slug, 48) : []), [c]);
  const hist = useMemo(() => (c ? priceHistory(c.slug, range) : []), [c, range]);
  const watchedRow = useIsWatched(address, c?.slug);
  const toggleWatch = useToggleWatch();

  const traitCounts = useMemo(() => {
    if (!c) return [];
    const map = new Map<string, number>();
    for (const it of items) for (const t of it.traits) map.set(t.value, (map.get(t.value) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [c, items]);

  if (!c) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState title="Collection not found" hint="It may have been delisted from the terminal." />
        <div className="mt-4 text-center">
          <Link to="/dashboard" className="font-mono text-sm text-acid hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const buyItem = items.find((i) => i.id === buying);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/"><Logo /></Link>
          <div className="ml-auto"><WalletButton /></div>
        </div>
      </header>

      {/* banner */}
      <div className="relative h-44 overflow-hidden border-b border-border sm:h-56">
        <NftArt seed={c.vibe + 9999} accent={c.accent} className="h-full w-full rounded-none opacity-70" rounded={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <main className="mx-auto max-w-7xl px-4">
        <div className="-mt-16 flex flex-wrap items-end gap-5">
          <NftArt seed={c.vibe} accent={c.accent} className="h-24 w-24 ring-4 ring-background sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{c.name}</h1>
              <Badge variant="outline">{c.symbol}</Badge>
              <Badge variant="acid"><ChainDot chain={c.chain} className="h-1.5 w-1.5" /> {c.chain}</Badge>
              <Badge variant="outline">{c.category}</Badge>
            </div>
            <p className="mt-1.5 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">{c.description}</p>
          </div>
          <button
            onClick={() => address && toggleWatch(address, c.slug)}
            disabled={!address}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide transition",
              watchedRow ? "border-acid/60 bg-acid-dim text-acid" : "border-border text-muted-foreground hover:border-acid/50 hover:text-acid",
              !address && "opacity-40",
            )}
          >
            <Star className={cn("h-3.5 w-3.5", watchedRow && "fill-acid")} />
            {watchedRow ? "Watching" : "Watch"}
          </button>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Floor" value={`${fmtPrice(c.floor)} Ξ`} sub={fmtUsd(ethToUsd(c.floor))} />
          <Stat label="24h" value={<span className={c.change24h >= 0 ? "text-acid" : "text-down"}>{fmtPct(c.change24h)}</span>} sub="floor change" />
          <Stat label="24h volume" value={`${fmtCompact(c.volume24h)} Ξ`} sub={`all-time ${fmtCompact(c.volumeAll)} Ξ`} />
          <Stat label="Supply" value={fmtCompact(c.supply)} sub="tokens" />
          <Stat label="Owners" value={fmtCompact(c.owners)} sub={`${((c.owners / c.supply) * 100).toFixed(0)}% unique`} />
          <Stat label="Listed" value={`${c.listedPct.toFixed(1)}%`} sub={`best on ${marketplaceBySlug(c.bestMarketplace).name}`} />
        </div>

        {/* chart + traits */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="panel p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-acid" />
                <span className="font-display text-sm font-semibold">Floor price</span>
              </div>
              <div className="flex rounded-lg bg-muted p-0.5">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn("rounded-md px-2.5 py-1 font-mono text-[10px] font-semibold uppercase transition", range === r ? "bg-card text-acid" : "text-muted-foreground")}
                  >
                    {r}D
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="floorFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(76 88% 60%)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="hsl(76 88% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(230 20% 13%)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis tickLine={false} axisLine={false} width={46} domain={["auto", "auto"]} tickFormatter={(v: number) => fmtPrice(v)} />
                  <Tooltip
                    formatter={(v: number | string) => [`${fmtPrice(Number(v))} Ξ`, "Floor"]}
                    contentStyle={{ background: "hsl(230 30% 5.5%)", border: "1px solid hsl(230 20% 13%)", borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="floor" stroke="hsl(76 88% 60%)" strokeWidth={2} fill="url(#floorFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-acid" />
              <span className="font-display text-sm font-semibold">Trait floor snapshot</span>
            </div>
            <div className="mt-3 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 224 }}>
              {traitCounts.map(([value, count]) => (
                <div key={value} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 font-mono text-[11px]">
                  <span className="truncate text-muted-foreground">{value}</span>
                  <span className="ml-2 shrink-0 text-foreground">{count} listed</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* items */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ShoppingBag className="h-4 w-4 text-acid" /> Live listings
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">routed from {new Set(items.map((i) => i.marketplace)).size} marketplaces</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="panel group overflow-hidden transition hover:border-acid/50">
              <Link to={`/nft/${item.id}`} className="relative block">
                <NftArt seed={item.vibe} accent={c.accent} className="aspect-square w-full rounded-none" rounded={false} />
                <span className="absolute left-1.5 top-1.5"><ChainDot chain={item.chain} /></span>
                <span className="absolute bottom-1.5 left-1.5 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-acid backdrop-blur">
                  {marketplaceBySlug(item.marketplace).short}
                </span>
              </Link>
              <div className="p-2.5">
                <Link to={`/nft/${item.id}`} className="block truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-acid">
                  #{item.tokenId} · R{item.rarity}
                </Link>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-acid">{fmtPrice(item.price)} Ξ</span>
                  <button
                    onClick={() => setBuying(item.id)}
                    className="rounded-md bg-acid px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-background transition hover:bg-acid-bright"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-10" />
      </main>

      {buyItem && <TradeModal item={buyItem} onClose={() => setBuying(null)} />}
    </div>
  );
}
