import { useEffect, useMemo, useState } from "react";
import { X, ShieldCheck, Zap, Loader2, CheckCircle2, ExternalLink, Tag, ShoppingBag, HandCoins } from "lucide-react";
import type { NftItem } from "@/lib/market";
import { MARKETPLACES, marketplaceBySlug, collectionBySlug } from "@/lib/market";
import { fmtPrice, fmtUsd, ethToUsd, shortAddr } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { useRecordTrade, useCreateListing } from "@/lib/store";
import { localAddHolding } from "@/lib/localStore";
import { NftArt } from "./NftArt";
import { WalletButton } from "./WalletButton";
import { cn } from "@/lib/utils";

type Mode = "buy" | "sell" | "offer";

interface Route {
  marketplace: string;
  price: number;
  fastest: boolean;
}

function routesFor(item: NftItem): Route[] {
  const c = collectionBySlug(item.collection);
  const eligible = MARKETPLACES.filter((m) => !c || m.chains.includes(c.chain));
  const routes: Route[] = eligible.slice(0, 4).map((m, i) => ({
    marketplace: m.slug,
    price: i === 0 ? item.price : item.price * (1 + (i - 1) * 0.006),
    fastest: i === 0,
  }));
  return routes.sort((a, b) => a.price - b.price);
}

const STEPS = ["Review", "Sign", "Broadcast", "Settled"] as const;

