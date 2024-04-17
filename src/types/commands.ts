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
  action: string;
  signal: string;
  verification_level: string;
  timestamp: string;
};

export type PayCommandInput = {
  to: string;
  from: string;
  value: number;
  network: string;
  token_address: string;
  token: string;
  timestamp: string;
};
