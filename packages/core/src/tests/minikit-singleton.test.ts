import { MiniKit } from '../minikit';

describe('MiniKit singleton delegation', () => {
  let originalWindow: unknown;

  beforeEach(() => {
    originalWindow = (global as any).window;
    (global as any).window = {};
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (global as any).window = originalWindow;
  });

  it('delegates walletAuth to window.MiniKit when a different instance is mounted globally', async () => {
    const walletAuth = jest.fn().mockResolvedValue({
      executedWith: 'minikit',
      data: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        message: 'hello',
        signature: '0xdeadbeef',
      },
    });

    (global as any).window.MiniKit = { walletAuth, trigger: jest.fn() };

    const input = { nonce: 'abc12345' };
    const result = await MiniKit.walletAuth(input as any);

    expect(walletAuth).toHaveBeenCalledTimes(1);
    expect(walletAuth).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      executedWith: 'minikit',
      data: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        message: 'hello',
        signature: '0xdeadbeef',
      },
    });
  });

  it('delegates signMessage and signTypedData to window.MiniKit', async () => {
    const signMessage = jest.fn().mockResolvedValue({
      executedWith: 'minikit',
      data: {
        status: 'success',
        version: 1,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        signature: '0xbead',
      },
    });
    const signTypedData = jest.fn().mockResolvedValue({
      executedWith: 'minikit',
      data: {
        status: 'success',
        version: 1,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        signature: '0xcafe',
      },
    });

    (global as any).window.MiniKit = {
      signMessage,
      signTypedData,
      trigger: jest.fn(),
    };

    await MiniKit.signMessage({ message: 'hello' } as any);
    await MiniKit.signTypedData({
      primaryType: 'Mail',
      types: { Mail: [{ name: 'contents', type: 'string' }] },
      domain: { name: 'MiniKit', chainId: 480 },
      message: { contents: 'hello' },
    } as any);

    expect(signMessage).toHaveBeenCalledTimes(1);
    expect(signTypedData).toHaveBeenCalledTimes(1);
  });
});
