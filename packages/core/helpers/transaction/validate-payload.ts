import { SendTransactionInput } from 'types/commands';
type ValidationReturn = { isValid: true } | { isValid: false };

const validate = (payload: any): ValidationReturn => {
  if (typeof payload === 'string') return { isValid: true };
  if (typeof payload === 'object') {
    const isValid = Object.values(payload).every(
      (value) => validate(value).isValid,
    );
    return { isValid };
  }
  if (Array.isArray(payload)) {
    const isValid = payload.every((value) => validate(value).isValid);
    return { isValid };
  }
  return { isValid: false };
};

export const validateSendTransactionPayload = (payload: SendTransactionInput) =>
  validate(payload);
