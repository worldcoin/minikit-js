import { fetchTransactionHash, fetchUserOperationStatus } from './index';

describe('transaction API helpers', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses the default developer endpoint for transaction receipts', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transactionHash:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
        transactionStatus: 'pending',
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    await fetchTransactionHash({ app_id: 'app_staging_example' }, 'tx_123');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://developer.world.org/api/v2/minikit/transaction/tx_123?app_id=app_staging_example&type=transaction',
      { method: 'GET' },
    );
  });

  it('normalizes a pending user operation without a transaction hash', async () => {
    const userOpHash =
      '0x2222222222222222222222222222222222222222222222222222222222222222';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'pending',
        userOpHash,
        sender: null,
        transaction_hash: null,
        nonce: null,
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    await expect(
      fetchUserOperationStatus(undefined, userOpHash),
    ).resolves.toEqual({
      userOpHash,
      transactionHash: undefined,
      transactionStatus: 'pending',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `https://developer.world.org/api/v2/minikit/userop/${userOpHash}`,
      { method: 'GET' },
    );
  });

  it('normalizes a successful user operation with receipt metadata', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        userOpHash:
          '0x3333333333333333333333333333333333333333333333333333333333333333',
        sender: '0x4444444444444444444444444444444444444444',
        transaction_hash:
          '0x5555555555555555555555555555555555555555555555555555555555555555',
        nonce: '0x0',
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    await expect(
      fetchUserOperationStatus(
        { apiBaseUrl: 'https://developer.world.org' },
        '0x3333333333333333333333333333333333333333333333333333333333333333',
      ),
    ).resolves.toEqual({
      userOpHash:
        '0x3333333333333333333333333333333333333333333333333333333333333333',
      transactionHash:
        '0x5555555555555555555555555555555555555555555555555555555555555555',
      transactionStatus: 'mined',
      sender: '0x4444444444444444444444444444444444444444',
      nonce: '0x0',
    });
  });
});
