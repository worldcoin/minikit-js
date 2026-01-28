// Re-export shared types and utilities
export * from './types';

// Re-export all command types and implementations
export * from './chat';
export * from './get-permissions';
export * from './pay';
export * from './request-permission';
export * from './send-haptic-feedback';
export * from './send-transaction';
export * from './share';
export * from './share-contacts';
export * from './sign-message';
export * from './sign-typed-data';
export * from './verify';
export * from './wallet-auth';

// ============================================================================
// Command Aggregation
// ============================================================================

import { CommandContext } from './types';

import { createChatAsyncCommand, createChatCommand } from './chat';
import {
  createGetPermissionsAsyncCommand,
  createGetPermissionsCommand,
} from './get-permissions';
import { createPayAsyncCommand, createPayCommand } from './pay';
import {
  createRequestPermissionAsyncCommand,
  createRequestPermissionCommand,
} from './request-permission';
import {
  createSendHapticFeedbackAsyncCommand,
  createSendHapticFeedbackCommand,
} from './send-haptic-feedback';
import {
  createSendTransactionAsyncCommand,
  createSendTransactionCommand,
} from './send-transaction';
import { createShareAsyncCommand, createShareCommand } from './share';
import {
  createShareContactsAsyncCommand,
  createShareContactsCommand,
} from './share-contacts';
import {
  createSignMessageAsyncCommand,
  createSignMessageCommand,
} from './sign-message';
import {
  createSignTypedDataAsyncCommand,
  createSignTypedDataCommand,
} from './sign-typed-data';
import { createVerifyAsyncCommand, createVerifyCommand } from './verify';
import {
  createWalletAuthAsyncCommand,
  createWalletAuthCommand,
} from './wallet-auth';

export function createCommands(ctx: CommandContext) {
  return {
    verify: createVerifyCommand(ctx),
    pay: createPayCommand(ctx),
    walletAuth: createWalletAuthCommand(ctx),
    sendTransaction: createSendTransactionCommand(ctx),
    signMessage: createSignMessageCommand(ctx),
    signTypedData: createSignTypedDataCommand(ctx),
    shareContacts: createShareContactsCommand(ctx),
    requestPermission: createRequestPermissionCommand(ctx),
    getPermissions: createGetPermissionsCommand(ctx),
    sendHapticFeedback: createSendHapticFeedbackCommand(ctx),
    share: createShareCommand(ctx),
    chat: createChatCommand(ctx),
  };
}

export type Commands = ReturnType<typeof createCommands>;

export function createAsyncCommands(ctx: CommandContext, commands: Commands) {
  return {
    verify: createVerifyAsyncCommand(ctx, commands.verify),
    pay: createPayAsyncCommand(ctx, commands.pay),
    walletAuth: createWalletAuthAsyncCommand(ctx, commands.walletAuth),
    sendTransaction: createSendTransactionAsyncCommand(
      ctx,
      commands.sendTransaction,
    ),
    signMessage: createSignMessageAsyncCommand(ctx, commands.signMessage),
    signTypedData: createSignTypedDataAsyncCommand(ctx, commands.signTypedData),
    shareContacts: createShareContactsAsyncCommand(ctx, commands.shareContacts),
    requestPermission: createRequestPermissionAsyncCommand(
      ctx,
      commands.requestPermission,
    ),
    getPermissions: createGetPermissionsAsyncCommand(
      ctx,
      commands.getPermissions,
    ),
    sendHapticFeedback: createSendHapticFeedbackAsyncCommand(
      ctx,
      commands.sendHapticFeedback,
    ),
    share: createShareAsyncCommand(ctx, commands.share),
    chat: createChatAsyncCommand(ctx, commands.chat),
  };
}

export type AsyncCommands = ReturnType<typeof createAsyncCommands>;
