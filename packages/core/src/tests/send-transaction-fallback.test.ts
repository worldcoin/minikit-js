import * as fallbackAdapterRegistry from '../commands/fallback-adapter-registry';
import { sendTransaction } from '../commands/send-transaction';
import * as commandTypes from '../commands/types';

const ADDRESS_A = '0x1111111111111111111111111111111111111111';
const ADDRESS_B = '0x2222222222222222222222222222222222222222';
const TX_HASH =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

describe('sendTransaction wagmi fallback', () => {
  let mockSendTransaction: jest.Mock;

  beforeEach(() => {
    jest.spyOn(commandTypes, 'isInWorldApp').mockReturnValue(false);
    jest.spyOn(commandTypes, 'isCommandAvailable').mockReturnValue(false);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    mockSendTransaction = jest.fn().mockResolvedValue({
      transactionHash: TX_HASH,
    });

    jest.spyOn(fallbackAdapterRegistry, 'getFallbackAdapter').mockReturnValue({
      sendTransaction: mockSendTransaction,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes a single transaction to the adapter', async () => {
    const result = await sendTransaction({
      chainId: 480,
      transactions: [{ to: ADDRESS_A, data: '0x1234' }],
    });

    expect(result.executedWith).toBe('wagmi');
    expect(result.data.userOpHash).toBe(TX_HASH);
    expect(mockSendTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendTransaction).toHaveBeenCalledWith({
      transactions: [{ address: ADDRESS_A, data: '0x1234', value: undefined }],
      chainId: 480,
    });
  });

  it('passes multiple transactions to the adapter', async () => {
    const result = await sendTransaction({
      chainId: 480,
      transactions: [
        { to: ADDRESS_A, data: '0xaaaa' },
        { to: ADDRESS_B, data: '0xbbbb', value: '0x1' },
      ],
    });

    expect(result.executedWith).toBe('wagmi');
    expect(result.data.userOpHash).toBe(TX_HASH);
    expect(mockSendTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendTransaction).toHaveBeenCalledWith({
      transactions: [
        { address: ADDRESS_A, data: '0xaaaa', value: undefined },
        { address: ADDRESS_B, data: '0xbbbb', value: '0x1' },
      ],
      chainId: 480,
    });
  });

  it('rejects empty transactions', async () => {
    await expect(
      sendTransaction({
        chainId: 480,
        transactions: [],
      }),
    ).rejects.toThrow();

    expect(mockSendTransaction).not.toHaveBeenCalled();
  });

  it('rejects wrong chainId', async () => {
    await expect(
      sendTransaction({
        chainId: 1,
        transactions: [{ to: ADDRESS_A }],
      }),
    ).rejects.toThrow();

    expect(mockSendTransaction).not.toHaveBeenCalled();
  });
});
