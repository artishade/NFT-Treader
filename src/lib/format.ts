export function fmtEth(n: number, max = 2): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: max });
}

export function fmtPrice(n: number): string {
  if (n >= 100) return n.toFixed(0);
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  return n.toFixed(4);
}

export function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function fmtUsd(n: number): string {
  if (n >= 1000) return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return "$" + n.toFixed(2);
}

export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function shortAddr(a: string, size = 4): string {
  if (a.length <= size * 2 + 2) return a;
  return `${a.slice(0, 2 + size)}…${a.slice(-size)}`;
}

export const ETH_USD = 3412;

export function ethToUsd(eth: number): number {
  return eth * ETH_USD;
}
