import { validateWalletAuthCommandInput } from '../commands/wallet-auth/validate';

describe('validateWalletAuthCommandInput', () => {
  it('accepts alphanumeric nonce with minimum length', () => {
    const result = validateWalletAuthCommandInput({
      nonce: 'abc12345',
    });

    expect(result).toEqual({ valid: true });
  });

  it('rejects non-alphanumeric nonce', () => {
    const result = validateWalletAuthCommandInput({
      nonce: 'abc-12345',
    });

    expect(result).toEqual({
      valid: false,
      message: "'nonce' must be alphanumeric (letters and numbers only)",
    });
  });

  it('rejects nonce shorter than 8 chars', () => {
    const result = validateWalletAuthCommandInput({
      nonce: 'abc1234',
    });

    expect(result).toEqual({
      valid: false,
      message: "'nonce' must be at least 8 characters",
    });
  });
});
