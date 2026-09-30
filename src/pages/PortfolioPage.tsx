import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, RefreshCw, Loader2, Download, Tag, History, Package, X, WifiOff,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { NftArt } from "@/components/NftArt";
import { Badge, ChainDot, Stat, EmptyState } from "@/components/ui";
import { TradeModal } from "@/components/TradeModal";
import { useWallet } from "@/lib/wallet";
import { useTradesByUser, useUserListings, useCreateListing, useCancelListing, useClearUserTrades } from "@/lib/store";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  collectionBySlug, itemById, portfolioHistory, marketplaceBySlug, type NftItem,
} from "@/lib/market";
import { fetchNftsForOwner, type AlchemyNft } from "@/lib/alchemy";
import { localHoldings } from "@/lib/localStore";
import { fmtPrice, fmtUsd, ethToUsd, timeAgo, shortAddr, fmtCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const { address, isConnected, chainName } = useWallet();
  const [listItem, setListItem] = useState<NftItem | null>(null);
  const [chainNfts, setChainNfts] = useState<AlchemyNft[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);

  const holdings = useMemo(() => {
    if (!address) return [];
    const demo = ["obsidian-punks-2048", "chrome-serpents-77", "quantum-cats-404", "signal-ghosts-12", "neon-ronin-606"];
    return Array.from(new Set([...localHoldings(), ...demo]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);
  const items = useMemo(() => holdings.map((h) => itemById(h)).filter((x): x is NftItem => !!x), [holdings]);
  const hist = useMemo(() => portfolioHistory(30), []);

  const listings = useUserListings(address);
  const trades = useTradesByUser(address);
  const cancelListing = useCancelListing();
  const clearTrades = useClearUserTrades();

  const value = items.reduce((s, i) => s + i.price, 0);

  async function importOnChain() {
    if (!address) return;
    setImporting(true);
    setImportErr(null);
    try {
      const nfts = await fetchNftsForOwner(address, 1);
      setChainNfts(nfts.slice(0, 24));
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : "Import failed — is VITE_ALCHEMY_API_KEY set?");
    } finally {
      setImporting(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col">
        <SimpleHeader />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <Wallet className="h-10 w-10 text-muted-foreground/50" />
          <h1 className="mt-4 font-display text-2xl font-bold">Your portfolio lives on-chain</h1>
          <p className="mt-2 max-w-sm font-mono text-sm text-muted-foreground">
            Connect your wallet to see holdings, active listings, trade history and portfolio value.
          </p>
          <div className="mt-6"><WalletButton /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SimpleHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Est. portfolio value" value={`${fmtPrice(value)} Ξ`} sub={fmtUsd(ethToUsd(value))} />
          <Stat label="Holdings" value={items.length} sub="simulated + imported" />
          <Stat label="Active listings" value={listings?.length ?? 0} sub="across marketplaces" />
          <Stat label="Trades" value={trades?.length ?? 0} sub={chainName ?? "all networks"} />
        </div>

        {/* chart + import */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="panel p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Portfolio value · 30d</span>
              <Badge variant="acid">+{(((hist[hist.length - 1].value - hist[0].value) / hist[0].value) * 100).toFixed(0)}%</Badge>
            </div>
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hist} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(76 88% 60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(76 88% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(230 20% 13%)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number | string) => [`${fmtPrice(Number(v))} Ξ`, "Value"]} />
                  <Area type="monotone" dataKey="value" stroke="hsl(76 88% 60%)" strokeWidth={2} fill="url(#pfFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel flex flex-col p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-acid" />
              <span className="font-display text-sm font-semibold">Import from wallet</span>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
              Pull your real NFTs from Ethereum via the Alchemy NFT API. Add <span className="text-acid">VITE_ALCHEMY_API_KEY</span> in the Keys tab to enable.
            </p>
            <button
              onClick={importOnChain}
              disabled={importing}
              className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-acid/40 bg-acid-dim py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-acid transition hover:bg-acid/20 disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {importing ? "Scanning chain…" : "Import holdings"}
            </button>
            {importErr && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-down/10 px-2.5 py-2 font-mono text-[10px] text-down">
                <WifiOff className="mt-0.5 h-3 w-3 shrink-0" /> {importErr}
              </div>
            )}
            {chainNfts && chainNfts.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-1.5 overflow-y-auto" style={{ maxHeight: 140 }}>
                {chainNfts.map((n, i) => (
                  <div key={`${n.contract.address}-${n.tokenId}-${i}`} className="overflow-hidden rounded-md border border-border" title={n.title ?? undefined}>
                    {n.image?.thumbnail ? (
                      <img src={n.image.thumbnail} alt={n.title ?? "NFT"} className="aspect-square w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="aspect-square w-full bg-muted" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* holdings */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Package className="h-4 w-4 text-acid" /> Holdings</h2>
          <span className="font-mono text-[11px] text-muted-foreground">{items.length} tokens</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => {
            const c = collectionBySlug(item.collection);
            if (!c) return null;
            return (
              <div key={item.id} className="panel group overflow-hidden transition hover:border-acid/50">
                <Link to={`/nft/${item.id}`}>
                  <NftArt seed={item.vibe} accent={c.accent} className="aspect-square w-full rounded-none" rounded={false} />
                </Link>
                <div className="p-2.5">
                  <Link to={`/collection/${c.slug}`} className="block truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-acid">
                    {c.symbol} #{item.tokenId}
                  </Link>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold">{fmtPrice(item.price)} Ξ</span>
                    <button
                      onClick={() => setListItem(item)}
                      className="rounded-md border border-border px-2 py-1 font-mono text-[10px] font-semibold uppercase text-muted-foreground transition hover:border-acid/50 hover:text-acid"
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <EmptyState title="No holdings yet" hint="Buy something from the market tab." />}
        </div>

        {/* listings */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Tag className="h-4 w-4 text-acid" /> Your listings</h2>
        </div>
        <div className="panel mt-3 divide-y divide-border/60">
          {(listings ?? []).length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">No active listings. List a holding above.</div>
          ) : (
            (listings ?? []).map((l) => {
              const c = collectionBySlug(l.collection);
              return (
                <div key={l._id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <NftArt seed={(c?.vibe ?? 0) + l.tokenId} accent={c?.accent ?? "#C6F53F"} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c?.name ?? l.collection} #{l.tokenId}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      via {marketplaceBySlug(l.marketplace).name} · {timeAgo(l.ts)} ago
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-acid">{fmtPrice(l.price)} Ξ</span>
                  <button
                    onClick={() => cancelListing(l._id)}
                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-down/10 hover:text-down"
                    title="Cancel listing"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* history */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><History className="h-4 w-4 text-acid" /> Trade history</h2>
          {(trades ?? []).length > 0 ? (
            <button onClick={() => clearTrades(address!)} className="font-mono text-[10px] uppercase text-muted-foreground transition hover:text-down">
              Clear history
            </button>
          ) : null}
        </div>
        <div className="panel mt-3 divide-y divide-border/60">
          {(trades ?? []).length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">No trades yet. Your routed fills will appear here.</div>
          ) : (
            (trades ?? []).map((t) => {
              const c = collectionBySlug(t.collection);
              return (
                <div key={t._id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase", t.kind === "BUY" ? "bg-acid-dim text-acid" : "bg-muted text-muted-foreground")}>
                    {t.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c?.name ?? t.collection}{t.tokenId !== undefined ? ` #${t.tokenId}` : ""}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {marketplaceBySlug(t.marketplace).name} · {timeAgo(t.ts)} ago · {shortAddr(t.txHash, 6)}
                    </div>
                  </div>
                  <span className="font-mono font-semibold">{fmtPrice(t.price)} Ξ</span>
                </div>
              );
            })
          )}
        </div>
        <div className="h-10" />
      </main>

      {listItem && <TradeModal item={listItem} defaultMode="sell" onClose={() => setListItem(null)} />}
    </div>
  );
}

function SimpleHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/"><Logo /></Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          <Link to="/dashboard" className="rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted-foreground transition hover:bg-muted hover:text-foreground">
            Terminal
          </Link>
        </nav>
        <div className="ml-auto"><WalletButton /></div>
      </div>
    </header>
  );
}
