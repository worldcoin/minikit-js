import { validateSendTransactionPayload } from '../commands/send-transaction/validate';

describe('validateSendTransactionPayload', () => {
  it('preserves calldata payload fields', () => {
    const payload = {
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '0x1',
        },
      ],
      chainId: 480,
    };

    expect(validateSendTransactionPayload(payload)).toEqual(payload);
  });

  it('normalizes transaction values while preserving v2 shape', () => {
    const payload = {
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '0xff',
        },
      ],
      chainId: 480,
    };

    expect(validateSendTransactionPayload(payload as any)).toEqual({
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '0xff',
        },
      ],
      chainId: 480,
    });
  });

  it('throws when value is not a valid hex string', () => {
    const payload = {
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '100',
        },
      ],
      chainId: 480,
    };

    expect(() => validateSendTransactionPayload(payload as any)).toThrow(
      'Transaction value must be a valid hex string: 100',
    );
  });

  it('normalizes string chainId to number', () => {
    const payload = {
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '0x64',
        },
      ],
      chainId: '480',
    };

    expect(validateSendTransactionPayload(payload as any)).toEqual({
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '0x64',
        },
      ],
      chainId: 480,
    });
  });
});
