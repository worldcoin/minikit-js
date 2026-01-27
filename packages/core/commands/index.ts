// Re-export shared types and utilities
export * from './types';

// Re-export all command types and implementations
export * from './verify';
export * from './pay';
export * from './wallet-auth';
export * from './send-transaction';
export * from './sign-message';
export * from './sign-typed-data';
export * from './share-contacts';
export * from './request-permission';
export * from './get-permissions';
export * from './send-haptic-feedback';
export * from './share';
export * from './chat';

// ============================================================================
// Command Aggregation
// ============================================================================

import { CommandContext } from './types';

import { createVerifyCommand, createVerifyAsyncCommand } from './verify';
import { createPayCommand, createPayAsyncCommand } from './pay';
import { createWalletAuthCommand, createWalletAuthAsyncCommand } from './wallet-auth';
import { createSendTransactionCommand, createSendTransactionAsyncCommand } from './send-transaction';
import { createSignMessageCommand, createSignMessageAsyncCommand } from './sign-message';
import { createSignTypedDataCommand, createSignTypedDataAsyncCommand } from './sign-typed-data';
import { createShareContactsCommand, createShareContactsAsyncCommand } from './share-contacts';
import { createRequestPermissionCommand, createRequestPermissionAsyncCommand } from './request-permission';
import { createGetPermissionsCommand, createGetPermissionsAsyncCommand } from './get-permissions';
import { createSendHapticFeedbackCommand, createSendHapticFeedbackAsyncCommand } from './send-haptic-feedback';
import { createShareCommand, createShareAsyncCommand } from './share';
import { createChatCommand, createChatAsyncCommand } from './chat';

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
    sendTransaction: createSendTransactionAsyncCommand(ctx, commands.sendTransaction),
    signMessage: createSignMessageAsyncCommand(ctx, commands.signMessage),
    signTypedData: createSignTypedDataAsyncCommand(ctx, commands.signTypedData),
    shareContacts: createShareContactsAsyncCommand(ctx, commands.shareContacts),
    requestPermission: createRequestPermissionAsyncCommand(ctx, commands.requestPermission),
    getPermissions: createGetPermissionsAsyncCommand(ctx, commands.getPermissions),
    sendHapticFeedback: createSendHapticFeedbackAsyncCommand(ctx, commands.sendHapticFeedback),
    share: createShareAsyncCommand(ctx, commands.share),
    chat: createChatAsyncCommand(ctx, commands.chat),
  };
}

export type AsyncCommands = ReturnType<typeof createAsyncCommands>;
