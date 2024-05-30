import { IDKitConfig, VerificationLevel } from "@worldcoin/idkit-core/*";
import { Network, Tokens } from "./payment";
import { MiniKitInstallErrorCode, MiniKitInstallErrorMessage } from "./";

export enum Command {
  Verify = "verify",
  Pay = "pay",
  WalletAuth = "wallet-auth",
}

export type WebViewBasePayload = {
  command: Command;
  version: number;
  payload: Record<string, any>;
};

export type VerifyCommandInput = {
  action: IDKitConfig["action"];
  signal?: IDKitConfig["signal"];
  verification_level?: VerificationLevel;
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

export type WalletAuthInput = {
  nonce: string;
  statement?: string;
  requestId?: string;
  expirationTime?: Date;
  notBefore?: Date;
};

export type VerifyCommandPayload = VerifyCommandInput & {
  timestamp: string;
};

export type PayCommandPayload = PayCommandInput & {
  reference: string;
};

export type WalletAuthPayload = {
  siweMessage: string;
};

export type MiniKitInstallReturnType =
  | { success: true }
  | {
      success: false;
      errorCode: MiniKitInstallErrorCode;
      errorMessage: (typeof MiniKitInstallErrorMessage)[MiniKitInstallErrorCode];
    };
