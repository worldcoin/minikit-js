---
title: "Minikit v2.0"
"og:image": "/images/docs/docs-meta.png"
"twitter:image": "/images/docs/docs-meta.png"
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

MiniKit v2 addresses this by:
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
const rpContext = await fetch('/api/rp-signature', { method: 'POST' }).then((r) =>
  r.json(),
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

### MiniKit Command API (v2 -> v3)

#### 1) `MiniKit.commands` / `MiniKit.commandsAsync` are removed

**Old:**

```ts 
const payload = MiniKit.commands.signMessage({ message: 'hello' });
const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
  nonce,
});
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
import { parseSiweMessage, verifySiweMessage } from '@worldcoin/minikit-js/siwe'; // MOVED

const options: MiniKitSendHapticFeedbackOptions = {
  hapticsType: 'success',
};

```

#### 3) Commands now support custom fallbacks

Use `fallback` to keep the same command flow working outside World App.
Fallback by default expect a response with the same shape as the original command, but you can also override and return custom data.

```ts Fallback handlers for outside World App
const result = await MiniKit.sendHapticFeedback({
  hapticsType: 'impact',
  style: 'light',
  fallback: () => { // NEW
    navigator.vibrate?.(20);
    return {
      status: 'success',
      version: 1,
      timestamp: new Date().toISOString(),
    };
  },
});
```

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
  transaction: [tx],
});

console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
console.log(result.data.transactionId);
```

#### 5) `walletAuth` nonce validation is stricter
In order to be in line with EIP-4361, `walletAuth` now requires a nonce without hyphens. You can use `crypto.randomUUID().replace(/-/g, '')`.

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

#### 6) `sendTransaction` now also supports raw calldata

`Transaction` now supports optional raw
calldata. When `data` is present, it takes priority over `abi` /
`functionName` / `args`. This change helps with Wagmi interoperability.

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
await MiniKit.sendTransaction({
  transaction: [
    {
      address: tokenAddress,
      value: '0x0',
      data: '0xa9059cbb...', // NEW: takes priority when present
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
    },
  ],
});
```

Type changes:

```ts Transaction Types
type Transaction = {
  address: string;
  value?: string;
  data?: string; // takes priority when present
  abi?: Abi | readonly unknown[];
  functionName?: ContractFunctionName<...>;
  args?: ContractFunctionArgs<...>;
};

interface MiniKitSendTransactionOptions<TCustomFallback = SendTransactionResult> {
  transaction: Transaction[];
  chainId?: number; // defaults to 480 on World App
  permit2?: Permit2[];
  formatPayload?: boolean;
}
```

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
Adding Wagmi provider
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
    worldApp(),   // native in World App
    injected(),   // web fallback connector
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
    // NEW QueryClientProvider and WagmiProvider recommended for robust performance
    <QueryClientProvider client={queryClient}> 
      <WagmiProvider config={wagmiConfig}>
        <MiniKitProvider
          props={{
            appId: process.env.NEXT_PUBLIC_APP_ID ?? '',
            wagmiConfig, // NEW: pass explicitly for robust fallback behavior
          }}
        >
          {children}
        </MiniKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
```
Once these are set up your application will automatically support transaction logic externally without any refactoring to core command calls.
#### Non Transaction Command fallbacks
MiniKit v2 is designed to work both inside and outside of World App. By adding custom fallbacks to commands, you can ensure your app behaves gracefully when users access it outside of World App.


### Standalone App to Mini App


#### World ID
Requires no changes, simply enable the configuration to run your app as a mini app in the developer portal.

#### Transactions
If you are using **wagmi** for transactions, adding the `MiniKitProvider` and `worldApp` connector will allow your existing transaction logic to work seamlessly in World App without any changes. 

If you're using another library like **viem** or **ethers**. Check if you're in World App and use the World App provider which will automatically
bridge your commands.
```tsx Viem/Ethers
import { MiniKit, getWorldAppProvider } from '@worldcoin/minikit-js'
import { BrowserProvider } from 'ethers' // or viem custom transport

const inWorldApp = MiniKit.isInWorldApp()

if (inWorldApp) {
  const provider = new BrowserProvider(getWorldAppProvider())
  const signer = await provider.getSigner()
  // signer.sendTransaction / signMessage works via MiniKit bridge
} else {
  // your normal viem/ethers provider flow
}
```