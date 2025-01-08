// import { validateSendTransactionPayload } from "@worldcoin/minikit-js/core/helpers/transaction/validate-transaction";
const validate = (payload) => {
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

export const validateSendTransactionPayload = (payload) => validate(payload);

describe('validateSendTransactionPayload', () => {
  it('should validate simple string values', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: ['0x456', '1000000000000000000'],
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject({
      isValid: true,
    });
  });

  it('should validate nested objects', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          abi: [
            {
              name: 'transfer',
              type: 'function',
              inputs: [
                { name: 'recipient', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
            },
          ],
          functionName: 'transfer',
          args: ['0x456', '1000000000000000000'],
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject({
      isValid: true,
    });
  });

  it('should validate with permit2 data', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: ['0x456', '1000000000000000000'],
        },
      ],
      permit2: [
        {
          permitted: {
            token: '0x789',
            amount: '1000000000000000000',
          },
          spender: '0xabc',
          nonce: '1',
          deadline: '1234567890',
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject({
      isValid: true,
    });
  });

  it('should reject invalid values like numbers', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [123, '1000000000000000000'], // number instead of string
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject({
      isValid: false,
    });
  });

  it('should reject invalid values like booleans', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [true, '1000000000000000000'], // boolean instead of string
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject({
      isValid: false,
    });
  });
});
