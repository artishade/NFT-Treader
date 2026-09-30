// ── Core types & deterministic market engine ─────────────────────────────
// One shared engine feeds the landing ticker, dashboard, detail pages and
// portfolio so prices stay consistent across routes and reloads.

export type Chain = "Ethereum" | "Base" | "Polygon" | "Arbitrum" | "Solana" | "Bitcoin";
export type TradeKind = "BUY" | "SELL" | "LIST" | "MINT" | "OFFER" | "TRANSFER";

export interface Marketplace {
  slug: string;
  name: string;
  short: string;
  color: string;
  chains: Chain[];
  share: number; // % of aggregated volume
  protocolFee: number; // %
}

export interface Collection {
  slug: string;
  name: string;
  symbol: string;
  chain: Chain;
  floor: number; // ETH
  change24h: number; // %
  volume24h: number; // ETH
  volumeAll: number; // ETH
  supply: number;
  owners: number;
  listedPct: number;
  bestMarketplace: string; // marketplace slug with lowest listing
  category: string;
  accent: string; // hex accent for generated art
  vibe: number; // seed for art generator
  description: string;
}

export interface NftItem {
  id: string;
  collection: string; // collection slug
  name: string;
  tokenId: number;
  price: number; // best listing ETH
  lastSale: number;
  marketplace: string;
  rarity: number; // percentile 0-100, lower = rarer
  traits: { name: string; value: string; pct: number }[];
  owner: string;
  chain: Chain;
  vibe: number; // art seed
}

