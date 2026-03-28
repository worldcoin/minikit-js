---
'@worldcoin/minikit-js': major
'@worldcoin/minikit-react': major
---

MiniKit 2.0 — Unified SDK

### Breaking Changes

- **`MiniKit.commands` / `MiniKit.commandsAsync` removed** — use `await MiniKit.signMessage()`, `await MiniKit.walletAuth()` etc. directly
- **World ID verification moved to `@worldcoin/idkit`** — `MiniKit.commandsAsync.verify()` is no longer available
- **`sendTransaction` uses calldata-first `transactions` array** with explicit `chainId` instead of the legacy contract-call shape
- **Command return shape changed to `{ executedWith, data }`** — `executedWith` indicates `'minikit' | 'wagmi' | 'fallback'`
- **`walletAuth` nonce validation is stricter** — requires alphanumeric, 8+ characters (no hyphens)
- **Removed SIWE v1 support** — only SIWE v3+ (`siwe` package) is supported
- **Type/helper exports moved** — types to `@worldcoin/minikit-js/commands`, SIWE utils to `@worldcoin/minikit-js/siwe`, address book to `@worldcoin/minikit-js/address-book`
- **`signTypedData` deprecated**

### New Features

- **Wagmi connector** — `worldApp()` connector via `@worldcoin/minikit-js/wagmi` for seamless wallet integration
- **Custom fallbacks** — all commands accept a `fallback` handler for standalone (non-World App) usage
- **Built-in wagmi web paths** for `walletAuth`, `signMessage`, `signTypedData`, `sendTransaction`
- **EIP-1193 provider** — `getWorldAppProvider()` for viem/ethers integration
- **`MiniKitProvider`** accepts `wagmiConfig` for automatic web fallback routing
