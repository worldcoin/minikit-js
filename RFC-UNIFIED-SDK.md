---
title: 'Unified MiniKit SDK'
'og:image': '/images/docs/docs-meta.png'
'twitter:image': '/images/docs/docs-meta.png'
---

## Summary

We are standardizing SDKs by concern:

- `@worldcoin/idkit` owns World ID verification APIs and UI.
- `@worldcoin/minikit-js` owns mini-app commands only, verify is moved out to IDKit.

## Why

Developers building on the World network should not have to choose between shipping a Mini App and a standalone application.

Historically, that choice created friction for three reasons:

- World ID verification logic differed between Mini Apps and IDKit.
- MiniKit command APIs were tightly coupled to World App runtime behavior.
- MiniKit v1 wallet interactions did not follow EIP-1193 conventions (for example, wagmi/viem patterns), so existing dApps often required significant refactors to adopt MiniKit-specific walletAuth and sendTransaction flows.

The current unified SDK implementation addresses this by:

- Removing verification APIs/UI from MiniKit and standardizing verification on IDKit.
- Allowing existing wagmi-based dApps to add MiniKitProvider so wallet/transaction behavior adapts automatically to World App context.
- Supporting custom fallback logic across commands, so apps behave consistently both inside and outside World App.

## Migration

### World ID moved completely to IDKit

**Old:** Only works in a Mini App context

```ts
// 1. Custom verification logic for MiniKit using World ID 3.0
await MiniKit.commandsAsync.verify({
  action: 'my-action',
  signal: 'user-123',
});

// 2. Verify Proof
await fetch('/api/verify-proof', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(completion.result),
});
```

**New:** Verification works as a mini app and standalone

```ts
import { IDKit, orbLegacy } from '@worldcoin/idkit';

// 1. NEW: Requests now require signing in 4.0 to ensure legitimacy of RP context.
const rpContext = await fetch('/api/rp-signature', { method: 'POST' }).then(
  (r) => r.json(),
);
// 2. Request verification
const request = await IDKit.request({
  app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}`,
  action: 'my-action',
  rp_context: rpContext,
  allow_legacy_proofs: false,
  environment: 'production',
}).preset(orbLegacy({ signal: 'user-123' }));

const completion = await request.pollUntilCompletion();
// 3. Verify Proof
if (completion.success) {
  await fetch('/api/verify-proof', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(completion.result),
  });
}
```

### MiniKit Command API

#### 1) `MiniKit.commands` / `MiniKit.commandsAsync` are removed

**Old:**

```ts
const payload = MiniKit.commands.signMessage({ message: 'hello' });
const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth(
  {
    nonce,
  },
);
```

**New:**

```ts
const signResult = await MiniKit.signMessage({ message: 'hello' });
const authResult = await MiniKit.walletAuth({ nonce });
```

#### 2) Type and helper exports moved to `@worldcoin/minikit-js/commands`

This reduces bundle size by importing types and helpers without pulling in the full MiniKit runtime.

**New:** Updated paths for types and helpers

```tsx
import type { MiniKitSendHapticFeedbackOptions } from '@worldcoin/minikit-js/commands'; // MOVED
import { getIsUserVerified } from '@worldcoin/minikit-js/address-book'; // MOVED
import {
  parseSiweMessage,
  verifySiweMessage,
} from '@worldcoin/minikit-js/siwe'; // MOVED

