import { IDKitConfig, VerificationLevel } from "@worldcoin/idkit-core/*";
import { BaseCurrency, Network, TokenMapping, Tokens } from "./payment";

export enum Command {
  Verify = "verify",
  Pay = "pay",
}

export type WebViewBasePayload = {
  command: Command;
  payload: Record<string, any>;
};

export type VerifyCommandInput = {
  app_id: `app_${string}`;
  action: IDKitConfig["action"];
  signal: IDKitConfig["signal"];
  verification_level: VerificationLevel;
  timestamp: string; // epoch timestamp
};

export type PayCommandPayload = PayCommandInput & {
  network: Network;
  accepted_payment_token_addresses: string[];
  reference: string;
};

export type PayCommandInput = {
  to: string;
  charge_amount: number;
  base_currency: BaseCurrency;
  accepted_payment_tokens: Tokens[];
};
