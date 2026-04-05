'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { MiniKit } from './minikit';

const WAGMI_INSTALL_HOOK_KEY = '__minikit_install_wagmi_fallback__' as const;

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
  const wagmiConfig = props?.wagmiConfig;

  useEffect(() => {
    const { success } = MiniKit.install(props?.appId);
    if (!success) return setIsInstalled(false);
    console.warn(
      'MiniKit permissions not fetched in provider. MiniKit.user.permissions will be inaccurate.',
    );
    setIsInstalled(success);
  }, [props?.appId]);

  useEffect(() => {
    if (!wagmiConfig) return;
    const install = (globalThis as any)[WAGMI_INSTALL_HOOK_KEY];
    if (typeof install === 'function') {
      install(wagmiConfig);
    } else {
      console.warn(
        'MiniKitProvider received wagmiConfig but the wagmi fallback module is not imported. ' +
          'Add this once in your app: import "@worldcoin/minikit-js/wagmi-fallback"',
      );
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
