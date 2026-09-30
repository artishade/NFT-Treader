import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { wagmiConfig } from "./lib/wallet";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import CollectionPage from "./pages/CollectionPage";
import NftPage from "./pages/NftPage";
import PortfolioPage from "./pages/PortfolioPage";

const queryClient = new QueryClient();
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL ?? "");

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConvexProvider client={convex}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/collection/:slug" element={<CollectionPage />} />
              <Route path="/nft/:id" element={<NftPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ConvexProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="font-display text-6xl font-bold text-acid text-glow">404</div>
      <p className="font-mono text-sm text-muted-foreground">This route was delisted.</p>
      <Link to="/" className="rounded-lg bg-acid px-5 py-2.5 font-mono text-sm font-bold uppercase text-background">
        Back to terminal
      </Link>
    </div>
  );
}
