import { IDKitConfig, VerificationLevel } from '@worldcoin/idkit-core';
import type { TypedData, TypedDataDomain } from 'abitype';
import { MiniKitInstallErrorCodes, MiniKitInstallErrorMessage } from './errors';
import { Network, Tokens } from './payment';
import { Permit2, Transaction } from './transactions';

export enum Command {
  Verify = 'verify',
  Pay = 'pay',
  WalletAuth = 'wallet-auth',
  SendTransaction = 'send-transaction',
  SignMessage = 'sign-message',
  SignTypedData = 'sign-typed-data',
  ShareContacts = 'share-contacts',
  RequestPermission = 'request-permission',
}

export type WebViewBasePayload = {
  command: Command;
  version: number;
  payload: Record<string, any>;
};

export type AsyncHandlerReturn<CommandPayload, FinalPayload> = Promise<{
  commandPayload: CommandPayload;
  finalPayload: FinalPayload;
}>;

// Values developers can specify
export type VerifyCommandInput = {
  action: IDKitConfig['action'];
  signal?: IDKitConfig['signal'];
  verification_level?: VerificationLevel;
};

// Full list of values sent to the app
export type VerifyCommandPayload = VerifyCommandInput & {
  timestamp: string;
};

export type TokensPayload = {
  symbol: Tokens;
  token_amount: string;
};

export type PayCommandInput = {
  reference: string;
  to: string;
  tokens: TokensPayload[];
  network?: Network; // Optional
  description: string;
};

export type PayCommandPayload = PayCommandInput;

export type WalletAuthInput = {
  nonce: string;
  statement?: string;
  requestId?: string;
  expirationTime?: Date;
  notBefore?: Date;
};

export type WalletAuthPayload = {
  siweMessage: string;
};

export type MiniKitInstallReturnType =
  | { success: true }
  | {
      success: false;
      errorCode: MiniKitInstallErrorCodes;
      errorMessage: (typeof MiniKitInstallErrorMessage)[MiniKitInstallErrorCodes];
    };

export type SendTransactionInput = {
  transaction: Transaction[];
  permit2?: Permit2[]; // Optional
};

export type SendTransactionPayload = SendTransactionInput;

export type SignMessageInput = {
  message: string;
};

export type SignMessagePayload = SignMessageInput;

export type SignTypedDataInput = {
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
  domain?: TypedDataDomain;
};

export type SignTypedDataPayload = SignTypedDataInput;

// Anchor: Share Contacts Payload
export type ShareContactsInput = {
  isMultiSelectEnabled: boolean;
  inviteMessage?: string;
};
export type ShareContactsPayload = ShareContactsInput;

// Anchor: Request Permission Payload
export enum Permission {
  Notifications = 'notifications',
}

export type RequestPermissionInput = {
  permission: Permission;
};

export type RequestPermissionPayload = RequestPermissionInput;

type CommandReturnPayloadMap = {
  [Command.Verify]: VerifyCommandPayload;
  [Command.Pay]: PayCommandPayload;
  [Command.WalletAuth]: WalletAuthPayload;
  [Command.SendTransaction]: SendTransactionPayload;
  [Command.SignMessage]: SignMessagePayload;
  [Command.SignTypedData]: SignTypedDataPayload;
  [Command.ShareContacts]: ShareContactsPayload;
  [Command.RequestPermission]: RequestPermissionPayload;
};
export type CommandReturnPayload<T extends Command> =
  T extends keyof CommandReturnPayloadMap ? CommandReturnPayloadMap[T] : never;
