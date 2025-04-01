import { createPublicClient, http, getContract } from "viem";
import { mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ALCHEMY_RPC_URL)
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    injected({ target: "metaMask" }),
    walletConnect({ projectId: process.env.WC_PROJECT_ID! })
  ],
  publicClient
});

export async function getSigner() {
  const { connector } = await wagmiConfig.connector;
  if (!connector) throw new Error("No wallet connected");
  return await connector.getSigner();
}