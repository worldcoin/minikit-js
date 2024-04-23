export enum Tokens {
  USDC = "usdc",
}

export type TokenMapping = {
  [key in Tokens]: string;
};

// We only support conversions from USD for now
export enum BaseCurrency {
  USD = "usd",
}

// We currently only support one network
export enum Network {
  Optimism = "optimism",
}

