export function Logo({ className }: { className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2 " + (className ?? "")}>
      <svg width="26" height="26" viewBox="0 0 32 32" className="drop-shadow-[0_0_10px_hsl(76_88%_60%/0.5)]">
        <rect width="32" height="32" rx="8" fill="hsl(230 33% 6%)" />
        <path d="M16 5l9 5.5v11L16 27l-9-5.5v-11L16 5z" fill="none" stroke="hsl(76 88% 60%)" strokeWidth="2" />
        <path d="M16 11l4.5 2.8v5.4L16 22l-4.5-2.8v-5.4L16 11z" fill="hsl(76 88% 60%)" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">
        OBSIDIAN
        <span className="ml-1.5 rounded bg-acid-dim px-1.5 py-0.5 align-middle font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-acid">
          Exchange
        </span>
      </span>
    </span>
  );
}
