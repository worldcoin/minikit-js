'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode, useEffect } from 'react';

const appId = 'your-app-id';

export const MiniKitProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    MiniKit.install(appId);
  }, []);

  return <>{children}</>;
};
