This is a demo application to try out minikit. Since this connects to the World App. You will need a corresponding test build of an android app to receive and send events.

## Environment Variables

Create a `.env.local` file and add:

```
NEXT_PUBLIC_ALCHEMY_API_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

Replace `YOUR_API_KEY` with your actual Alchemy API key for signature verification in the SignTypedMessage component.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

### Usage

1. Recommended usage to test is to use the corresponding android folder, ask Andy for permission
2. `pnpm dev`
3. `ngrok 3000`
4. Set the Ngrok url to the ngrok generated url
