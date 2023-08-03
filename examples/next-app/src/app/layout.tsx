import { SupportedSquidRegion } from '@squidcloud/common';
import { SquidContextProvider } from '@squidcloud/react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SquidContextProvider
          options={{
            appId: process.env.NEXT_PUBLIC_SQUID_APP_ID,
            region: process.env
              .NEXT_PUBLIC_SQUID_REGION as SupportedSquidRegion,
            environmentId: 'dev',
            squidDeveloperId: process.env.NEXT_PUBLIC_SQUID_DEVELOPER_ID,
          }}
        >
          {children}
        </SquidContextProvider>
      </body>
    </html>
  );
}
