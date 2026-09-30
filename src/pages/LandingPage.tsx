import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, GitMerge, LineChart, ShieldCheck, Zap, Radio, Layers } from "lucide-react";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { MarketTicker, Sparkline } from "@/components/Ticker";
import { NftArt } from "@/components/NftArt";
import { Badge, ChainDot } from "@/components/ui";
import { COLLECTIONS, MARKETPLACES, activityFeed, priceHistory } from "@/lib/market";
import { fmtPrice, fmtCompact, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const navigate = useNavigate();
  const feed = useMemo(() => activityFeed(18), []);
  const featured = useMemo(() => [...COLLECTIONS].sort((a, b) => b.volume24h - a.volume24h).slice(0, 8), []);

  return (
    <div className="min-h-screen">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground md:flex">
            <a href="#markets" className="transition hover:text-acid">Markets</a>
            <a href="#aggregate" className="transition hover:text-acid">Aggregator</a>
            <a href="#collections" className="transition hover:text-acid">Collections</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hidden rounded-lg border border-border px-4 py-2 font-mono text-sm font-semibold text-foreground transition hover:border-acid/50 hover:text-acid sm:block"
            >
              Launch Terminal
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" />
        <div className="bg-noise absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-acid/30 bg-acid-dim px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-acid animate-fade-up">
            <Radio className="h-3 w-3 animate-pulse-soft" />
            8 marketplaces · 6 chains · one orderbook
          </div>
          <h1 className="mx-auto max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight animate-fade-up sm:text-6xl md:text-7xl">
            Every NFT market.
            <br />
            <span className="text-glow text-acid">One terminal.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground animate-fade-up sm:text-base">
            Obsidian aggregates listings across OpenSea, Blur, Magic Eden, OKX and more.
            See every floor, route every trade, sweep everything — without leaving the dashboard.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 animate-fade-up sm:flex-row">
            <button
              onClick={() => navigate("/dashboard")}
              className="group inline-flex items-center gap-2 rounded-lg bg-acid px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-wide text-background shadow-glow transition hover:bg-acid-bright active:scale-[0.98]"
            >
              Enter the terminal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              to="/dashboard?tab=collections"
              className="rounded-lg border border-border px-6 py-3.5 font-mono text-sm font-semibold text-foreground transition hover:border-acid/50 hover:text-acid"
            >
              Browse collections
            </Link>
          </div>

          {/* live stat strip */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "24h volume", value: "41.2K Ξ" },
              { label: "Trades routed", value: "128,540" },
              { label: "Avg. savings", value: "1.9%" },
              { label: "Uptime", value: "99.99%" },
            ].map((s) => (
              <div key={s.label} className="panel px-4 py-3 text-left">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</div>
                <div className="mt-1 font-display text-lg font-semibold text-acid">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ticker */}
      <MarketTicker items={feed} />

      {/* features */}
      <section id="aggregate" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-10 text-center">
          <Badge variant="acid" className="mb-3">How it works</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built like a DEX aggregator. For NFTs.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: GitMerge, title: "Smart order routing", body: "Every listing across every marketplace is pooled into one orderbook. Obsidian picks the cheapest route automatically — or lets you pick." },
            { icon: Layers, title: "Cross-market sweeps", body: "Fill 14 listings across 4 venues in a single atomic transaction. No more cart-by-cart grinding." },
            { icon: LineChart, title: "Real-time floors", body: "Floor, depth, volume and owner counts stream in for all collections, all chains, one view." },
            { icon: ShieldCheck, title: "MEV-protected signing", body: "Trades route through private orderflow. No sandwich attacks, no front-running, ever." },
          ].map((f) => (
            <div key={f.title} className="panel group p-5 transition hover:border-acid/40">
              <f.icon className="h-6 w-6 text-acid" />
              <div className="mt-3 font-display text-base font-semibold">{f.title}</div>
              <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* marketplace grid */}
      <section id="markets" className="border-y border-border bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <Badge variant="outline" className="mb-3">Coverage</Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight">Aggregated marketplaces</h2>
            </div>
            <div className="hidden font-mono text-xs text-muted-foreground sm:block">share of routed volume →</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACES.map((m) => (
              <div key={m.slug} className="panel p-4 transition hover:border-acid/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold"
                      style={{ backgroundColor: `${m.color}1f`, color: m.color }}
                    >
                      {m.short}
                    </span>
                    <div>
                      <div className="font-display text-sm font-semibold">{m.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{m.protocolFee}% fee</div>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-acid">{m.share}%</span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(m.share / 35) * 100}%`, backgroundColor: m.color }} />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {m.chains.map((ch) => (
                    <span key={ch} className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                      <ChainDot chain={ch} className="h-1.5 w-1.5" />
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* top collections preview */}
      <section id="collections" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <Badge variant="acid" className="mb-3">Live</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight">Top collections right now</h2>
          </div>
          <Link to="/dashboard" className="hidden items-center gap-1 font-mono text-xs uppercase tracking-wider text-acid hover:underline sm:flex">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c, i) => {
            const hist = priceHistory(c.slug, 14).map((p) => p.floor);
            return (
              <Link
                key={c.slug}
                to={`/collection/${c.slug}`}
                className="panel group overflow-hidden transition hover:border-acid/50"
              >
                <div className="relative">
                  <NftArt seed={c.vibe} accent={c.accent} className="h-28 w-full rounded-none" rounded={false} />
                  <span className="absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-acid backdrop-blur">
                    #{i + 1}
                  </span>
                  <span className="absolute right-2 top-2"><ChainDot chain={c.chain} /></span>
                </div>
                <div className="p-3">
                  <div className="truncate font-display text-sm font-semibold">{c.name}</div>
                  <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">Floor</span>
                    <span className="font-semibold">{fmtPrice(c.floor)} Ξ</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">24h</span>
                    <span className={cn(c.change24h >= 0 ? "text-acid" : "text-down")}>{fmtPct(c.change24h)}</span>
                  </div>
                  <Sparkline data={hist} className="mt-2" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* final CTA */}
      <section className="relative overflow-hidden border-t border-border py-24">
        <div className="bg-grid absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Zap className="mx-auto h-8 w-8 text-acid" />
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            Stop tab-switching. Start sweeping.
          </h2>
          <p className="mx-auto mt-3 max-w-md font-mono text-sm text-muted-foreground">
            Connect any wallet and route your first cross-market trade in under a minute.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-acid px-8 py-4 font-mono text-sm font-bold uppercase tracking-wide text-background shadow-glow transition hover:bg-acid-bright active:scale-[0.98]"
          >
            <Boxes className="h-4 w-4" />
            Launch dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 font-mono text-[11px] text-muted-foreground sm:flex-row">
          <Logo className="scale-90" />
          <span>Simulated market data · Connect your own keys for live chain data</span>
        </div>
      </footer>
    </div>
  );
}
