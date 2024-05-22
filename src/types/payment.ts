export enum Tokens {
  USDCE = "USDC.e",
  WLD = "WLD",
}

export const TokenDecimals: { [key in Tokens]: number } = {
  [Tokens.USDCE]: 6,
  [Tokens.WLD]: 18,
};

// We currently only support one network
export enum Network {
  Optimism = "optimism",
}
