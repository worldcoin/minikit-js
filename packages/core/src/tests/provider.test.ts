import { MiniKit } from '../minikit';
import { getWorldAppProvider } from '../provider';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

describe('World App EIP-1193 provider', () => {
  let originalWindow: unknown;

  beforeEach(() => {
    originalWindow = (global as any).window;
    (global as any).window = {};
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (global as any).window = originalWindow;
  });

  it('routes personal_sign to MiniKit.signMessage and decodes hex payload', async () => {
    const signMessageSpy = jest.spyOn(MiniKit, 'signMessage').mockResolvedValue({
      executedWith: 'minikit',
      data: {
        status: 'success',
        version: 1,
        signature: '0xsigned',
      },
    } as any);
    const provider = getWorldAppProvider();

    const signature = await provider.request({
      method: 'personal_sign',
      params: ['0x68656c6c6f', ADDRESS],
    });

    expect(signature).toBe('0xsigned');
    expect(signMessageSpy).toHaveBeenCalledWith({ message: 'hello' });
  });

  it('supports personal_sign address-first params', async () => {
    const signMessageSpy = jest.spyOn(MiniKit, 'signMessage').mockResolvedValue({
      executedWith: 'minikit',
      data: {
        status: 'success',
        version: 1,
        signature: '0xpersonal',
      },
    } as any);
    const provider = getWorldAppProvider();

    const signature = await provider.request({
      method: 'personal_sign',
      params: [ADDRESS, '0x68656c6c6f'],
    });

    expect(signature).toBe('0xpersonal');
    expect(signMessageSpy).toHaveBeenCalledWith({ message: 'hello' });
  });

  it('routes eth_sign to MiniKit.signMessage', async () => {
    const signMessageSpy = jest.spyOn(MiniKit, 'signMessage').mockResolvedValue({
      executedWith: 'minikit',
      data: {
        status: 'success',
        version: 1,
        signature: '0xethsign',
      },
    } as any);
    const provider = getWorldAppProvider();

    const signature = await provider.request({
      method: 'eth_sign',
      params: [ADDRESS, '0x68656c6c6f'],
    });

    expect(signature).toBe('0xethsign');
    expect(signMessageSpy).toHaveBeenCalledWith({ message: 'hello' });
  });

  it('routes typed data signatures to MiniKit.signTypedData', async () => {
    const signTypedDataSpy = jest
      .spyOn(MiniKit, 'signTypedData')
      .mockResolvedValue({
        executedWith: 'minikit',
        data: {
          status: 'success',
          version: 1,
          signature: '0xtyped',
        },
      } as any);
    const provider = getWorldAppProvider();

    const typedData = {
      types: {
        EIP712Domain: [{ name: 'name', type: 'string' }],
        Mail: [{ name: 'contents', type: 'string' }],
      },
      primaryType: 'Mail',
      domain: { name: 'MiniKit', chainId: '480' },
      message: { contents: 'hello' },
    };

    const signature = await provider.request({
      method: 'eth_signTypedData_v4',
      params: [ADDRESS, JSON.stringify(typedData)],
    });

    expect(signature).toBe('0xtyped');
    expect(signTypedDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryType: 'Mail',
        message: { contents: 'hello' },
        chainId: 480,
      }),
    );
  });

  it('supports eth_signTypedData object payload format', async () => {
    const signTypedDataSpy = jest
      .spyOn(MiniKit, 'signTypedData')
      .mockResolvedValue({
        executedWith: 'minikit',
        data: {
          status: 'success',
          version: 1,
          signature: '0xtyped-object',
        },
      } as any);
    const provider = getWorldAppProvider();

    const typedData = {
      types: {
        EIP712Domain: [{ name: 'name', type: 'string' }],
        Message: [{ name: 'body', type: 'string' }],
      },
      primaryType: 'Message',
      domain: { name: 'MiniKit', chainId: 480 },
      message: { body: 'hello' },
    };

    const signature = await provider.request({
      method: 'eth_signTypedData',
      params: [typedData],
    });

    expect(signature).toBe('0xtyped-object');
    expect(signTypedDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryType: 'Message',
        chainId: 480,
      }),
    );
  });

  it('routes send transaction to MiniKit.sendTransaction and normalizes params', async () => {
    const sendTransactionSpy = jest
      .spyOn(MiniKit, 'sendTransaction')
      .mockResolvedValue({
        executedWith: 'minikit',
        data: {
          status: 'success',
          version: 1,
          transactionId: 'tx-123',
        },
      } as any);
    const provider = getWorldAppProvider();

    const transactionId = await provider.request({
      method: 'eth_sendTransaction',
      params: {
        to: ADDRESS,
        data: '0x1234',
        value: 1n,
        chainId: '0x1e0',
      },
    });

    expect(transactionId).toBe('tx-123');
    expect(sendTransactionSpy).toHaveBeenCalledWith({
      network: 'worldchain',
      transactions: [
        {
          to: ADDRESS,
          data: '0x1234',
          value: '0x1',
        },
      ],
    });
  });

  it('handles wallet_switchEthereumChain chain parsing', async () => {
    const provider = getWorldAppProvider();

    await expect(
      provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1e0' }],
      }),
    ).resolves.toBeNull();

    await expect(
      provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      }),
    ).rejects.toMatchObject({
      code: 4902,
    });
  });
});
