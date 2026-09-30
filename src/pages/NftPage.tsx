import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Copy, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { NftArt } from "@/components/NftArt";
import { Badge, ChainDot, EmptyState } from "@/components/ui";
import { TradeModal } from "@/components/TradeModal";
import { collectionBySlug, itemById, marketplaceBySlug } from "@/lib/market";
import { fmtPrice, fmtUsd, ethToUsd, shortAddr } from "@/lib/format";

export default function NftPage() {
  const { id } = useParams<{ id: string }>();
  const item = id ? itemById(id) : undefined;
  const c = item ? collectionBySlug(item.collection) : undefined;
  const [tradeOpen, setTradeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const traitRows = useMemo(() => item?.traits ?? [], [item]);

  if (!item || !c) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState title="Token not found" hint="This token may have been swept." />
        <div className="mt-4 text-center">
          <Link to="/dashboard" className="font-mono text-sm text-acid hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const mk = marketplaceBySlug(item.marketplace);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link to="/"><Logo /></Link>
          <div className="ml-auto"><WalletButton /></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          to={`/collection/${c.slug}`}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition hover:text-acid"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {c.name}
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {/* art */}
          <div>
            <div className="panel overflow-hidden p-2">
              <NftArt seed={item.vibe} accent={c.accent} className="aspect-square w-full" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "Rarity", value: `#${item.rarity === 0 ? 1 : Math.max(1, 100 - item.rarity)} · top ${Math.max(1, item.rarity)}%` },
                { label: "Chain", value: item.chain },
                { label: "Best price on", value: mk.name },
              ].map((s) => (
                <div key={s.label} className="panel px-3 py-2.5">
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</div>
                  <div className="mt-0.5 truncate font-display text-xs font-semibold">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* buy panel */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{c.symbol}</Badge>
              <Badge variant="acid"><ChainDot chain={item.chain} className="h-1.5 w-1.5" /> {item.chain}</Badge>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{item.name}</h1>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              Owned by <span className="text-foreground">{shortAddr(item.owner, 6)}</span>
            </div>

            <div className="panel mt-5 p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Best price · {mk.name}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-acid text-glow">{fmtPrice(item.price)} Ξ</span>
                <span className="font-mono text-sm text-muted-foreground">{fmtUsd(ethToUsd(item.price))}</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                Last sale {fmtPrice(item.lastSale)} Ξ · Floor {fmtPrice(c.floor)} Ξ
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTradeOpen(true)}
                  className="col-span-2 rounded-lg bg-acid py-3 font-mono text-sm font-bold uppercase tracking-wide text-background shadow-glow-sm transition hover:bg-acid-bright active:scale-[0.99]"
                >
                  Buy now
                </button>
                <button
                  onClick={() => setTradeOpen(true)}
                  className="rounded-lg border border-border py-3 font-mono text-sm font-semibold text-foreground transition hover:border-acid/50 hover:text-acid"
                >
                  Offer
                </button>
              </div>
              <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                Routed via Obsidian SOR across {c ? "all venues" : ""} · fees included at signature · MEV protected
              </div>
            </div>

            {/* traits */}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-acid" />
                <span className="font-display text-sm font-semibold">Traits</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {traitRows.map((t) => (
                  <div key={t.name} className="panel px-3 py-2.5 transition hover:border-acid/40">
                    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{t.name}</div>
                    <div className="mt-0.5 truncate font-display text-xs font-semibold">{t.value}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-acid">{t.pct}% have this</div>
                  </div>
                ))}
              </div>
            </div>

            {/* contract */}
            <div className="panel mt-6 flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Contract</div>
                <div className="mt-0.5 font-mono text-xs">{shortAddr(item.owner, 8)}</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(item.owner).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-acid"
              >
                {copied ? <Check className="h-4 w-4 text-acid" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {tradeOpen && <TradeModal item={item} defaultMode="buy" onClose={() => setTradeOpen(false)} />}
    </div>
  );
}
