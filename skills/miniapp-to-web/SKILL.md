---
name: miniapp-to-web
description: Use this skill when you are asked to make a World App mini app also work as a standalone web app, or to add browser wallet support alongside MiniKit. This skill covers adding Wagmi as a fallback so MiniKit commands work both inside World App and in any browser. All transactions are World Chain only (chainId 480).
---

# Migrate Mini App to Standalone Web App

You are converting a World App mini app to also work in a regular browser. MiniKit commands auto-detect the environment — inside World App they use the native bridge, outside they fall back to Wagmi. Follow these steps in order.

## Step 1 — Install dependencies

```bash
pnpm add wagmi @tanstack/react-query siwe
```

- `wagmi` — wallet connection and transaction execution on web
- `@tanstack/react-query` — peer dependency of wagmi
- `siwe` — needed for `walletAuth` SIWE message construction on web

## Step 2 — Create Wagmi config

```ts
// config.ts
import { worldApp } from '@worldcoin/minikit-js/wagmi';
import { createConfig, http } from 'wagmi';
import { worldchain } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [worldchain],
  connectors: [worldApp(), injected()],
  transports: {
    [worldchain.id]: http(),
  },
});
```

`worldApp()` handles World App, `injected()` handles browser wallets (MetaMask, etc).

## Step 3 — Update providers

Wrap with `WagmiProvider` and `QueryClientProvider`, and pass `wagmiConfig` to `MiniKitProvider`:

```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { WagmiProvider } from 'wagmi';
import { config } from './config';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          props={{
            appId: process.env.NEXT_PUBLIC_APP_ID!,
            wagmiConfig: config,
          }}
        >
          {children}
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

`MiniKitProvider` calls `setWagmiConfig(config)` internally which registers the Wagmi fallback adapter. `WagmiProvider` and `QueryClientProvider` are needed for Wagmi hooks like `useWaitForTransactionReceipt`.

## Step 4 — Auth works automatically

`MiniKit.walletAuth()` requires no code changes:

- **World App**: native SIWE flow via Smart Account (Safe)
- **Web**: connects via Wagmi connector, signs SIWE message

```tsx
const result = await MiniKit.walletAuth({
  nonce,
  statement: 'Sign in to my app',
});
// result.executedWith === "minikit" | "wagmi"
```

### Backend verification handles both account types

`verifySiweMessage` from `@worldcoin/minikit-js/siwe` auto-detects:
- **Smart Account (Safe)**: EIP-1271 `isValidSignature` on-chain
- **EOA**: ECDSA `recoverMessageAddress`

```ts
import { verifySiweMessage } from '@worldcoin/minikit-js/siwe';

const { isValid, siweMessageData } = await verifySiweMessage(
  payload, // { message, signature, address }
  nonce,
);
```

No branching needed — it checks if the address has contract code and picks the right method.

## Step 5 — Transactions work automatically

`MiniKit.sendTransaction()` requires no code changes. World Chain only (chainId 480).

- **World App**: native bridge, supports batching, returns `userOpHash`
- **Web (single tx)**: sent directly via Wagmi wallet
- **Web (multiple txs)**: automatically bundled into a single Multicall3 `aggregate3Value` call for atomic execution

```tsx
import { MiniKit } from '@worldcoin/minikit-js';
import { encodeFunctionData } from 'viem';

const result = await MiniKit.sendTransaction({
  chainId: 480,
  transactions: [
    {
      to: PERMIT2,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'approve',
        args: [TOKEN, SPENDER, amount, 0],
      }),
    },
    {
      to: CONTRACT,
      data: encodeFunctionData({
        abi: contractAbi,
        functionName: 'swap',
        args: [amount],
      }),
    },
  ],
});
```

### Handle transaction receipts by environment

```tsx
import { useUserOperationReceipt } from '@worldcoin/minikit-react';

const { poll } = useUserOperationReceipt({ client });

if (result.executedWith === 'minikit') {
  // World App: poll for UserOperation receipt
  await poll(result.data.userOpHash);
} else {
  // Web: standard tx hash
  await publicClient.waitForTransactionReceipt({
    hash: result.data.userOpHash as `0x${string}`,
  });
}
```

## Step 6 — World ID needs no changes

World ID uses IDKit, which is independent of the wallet layer. It works the same everywhere.

## Step 7 — Other commands need fallbacks

Commands without built-in Wagmi adapters (`pay`, `shareContacts`, `sendHapticFeedback`, etc.) need a `fallback` function for web:

```tsx
const result = await MiniKit.pay({
  amount: '1.00',
  token: 'USDCE',
  reference: 'order-123',
  description: 'Coffee',
  fallback: async () => {
    // Custom web payment flow
    return myCustomPaymentResult;
  },
});
```

Without a fallback, these throw `CommandUnavailableError` on web.

---

## What has built-in Wagmi support

| Command | Wagmi fallback | Notes |
|---|---|---|
| `walletAuth` | Yes | SIWE via Wagmi connector |
| `sendTransaction` | Yes | Single or batched via Multicall3 |
| `signMessage` | Yes | `personal_sign` via Wagmi |
| `signTypedData` | Yes | EIP-712 via Wagmi |
| `pay` | No | Provide `fallback` |
| `shareContacts` | No | Provide `fallback` |
| `verify` (World ID) | N/A | Uses IDKit directly |
| Everything else | No | Provide `fallback` |

## Key differences between environments

| Aspect | World App | Web |
|---|---|---|
| Account type | Smart Account (Safe) | EOA |
| Transaction hash | `userOpHash` (UserOperation) | Standard tx hash |
| Multi-tx | Native atomic batching | Multicall3 atomic batching |
| Gas | Sponsored | User pays |
| Chain | World Chain (480) | World Chain (480) |
