import { validateSendTransactionPayload } from '../helpers/transaction/validate-payload';
const ABI = [
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'recipient',
        type: 'address',
      },
    ],
    name: 'pay',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
    ],
    name: 'Paid',
    type: 'event',
  },
];
describe('validateSendTransactionPayload', () => {
  it('should validate simple string values and preserve ABI', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: ['0x456', '1000000000000000000'],
          abi: ABI,
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject(payload);
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
          args: ['0x456', [1000000000000000000, '1', [true]]],
        },
      ],
    };

    const formattedPayload = {
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
          args: ['0x456', ['1000000000000000000', '1', [true]]],
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject(
      formattedPayload,
    );
  });

  it('should validate with permit2 data', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: ['0x456', '1000000000000000000'],
          abi: [],
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
    expect(validateSendTransactionPayload(payload)).toMatchObject(payload);
  });

  it('should fix numbers', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [123, '1000000000000000000'], // number instead of string
          abi: ABI,
        },
      ],
    };
    const formattedPayload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: ['123', '1000000000000000000'], // number instead of string
          abi: ABI,
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject(
      formattedPayload,
    );
  });

  it('should preserve booleans', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [true, '1000000000000000000'], // boolean instead of string
          abi: [],
        },
      ],
    };
    const formattedPayload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [true, '1000000000000000000'], // boolean instead of string
          abi: [],
        },
      ],
    };
    expect(validateSendTransactionPayload(payload)).toMatchObject(
      formattedPayload,
    );
  });
});
