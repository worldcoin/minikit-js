describe('worldApp connector lazy auth', () => {
  let originalWindow: unknown;

  beforeEach(() => {
    jest.resetModules();
    originalWindow = (global as any).window;
    (global as any).window = {
      WorldApp: {
        world_app_version: 1,
        device_os: 'ios',
        is_optional_analytics: false,
        supported_commands: [],
        safe_area_insets: { top: 0, right: 0, bottom: 0, left: 0 },
        location: null,
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (global as any).window = originalWindow;
  });

  it('calls eth_requestAccounts from getAccounts when no cached address exists', async () => {
    const request = jest
      .fn()
      .mockResolvedValue(['0x1234567890abcdef1234567890abcdef12345678']);
    const getAddress = jest.fn().mockReturnValue(undefined);

    jest.doMock('../provider', () => ({
      _clearAddress: jest.fn(),
      _getAddress: getAddress,
      _setAddress: jest.fn(),
      getWorldAppProvider: jest.fn(() => ({ request })),
    }));
    jest.doMock('../commands/wagmi-fallback', () => ({
      setWagmiConfig: jest.fn(),
    }));

    const { worldApp } = await import('../connector/connector');
    const connector = worldApp()({ chains: [{ id: 480 }] });

    const accounts = await connector.getAccounts();

    expect(request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    expect(accounts).toEqual(['0x1234567890abcdef1234567890abcdef12345678']);
  });

  it('returns cached address without prompting auth', async () => {
    const request = jest.fn();
    const cached = '0x1234567890abcdef1234567890abcdef12345678';
    const getAddress = jest.fn().mockReturnValue(cached);

    jest.doMock('../provider', () => ({
      _clearAddress: jest.fn(),
      _getAddress: getAddress,
      _setAddress: jest.fn(),
      getWorldAppProvider: jest.fn(() => ({ request })),
    }));
    jest.doMock('../commands/wagmi-fallback', () => ({
      setWagmiConfig: jest.fn(),
    }));

    const { worldApp } = await import('../connector/connector');
    const connector = worldApp()({ chains: [{ id: 480 }] });

    const accounts = await connector.getAccounts();

    expect(request).not.toHaveBeenCalled();
    expect(accounts).toEqual([cached]);
  });

  it('returns empty accounts when auth request fails', async () => {
    const request = jest.fn().mockRejectedValue(new Error('user_rejected'));
    const getAddress = jest.fn().mockReturnValue(undefined);

    jest.doMock('../provider', () => ({
      _clearAddress: jest.fn(),
      _getAddress: getAddress,
      _setAddress: jest.fn(),
      getWorldAppProvider: jest.fn(() => ({ request })),
    }));
    jest.doMock('../commands/wagmi-fallback', () => ({
      setWagmiConfig: jest.fn(),
    }));

    const { worldApp } = await import('../connector/connector');
    const connector = worldApp()({ chains: [{ id: 480 }] });

    const accounts = await connector.getAccounts();

    expect(request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    expect(accounts).toEqual([]);
  });
});
