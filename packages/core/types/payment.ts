export enum Tokens {
  USDCE = 'USDCE',
  WLD = 'WLD',
}

export const TokenDecimals: { [key in Tokens]: number } = {
  [Tokens.USDCE]: 6,
  [Tokens.WLD]: 18,
};

export enum Network {
  Optimism = 'optimism',
  WorldChain = 'worldchain',
}
