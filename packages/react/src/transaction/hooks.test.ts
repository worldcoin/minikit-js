import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { TransactionReceipt } from 'viem';

import {
  useWaitForTransactionReceipt,
  useWaitForUserOperationReceipt,
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
