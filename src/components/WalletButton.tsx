import { useState } from "react";
import { Wallet, X, ChevronDown, AlertTriangle } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const {
    address,
    isConnected,
    connect,
    connectors,
    connecting,
    connectError,
    disconnect,
    chainName,
    switchChain,
    chains,
    switching,
  } = useWallet();
  const [open, setOpen] = useState(false);

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-acid px-4 py-2 font-mono text-sm font-semibold text-background shadow-glow-sm transition hover:bg-acid-bright active:scale-[0.98]",
            compact && "px-3 py-1.5 text-xs",
          )}
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-50 mt-2 w-64 panel p-2 shadow-glow">
              <div className="px-2 pb-1 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Choose wallet
              </div>
              {connectors
                .filter((c) => c.ready || c.id === "injected")
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={async () => {
                      try {
                        await connect({ connector: c });
                        setOpen(false);
                      } catch {
                        /* user rejected */
                      }
                    }}
                    disabled={connecting}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-acid-dim disabled:opacity-50"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {c.id === "injected" ? "browser" : c.type}
                    </span>
                  </button>
                ))}
              {connectError ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg bg-down/10 px-3 py-2 font-mono text-[11px] text-down">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {connectError.message.slice(0, 80)}
                </div>
              ) : null}
              {!connectors.some((c) => c.id === "walletConnect") && (
                <div className="mt-1 border-t border-border px-3 pb-1 pt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  Tip: add a WalletConnect project id (VITE_WALLETCONNECT_PROJECT_ID) to enable mobile wallets.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-acid/40 bg-acid-dim px-3 py-2 font-mono text-sm font-semibold text-acid transition hover:bg-acid/20"
      >
        <span className="h-2 w-2 rounded-full bg-acid animate-pulse-soft" />
        {shortAddr(address!)}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 panel p-2 shadow-glow">
            <div className="px-3 pb-2 pt-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Network</div>
              <div className="mt-1 font-display text-sm font-medium">{chainName ?? "Unsupported"}</div>
            </div>
            <div className="border-t border-border px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Switch network
            </div>
            {chains.map((c) => (
              <button
                key={c.id}
                onClick={() => switchChain({ chainId: c.id })}
                disabled={switching}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-acid-dim disabled:opacity-50"
              >
                {c.name}
                {chainName === c.name ? <span className="font-mono text-[10px] text-acid">●</span> : null}
              </button>
            ))}
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm text-down transition hover:bg-down/10"
            >
              <X className="h-4 w-4" /> Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
