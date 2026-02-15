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

### If you need backend RP signatures

Use IDKit core:

```ts
import { IDKit, signRequest } from '@worldcoin/idkit-core';
```

## Migration

### Before

```ts
import { IDKitRequestWidget } from '@worldcoin/minikit-js/idkit';
import { MiniKit, orbLegacy } from '@worldcoin/minikit-js';
```

### After

```ts
import { IDKitRequestWidget, IDKit, orbLegacy } from '@worldcoin/idkit';
import { MiniKit } from '@worldcoin/minikit-js';
```

### Request Builder

### Before

```ts
const req = await MiniKit.request(config).preset(orbLegacy({ signal }));
```

### After

```ts
const req = await IDKit.request(config).preset(orbLegacy({ signal }));
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
