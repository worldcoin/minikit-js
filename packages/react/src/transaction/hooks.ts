import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type Account,
  type Address,
  type Chain,
  type ParseAccount,
  type PublicClient,
  type RpcSchema,
  type TransactionReceipt,
  type Transport,
} from 'viem';
import {
  fetchTransactionHash,
  fetchUserOperationStatus,
  type TransactionStatus,
  type UserOperationStatus,
} from '.';
import { AppConfig } from '../types/client';

const DEFAULT_POLLING_INTERVAL_MS = 1000;
const USER_OPERATION_INITIAL_POLLING_INTERVAL_MS = 300;
const USER_OPERATION_MAX_POLLING_INTERVAL_MS = 5000;

type ReceiptLookupStatus = {
  transactionHash?: `0x${string}`;
  transactionStatus: 'pending' | 'mined' | 'failed';
};

type ReceiptPollingStrategy = {
  getPollDelayMs: (attempt: number) => number;
};

type BaseReceiptOptions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = {
  client: PublicClient<
    transport,
    chain,
    ParseAccount<accountOrAddress>,
    rpcSchema
  >;
  confirmations?: number;
  timeout?: number;
  pollingInterval?: number;
};

type UseTransactionReceiptOptions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = BaseReceiptOptions<transport, chain, accountOrAddress, rpcSchema> & {
  appConfig: AppConfig;
  transactionId: string;
};

type UseUserOperationReceiptOptions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = BaseReceiptOptions<transport, chain, accountOrAddress, rpcSchema> & {
  userOpHash: string;
  apiBaseUrl?: string;
};

type UseTransactionReceiptResult = {
  transactionHash?: `0x${string}`;
  receipt?: TransactionReceipt;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error?: Error;
  retrigger: () => void;
};

type UseReceiptPollingOptions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = BaseReceiptOptions<transport, chain, accountOrAddress, rpcSchema> & {
  id: string;
  fetchStatus: () => Promise<ReceiptLookupStatus>;
  strategy: ReceiptPollingStrategy;
};

function createFixedPollingStrategy(
  intervalMs: number,
): ReceiptPollingStrategy {
  return {
    getPollDelayMs: () => intervalMs,
  };
}

function createExponentialBackoffStrategy(
  initialDelayMs: number,
  maxDelayMs: number,
): ReceiptPollingStrategy {
  return {
    getPollDelayMs: (attempt) =>
      Math.min(initialDelayMs * 2 ** attempt, maxDelayMs),
  };
}

function useReceiptPolling<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
>(
  options: UseReceiptPollingOptions<
    transport,
    chain,
    accountOrAddress,
    rpcSchema
  >,
): UseTransactionReceiptResult {
  const {
    client,
    id,
    fetchStatus,
    strategy,
    confirmations = 1,
    timeout,
  } = options;

  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [receipt, setReceipt] = useState<TransactionReceipt | undefined>();
  const [transactionStatus, setTransactionStatus] =
    useState<ReceiptLookupStatus>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error>();
  const [retryKey, setRetryKey] = useState(0);

  const resetState = useCallback(() => {
    setTransactionHash(undefined);
    setReceipt(undefined);
    setTransactionStatus(undefined);
    setIsLoading(false);
    setIsError(false);
    setError(undefined);
  }, []);

  const retrigger = useCallback(() => {
    resetState();
    setRetryKey((value) => value + 1);
  }, [resetState]);

  useEffect(() => {
    if (!id) {
      resetState();
      return;
    }

    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let attempt = 0;

    setIsLoading(true);
    setIsError(false);
    setError(undefined);

    const waitForReceipt = async (hash: `0x${string}`) => {
      if (abortController.signal.aborted) return;

      try {
        const nextReceipt = await client.waitForTransactionReceipt({
          hash,
          confirmations,
          timeout,
        });

        if (abortController.signal.aborted) return;

        setReceipt(nextReceipt);
        setIsLoading(false);
      } catch (nextError) {
        if (abortController.signal.aborted) return;

        setIsError(true);
        setError(
          nextError instanceof Error ? nextError : new Error(String(nextError)),
        );
        setIsLoading(false);
      }
    };

    const poll = async () => {
      if (abortController.signal.aborted) {
        return;
      }

      try {
        const nextStatus = await fetchStatus();
        if (abortController.signal.aborted) return;

        setTransactionStatus(nextStatus);

        if (nextStatus.transactionStatus === 'failed') {
          setIsError(true);
          setError(new Error('Transaction failed'));
          setIsLoading(false);
          return;
        }

        if (nextStatus.transactionHash) {
          setTransactionHash(nextStatus.transactionHash);
          await waitForReceipt(nextStatus.transactionHash);
          return;
        }

        timeoutId = setTimeout(poll, strategy.getPollDelayMs(attempt));
        attempt += 1;
      } catch (nextError) {
        if (abortController.signal.aborted) return;

        setIsError(true);
        setError(
          nextError instanceof Error ? nextError : new Error(String(nextError)),
        );
        setIsLoading(false);
      }
    };

    poll();

    return () => {
      abortController.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    id,
    retryKey,
    fetchStatus,
    strategy,
    client,
    confirmations,
    timeout,
    resetState,
  ]);

  return {
    transactionHash,
    receipt,
    isError,
    isLoading,
    isSuccess:
      receipt?.status === 'success' ||
      transactionStatus?.transactionStatus === 'mined',
    error,
    retrigger,
  };
}

export function useWaitForTransactionReceipt<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
>(
  options: UseTransactionReceiptOptions<
    transport,
    chain,
    accountOrAddress,
    rpcSchema
  >,
): UseTransactionReceiptResult {
  const {
    appConfig,
    pollingInterval = DEFAULT_POLLING_INTERVAL_MS,
    transactionId,
  } = options;

  const fetchStatus = useCallback(async (): Promise<TransactionStatus> => {
    return await fetchTransactionHash(appConfig, transactionId);
  }, [appConfig.app_id, transactionId]);

  const strategy = useMemo(
    () => createFixedPollingStrategy(pollingInterval),
    [pollingInterval],
  );

  return useReceiptPolling({
    ...options,
    id: transactionId,
    fetchStatus,
    strategy,
  });
}

export function useWaitForUserOperationReceipt<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
>(
  options: UseUserOperationReceiptOptions<
    transport,
    chain,
    accountOrAddress,
    rpcSchema
  >,
): UseTransactionReceiptResult {
  const {
    apiBaseUrl,
    pollingInterval = USER_OPERATION_INITIAL_POLLING_INTERVAL_MS,
    userOpHash,
  } = options;

  const fetchStatus = useCallback(async (): Promise<UserOperationStatus> => {
    return await fetchUserOperationStatus({ apiBaseUrl }, userOpHash);
  }, [apiBaseUrl, userOpHash]);

  const strategy = useMemo(
    () =>
      createExponentialBackoffStrategy(
        pollingInterval,
        USER_OPERATION_MAX_POLLING_INTERVAL_MS,
      ),
    [pollingInterval],
  );

  return useReceiptPolling({
    ...options,
    id: userOpHash,
    fetchStatus,
    strategy,
  });
}
