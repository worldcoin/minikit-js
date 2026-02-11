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

1. Install Wagmi: `npm install wagmi viem @tanstack/react-query`
2. Add providers (QueryClient, Wagmi, MiniKit)
3. Add fallbacks for pay/contacts

No code changes for verify/connect/sendTransaction.

### Web → Mini App

1. Install MiniKit: `npm install @worldcoin/minikit`
2. Add `worldApp()` connector to Wagmi config
3. Wrap with MiniKitProvider

Existing Wagmi code works unchanged.
