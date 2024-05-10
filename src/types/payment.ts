export enum Tokens {
  USDC = "USDC",
  WLD = "WLD",
}

export const TokenDecimals: { [key in Tokens]: number } = {
  [Tokens.USDC]: 6,
  [Tokens.WLD]: 18,
};

// We currently only support one network
export enum Network {
  Optimism = "optimism",
}
