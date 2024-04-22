export enum Tokens {
  WLD = "wld",
  ETH = "weth", // ETH is actually WETH
  USDC = "usdc",
}

export type TokenMapping = {
  [key in Tokens]: string;
};

export const tokenAddresses: TokenMapping = {
  [Tokens.WLD]: "0xdC6fF44d5d932Cbd77B52E5612Ba0529DC6226F1",
  [Tokens.ETH]: "0x4200000000000000000000000000000000000006", // WETH
  [Tokens.USDC]: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC.e
};

// We only support conversions from USD for now
export enum BaseCurrency {
  USD = "usd",
}

// We currently only support one network
export enum Network {
  Optimism = "optimism",
}
