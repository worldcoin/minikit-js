'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { setWagmiConfig } from './commands/fallback-wagmi';
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
  wagmiConfig,
}: {
  children: ReactNode;
  props?: MiniKitProps;
  /** Pass your Wagmi config to enable web fallback via Wagmi. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wagmiConfig?: any;
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
