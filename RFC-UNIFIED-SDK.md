# RFC: Unified World ID + MiniKit SDK

## Overview

Two packages with clear separation:

- **@worldcoin/world-id** — Lightweight, universal identity verification
- **@worldcoin/minikit** — Full mini app SDK, depends on world-id

MiniKit commands auto-detect environment and fall back gracefully:
- World App → native postMessage
- Web + Wagmi → Wagmi wallet / SIWE
- Web (no Wagmi) → custom fallback or error

---

## Package Structure

```
@worldcoin/idkit
├── verify()
├── transports/
│   ├── native.ts      # World App postMessage
│   └── bridge.ts      # QR code + polling (web)
└── types/

@worldcoin/minikit
├── depends on @worldcoin/idkit
├── verify()           # re-exports from idkit
├── walletAuth()       # SIWE (World App) / Wagmi connect + SIWE (web)
├── sendTransaction()  # native / Wagmi
├── pay()              # native only, fallback required on web
├── getContacts()      # native only, fallback required on web
└── wagmi/
    └── connector.ts   # worldApp connector
```

---

## API

### verify()

```typescript
// Simple - MiniKit handles UI
const result = await MiniKit.verify({ action: 'login' })

// Manual - control your own UI (web QR flow)
const request = await MiniKit.verify({ action: 'login', mode: 'manual' })
request.url           // QR URL (undefined in World App)
await request.wait()  // poll until complete
```

Request interface:
```typescript
interface VerifyRequest {
  url?: string
  poll(): Promise<VerifyStatus>
  wait(opts?: { pollInterval?: number; timeout?: number }): Promise<VerifyResult>
  abort(): void
}
```

### walletAuth()

```typescript
const { address } = await MiniKit.walletAuth()
// World App → native SIWE
// Web + Wagmi → Wagmi connect modal → SIWE
// Web (no Wagmi) → error

// With custom fallback (skip wallet auth entirely)
const { address } = await MiniKit.walletAuth({
  fallback: () => signInWithGoogle()
})
```

### sendTransaction()

```typescript
await MiniKit.sendTransaction({
  transaction: [{
    address: '0x...',
    abi: ContractABI,
    functionName: 'mint',
    args: [],
  }]
})
// World App → native (no prior auth needed)
// Web + Wagmi → auto-connects if needed, then sends via Wagmi
// Web (no Wagmi) → error or fallback
```

Feature support:
| Feature | World App | Web (Wagmi) |
|---------|-----------|-------------|
| Single tx | ✅ | ✅ |
| Batch tx | ✅ | ⚠️ Sequential |
| Permit2 | ✅ | ❌ |
| Gas sponsorship | ✅ | ❌ |

### pay()

```typescript
await MiniKit.pay({ to: '0x...', amount: '10' }, {
  fallback: () => showStripeCheckout()
})
// World App → native payment
// Web → fallback (no built-in, requires fallback)
```

### getContacts()

```typescript
const contacts = await MiniKit.getContacts({
  fallback: () => showManualInput()
})
// World App → native contacts picker
// Web → fallback (no built-in, requires fallback)
```

---

## Fallback System

Fallback is triggered when native command is unavailable:
- **On web** — not in World App
- **In World App** — command not supported (old app version)

```
1. MiniKit native (World App + command available)
2. Built-in web fallback (Wagmi for walletAuth/sendTransaction, World ID for verify)
3. Custom fallback (user-provided)
4. Error
```

| Command | World App | World App (old version) | Web + Wagmi | Web (no Wagmi) |
|---------|-----------|------------------------|-------------|----------------|
| verify | native | native (always available) | QR/bridge | QR/bridge |
| walletAuth | SIWE | fallback | Wagmi + SIWE | fallback or error |
| sendTransaction | native | fallback | Wagmi | fallback or error |
| pay | native | fallback | fallback required | fallback required |
| getContacts | native | fallback | fallback required | fallback required |

Return type includes path taken:
```typescript
result.via  // 'minikit' | 'wagmi' | 'fallback'
```

---

## Wagmi Integration

Optional peer dependency. When installed, MiniKit uses it for web fallback.

### Setup

```typescript
// wagmi.ts
import { worldApp } from '@worldcoin/minikit/wagmi'

export const wagmiConfig = createConfig({
  connectors: [
    worldApp(),      // auto-used in World App
    injected(),
    walletConnect({ projectId: '...' }),
  ],
})
```

```typescript
// providers.tsx
<QueryClientProvider client={queryClient}>
  <WagmiProvider config={wagmiConfig}>
    <MiniKitProvider appId="app_xxx">
      {children}
    </MiniKitProvider>
  </WagmiProvider>
</QueryClientProvider>
```

