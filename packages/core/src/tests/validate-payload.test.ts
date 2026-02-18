import { validateSendTransactionPayload } from '../commands/send-transaction/validate';
import { Network } from '../commands/pay/types';

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
      network: Network.WorldChain,
      formatPayload: true,
    };

    expect(validateSendTransactionPayload(payload)).toEqual(payload);
  });

  it('normalizes bigint and number values when formatPayload is true', () => {
    const payload = {
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '0xff',
        },
      ],
      network: Network.WorldChain,
      permit2: [
        {
          permitted: {
            token: '0x1234567890abcdef1234567890abcdef12345678',
            amount: 10,
          },
          spender: '0x1234567890abcdef1234567890abcdef12345678',
          nonce: 1,
          deadline: 2,
        },
      ],
      formatPayload: true,
    };

    expect(validateSendTransactionPayload(payload as any)).toEqual({
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: '0xff',
        },
      ],
      network: Network.WorldChain,
      permit2: [
        {
          permitted: {
            token: '0x1234567890abcdef1234567890abcdef12345678',
            amount: '10',
          },
          spender: '0x1234567890abcdef1234567890abcdef12345678',
          nonce: '1',
          deadline: '2',
        },
      ],
      formatPayload: true,
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
      network: Network.WorldChain,
      formatPayload: true,
    };

    expect(() => validateSendTransactionPayload(payload as any)).toThrow(
      'Transaction value must be a valid hex string: 100',
    );
  });

  it('returns payload unchanged when formatPayload is false', () => {
    const payload = {
      transactions: [
        {
          to: '0x1234567890abcdef1234567890abcdef12345678',
          data: '0x1234',
          value: 100,
        },
      ],
      network: 'worldchain',
      formatPayload: false,
    };

    expect(validateSendTransactionPayload(payload as any)).toEqual(payload);
  });
});
