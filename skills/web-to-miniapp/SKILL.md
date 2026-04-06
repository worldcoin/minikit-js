---
name: web-to-miniapp
description: Use this skill when you are asked to adapt an existing web app to work as a World App mini app, or to share code between a web app and a mini app. This skill covers the technical steps of migration, common issues, and debugging tips. There will be some changes required to contracts and frontend code, but the overall architecture and user experience can remain largely unchanged.
---

# Migrate Next.js Web App to World App Mini App

You are converting an existing Next.js web app that uses viem to work as a World App mini app. Follow these steps in order.

## Step 1 — Install MiniKit

```bash
npm install @worldcoin/minikit-js @worldcoin/minikit-react
```

## Step 2 — Disable SSR for pages that use MiniKit

MiniKit depends on `window.WorldApp` which doesn't exist on the server. SSR causes hydration mismatches that silently break all React event handlers — buttons render but do nothing.

Wrap the page component in a dynamic import with `ssr: false`:

```tsx
// src/app/page.tsx
'use client';
import dynamic from 'next/dynamic';
const App = dynamic(() => import('../components/App'), { ssr: false });
export default function Page() {
  return <App />;
}
```

Move the actual page logic into `src/components/App.tsx`.

## Step 3 — Add MiniKitProvider

Create `src/app/providers.tsx`:

```tsx
'use client';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
export default function Providers({ children }: { children: React.ReactNode }) {
  return <MiniKitProvider>{children}</MiniKitProvider>;
}
```

Wrap children in `src/app/layout.tsx`:

```tsx
import Providers from './providers';
// ...
<body>
  <Providers>{children}</Providers>
</body>;
```

## Step 4 — Dual-provider wallet connection

Detect World App with `MiniKit.isInWorldApp()` and use `getWorldAppProvider()` as the EIP-1193 provider. Fall back to `window.ethereum` for browser wallets.

```tsx
import { MiniKit } from '@worldcoin/minikit-js';
import { getWorldAppProvider } from '@worldcoin/minikit-js';
import { createWalletClient, custom } from 'viem';
import { worldchain } from 'viem/chains';

const provider = MiniKit.isInWorldApp()
  ? getWorldAppProvider()
  : window.ethereum;

const walletClient = createWalletClient({
  chain: worldchain,
  transport: custom(provider),
});
```

`getWorldAppProvider()` is a standard EIP-1193 provider. Under the hood:

- `eth_requestAccounts` → `MiniKit.walletAuth()` (SIWE sign-in)
- `eth_sendTransaction` → `MiniKit.sendTransaction()` (returns `userOpHash`)
- `eth_chainId` → `0x1e0` (World Chain 480)

All existing `writeContract` / `readContract` calls work unchanged through this provider.

## Step 5 — Bundle Approve with Contract Calls

World App resets token approvals to 0 after each transaction. A separate `approve()` followed by a `transferFrom()` in the next tx will fail, the approval is already gone. Thus you should bundle the approval and your contract call in a single `sendTransaction`:

```tsx
import { MiniKit } from '@worldcoin/minikit-js';
import { encodeFunctionData } from 'viem';

await MiniKit.sendTransaction({
  chainId: 480,
  transactions: [
    {
      to: TOKEN,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACT, amount],
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

In World App, these execute atomically. On web, they execute sequentially — each requires a separate wallet confirmation and is not atomic.

## Step 6 — Handle userOpHash receipts

MiniKit returns a `userOpHash`, not a standard tx hash. Use `useUserOperationReceipt` from `@worldcoin/minikit-react` to poll for the receipt:

```tsx
import { useUserOperationReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

const client = createPublicClient({
  chain: worldchain,
  transport: http(),
});

const { poll, isLoading } = useUserOperationReceipt({ client });

// After sendTransaction:
const result = await MiniKit.sendTransaction({ ... });
await poll(result.data.userOpHash);
```

## Step 7 — Whitelist contracts and tokens

In the **Developer Portal > Mini App > Permissions**, add:

- **Permit2 Tokens** — every ERC-20 your app transfers
- **Contract Entrypoints** — every contract your app calls directly

Transactions touching non-whitelisted contracts are blocked with `invalid_contract`.

| Issue                                      | Symptom                               | Fix                                                           |
| ------------------------------------------ | ------------------------------------- | ------------------------------------------------------------- |
| SSR hydration mismatch                     | Buttons render but clicks do nothing  | `dynamic(..., { ssr: false })`                                |
| `MiniKit.isInstalled()` before `install()` | Always `false` even in World App      | Use `useMiniKit()` hook or `window.WorldApp`                  |
| Permit2 uses `uint160` amounts             | Silent overflow                       | Cast explicitly                                               |
| `eth_sendTransaction` returns `userOpHash` | `waitForTransactionReceipt` times out | Use `useUserOperationReceipt` from `@worldcoin/minikit-react` |
| Missing contract whitelist                 | `invalid_contract` error              | Add to Developer Portal permissions                           |

## Tip: Debugging in the webview

There are no browser devtools in World App's webview. Add [eruda](https://github.com/nicedaycode/eruda) for a mobile console:

```html
<!-- In layout.tsx body -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>
  eruda.init();
</script>
```

## Bonus: Think about World ID

Think about places where you could use privacy preserving sybil resistance with World ID. The [World ID SDK](https://docs.world.org/world-id/overview)