### worldApp Connector

```typescript
export function worldApp() {
  return createConnector(() => ({
    id: 'worldapp',
    name: 'World App',

    async connect() {
      const { address } = await MiniKit.signIn()
      return { accounts: [address], chainId: 480 }
    },

    async sendTransaction(params) {
      return MiniKit.sendTransaction({
        transaction: [{ address: params.to, value: params.value, data: params.data }]
      })
    },
  }))
}
```

---

## Migration

### Mini App → Web

Your existing MiniKit code stays the same. Add wagmi so the unified API has a web fallback.

**Step 1: Install dependencies**

```bash
pnpm i wagmi viem @tanstack/react-query
```

**Step 2: Create a wagmi config**

```ts
// wagmi-config.ts
import { http, createConfig } from 'wagmi';
import { worldchain } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { worldApp } from '@worldcoin/minikit/wagmi';

export const wagmiConfig = createConfig({
  chains: [worldchain],
  connectors: [
    worldApp(),   // Auto-detected in World App, skipped on web
    injected(),   // MetaMask, Rabby, etc.
    walletConnect({ projectId: 'YOUR_WC_PROJECT_ID' }),
  ],
  transports: {
    [worldchain.id]: http(),
  },
});
```

**Step 3: Wrap your app with providers**

Pass the wagmi config to both `WagmiProvider` and `MiniKitProvider` — this enables the web fallback.

```tsx
// providers.tsx
import { MiniKitProvider } from '@worldcoin/minikit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './wagmi-config';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <MiniKitProvider
          props={{ appId: 'app_YOUR_APP_ID' }}
          wagmiConfig={wagmiConfig}
        >
          {children}
        </MiniKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
```

**Step 4: No code changes — your MiniKit calls now work on web**

```ts
// This already works in both environments
const result = await MiniKit.walletAuth({
  nonce: crypto.randomUUID(),
  statement: 'Sign in',
});
console.log(result.via);          // 'minikit' (World App) or 'wagmi' (web)
console.log(result.data.address); // '0x...'

const txResult = await MiniKit.sendTransaction({
  transaction: [{
    address: '0xContractAddress',
    abi: contractAbi,
    functionName: 'mint',
    args: [],
  }],
});
console.log(txResult.via);         // 'minikit' or 'wagmi'
console.log(txResult.data.hashes); // transaction hashes
```

In World App: native MiniKit commands (batch transactions, permit2, gas sponsorship).
On web: wagmi fallback (sequential transactions, user pays gas).

**Step 5: Add fallbacks for native-only commands**

`pay()` and `getContacts()` have no built-in web fallback — provide your own:

```ts
await MiniKit.pay(
  { to: '0x...', amount: '10' },
  { fallback: () => showStripeCheckout() },
);

const contacts = await MiniKit.getContacts({
  fallback: () => showManualInput(),
});
```

### Web → Mini App

Your existing wagmi code stays the same. Add the `worldApp()` connector so wagmi hooks route through MiniKit natively in World App.

**Step 1: Install MiniKit**

```bash
pnpm i @worldcoin/minikit
```

**Step 2: Add the `worldApp()` connector to your existing wagmi config**

```ts
import { worldApp } from '@worldcoin/minikit/wagmi';

const config = createConfig({
  connectors: [
    worldApp(),           // Add this — works natively in World App
    injected(),           // Your existing connectors
    walletConnect({ ... }),
  ],
  // ... rest of your config
});
```

**Step 3: Wrap with MiniKitProvider**

```tsx
<WagmiProvider config={wagmiConfig}>
  <MiniKitProvider props={{ appId: 'app_YOUR_APP_ID' }} wagmiConfig={wagmiConfig}>
    {children}
  </MiniKitProvider>
</WagmiProvider>
```

**Step 4: No code changes — wagmi hooks work in World App**

```tsx
import { useConnect, useConnectors, useSendTransaction, useWriteContract } from 'wagmi';

// Connect — worldApp() connector handles World App, others handle web
const { mutate: connect } = useConnect();
const connectors = useConnectors();
connect({ connector: connectors[0] });

// Send transaction — routed through MiniKit in World App, real wallet on web
const { mutateAsync: sendTransaction } = useSendTransaction();
await sendTransaction({ to: '0x...', value: parseEther('0.01') });

// Contract write — same transparent routing
const { mutateAsync: writeContract } = useWriteContract();
await writeContract({
  address: '0x...',
  abi: contractAbi,
  functionName: 'transfer',
  args: [to, amount],
});
```

In World App: the `worldApp()` connector intercepts all calls and routes them through MiniKit.
On web: `worldApp()` is skipped, and injected/WalletConnect connectors handle it as usual.
