---
name: web-to-miniapp
description: Use this skill when you are asked to adapt an existing web3 dapp to work as a World App mini app, or to share code between a web dapp and a mini app. This skill covers the technical steps of migration, common issues, and debugging tips. There will be some changes required to contracts and frontend code, but the overall architecture and user experience can remain largely unchanged.
---

# Migrate Next.js Dapp to World App Mini App

You are converting an existing Next.js dapp that uses viem to work as a World App mini app. Follow these steps in order.

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

Detect World App and use `getWorldAppProvider()` as the EIP-1193 provider. Fall back to `window.ethereum` for browser wallets.

```tsx
import { getWorldAppProvider } from '@worldcoin/minikit-js';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { createWalletClient, custom } from 'viem';
import { worldchain } from 'viem/chains';

// Inside your component:
let isWorldApp = false;
try {
  isWorldApp = !!useMiniKit().isInstalled;
} catch {
  isWorldApp = typeof window !== 'undefined' && !!window.WorldApp;
}

// When connecting:
const provider = isWorldApp ? getWorldAppProvider() : window.ethereum;

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

## Step 5 — Replace ERC20 approve with Permit2

MiniKit blocks standard `token.approve()` calls. Use Permit2 AllowanceTransfer instead.

Permit2 address (same on all EVM chains): `0x000000000022D473030F116dDEE9F6B43aC78BA3`

**Frontend — change approve calls:**

```tsx
// Before (blocked in mini app):
await walletClient.writeContract({
  address: TOKEN,
  abi: erc20Abi,
  functionName: 'approve',
  args: [SPENDER, amount],
});

// After:
const expiration = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
await walletClient.writeContract({
  address: '0x000000000022D473030F116dDEE9F6B43aC78BA3', // Permit2
  abi: [
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'token', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
      ],
      outputs: [],
    },
  ],
  functionName: 'approve',
  args: [TOKEN, SPENDER, amount, expiration],
});
```

**Smart contract — change transferFrom:**

```solidity
// Before:
token.transferFrom(msg.sender, address(this), amount);

// After:
import {IAllowanceTransfer} from "permit2/src/interfaces/IAllowanceTransfer.sol";

IAllowanceTransfer public immutable permit2;
// Set in constructor: permit2 = IAllowanceTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3);

permit2.transferFrom(msg.sender, address(this), uint160(amount), address(token));
```

World App automatically approves tokens to the Permit2 contract. Your contract only calls `permit2.transferFrom`.

## Step 6 — Handle userOpHash receipts

`eth_sendTransaction` through MiniKit returns a `userOpHash`, not a mined tx hash. `waitForTransactionReceipt` may time out. Use a longer timeout and catch:

```tsx
try {
  await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000,
    pollingInterval: 2_000,
  });
} catch {
  // userOp not yet settled — refresh state anyway
}
```

## Step 7 — Whitelist contracts and tokens

In the **Developer Portal > Mini App > Permissions**, add:

- **Permit2 Tokens** — every ERC-20 your app transfers
- **Contract Entrypoints** — every contract your app calls directly

Transactions touching non-whitelisted contracts are blocked with `invalid_contract`.

## Step 8 — (Optional) Bundle transactions

For one-tap UX, call `MiniKit.sendTransaction()` directly with multiple transactions. The EIP-1193 provider only sends one tx at a time — for batching you must bypass it:

```tsx
import { MiniKit } from '@worldcoin/minikit-js';
import { encodeFunctionData } from 'viem';

await MiniKit.sendTransaction({
  chainId: 480,
  transactions: [
    {
      to: PERMIT2,
      data: encodeFunctionData({
        abi: permit2Abi,
        functionName: 'approve',
        args: [TOKEN, SPENDER, amount, expiration],
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

World App executes these atomically — both succeed or both revert.

---

## Common gotchas

| Issue                                      | Symptom                               | Fix                                          |
| ------------------------------------------ | ------------------------------------- | -------------------------------------------- |
| SSR hydration mismatch                     | Buttons render but clicks do nothing  | `dynamic(..., { ssr: false })`               |
| `MiniKit.isInstalled()` before `install()` | Always `false` even in World App      | Use `useMiniKit()` hook or `window.WorldApp` |
| ERC20 `approve()` blocked                  | Transaction silently rejected         | Use `permit2.approve()`                      |
| Permit2 uses `uint160` amounts             | Silent overflow                       | Cast explicitly                              |
| `eth_sendTransaction` returns `userOpHash` | `waitForTransactionReceipt` times out | Longer timeout + catch                       |
| Missing contract whitelist                 | `invalid_contract` error              | Add to Developer Portal permissions          |

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