export interface Activity {
  id: string;
  kind: TradeKind;
  collection: string;
  tokenId?: number;
  price: number;
  marketplace: string;
  maker: string;
  taker: string;
  ts: number;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Marketplace registry ───────────────────────────────────────────────────
export const MARKETPLACES: Marketplace[] = [
  { slug: "opensea", name: "OpenSea", short: "OS", color: "#8A9CFF", chains: ["Ethereum", "Base", "Polygon", "Arbitrum"], share: 31.4, protocolFee: 2.5 },
  { slug: "blur", name: "Blur", short: "BL", color: "#FF7A45", chains: ["Ethereum"], share: 24.1, protocolFee: 0.5 },
  { slug: "magiceden", name: "Magic Eden", short: "ME", color: "#5EEAD4", chains: ["Ethereum", "Base", "Solana", "Bitcoin"], share: 18.7, protocolFee: 1.5 },
  { slug: "okx", name: "OKX NFT", short: "OK", color: "#FFD54A", chains: ["Ethereum", "Base", "Polygon", "Arbitrum"], share: 11.2, protocolFee: 0 },
  { slug: "reservoir", name: "Reservoir", short: "RS", color: "#7DD3FC", chains: ["Ethereum", "Base"], share: 6.3, protocolFee: 0 },
  { slug: "x2y2", name: "X2Y2", short: "X2", color: "#C4B5FD", chains: ["Ethereum"], share: 4.6, protocolFee: 0.5 },
  { slug: "rarible", name: "Rarible", short: "RB", color: "#F9A8D4", chains: ["Ethereum", "Polygon"], share: 2.2, protocolFee: 1.0 },
  { slug: "foundation", name: "Foundation", short: "FN", color: "#FFFFFF", chains: ["Ethereum"], share: 1.5, protocolFee: 5.0 },
];

export const marketplaceBySlug = (slug: string): Marketplace =>
  MARKETPLACES.find((m) => m.slug === slug) ?? MARKETPLACES[0];

const CHAINS: Chain[] = ["Ethereum", "Base", "Polygon", "Arbitrum", "Solana", "Bitcoin"];

interface CollectionSeed {
  name: string;
  symbol: string;
  category: string;
  floor: number;
  supply: number;
  accent: string;
  description: string;
}

const SEEDS: CollectionSeed[] = [
  { name: "Obsidian Punks", symbol: "OBP", category: "PFP", floor: 14.82, supply: 10000, accent: "#C6F53F", description: "10,000 citizens of the dark forest chain. The de facto blue chip of the Obsidian terminal." },
  { name: "Chrome Serpents", symbol: "CHRM", category: "Generative", floor: 6.41, supply: 5555, accent: "#7DD3FC", description: "Machine-forged serpents etched in liquid chrome. Fully on-chain, fully mechanical." },
  { name: "Void Gardens", symbol: "VOID", category: "Art", floor: 3.09, supply: 2048, accent: "#F9A8D4", description: "Immersive generative gardens grown from entropy. Curated by the Void DAO." },
  { name: "Neon Ronin", symbol: "NRON", category: "PFP", floor: 1.77, supply: 8888, accent: "#FFD54A", description: "Ronin of the electric city. Every blade trait is a cross-marketplace sweep legend." },
  { name: "Quantum Cats", symbol: "QCAT", category: "PFP", floor: 2.24, supply: 4096, accent: "#5EEAD4", description: "Schrödinger's best friend. Collapsible across six chains at once." },
  { name: "Basalt Monoliths", symbol: "BSLT", category: "3D", floor: 0.94, supply: 1200, accent: "#8A9CFF", description: "Monolithic structures rendered in ray-traced basalt. Anchor of the 3D renaissance." },
  { name: "Hyperdrive Racers", symbol: "HYPR", category: "Gaming", floor: 0.52, supply: 30000, accent: "#FF7A45", description: "Stake, race, and burn. The premier play-to-vaporize circuit." },
  { name: "Molten Apes", symbol: "MLT", category: "PFP", floor: 0.61, supply: 6666, accent: "#FF5470", description: "Forged in the last gas balloon. Diamond hands, lava skin." },
  { name: "Glasswork Idols", symbol: "GLAS", category: "Art", floor: 0.38, supply: 1500, accent: "#E2E8F0", description: "Hand-blown pixel glass. Each idol is a single-edition museum piece." },
  { name: "Signal Ghosts", symbol: "SGST", category: "Music", floor: 0.27, supply: 5000, accent: "#C4B5FD", description: "Ghost producers distributed as visual frequencies. Streaming rights on-chain." },
  { name: "Terracotta Drones", symbol: "TRD", category: "Gaming", floor: 0.19, supply: 20000, accent: "#FDBA74", description: "Autonomous clay drones that mine and duel across the badlands." },
  { name: "Lumen Fossils", symbol: "LMN", category: "Photography", floor: 0.84, supply: 777, accent: "#93C5FD", description: "Fossilized light, scanned at 16K. Shot across seven continents." },
  { name: "Paper Cathedrals", symbol: "PAPR", category: "Art", floor: 0.11, supply: 9999, accent: "#FDE68A", description: "Folded architecture from a post-digital origami guild." },
  { name: "Static Bloom", symbol: "STBL", category: "Generative", floor: 0.069, supply: 12000, accent: "#86EFAC", description: "Broadcast interference reimagined as botanical form." },
  { name: "Deeprun Badgers", symbol: "DBDG", category: "PFP", floor: 0.045, supply: 4400, accent: "#A3E635", description: "The badgers run deep. Community-owned since block 14,882,001." },
  { name: "Solar Anvils", symbol: "SNVL", category: "3D", floor: 0.033, supply: 2500, accent: "#FCA5A5", description: "Anvils cooled in stellar wind. Forge passes included." },
];

const PREFIX = ["Chrome", "Void", "Neon", "Quantum", "Basalt", "Molten", "Glass", "Signal", "Solar", "Static", "Umbral", "Cobalt", "Ivory", "Ember", "Frost", "Rune"];
const SUFFIX = ["Skull", "Halo", "Fang", "Prism", "Warden", "Cipher", "Bloom", "Forge", "Aria", "Vertex", "Drift", "Karma", "Echo", "Pulse", "Monk", "Ghost"];
const TRAIT_NAMES = ["Background", "Eyes", "Mouth", "Aura", "Garment", "Headgear", "Familiar"];

function collectionFromSeed(seed: CollectionSeed, i: number): Collection {
  const rnd = mulberry32(hashStr(seed.symbol) + i * 7919);
  const floorDelta = 1 + (rnd() - 0.45) * 0.9;
  const floor = Math.max(0.012, seed.floor * floorDelta);
  const listedPct = 6 + rnd() * 38;
  const owners = Math.round(supplyOf(seed.supply) * (0.3 + rnd() * 0.5));
  const market = MARKETPLACES[Math.floor(rnd() * MARKETPLACES.length)];
  const chain = seed.supply >= 20000 && rnd() > 0.5 ? (rnd() > 0.5 ? "Base" : "Polygon") : rnd() > 0.82 ? "Bitcoin" : rnd() > 0.72 ? "Solana" : "Ethereum";
  return {
    slug: seed.symbol.toLowerCase(),
    name: seed.name,
    symbol: seed.symbol,
    chain: chain as Chain,
    floor,
    change24h: (rnd() - 0.42) * 28,
    volume24h: floor * supplyOf(seed.supply) * (0.002 + rnd() * 0.03),
    volumeAll: floor * supplyOf(seed.supply) * (0.4 + rnd() * 6),
    supply: supplyOf(seed.supply),
    owners,
    listedPct,
    bestMarketplace: market.slug,
    category: seed.category,
    accent: seed.accent,
    vibe: hashStr(seed.name),
    description: seed.description,
  };
}

function supplyOf(s: number) {
  return s;
}

export const COLLECTIONS: Collection[] = SEEDS.map(collectionFromSeed);

export const collectionBySlug = (slug: string): Collection | undefined =>
  COLLECTIONS.find((c) => c.slug === slug);

function itemFromCollection(c: Collection, tokenId: number): NftItem {
  const rnd = mulberry32(c.vibe + tokenId * 48271);
  const rarity = Math.floor(Math.pow(rnd(), 2.2) * 100);
  const traits = TRAIT_NAMES.map((name) => {
    const value = PREFIX[Math.floor(rnd() * PREFIX.length)] + " " + SUFFIX[Math.floor(rnd() * SUFFIX.length)];
    return { name, value, pct: Math.round(1 + rnd() * 42) };
  });
  const marketplace = MARKETPLACES[Math.floor(rnd() * MARKETPLACES.length)].slug;
  const rarityMult = 1 + (100 - rarity) / 55;
  const price = c.floor * rarityMult * (0.72 + rnd() * 0.7);
  const lastSale = price * (0.25 + rnd() * 1.15);
  const wallet = "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("");
  return {
    id: `${c.slug}-${tokenId}`,
    collection: c.slug,
    name: `${c.name} #${tokenId}`,
    tokenId,
    price,
    lastSale,
    marketplace,
    rarity,
    traits,
    owner: wallet,
    chain: c.chain,
    vibe: c.vibe + tokenId,
  };
}

export function itemsForCollection(slug: string, count = 48): NftItem[] {
  const c = collectionBySlug(slug);
  if (!c) return [];
  const out: NftItem[] = [];
  const base = hashStr(slug) % 7000;
  for (let i = 0; i < count; i++) out.push(itemFromCollection(c, base + i));
  return out;
}

export function itemById(id: string): NftItem | undefined {
  const [slug, tok] = id.split("-");
  const tokenId = Number(tok);
  if (!slug || !Number.isFinite(tokenId)) return undefined;
  const c = collectionBySlug(slug);
  if (!c) return undefined;
  return itemFromCollection(c, tokenId);
}

// ── Activity feed ──────────────────────────────────────────────────────────
function activityAt(ts: number): Activity {
  const seed = mulberry32(Math.floor(ts / 1000));
  const c = COLLECTIONS[Math.floor(seed() * COLLECTIONS.length)];
  const kindPool: TradeKind[] = ["BUY", "BUY", "BUY", "LIST", "SELL", "OFFER", "MINT", "TRANSFER"];
  const kind = kindPool[Math.floor(seed() * kindPool.length)];
  const mk = MARKETPLACES[Math.floor(seed() * MARKETPLACES.length)];
  const addr = () => "0x" + Array.from({ length: 4 }, () => Math.floor(seed() * 65536).toString(16).padStart(4, "0")).join("") + "…" + Array.from({ length: 4 }, () => Math.floor(seed() * 65536).toString(16).padStart(4, "0")).join("");
  return {
    id: `a${Math.floor(ts / 1000)}`,
    kind,
    collection: c.slug,
    tokenId: Math.floor(seed() * c.supply),
    price: c.floor * (0.6 + seed() * 2.6),
    marketplace: mk.slug,
    maker: addr(),
    taker: addr(),
    ts,
  };
}

export function activityFeed(count = 40): Activity[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => activityAt(now - i * 11_000 - Math.random() * 4000));
}

// ── Price history for charts ───────────────────────────────────────────────
export function priceHistory(slug: string, days = 30): { day: string; floor: number; volume: number }[] {
  const c = collectionBySlug(slug);
  if (!c) return [];
  const rnd = mulberry32(c.vibe);
  const out: { day: string; floor: number; volume: number }[] = [];
  let price = c.floor * (0.55 + rnd() * 0.5);
  for (let i = days; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    price = Math.max(0.008, price * (1 + (rnd() - 0.46) * 0.09));
    out.push({
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      floor: price,
      volume: c.volume24h * (0.35 + rnd() * 1.8),
    });
  }
  // pin the last point to current floor
  out[out.length - 1].floor = c.floor;
  return out;
}

export function portfolioHistory(days = 30): { day: string; value: number }[] {
  const rnd = mulberry32(1337);
  let v = 22;
  return Array.from({ length: days }, (_, i) => {
    v = Math.max(6, v * (1 + (rnd() - 0.4) * 0.12) + i * 0.14);
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
    return { day: `${d.getMonth() + 1}/${d.getDate()}`, value: v };
  });
}
