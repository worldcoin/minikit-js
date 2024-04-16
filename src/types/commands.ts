export enum OIDCResponseMode {
  Query = "query",
  Fragment = "fragment",
  FormPost = "form_post",
}

export enum OIDCResponseType {
  Code = "code",
  IdToken = "id_token",
  Token = "token",
}

export enum Activity {
  SignIn = "signIn",
  Verify = "verify",
  Pay = "pay",
}

export type WebViewBasePayload = {
  activity: Activity;
  payload: Record<string, any>;
};

export type SignInCommandInput = {
  app_id: `app_${string}`;
  response_type: OIDCResponseType;
  response_mode: OIDCResponseMode;
  redirect_uri: string;
  nonce: string;
  scope: string;
  state: string;
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
  memo: string;
  timestamp: string;
};
