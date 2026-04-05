import { validateBatch } from '../commands/wagmi-fallback';

const VALID_ADDR = '0x1111111111111111111111111111111111111111';
const VALID_ADDR_2 = '0x2222222222222222222222222222222222222222';

describe('validateBatch', () => {
  it('normalizes a valid single-tx batch', () => {
    const result = validateBatch([
      { address: VALID_ADDR, data: '0x1234', value: '0x1' },
    ]);
    expect(result).toEqual([{ to: VALID_ADDR, data: '0x1234', value: 1n }]);
  });

  it('normalizes a multi-tx batch', () => {
    const result = validateBatch([
      { address: VALID_ADDR, data: '0xaa' },
      { address: VALID_ADDR_2, value: '100' },
    ]);
    expect(result).toEqual([
      { to: VALID_ADDR, data: '0xaa' },
      { to: VALID_ADDR_2, value: 100n },
    ]);
  });

  it('rejects invalid address in any position', () => {
    expect(() =>
      validateBatch([
        { address: VALID_ADDR, data: '0xaa' },
        { address: '0xNOT_AN_ADDRESS' },
      ]),
    ).toThrow('Transaction 2: invalid address');
  });

  it('rejects non-hex data', () => {
    expect(() =>
      validateBatch([{ address: VALID_ADDR, data: 'not-hex' }]),
    ).toThrow('Transaction 1: invalid data');
  });

  it('rejects unparseable value', () => {
    expect(() =>
      validateBatch([{ address: VALID_ADDR, value: 'not-a-number' }]),
    ).toThrow('Transaction 1: invalid value');
  });

  it('rejects negative value', () => {
    expect(() => validateBatch([{ address: VALID_ADDR, value: '-1' }])).toThrow(
      'cannot be negative',
    );
  });
});
