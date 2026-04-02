# MiniKit

## 🚀 Getting Started

MiniKit is currently available on npm. To install, run:
`pnpm i @worldcoin/minikit-js`

or use the CDN:
`https://cdn.jsdelivr.net/npm/@worldcoin/minikit-js@[version]/+esm`

For comprehensive setup instructions and usage examples, visit our [developer documentation](https://docs.world.org/mini-apps).

## Using Agents

To migrate an existing web app to a mini app use

```
npx skills add worldcoin/minikit-js web-to-miniapp
```

To migrate a mini app to web use

```
npx skills add worldcoin/minikit-js miniapp-to-web
```

## Verification Ownership

World ID verification is owned by IDKit:

- Use `@worldcoin/idkit` using `IDKitRequestWidget` see our [docs](https://docs.world.org/world-id/idkit/react)

MiniKit is focused on mini-app commands (`walletAuth`, `sendTransaction`, `pay`, `shareContacts`, etc.) and does not proxy verify APIs.

## 🛠 ️Developing Locally

To run the example mini app locally:

```
pnpm i
cd demo/with-next
pnpm dev
```

This will launch a demo mini app with all essential commands implemented, allowing you to explore and test the features.

## 📦 Releasing

To bump the version of the package, run:

```
pnpm changeset
```
