import { IDKitConfig, VerificationLevel } from "@worldcoin/idkit-core";
import { Network, Tokens } from "./payment";
import { Permit2, Transaction } from "./transactions";
import type { TypedData, TypedDataDomain } from "abitype";
import { MiniKitInstallErrorCodes, MiniKitInstallErrorMessage } from "./errors";

export enum Command {
  Verify = "verify",
  Pay = "pay",
  WalletAuth = "wallet-auth",
  SendTransaction = "send-transaction",
  SignMessage = "sign-message",
  SignTypedData = "sign-typed-data",
}

export type WebViewBasePayload = {
  command: Command;
  version: number;
  payload: Record<string, any>;
};

// Values developers can specify
export type VerifyCommandInput = {
  action: IDKitConfig["action"];
  signal?: IDKitConfig["signal"];
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
  payload: Transaction[];
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
