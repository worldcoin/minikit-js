/**
 * Wagmi integration for MiniKit
 *
 * @example
 * ```typescript
 * import { worldApp } from '@worldcoin/minikit-js/wagmi';
 *
 * const wagmiConfig = createConfig({
 *   connectors: [
 *     worldApp(),
 *     injected(),
 *     walletConnect({ ... }),
 *   ],
 *   // ...
 * });
 * ```
 */

export * from './wagmi/index';
