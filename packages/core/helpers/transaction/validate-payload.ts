import { SendTransactionInput } from 'types/commands';

const isValidHex = (str: string): boolean => {
  return /^0x[0-9A-Fa-f]+$/.test(str);
};

const processPayload = <T>(payload: T): T => {
  // Handle primitives directly
  if (
    typeof payload === 'boolean' ||
    typeof payload === 'string' ||
    payload === null ||
    payload === undefined
  ) {
    return payload;
  }

  // Convert numbers to strings to prevent overflow issues
  if (typeof payload === 'number') {
    return String(payload) as unknown as T;
  }

  // Handle arrays by processing each element
  if (Array.isArray(payload)) {
    return payload.map((value) => processPayload(value)) as unknown as T;
  }

  // Handle objects
  if (typeof payload === 'object') {
    const result = { ...payload } as any;

    // Special handling for transaction value fields
    if ('value' in result && result.value !== undefined) {
      // For transaction value, we need to ensure it's a valid hex string
      if (typeof result.value !== 'string') {
        result.value = String(result.value);
      }

      if (!isValidHex(result.value)) {
        console.error(
          'Transaction value must be a valid hex string',
          result.value,
        );
        throw new Error(
          `Transaction value must be a valid hex string: ${result.value}`,
        );
      }
    }

    // Process all object properties recursively
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        result[key] = processPayload(result[key]);
      }
    }

    return result;
  }

  // Fallback for any other types
  return payload;
};

export const validateSendTransactionPayload = (
  payload: SendTransactionInput,
): SendTransactionInput => {
  return processPayload(payload);
};
