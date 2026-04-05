const HEX_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const HEX_STRING_REGEX = /^0x[0-9a-fA-F]*$/;

export function isHexAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && HEX_ADDRESS_REGEX.test(value);
}

export function isHexString(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && HEX_STRING_REGEX.test(value);
}
