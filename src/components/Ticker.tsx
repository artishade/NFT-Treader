import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { MARKETPLACES, marketplaceBySlug, type Activity } from "@/lib/market";
import { fmtPrice, fmtPct, timeAgo, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Live market ticker (marquee) ───────────────────────────────────────────
export function MarketTicker({ items, className }: { items?: Activity[]; className?: string }) {
  const [flash, setFlash] = useState(false);
  const timer = useRef<number | null>(null);

  // re-generate the feed locally so the marquee always has fresh rows
  const [feed, setFeed] = useState<Activity[]>(items ?? []);
  useEffect(() => {
    if (items) setFeed(items);
  }, [items]);

  useEffect(() => {
    timer.current = window.setInterval(() => setFlash((v) => !v), 2000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  if (feed.length === 0) return null;
  const doubled = [...feed, ...feed];

  return (
    <div className={cn("relative overflow-hidden border-y border-border bg-card/60", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-8 py-2.5">
        {doubled.map((a, i) => {
          const mk = marketplaceBySlug(a.marketplace);
          const c = MARKETPLACES.find((m) => m.slug === a.marketplace);
          const up = a.kind === "BUY" || a.kind === "MINT";
          return (
            <div key={`${a.id}-${i}`} className="flex items-center gap-2 font-mono text-[11px] whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mk.color }} />
              <span className="font-semibold text-foreground">{mk.name}</span>
              <span className="text-muted-foreground">{a.kind}</span>
              <span className={cn("font-semibold", up ? "text-acid" : "text-down")}>
                {fmtPrice(a.price)} Ξ
              </span>
              <span className="text-muted-foreground/70">{timeAgo(a.ts)} ago</span>
              {c && i % 3 === 0 ? (
                <span className={cn("flex items-center gap-0.5", c.share > 10 ? "text-acid" : "text-muted-foreground")}>
                  {c.share > 10 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {c.share.toFixed(1)}%
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compact sparkline (pure SVG) ───────────────────────────────────────────
export function Sparkline({
  data,
  className,
  stroke,
}: {
  data: number[];
  className?: string;
  stroke?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`);
  const up = data[data.length - 1] >= data[0];
  const color = stroke ?? (up ? "hsl(76 88% 60%)" : "hsl(350 90% 62%)");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-7 w-full", className)} preserveAspectRatio="none">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function WhaleRow({ maker, price, kind }: { maker: string; price: number; kind: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 font-mono text-xs last:border-0">
      <span className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", kind === "BUY" ? "bg-acid" : "bg-down")} />
        {shortAddr(maker)}
      </span>
      <span className="text-foreground">{fmtPrice(price)} Ξ</span>
    </div>
  );
}
