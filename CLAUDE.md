# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**minikit-js** is Worldcoin's official SDK for building mini-apps that run within the World App mobile application. This is a TypeScript monorepo using pnpm workspaces and Turbo for build orchestration.

## Monorepo Structure

- `packages/core/` - Main SDK (`@worldcoin/minikit-js`)
- `packages/react/` - React hooks and components (`@worldcoin/minikit-react`)
- `packages/create-mini-app/` - CLI scaffolding tool (`@worldcoin/create-mini-app`)
- `demo/with-next/` - Comprehensive demo with all features
- `demo/next-15-template/` - Production-ready starter template

## Common Development Commands

**Setup:**

```bash
pnpm i                    # Install dependencies
```

**Development:**

```bash
pnpm dev                  # Start all development servers (turbo)
cd demo/with-next && pnpm dev  # Run comprehensive demo locally
```

**Building:**

```bash
pnpm build               # Build all packages (turbo)
pnpm type-check          # Type check all packages
```

**Testing:**

```bash
cd packages/core && pnpm test  # Run core package tests
```

**Code Quality:**

```bash
pnpm lint                # Check formatting (prettier)
pnpm format              # Fix formatting (prettier)
```

**Releasing:**

```bash
pnpm changeset           # Create changeset for version bump
pnpm release             # Build and publish with changesets
```

## Architecture

### Core SDK Design

- **Singleton pattern:** `MiniKit` class as main entry point
- **Command versioning:** Each command has version compatibility checking
- **Event-driven architecture:** WebView postMessage for native communication
- **Dual API support:** Both callback-based and Promise-based APIs

### Communication Protocol

The SDK communicates with the World App native container via WebView postMessage:

- Commands are sent as versioned payloads
- Responses are handled through event subscription system
- Error handling uses comprehensive error codes

### Key Features

- Wallet authentication (SIWE - Sign-In with Ethereum)
- Identity verification (World ID proofs)
- Payments integration
- Transaction signing
- Contact sharing and username search
- Haptic feedback and native permissions

## Package-Specific Information

### Core Package (`packages/core/`)

- **Build tool:** tsup for ESM/CJS dual format
- **Testing:** Jest with ts-jest
- **Type checking:** `tsc --noEmit`
- **Entry points:** Main SDK and minikit-provider React component

### React Package (`packages/react/`)

- **Dependencies:** Workspace dependency on core package
- **Exports:** React hooks for address book, transactions, username search

### Demo Applications

- **with-next:** Full-featured demo using Next.js 15, next-auth, viem
- **next-15-template:** Production starter with Mini Apps UI Kit

## Development Workflow

1. **Local development:** Use ngrok tunneling for mobile app testing
2. **Authentication:** Generate secrets with `npx auth secret`
3. **Testing:** World App required for end-to-end testing
4. **Debugging:** Eruda console available in demo apps

## Build System

- **Package Manager:** pnpm@9.9.0 (required)
- **Build Orchestration:** Turbo with task dependencies
- **Node Version:** >= 16
- **TypeScript:** Strict mode with comprehensive type definitions
