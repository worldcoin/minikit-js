import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { TransactionReceipt } from 'viem';

import {
  useUserOperationReceipt,
  useWaitForTransactionReceipt,
  useWaitForUserOperationReceipt,
  type ReceiptResult,
} from './hooks';
import {
  fetchTransactionHash,
  fetchUserOperationStatus,
  type TransactionStatus,
  type UserOperationStatus,
} from './index';

jest.mock('./index', () => ({
  fetchTransactionHash: jest.fn(),
  fetchUserOperationStatus: jest.fn(),
}));

type HookResult = ReturnType<typeof useWaitForTransactionReceipt>;

type TransactionHarnessProps = {
  onChange: (result: HookResult) => void;
  client: {
    waitForTransactionReceipt: jest.Mock;
  };
  pollingInterval?: number;
};

type UserOperationHarnessProps = {
  onChange: (result: HookResult) => void;
  client: {
    waitForTransactionReceipt: jest.Mock;
  };
  pollingInterval?: number;
};

function TransactionHarness({
  onChange,
  client,
  pollingInterval,
}: TransactionHarnessProps) {
  const result = useWaitForTransactionReceipt({
    client: client as never,
    appConfig: { app_id: 'app_staging_example' },
    transactionId: 'tx_123',
    pollingInterval,
  });

  onChange(result);
  return null;
}

function UserOperationHarness({
  onChange,
  client,
  pollingInterval,
}: UserOperationHarnessProps) {
  const result = useWaitForUserOperationReceipt({
    client: client as never,
    apiBaseUrl: 'https://developer.world.org',
    userOpHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    pollingInterval,
  });

  onChange(result);
  return null;
}

const mockedFetchTransactionHash = jest.mocked(fetchTransactionHash);
const mockedFetchUserOperationStatus = jest.mocked(fetchUserOperationStatus);

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function waitForCondition(predicate: () => boolean) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await flushMicrotasks();
    if (predicate()) {
      return;
    }
  }

  throw new Error('Condition was not met');
}