export function TradeModal({
  item,
  items,
  defaultMode = "buy",
  onClose,
}: {
  item?: NftItem;
  items?: NftItem[];
  defaultMode?: Mode;
  onClose: () => void;
}) {
  const cart = useMemo(() => items ?? (item ? [item] : []), [item, items]);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [route, setRoute] = useState<string>("");
  const [sellPrice, setSellPrice] = useState<string>("");
  const [step, setStep] = useState(0); // 0 review, 1 signing, 2 broadcasting, 3 done
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, isConnected } = useWallet();
  const recordTrade = useRecordTrade();
  const createListing = useCreateListing();

  useEffect(() => {
    const r = routesFor(cart[0]);
    setRoute(r[0]?.marketplace ?? MARKETPLACES[0].slug);
    if (!sellPrice && cart[0]) setSellPrice(cart[0].price.toFixed(3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && step < 2 && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  const routes = cart.length ? routesFor(cart[0]) : [];
  const chosen = routes.find((r) => r.marketplace === route) ?? routes[0];
  const subtotal = mode === "buy" ? cart.reduce((s, i) => s + (i === cart[0] ? chosen?.price ?? i.price : chosen? i.price * (chosen.price / (cart[0].price || 1)) : i.price), 0) : 0;
  const mk = marketplaceBySlug(route || "opensea");
  const routerFeePct = 0.35;
  const fees =
    mode === "buy"
      ? (subtotal * mk.protocolFee) / 100 + (subtotal * routerFeePct) / 100
      : 0;
  const total = mode === "buy" ? subtotal + fees : Number(sellPrice || 0);
  const proceeds = Number(sellPrice || 0) * (1 - mk.protocolFee / 100 - routerFeePct / 100);

  async function execute() {
    if (!isConnected || !address) return;
    try {
      setStep(1);
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
      setStep(2);
      const res =
        mode === "sell"
          ? await createListing({
              collection: cart[0].collection,
              tokenId: cart[0].tokenId,
              seller: address,
              price: Number(sellPrice),
              marketplace: mk.slug,
            })
          : mode === "buy"
            ? await recordTrade({
                kind: "BUY",
                collection: cart[0].collection,
                tokenId: cart[0].tokenId,
                price: total,
                marketplace: mk.slug,
                maker: address,
                counterparty: cart[0].owner,
              })
            : await recordTrade({
                kind: "OFFER",
                collection: cart[0].collection,
                tokenId: cart[0].tokenId,
                price: Number(sellPrice),
                marketplace: mk.slug,
                maker: address,
                counterparty: cart[0].owner,
              });
      setTxHash(res?.txHash ?? "0x" + Math.random().toString(16).slice(2));
      if (mode === "buy") for (const it of cart) localAddHolding(it.id);
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
      setStep(3);
    } catch {
      setStep(0);
    }
  }

  const busy = step === 1 || step === 2;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center" onClick={() => !busy && onClose()}>
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-border bg-card shadow-glow sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            {mode === "buy" ? <ShoppingBag className="h-4 w-4 text-acid" /> : mode === "sell" ? <Tag className="h-4 w-4 text-acid" /> : <HandCoins className="h-4 w-4 text-acid" />}
            <span className="font-display text-sm font-semibold">
              {mode === "buy" ? (cart.length > 1 ? `Sweep ${cart.length} items` : "Buy NFT") : mode === "sell" ? "List for sale" : "Place offer"}
            </span>
          </div>
          <button onClick={() => !busy && onClose()} className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* item strip */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <NftArt seed={cart[0].vibe} accent={collectionBySlug(cart[0].collection)?.accent ?? "#C6F53F"} className="h-12 w-12 shrink-0" />
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-medium">{cart[0].name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {collectionBySlug(cart[0].collection)?.name} · {cart.length > 1 ? `+${cart.length - 1} more` : `#${cart[0].tokenId}`}
            </div>
          </div>
        </div>

        {step < 3 ? (
          <div className="space-y-4 px-5 py-4">
            {/* mode tabs (buy/sell only when selling own item via portfolio) */}
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {(["buy", "sell", "offer"] as Mode[]).map((m) => (
                <button
                  key={m}
                  disabled={busy}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-md py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition",
                    mode === m ? "bg-acid text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {mode === "buy" ? (
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Best route across marketplaces</div>
                <div className="space-y-1">
                  {routes.map((r) => {
                    const m = marketplaceBySlug(r.marketplace);
                    return (
                      <button
                        key={r.marketplace}
                        disabled={busy}
                        onClick={() => setRoute(r.marketplace)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition",
                          route === r.marketplace ? "border-acid/60 bg-acid-dim" : "border-border hover:border-muted-foreground/40",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                          <span className="text-sm font-medium">{m.name}</span>
                          {r.fastest && <span className="rounded bg-muted px-1 font-mono text-[9px] uppercase text-muted-foreground">fast</span>}
                        </span>
                        <span className="font-mono text-sm">{fmtPrice(r.price)} Ξ</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {mode === "sell" ? "Listing price (ETH)" : "Offer amount (ETH)"}
                </label>
                <div className="flex items-center rounded-lg border border-border bg-input px-3 py-2.5 focus-within:border-acid/60">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={sellPrice}
                    disabled={busy}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full bg-transparent font-mono text-sm outline-none"
                    placeholder="0.000"
                  />
                  <span className="font-mono text-xs text-muted-foreground">Ξ ≈ {fmtUsd(ethToUsd(Number(sellPrice || 0)))}</span>
                </div>
                {mode === "sell" && cart[0] && (
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Floor: {fmtPrice(collectionBySlug(cart[0].collection)?.floor ?? 0)} Ξ · Last sale: {fmtPrice(cart[0].lastSale)} Ξ
                  </div>
                )}
              </div>
            )}

            {/* fee breakdown */}
            <div className="space-y-1 rounded-lg bg-muted/60 px-3 py-2.5 font-mono text-xs">
              {mode === "buy" ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({cart.length} item{cart.length > 1 ? "s" : ""})</span>
                    <span className="text-foreground">{fmtPrice(subtotal)} Ξ</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{mk.name} fee ({mk.protocolFee}%)</span>
                    <span className="text-foreground">{fmtPrice((subtotal * mk.protocolFee) / 100)} Ξ</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Router fee (0.35%)</span>
                    <span className="text-foreground">{fmtPrice((subtotal * routerFeePct) / 100)} Ξ</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>You receive (after {mk.protocolFee + routerFeePct}% fees)</span>
                    <span className="text-acid">{fmtPrice(proceeds)} Ξ</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>USD estimate</span>
                    <span className="text-foreground">{fmtUsd(ethToUsd(proceeds))}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-sm font-semibold">
                <span>{mode === "buy" ? "Total" : mode === "sell" ? "List price" : "Offer"}</span>
                <span className="text-acid">{fmtPrice(total)} Ξ</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-acid" />
              Routed via Obsidian smart-order router · MEV protected
            </div>

            {!isConnected ? (
              <div className="flex flex-col items-center gap-2 border-t border-border pt-3">
                <div className="font-mono text-xs text-muted-foreground">Connect a wallet to {mode}</div>
                <WalletButton />
              </div>
            ) : (
              <button
                onClick={execute}
                disabled={busy || mode !== "buy" && !Number(sellPrice)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-acid py-3 font-mono text-sm font-bold uppercase tracking-wide text-background shadow-glow-sm transition hover:bg-acid-bright active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {step === 0 ? (mode === "buy" ? `Buy ${cart.length > 1 ? "all" : "now"}` : mode === "sell" ? "Sign listing" : "Sign offer") : step === 1 ? "Waiting for signature…" : "Broadcasting…"}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-acid drop-shadow-[0_0_16px_hsl(76_88%_60%/0.5)]" />
            <div className="mt-3 font-display text-lg font-semibold">
              {mode === "buy" ? "Purchase complete" : mode === "sell" ? "Listed for sale" : "Offer placed"}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {fmtPrice(total)} Ξ · {cart.length} item{cart.length > 1 ? "s" : ""} · via {mk.name}
            </div>
            {txHash ? (
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                tx {shortAddr(txHash, 6)}
                <ExternalLink className="h-3 w-3" />
              </div>
            ) : null}
            <button onClick={onClose} className="mt-5 w-full rounded-lg border border-border py-2.5 font-mono text-sm font-semibold transition hover:bg-muted">
              Done
            </button>
          </div>
        )}

        {/* step rail */}
        <div className="flex border-t border-border">
          {STEPS.map((s, i) => (
            <div key={s} className={cn("flex-1 py-2 text-center font-mono text-[9px] uppercase tracking-[0.18em]", i <= step ? "bg-acid-dim text-acid" : "text-muted-foreground/50")}>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
