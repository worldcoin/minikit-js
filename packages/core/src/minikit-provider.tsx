'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as wagmi from 'wagmi';
import { setWagmiConfig } from './commands/wagmi-fallback';
import { MiniKit } from './minikit';

type MiniKitProps = {
  appId?: string;
  wagmiConfig?: unknown;
};

type MiniKitContextValue = {
  isInstalled: boolean | undefined;
};

const MiniKitContext = createContext<MiniKitContextValue | undefined>(
  undefined,
);

function useWagmiConfigSafe() {
  const useConfig = (wagmi as any).useConfig as (() => unknown) | undefined;
  if (!useConfig) return undefined;

  try {
    return useConfig();
  } catch {
    return undefined;
  }
}

export const MiniKitProvider = ({
  children,
  props,
}: {
  children: ReactNode;
  props?: MiniKitProps;
}) => {
  const detectedWagmiConfig = useWagmiConfigSafe();
  const [isInstalled, setIsInstalled] = useState<boolean | undefined>(
    undefined,
  );
  const wagmiConfig = props?.wagmiConfig ?? detectedWagmiConfig;

  useEffect(() => {
    const { success } = MiniKit.install(props?.appId);
    if (!success) return setIsInstalled(false);
    console.warn(
      'MiniKit permissions not fetched in provider. MiniKit.user.permissions will be inaccurate.',
    );
    setIsInstalled(success);
  }, [props?.appId]);

  useEffect(() => {
    if (wagmiConfig) {
      setWagmiConfig(wagmiConfig);
    }
  }, [wagmiConfig]);

  return (
    <MiniKitContext.Provider value={{ isInstalled }}>
      {children}
    </MiniKitContext.Provider>
  );
};

// Custom hook to see when minikit is installed
export const useMiniKit = () => {
  const context = useContext(MiniKitContext);
  if (context === undefined) {
    throw new Error('useMiniKit must be used within a MiniKitProvider');
  }
  return context;
};
