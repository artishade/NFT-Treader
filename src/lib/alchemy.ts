// ── Alchemy NFT API action (optional live on-chain data) ──────────────────
// Set VITE_ALCHEMY_API_KEY in the Keys/API keys UI to enable on-chain NFT
// import for any connected wallet. Without it the app runs fully simulated.

export const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY ?? "";

const NETWORK_SUBDOMAIN: Record<number, string> = {
  1: "eth-mainnet",
  8453: "base-mainnet",
  137: "polygon-mainnet",
  42161: "arb-mainnet",
};

export interface AlchemyNft {
  contract: { address: string; name?: string; symbol?: string };
  tokenId: string;
  title?: string;
  image?: { thumbnail?: string; gateway?: string };
  collection?: { name?: string };
  floorPrice?: { floorPrice: string; priceCurrency: string }[];
}

export async function fetchNftsForOwner(
  address: string,
  chainId: number,
  pageSize = 24,
): Promise<AlchemyNft[]> {
  const sub = NETWORK_SUBDOMAIN[chainId] ?? "eth-mainnet";
  if (!alchemyKey) throw new Error("Missing VITE_ALCHEMY_API_KEY");
  const url = `https://${sub}.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${address}&pageSize=${pageSize}&withMetadata=false&refreshCache=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alchemy error ${res.status}`);
  const json = (await res.json()) as { ownedNfts?: AlchemyNft[] };
  return json.ownedNfts ?? [];
}
