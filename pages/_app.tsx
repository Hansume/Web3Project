import type { AppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Mainnet;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider activeChain={activeChainId} clientId="f3231589827385d45a588b705e428b44">
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