const options: MiniKitSendHapticFeedbackOptions = {
  hapticsType: 'success',
};
```

#### 3) Commands now support custom fallbacks

Use `fallback` to keep the same command flow working outside World App.
Fallbacks are expected to return the same shape as the original command, but you can also override and return custom data.

```ts Fallback handlers for outside World App
const result = await MiniKit.sendHapticFeedback({
  hapticsType: 'impact',
  style: 'light',
  fallback: () => {
    // NEW
    navigator.vibrate?.(20);
    return {
      status: 'success',
      version: 1,
      timestamp: new Date().toISOString(),
    };
  },
});
```

When `wagmiConfig` is registered through `MiniKitProvider`, MiniKit also has a built-in wagmi-backed web path for:

- `walletAuth`
- `signMessage`
- `signTypedData`
- `sendTransaction`

Commands without a built-in web implementation still need an explicit `fallback`.

#### 4) Return shape changed to `{ executedWith, data }`

Command responses now include `executedWith` to indicate whether the command was executed by `minikit` | `fallback` | `wagmi` (if applicable).
The actual command response data is still nested under `data`.

**Old:**

```ts Fails outside World App
const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
  transaction: [tx],
});
console.log(finalPayload.transaction_id);
```

**New:**

```ts Custom handling based on execution context
const result = await MiniKit.sendTransaction({
  chainId: 480,
  transactions: [tx],
});

console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
console.log(result.data.userOpHash);
```

Inside World App, `userOpHash` is the MiniKit user operation hash. In the wagmi fallback path, the current implementation normalizes the returned transaction hash into the same `userOpHash` field.

#### 5) `walletAuth` nonce validation is stricter

In order to be in line with EIP-4361, `walletAuth` now requires an alphanumeric nonce that is at least 8 characters long. `crypto.randomUUID().replace(/-/g, '')` is a safe default.

**Old:**

```ts Nonce with hyphens
const nonce = crypto.randomUUID(); // contains hyphens
await MiniKit.commandsAsync.walletAuth({ nonce });
```

**New:**

```ts Nonce without hyphens
const nonce = crypto.randomUUID().replace(/-/g, '');
await MiniKit.walletAuth({ nonce });
```

#### 6) `sendTransaction` now uses a calldata-first `transactions` array

The current `sendTransaction` implementation no longer uses the legacy `transaction` contract-call shape. The supported API is a calldata-first `transactions` array with an explicit `chainId`.

**Old (contract-call only):**

```ts
await MiniKit.commandsAsync.sendTransaction({
  transaction: [
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
    },
  ],
});
```

**New:**

```ts
import { encodeFunctionData } from 'viem';

await MiniKit.sendTransaction({
  chainId: 480,
  transactions: [
    {
      to: tokenAddress,
      value: '0x0',
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to, amount],
      }),
    },
  ],
});
```

Type changes:

```ts Transaction Types
type CalldataTransaction = {
  to: string;
  value?: string;
  data?: string;
};

interface MiniKitSendTransactionOptions<
  TCustomFallback = SendTransactionResult,
> {
  transactions: CalldataTransaction[];
  chainId: number; // currently must be 480
}

interface SendTransactionResult {
  userOpHash: string; // tx hash in wagmi fallback path
  status: 'success';
  version: number;
  from: string;
  timestamp: string;
}
```

Current behavior to be aware of:

- `chainId` is required and the implementation currently only accepts World Chain (`480`).
- World App supports batched `transactions`.
- The built-in wagmi fallback currently supports a single transaction only unless you provide a custom `fallback`.
- Deprecated v1 send-transaction types still exist in `@worldcoin/minikit-js/commands` for compatibility, but they are not the supported runtime API.

#### 7) React transaction polling is centered on `userOpHash`

For MiniKit transaction flows, the current React helper is `useWaitForUserOperationReceipt`.

```tsx
import { useWaitForUserOperationReceipt } from '@worldcoin/minikit-react';

const { isLoading, isSuccess, transactionHash } =
  useWaitForUserOperationReceipt({
    client,
    userOpHash: result.data.userOpHash,
  });
