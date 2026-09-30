// ── Wallet connection layer (wagmi) ───────────────────────────────────────
// Works instantly with MetaMask / Coinbase / Rabby via InjectedConnector.
// If a WalletConnect project id is configured (VITE_WALLETCONNECT_PROJECT_ID),
// WalletConnect is enabled too. Keys go through the Keys/API keys UI and are
// exposed to the app via Vite env vars.

import { createConfig, http, useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { mainnet, base, polygon, arbitrum } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { useMemo } from "react";

const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

export const wagmiConfig = createConfig({
  chains: [mainnet, base, polygon, arbitrum],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Obsidian Exchange", preference: "all" }),
    ...(wcProjectId
      ? [walletConnect({ projectId: wcProjectId, showQrModal: true })]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});

export function useWallet() {
  const { address, isConnected, chain: activeChain } = useAccount();
  const { connect, connectors, isPending: connecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, chains, isPending: switching } = useSwitchChain();

  const walletName = useMemo(() => {
    const c = connectors.find((x) => x.name.toLowerCase().includes("metamask")) ?? connectors[0];
    return c?.name ?? "Wallet";
  }, [connectors]);

  return {
    address: address ?? null,
    isConnected,
    chainName: chains.find((c) => c.id === activeChain?.id)?.name ?? null,
    connect,
    connectors,
    connecting,
    connectError,
    disconnect,
    switchChain,
    switching,
    chains,
    walletName,
  };
}
