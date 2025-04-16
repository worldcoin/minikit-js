export type SiweMessage = {
  scheme?: string;
  domain: string;
  address?: string;
  statement?: string;
  uri: string;
  version: string;
  chain_id: number;
  nonce: string;
  issued_at: string;
  expiration_time?: string;
  not_before?: string;
  request_id?: string;
};
