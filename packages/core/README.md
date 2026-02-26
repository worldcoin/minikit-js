# minikit-js

## 🚀 Getting Started

MiniKit is currently available on npm. To install, run:
`pnpm i @worldcoin/minikit-js`

or use the CDN:
`https://cdn.jsdelivr.net/npm/@worldcoin/minikit-js@[version]/+esm`

For comprehensive setup instructions and usage examples, visit our [developer documentation](https://docs.world.org/mini-apps).

## Scope

`@worldcoin/minikit-js` is the mini-app command SDK:

- `MiniKit.walletAuth()`
- `MiniKit.sendTransaction()`
- `MiniKit.pay()`
- `MiniKit.shareContacts()`
- `MiniKit.signMessage()`
- `MiniKit.signTypedData()`
- and related mini-app commands

World ID verification belongs to IDKit:

- Use `@worldcoin/idkit` for verification requests and widget UI
- Use `@worldcoin/idkit-core` for backend signing helpers such as `signRequest`

## v2 -> v3 Migration Highlights

- `MiniKit.commands.*` / `MiniKit.commandsAsync.*` are removed. Use `await MiniKit.<command>(...)`.
- Command responses now use `{ executedWith, data }`.
- Verify flows moved to IDKit (`@worldcoin/idkit`), not MiniKit.
- `walletAuth` nonce validation is stricter (alphanumeric SIWE nonce).
- Tree-shakeable subpath exports are available for commands and helpers.

### `sendTransaction` uses one flexible transaction type

When `transaction[i].data` is provided, MiniKit prioritizes raw calldata over
`abi` / `functionName` / `args`.

Example:

```ts
await MiniKit.sendTransaction({
  transaction: [
    {
      address: tokenAddress,
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
  data?: string;
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

### Tree-shakeable subpath exports

Use subpaths to import only what you need:

```ts
import {
  MiniKitSendTransactionOptions,
  SendTransactionErrorCodes,
} from '@worldcoin/minikit-js/commands';
import { getIsUserVerified } from '@worldcoin/minikit-js/address-book';
import { parseSiweMessage, verifySiweMessage } from '@worldcoin/minikit-js/siwe';
```

You can still import `MiniKit` itself from the package root:

```ts
import { MiniKit } from '@worldcoin/minikit-js';
```

### Commands now support custom fallbacks

Use `fallback` to run equivalent logic outside World App:

```ts
const result = await MiniKit.sendHapticFeedback({
  hapticsType: 'impact',
  style: 'light',
  fallback: () => {
    navigator.vibrate?.(20);
    return {
      status: 'success',
      version: 1,
      timestamp: new Date().toISOString(),
    };
  },
});
```

## 🛠 ️Developing Locally

To run the example mini app locally:

```
pnpm i
cd demo/with-next
pnpm dev
```

This will launch a demo mini app with all essential commands implemented, allowing you to explore and test the features.

## 📦 Installation

To quick start with a template, run:
`npx @worldcoin/create-mini-app my-first-mini-app`

This will create a new directory called `my-first-mini-app` with a basic template setup.

Take a look at the in the template for more information.

## Contributing

### Adding a New Command

1. Create `commands/new-command.ts` — define all types (input, payload, response, errors) and implementation in one file
2. Update `commands/index.ts` — add to the enum and wire up in `createCommands`/`createAsyncCommands`