describe('receipt hooks', () => {
  let renderer: ReactTestRenderer | undefined;

  afterEach(async () => {
    if (renderer) {
      await act(async () => {
        renderer?.unmount();
      });
      renderer = undefined;
    }

    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('waits for the chain receipt after a legacy transaction lookup returns a hash', async () => {
    jest.useFakeTimers();

    const receipt = {
      status: 'success',
      transactionHash:
        '0x1111111111111111111111111111111111111111111111111111111111111111',
    } as unknown as TransactionReceipt;

    mockedFetchTransactionHash.mockResolvedValue({
      transactionHash: receipt.transactionHash,
      transactionStatus: 'pending',
    } satisfies TransactionStatus);

    const client = {
      waitForTransactionReceipt: jest.fn().mockResolvedValue(receipt),
    };

    let latestResult: HookResult | undefined;

    await act(async () => {
      renderer = create(
        React.createElement(TransactionHarness, {
          client,
          pollingInterval: 1500,
          onChange: (result: HookResult) => {
            latestResult = result;
          },
        }),
      );
    });

    await waitForCondition(() => latestResult?.receipt === receipt);

    expect(mockedFetchTransactionHash).toHaveBeenCalledTimes(1);
    expect(client.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: receipt.transactionHash,
      confirmations: 1,
      timeout: undefined,
    });
    expect(latestResult).toMatchObject({
      transactionHash: receipt.transactionHash,
      receipt,
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
  });

  it('backs off user operation polling aggressively before a receipt exists', async () => {
    jest.useFakeTimers();

    mockedFetchUserOperationStatus.mockResolvedValue({
      userOpHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      transactionStatus: 'pending',
    } satisfies UserOperationStatus);

    const client = {
      waitForTransactionReceipt: jest.fn(),
    };

    await act(async () => {
      renderer = create(
        React.createElement(UserOperationHarness, {
          client,
          onChange: () => {},
        }),
      );
    });

    await flushMicrotasks();
    expect(mockedFetchUserOperationStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    await flushMicrotasks();
    expect(mockedFetchUserOperationStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await flushMicrotasks();
    expect(mockedFetchUserOperationStatus).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(599);
    });
    await flushMicrotasks();
    expect(mockedFetchUserOperationStatus).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await flushMicrotasks();
    expect(mockedFetchUserOperationStatus).toHaveBeenCalledTimes(3);
  });

  it('waits for the chain receipt once a user operation is mined', async () => {
    jest.useFakeTimers();

    const receipt = {
      status: 'success',
      transactionHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    } as unknown as TransactionReceipt;

    mockedFetchUserOperationStatus.mockResolvedValue({
      userOpHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      transactionHash: receipt.transactionHash,
      transactionStatus: 'mined',
    } satisfies UserOperationStatus);

    const client = {
      waitForTransactionReceipt: jest.fn().mockResolvedValue(receipt),
    };

    let latestResult: HookResult | undefined;

    await act(async () => {
      renderer = create(
        React.createElement(UserOperationHarness, {
          client,
          onChange: (result: HookResult) => {
            latestResult = result;
          },
        }),
      );
    });

    await waitForCondition(() => latestResult?.receipt === receipt);

    expect(mockedFetchUserOperationStatus).toHaveBeenCalledTimes(1);
    expect(client.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: receipt.transactionHash,
      confirmations: 1,
      timeout: undefined,
    });
    expect(latestResult).toMatchObject({
      transactionHash: receipt.transactionHash,
      receipt,
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
  });
});

// ============================================================================
// New imperative hooks
// ============================================================================

type ImperativeHookResult = ReturnType<typeof useUserOperationReceipt>;

type ImperativeHarnessProps = {
  onChange: (result: ImperativeHookResult) => void;
  client: { waitForTransactionReceipt: jest.Mock };
};

function ImperativeHarness({ onChange, client }: ImperativeHarnessProps) {
  const result = useUserOperationReceipt({
    client: client as never,
    apiBaseUrl: 'https://developer.world.org',
  });

  onChange(result);
  return null;
}

describe('useUserOperationReceipt (imperative)', () => {
  let renderer: ReactTestRenderer | undefined;
  let latestResult: ImperativeHookResult | undefined;
  let client: { waitForTransactionReceipt: jest.Mock };

  beforeEach(() => {
    client = { waitForTransactionReceipt: jest.fn() };
    latestResult = undefined;
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => {
        renderer?.unmount();
      });
      renderer = undefined;
    }
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('starts idle with isLoading false', async () => {
    await act(async () => {
      renderer = create(
        React.createElement(ImperativeHarness, {
          client,
          onChange: (r: ImperativeHookResult) => {
            latestResult = r;
          },
        }),
      );
    });

    expect(latestResult?.isLoading).toBe(false);
    expect(typeof latestResult?.poll).toBe('function');
    expect(typeof latestResult?.reset).toBe('function');
  });

  it('poll resolves with receipt on success', async () => {
    const receipt = {
      status: 'success',
      transactionHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    } as unknown as import('viem').TransactionReceipt;

    mockedFetchUserOperationStatus.mockResolvedValue({
      userOpHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      transactionHash: receipt.transactionHash as `0x${string}`,
      transactionStatus: 'mined',
    } satisfies UserOperationStatus);

    client.waitForTransactionReceipt.mockResolvedValue(receipt);

    let pollPromise: Promise<ReceiptResult> | undefined;

    await act(async () => {
      renderer = create(
        React.createElement(ImperativeHarness, {
          client,
          onChange: (r: ImperativeHookResult) => {
            latestResult = r;
          },
        }),
      );
    });

    await act(async () => {
      pollPromise = latestResult!.poll(
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      );
    });

    let result: ReceiptResult | undefined;
    await act(async () => {
      result = await pollPromise;
    });

    expect(result).toEqual({
      transactionHash: receipt.transactionHash,
      receipt,
    });
    expect(latestResult?.isLoading).toBe(false);
  });

  it('poll rejects on transaction failure', async () => {
    mockedFetchUserOperationStatus.mockResolvedValue({
      userOpHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      transactionStatus: 'failed',
    } satisfies UserOperationStatus);

    await act(async () => {
      renderer = create(
        React.createElement(ImperativeHarness, {
          client,
          onChange: (r: ImperativeHookResult) => {
            latestResult = r;
          },
        }),
      );
    });

    let error: Error | undefined;

    await act(async () => {
      try {
        await latestResult!.poll(
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        );
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error?.message).toBe('Transaction failed');
    expect(latestResult?.isLoading).toBe(false);
  });

  it('reset aborts in-flight polling', async () => {
    jest.useFakeTimers();

    // Return pending so polling continues to the delay step
    mockedFetchUserOperationStatus.mockResolvedValue({
      userOpHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      transactionStatus: 'pending',
    } satisfies UserOperationStatus);

    await act(async () => {
      renderer = create(
        React.createElement(ImperativeHarness, {
          client,
          onChange: (r: ImperativeHookResult) => {
            latestResult = r;
          },
        }),
      );
    });

    let pollRejected = false;
    let pollPromise: Promise<unknown> | undefined;

    await act(async () => {
      // Attach a catch immediately so the rejection is handled
      pollPromise = latestResult!
        .poll(
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        )
        .catch(() => {
          pollRejected = true;
        });
    });

    // Let the first fetchStatus resolve so we enter the delay
    await flushMicrotasks();
    expect(latestResult?.isLoading).toBe(true);

    await act(async () => {
      latestResult!.reset();
    });

    // Let the abort propagate
    await act(async () => {
      await pollPromise;
    });

    expect(latestResult?.isLoading).toBe(false);
    expect(pollRejected).toBe(true);
  });

  it('does not call waitForTransactionReceipt after abort during fetchStatus', async () => {
    // Simulate: fetchStatus resolves with a tx hash, but signal was aborted
    // while fetchStatus was in flight. waitForTransactionReceipt must NOT be called.
    let resolveFetch!: (value: UserOperationStatus) => void;
    mockedFetchUserOperationStatus.mockImplementation(
      () =>
        new Promise<UserOperationStatus>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    await act(async () => {
      renderer = create(
        React.createElement(ImperativeHarness, {
          client,
          onChange: (r: ImperativeHookResult) => {
            latestResult = r;
          },
        }),
      );
    });

    let pollRejected = false;
    let pollPromise: Promise<unknown> | undefined;

    await act(async () => {
      pollPromise = latestResult!
        .poll(
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        )
        .catch(() => {
          pollRejected = true;
        });
    });

    // Abort while fetchStatus is still pending
    await act(async () => {
      latestResult!.reset();
    });

    // Now resolve fetchStatus with a mined status + hash
    await act(async () => {
      resolveFetch({
        userOpHash:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        transactionHash:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        transactionStatus: 'mined',
      });
      await pollPromise;
    });

    expect(pollRejected).toBe(true);
    expect(client.waitForTransactionReceipt).not.toHaveBeenCalled();
  });
});
