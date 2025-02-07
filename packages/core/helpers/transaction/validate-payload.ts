import { SendTransactionInput } from 'types/commands';

type ValidationReturn = { isValid: true } | { isValid: false };

const isValidHex = (str: string): boolean => {
  return /^0x[0-9A-Fa-f]+$/.test(str);
};

const validate = (payload: any): ValidationReturn => {
  if (typeof payload === 'string') return { isValid: true };

  if (Array.isArray(payload)) {
    const isValid = payload.every((value) => validate(value).isValid);
    return { isValid };
  }

  if (typeof payload === 'object' && payload !== null) {
    if ('value' in payload && payload.value !== undefined) {
      if (typeof payload.value !== 'string' || !isValidHex(payload.value)) {
        console.error(
          'Transaction value must be a valid hex string',
          payload.value,
        );
        return { isValid: false };
      }
    }

    const isValid = Object.values(payload).every(
      (value) => validate(value).isValid,
    );
    return { isValid };
  }

  return { isValid: false };
};

export const validateSendTransactionPayload = (payload: SendTransactionInput) =>
  validate(payload);
