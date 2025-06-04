export enum Tokens {
  USDC = 'USDC',
  WLD = 'WLD',
}

export const TokenDecimals: { [key in Tokens]: number } = {
  [Tokens.USDC]: 6,
  [Tokens.WLD]: 18,
};

export enum Network {
  Optimism = 'optimism',
  WorldChain = 'worldchain',
}
