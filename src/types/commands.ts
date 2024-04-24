import { IDKitConfig, VerificationLevel } from "@worldcoin/idkit-core/*";
import { BaseCurrency, Network, Tokens } from "./payment";

export enum Command {
  Verify = "verify",
  Pay = "pay",
}

export type WebViewBasePayload = {
  command: Command;
  payload: Record<string, any>;
};

export type VerifyCommandInput = {
  action: IDKitConfig["action"];
  signal?: IDKitConfig["signal"];
  verification_level: VerificationLevel;
};

export type VerifyCommandPayload = VerifyCommandInput & {
  timestamp: string;
};

export type PayCommandPayload = PayCommandInput & {
  network: Network;
  reference: string;
};

export type PayCommandInput = {
  to: string;
  reference?: string;
  charge_amount: number;
  base_currency: BaseCurrency;
  accepted_payment_tokens: Tokens[];
};
