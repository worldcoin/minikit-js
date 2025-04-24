import {
  objectValuesToArrayRecursive,
  validateSendTransactionPayload,
} from '../helpers/transaction/validate-payload';
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
      formatPayload: true,
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
      formatPayload: true,
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
      formatPayload: true,
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

  it('should catch bigints ', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [true, '1000000000000000000'], // boolean instead of string
          abi: [],
        },
      ],
      permit2: [
        {
          permitted: {
            token: '0x789',
            amount: BigInt('1000000000000000000'),
          },
          spender: '0xabc',
          nonce: '1',
          deadline: '1234567890',
        },
      ],
      formatPayload: true,
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
    expect(validateSendTransactionPayload(payload)).toMatchObject(
      formattedPayload,
    );
  });
  it('should handle both strings and numbers', () => {
    const payload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [true, { amount: '1000000000000000000', token: ['0x789'] }], // boolean instead of string
          abi: [],
        },
        {
          address: '0x123',
          functionName: 'transfer',
          args: [
            true,
            {
              address: '0x456',
              asset: { amount: '1000000000000000000', token: '0x789' },
            },
          ], // boolean instead of string
          abi: [],
        },
      ],
      permit2: [
        {
          permitted: {
            token: '0x789',
            amount: BigInt('1000000000000000000'),
          },
          spender: '0xabc',
          nonce: '1',
          deadline: '1234567890',
        },
      ],
      formatPayload: true,
    };
    const formattedPayload = {
      transaction: [
        {
          address: '0x123',
          functionName: 'transfer',
          args: [true, ['1000000000000000000', ['0x789']]], // boolean instead of string
          abi: [],
        },
        {
          address: '0x123',
          functionName: 'transfer',
          args: [
            true,
            ['0x456', ['1000000000000000000', '0x789']], // boolean instead of string
          ],
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
    expect(validateSendTransactionPayload(payload)).toMatchObject(
      formattedPayload,
    );
  });
});

describe('objectValuesToArrayRecursive', () => {
  it('should convert object values to array', () => {
    const payload = {
      a: 1,
      b: { c: 2, d: [3, 4] },
    };
    expect(objectValuesToArrayRecursive(payload)).toEqual([1, [2, [3, 4]]]);
  });

  it('should convert complex values to array', () => {
    const payload = {
      configName: 'Main Config',
      settings: {
        isEnabled: true,
        threshold: 0.75,
        features: {
          featureA: 'active',
          featureB: 'inactive',
        },
      },
      dataPoints: [10, 20, { pointId: 'p3', value: 30 }],
      adminContact: null,
    };
    expect(objectValuesToArrayRecursive(payload)).toEqual([
      'Main Config',
      [true, 0.75, ['active', 'inactive']],
      [10, 20, ['p3', 30]],
      null,
    ]);
  });

  it('should convert complex array to array', () => {
    const payload = [
      [2, 3],
      {
        configName: 'Main Config',
        settings: {
          isEnabled: true,
          threshold: 0.75,
          features: {
            featureA: 'active',
            featureB: 'inactive',
          },
        },
        dataPoints: [10, 20, { pointId: 'p3', value: 30 }],
        adminContact: null,
      },
    ];
    expect(objectValuesToArrayRecursive(payload)).toEqual([
      [2, 3],
      [
        'Main Config',
        [true, 0.75, ['active', 'inactive']],
        [10, 20, ['p3', 30]],
        null,
      ],
    ]);
  });

  it('should convert complex array with an array to array', () => {
    const payload = [
      [2, 3],
      {
        configName: 'Main Config',
        settings: {
          isEnabled: true,
          threshold: 0.75,
          features: {
            featureA: 'active',
            featureB: 'inactive',
          },
        },
        dataPoints: [10, 20, { pointId: ['p3', 'p4'], value: 30 }],
        adminContact: null,
      },
    ];
    expect(objectValuesToArrayRecursive(payload)).toEqual([
      [2, 3],
      [
        'Main Config',
        [true, 0.75, ['active', 'inactive']],
        [10, 20, [['p3', 'p4'], 30]],
        null,
      ],
    ]);
  });
});
