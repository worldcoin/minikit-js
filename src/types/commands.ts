import { IDKitConfig, VerificationLevel } from "@worldcoin/idkit-core/*";
import { Network, Tokens } from "./payment";

export enum Command {
  Verify = "verify",
  Pay = "pay",
  WalletAuth = "wallet-auth",
}

export type WebViewBasePayload = {
  command: Command;
  payload: Record<string, any>;
};

export type VerifyCommandInput = {
  action: IDKitConfig["action"];
  signal?: IDKitConfig["signal"];
  verification_level?: VerificationLevel;
};

export type PayCommandInput = {
  reference: string;
  to: string;
  token_amount: number; // In Decimals
  token: Tokens;
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
  message: string;
};
