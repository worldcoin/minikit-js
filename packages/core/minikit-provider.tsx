'use client';

import {
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { MiniKit } from './minikit';

type MiniKitProps = {
  appId: string;
};

type MiniKitContextValue = {
  isInstalled: boolean | undefined;
};

const MiniKitContext = createContext<MiniKitContextValue | undefined>(
  undefined,
);

export const MiniKitProvider = ({
  children,
  props,
}: {
  children: ReactNode;
  props?: MiniKitProps;
}) => {
  const [isInstalled, setIsInstalled] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    const { success } = MiniKit.install(props?.appId);
    if (!success) return setIsInstalled(false);
    console.warn(
      'MiniKit permissions not fetched in provider. MiniKit.user.permissions will be inaccurate.',
    );
    setIsInstalled(success);
  }, [props?.appId]);

  return (
    <MiniKitContext.Provider value={{ isInstalled }}>
      <WagmiAutoDetect />
      {children}
    </MiniKitContext.Provider>
  );
};

/**
 * Auto-detects Wagmi config from the provider tree.
 *
 * When MiniKitProvider is wrapped inside WagmiProvider (per RFC),
 * this dynamically loads a bridge component that reads Wagmi's config
 * via useConfig() and wires it into MiniKit's fallback system.
 *
 * If wagmi is not installed, the dynamic import fails silently.
 * No manual configureWagmi() call needed.
 */
function WagmiAutoDetect() {
  const [Bridge, setBridge] = useState<ComponentType | null>(null);

  useEffect(() => {
    import('./src/wagmi-bridge')
      .then((mod) => setBridge(() => mod.WagmiConfigBridge))
      .catch(() => {
        // wagmi not installed — expected, no-op
      });
  }, []);

  return Bridge ? <Bridge /> : null;
}

// Custom hook to see when minikit is installed
export const useMiniKit = () => {
  const context = useContext(MiniKitContext);
  if (context === undefined) {
    throw new Error('useMiniKit must be used within a MiniKitProvider');
  }
  return context;
};
