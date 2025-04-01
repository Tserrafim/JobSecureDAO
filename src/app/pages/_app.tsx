import type { AppProps } from "next/app";
import { WagmiConfig } from "wagmi";
import { SessionProvider } from "next-auth/react";
import { config } from "@/lib/wallet";
import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";
import "@/styles/neumorphic.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <WagmiConfig config={config}>
      <SessionProvider session={session} refetchInterval={60 * 60}>
        <Component {...pageProps} />
        <Toaster />
      </SessionProvider>
    </WagmiConfig>
  );
}