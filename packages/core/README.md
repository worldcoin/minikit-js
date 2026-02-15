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
