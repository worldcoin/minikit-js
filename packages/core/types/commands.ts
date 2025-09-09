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
  GetPermissions = 'get-permissions',
  SendHapticFeedback = 'send-haptic-feedback',
  Share = 'share',
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
  to: `0x${string}` | string; // Address or World Username
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
  formatPayload?: boolean; // Optional - If true, the payload will be formatted using objectvalues. Defaults to true if omitted.
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
  chainId?: number;
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
  Contacts = 'contacts',
  Microphone = 'microphone',
}

export type RequestPermissionInput = {
  permission: Permission;
};

export type RequestPermissionPayload = RequestPermissionInput;

// Anchor: Get Permissions Payload
export type GetPermissionsInput = {};

export type GetPermissionsPayload = GetPermissionsInput;

// Anchor: Send Haptic Feedback Payload
export type SendHapticFeedbackInput =
  | {
      hapticsType: 'notification';
      style: 'error' | 'success' | 'warning';
    }
  | {
      hapticsType: 'selection-changed';
      // never necessary or used but improves DX
      style?: never;
    }
  | {
      hapticsType: 'impact';
      style: 'light' | 'medium' | 'heavy';
    };

export type SendHapticFeedbackPayload = SendHapticFeedbackInput;

// Anchor: Share Files Payload

export type ShareInput = {
  files?: File[];
  title?: string;
  text?: string;
  url?: string;
};

export type SharePayload = {
  files?: Array<{
    name: string;
    type: string; // MIME type of the file (e.g., from File.type)
    data: string; // Base64 encoded content of the file
  }>;
  title?: string;
  text?: string;
  url?: string;
};

type CommandReturnPayloadMap = {
  [Command.Verify]: VerifyCommandPayload;
  [Command.Pay]: PayCommandPayload;
  [Command.WalletAuth]: WalletAuthPayload;
  [Command.SendTransaction]: SendTransactionPayload;
  [Command.SignMessage]: SignMessagePayload;
  [Command.SignTypedData]: SignTypedDataPayload;
  [Command.ShareContacts]: ShareContactsPayload;
  [Command.RequestPermission]: RequestPermissionPayload;
  [Command.GetPermissions]: GetPermissionsPayload;
  [Command.SendHapticFeedback]: SendHapticFeedbackPayload;
  [Command.Share]: SharePayload;
};
export type CommandReturnPayload<T extends Command> =
  T extends keyof CommandReturnPayloadMap ? CommandReturnPayloadMap[T] : never;
