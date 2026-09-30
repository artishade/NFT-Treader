import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "acid" | "outline" | "down";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        variant === "default" && "bg-muted text-muted-foreground",
        variant === "acid" && "bg-acid-dim text-acid",
        variant === "outline" && "border border-border text-muted-foreground",
        variant === "down" && "bg-down/10 text-down",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("panel px-4 py-3", className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold text-foreground">{value}</div>
      {sub ? <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,hsl(var(--muted))_0px,hsl(var(--muted))_120px,hsl(var(--border))_180px,hsl(var(--muted))_240px)] bg-[length:400px_100%]",
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon ? <div className="text-muted-foreground/60">{icon}</div> : null}
      <div className="font-display text-base font-medium text-foreground">{title}</div>
      {hint ? <div className="max-w-sm font-mono text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{children}</h2>
      {right}
    </div>
  );
}

export function ChainDot({ chain, className }: { chain: string; className?: string }) {
  const color =
    chain === "Ethereum" ? "#8A9CFF"
    : chain === "Base" ? "#3B82F6"
    : chain === "Polygon" ? "#A78BFA"
    : chain === "Arbitrum" ? "#5EEAD4"
    : chain === "Solana" ? "#F9A8D4"
    : "#F7931A";
  return (
    <span
      title={chain}
      className={cn("inline-block h-2 w-2 rounded-full", className)}
      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}