```

`useWaitForTransactionReceipt` is still exported for legacy transaction-id polling, but new `MiniKit.sendTransaction()` flows should use `userOpHash`.

### Running your Mini App as a Standalone App

#### World ID

Migrating to World ID 4.0 with IDKit will allow your verification flow to work out of the box. You can
optionally add branching logic to show the IDKit widget

**Example:**

```tsx Example Verify Flow
export function VerifyHybrid() {
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [status, setStatus] = useState<string>('idle');

  const onVerify = async () => {
    setStatus('loading');
    const rp = await fetchRpContext(ACTION);
    // Add branching logic here to show Widget outside of World App
    if (MiniKit.isInWorldApp()) {
      // World App: headless/native path (no widget UI)
      const req = await IDKit.request({
        app_id: APP_ID,
        action: ACTION,
        rp_context: rp,
        allow_legacy_proofs: true,
        environment: ENV,
      }).preset(orbLegacy({ signal: `user-${Date.now()}` }));

      const completion = await req.pollUntilCompletion();
      if (!completion.success) {
        setStatus(`error:${completion.error}`);
        return;
      }

      await verifyProof(completion.result);
      setStatus('verified:native');
      return;
    }

    // Standalone web: open widget
    setRpContext(rp);
    setOpen(true);
    setStatus('widget-open');
  };

  return (
    <>
      <button onClick={onVerify}>Verify</button>
      <p>{status}</p>

      {rpContext ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={APP_ID}
          action={ACTION}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: `user-${Date.now()}` })}
          environment={ENV}
          onSuccess={async (result) => {
            await verifyProof(result);
            setStatus('verified:widget');
          }}
          onError={(code) => setStatus(`error:${code}`)}
        />
      ) : null}
    </>
  );
}
```

#### Transactions

Adding Wagmi provider:

```tsx Install dependencies
pnpm add @worldcoin/minikit-js wagmi viem @tanstack/react-query
```

```tsx Add Wagmi Config
// src/providers/wagmi-config.ts
import { worldApp } from '@worldcoin/minikit-js/wagmi';
import { worldchain } from 'viem/chains';
import { http } from 'viem';
import { createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [worldchain],
  transports: {
    [worldchain.id]: http('https://worldchain-mainnet.g.alchemy.com/public'),
  },
  connectors: [
    worldApp(), // native in World App
    injected(), // web fallback connector
  ],
});
```

```tsx Update providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniKitProvider } from '@worldcoin/minikit-js/provider';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './wagmi-config';

const queryClient = new QueryClient();

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          props={{
            appId: process.env.NEXT_PUBLIC_APP_ID ?? '',
            wagmiConfig,
          }}
        >
          {children}
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

Once these are set up, `walletAuth`, `signMessage`, `signTypedData`, and `sendTransaction` can reuse the same MiniKit command calls both inside and outside World App. The current built-in wagmi path for `sendTransaction` supports single-transaction execution on web; batched transactions remain World App only unless you provide a custom fallback.

#### Commands without built-in wagmi fallbacks

MiniKit is designed to work both inside and outside of World App, but not every command has a built-in web implementation. Commands such as `pay` and `shareContacts` still need an explicit `fallback` when they should work on web.

### Standalone App to Mini App

#### World ID

Requires no changes, simply enable the configuration to run your app as a mini app in the developer portal.

#### Transactions

If you are already using **wagmi**, adding the `MiniKitProvider` and `worldApp` connector allows existing wallet and transaction flows to route through MiniKit in World App with minimal application changes.

If you're using another library like **viem** or **ethers**, check if you're in World App and swap in the World App EIP-1193 provider.

```tsx Viem/Ethers
import { MiniKit, getWorldAppProvider } from '@worldcoin/minikit-js';
import { BrowserProvider } from 'ethers'; // or viem custom transport

const inWorldApp = MiniKit.isInWorldApp();

if (inWorldApp) {
  const provider = new BrowserProvider(getWorldAppProvider());
  const signer = await provider.getSigner();
  // signer.sendTransaction / signMessage works via MiniKit bridge
} else {
  // your normal viem/ethers provider flow
}
```

Current implementation detail: inside World App, `eth_sendTransaction` currently resolves through `MiniKit.sendTransaction()` and returns the MiniKit `userOpHash`. If you need the final on-chain transaction hash, resolve the user operation status first.
