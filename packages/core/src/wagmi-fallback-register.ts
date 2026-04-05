/**
 * Public entry point for the wagmi fallback adapter.
 *
 * Import this module once in your app (typically where you set up providers)
 * to enable MiniKit's wagmi-based web fallback for `walletAuth`,
 * `sendTransaction`, `signMessage`, and `signTypedData`.
 *
 * @example
 * ```tsx
 * // Side-effect import — works alongside MiniKitProvider's wagmiConfig prop:
 * import '@worldcoin/minikit-js/wagmi-fallback';
 *
 * // Or call explicitly:
 * import { registerWagmiFallback } from '@worldcoin/minikit-js/wagmi-fallback';
 * registerWagmiFallback(wagmiConfig);
 * ```
 */
// Importing wagmi-fallback installs the global install hook as a side effect,
// so MiniKitProvider's `wagmiConfig` prop will start working too.
import { setWagmiConfig } from './commands/wagmi-fallback';

/**
 * Register the wagmi fallback adapter with a wagmi Config.
 *
 * Call this once at app startup (or anywhere before invoking MiniKit commands).
 * Alternatively, pass `wagmiConfig` to `MiniKitProvider` — this module must
 * still be imported for the prop to take effect.
 */
export function registerWagmiFallback(config: unknown): void {
  setWagmiConfig(config);
}
