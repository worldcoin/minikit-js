# RFC: IDKit-Owned Verification + MiniKit Commands

## Status

Accepted for current WIP branch.

## Summary

We are standardizing SDK ownership by concern:

- `@worldcoin/idkit` owns World ID verification APIs and UI.
- `@worldcoin/idkit-core` owns verification runtime primitives and backend signing.
- `@worldcoin/minikit-js` owns mini-app commands only.

This removes the ambiguous model where developers could import verification logic from multiple package paths.

## Why

During unification work, verification ended up reachable through multiple paths (`@worldcoin/idkit` and MiniKit compatibility exports). That created:

- Confusing DX: same feature appears to exist in two SDKs.
- Runtime risk: duplicate `@worldcoin/idkit-core` instances can lead to separate WASM/init state.
- Heavier MiniKit surface area than intended.

## Decision

### 1) Verification is not proxied through MiniKit

MiniKit no longer owns or proxies:

- `MiniKit.request()`
- `MiniKit.createSession()`
- `MiniKit.proveSession()`
- `@worldcoin/minikit-js/idkit` compatibility entrypoint

Verification usage is always through IDKit.

### 2) MiniKit remains command-focused

MiniKit keeps:

- `walletAuth`
- `sendTransaction`
- `pay`
- `shareContacts`
- `signMessage`
- `signTypedData`
- `chat`
- `share`
- permissions/haptics helpers

### 3) Server-side signing comes from IDKit core

Routes that sign RP context should use:

- `IDKit.initServer()` (once)
- `signRequest()`

both imported from `@worldcoin/idkit-core`.

## Developer Guidance

### If you need verification UI or verify flow

Use IDKit:

```ts
import { IDKit, IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
```

### If you need mini-app commands

Use MiniKit:

```ts
import { MiniKit } from '@worldcoin/minikit-js';
```

For tree-shakeable command type/function imports, use the commands subpath:

```ts
import {
  MiniKitSendTransactionOptions,
  SendTransactionErrorCodes,
} from '@worldcoin/minikit-js/commands';
```

For helper-only imports, use subpaths:

```ts
import { getIsUserVerified } from '@worldcoin/minikit-js/address-book';
import { parseSiweMessage, verifySiweMessage } from '@worldcoin/minikit-js/siwe';
```

### If you need backend RP signatures

Use IDKit core:

```ts
import { IDKit, signRequest } from '@worldcoin/idkit-core';
```

## Migration

### Verification Imports

```ts
import { IDKitRequestWidget } from '@worldcoin/minikit-js/idkit';
import { MiniKit, orbLegacy } from '@worldcoin/minikit-js';
```

### After

```ts
import { IDKitRequestWidget, IDKit, orbLegacy } from '@worldcoin/idkit';
import { MiniKit } from '@worldcoin/minikit-js';
```

### Verification Request Builder

Before:

```ts
const req = await MiniKit.request(config).preset(orbLegacy({ signal }));
```

After:

```ts
const req = await IDKit.request(config).preset(orbLegacy({ signal }));
```

### MiniKit Command API (v2 -> v3)

#### 1) `MiniKit.commands` / `MiniKit.commandsAsync` are removed

Before:

```ts
const payload = MiniKit.commands.signMessage({ message: 'hello' });
const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
  nonce,
});
```

After:

```ts
const signResult = await MiniKit.signMessage({ message: 'hello' });
const authResult = await MiniKit.walletAuth({ nonce });
```

#### 2) Return shape changed to `{ executedWith, data }`

Before:

```ts
const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
  transaction: [tx],
});
console.log(finalPayload.transaction_id);
```

After:

```ts
const result = await MiniKit.sendTransaction({
  transaction: [tx],
});

console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
console.log(result.data.transactionId);
```

#### 3) Verify command moved out of MiniKit

Before:

```ts
await MiniKit.commandsAsync.verify({
  action: 'my-action',
  signal: 'user-123',
});
```

After:

```ts
const request = await IDKit.request(config).preset(orbLegacy({ signal: 'user-123' }));
const completion = await request.pollUntilCompletion();
```

#### 4) `walletAuth` nonce validation is stricter

Before:

```ts
const nonce = crypto.randomUUID(); // contains hyphens
await MiniKit.commandsAsync.walletAuth({ nonce });
```

After:

```ts
const nonce = crypto.randomUUID().replace(/-/g, '');
await MiniKit.walletAuth({ nonce });
```

#### 5) `sendTransaction` now uses one flexible transaction type

`Transaction` is now a single type with optional ABI fields and optional raw
calldata. When `data` is present, it takes priority over `abi` /
`functionName` / `args`.

Before (contract-call only):

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

After:

```ts
await MiniKit.sendTransaction({
  transaction: [
    {
      address: tokenAddress,
      value: '0x0',
      data: '0xa9059cbb...', // takes priority when present
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amount],
    },
  ],
});
```

Type shape:

```ts
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

#### 6) Wagmi fallback behavior for multi-transaction inputs

Outside World App, wagmi fallback rejects `transaction.length > 1` by default.
Use World App native batching, split into single calls, or provide a custom fallback.

#### 7) Use subpath exports for better tree-shaking

Before:

```ts
import {
  MiniKitSendTransactionOptions,
  SendTransactionErrorCodes,
  getIsUserVerified,
  parseSiweMessage,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
```

After:

```ts
import {
  MiniKitSendTransactionOptions,
  SendTransactionErrorCodes,
} from '@worldcoin/minikit-js/commands';
import { getIsUserVerified } from '@worldcoin/minikit-js/address-book';
import { parseSiweMessage, verifySiweMessage } from '@worldcoin/minikit-js/siwe';
```

## Tradeoffs

- Pros:
  - Clear ownership model.
  - Smaller MiniKit API surface.
  - Fewer chances of duplicate runtime confusion.
- Cons:
  - Existing internal WIP code must update imports.

## Out of Scope

- Hard lockstep version policy between all SDKs.
- Runtime hard-fail on duplicate versions (we can add warnings separately).

## Acceptance Criteria

- No verify APIs are exported by MiniKit.
- No `/idkit` subpath exists in MiniKit.
- Demos use IDKit for verification and MiniKit for commands.
- RP signature routes use `@worldcoin/idkit-core` and call `IDKit.initServer()`.
