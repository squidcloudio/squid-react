import '@/styles/globals.css';
import { SupportedSquidRegion } from '@squidcloud/common';
import { SquidContextProvider } from '@squidcloud/react';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SquidContextProvider
      options={{
        appId: process.env.NEXT_PUBLIC_SQUID_APP_ID,
        region: process.env.NEXT_PUBLIC_SQUID_REGION as SupportedSquidRegion,
        environmentId: 'dev',
        squidDeveloperId: process.env.NEXT_PUBLIC_SQUID_DEVELOPER_ID,
      }}
    >
      <Component {...pageProps} />
    </SquidContextProvider>
  );
}
