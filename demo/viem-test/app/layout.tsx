'use client';

import { MiniKitProvider } from '@worldcoin/minikit-js/provider';
import { ErudaProvider } from '@/components/Eruda';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MiniKitProvider
          props={{ appId: process.env.NEXT_PUBLIC_APP_ID ?? '' }}
        >
          <ErudaProvider>{children}</ErudaProvider>
        </MiniKitProvider>
      </body>
    </html>
  );
}
