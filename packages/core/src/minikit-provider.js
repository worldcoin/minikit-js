'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { jsx as _jsx } from 'react/jsx-runtime';
import { useConfig } from 'wagmi';
import { setWagmiConfig } from './commands/wagmi-fallback';
import { MiniKit } from './minikit';
const MiniKitContext = createContext(undefined);
function useWagmiConfigSafe() {
  try {
    return useConfig();
  } catch {
    return undefined;
  }
}
export const MiniKitProvider = ({ children, props }) => {
  const detectedWagmiConfig = useWagmiConfigSafe();
  const [isInstalled, setIsInstalled] = useState(undefined);
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
  return _jsx(MiniKitContext.Provider, {
    value: { isInstalled },
    children: children,
  });
};
// Custom hook to see when minikit is installed
export const useMiniKit = () => {
  const context = useContext(MiniKitContext);
  if (context === undefined) {
    throw new Error('useMiniKit must be used within a MiniKitProvider');
  }
  return context;
};
