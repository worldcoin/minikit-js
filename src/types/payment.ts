export enum Currency {
  WLD = "wld",
  ETH = "eth",
  USDC = "usdc",
}

export const currencyMapping = {
  [Currency.WLD]: "0xdC6fF44d5d932Cbd77B52E5612Ba0529DC6226F1",
  [Currency.ETH]: "0x4200000000000000000000000000000000000006", // WETH
  [Currency.USDC]: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC.e
};

// We currently only support one network
export enum Network {
  Optimism = "optimism",
}
