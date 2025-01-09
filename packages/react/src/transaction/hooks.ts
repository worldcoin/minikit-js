import { useCallback, useEffect, useMemo, useState } from 'react';
import { PublicClient, TransactionReceipt } from 'viem';
import { fetchTransactionHash } from '.';
import { AppConfig } from '../types/client';

interface UseTransactionReceiptOptions {
  client: PublicClient;
  appConfig: AppConfig;
  transactionId: string;
  confirmations?: number;
  timeout?: number;
  pollingInterval?: number;
}

interface UseTransactionReceiptResult {
  transactionHash?: `0x${string}`;
  receipt?: TransactionReceipt;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error?: Error;
  retrigger: () => void;
}

export function useWaitForTransactionReceipt(
  options: UseTransactionReceiptOptions,
): UseTransactionReceiptResult {
  const {
    client,
    appConfig: _appConfig,
    transactionId,
    confirmations = 1,
    timeout,
    pollingInterval = 4000,
  } = options;

  const appConfig = useMemo(() => _appConfig, [_appConfig]);

  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [receipt, setReceipt] = useState<TransactionReceipt | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [pollCount, setPollCount] = useState<number>(0);

  const retrigger = useCallback(() => {
    reset();
    setIsLoading(false);
    setPollCount((count) => count + 1);
  }, []);

  const reset = useCallback(() => {
    setTransactionHash(undefined);
    setReceipt(undefined);
    setIsError(false);
    setError(undefined);
  }, []);

  const fetchStatus = useCallback(async () => {
    return await fetchTransactionHash(appConfig, transactionId);
  }, [appConfig, transactionId]);

  useEffect(() => {
    if (!transactionId) {
      setIsLoading(false);
      return;
    }

    reset();
    setIsLoading(true);

    const abortController = new AbortController();
    const signal = abortController.signal;
    let timeoutId: NodeJS.Timeout | null = null;

    const pollHash = async () => {
      if (signal.aborted) return;

      try {
        const status = await fetchStatus();

        if (signal.aborted) return;

        if (!status.transactionHash) {
          timeoutId = setTimeout(pollHash, pollingInterval);
        } else if (status.transactionHash) {
          setTransactionHash(status.transactionHash);
          setIsLoading(false);
        } else {
          timeoutId = setTimeout(pollHash, pollingInterval);
        }
      } catch (err) {
        if (signal.aborted) return;
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    pollHash();

    return () => {
      abortController.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [transactionId, pollCount]);

  useEffect(() => {
    if (!transactionHash) return;
    if (receipt) return;

    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchReceipt = async () => {
      try {
        const txnReceipt = await client.waitForTransactionReceipt({
          hash: transactionHash,
          confirmations,
          timeout,
        });
        if (signal.aborted) return;
        setReceipt(txnReceipt);
      } catch (err) {
        if (signal.aborted) return;
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    fetchReceipt();

    return () => {
      abortController.abort();
    };
  }, [transactionHash, confirmations, timeout, client]);

  const isSuccess = receipt !== undefined && receipt.status === 'success';

  return {
    transactionHash,
    receipt,
    isError,
    isLoading,
    isSuccess,
    error,
    retrigger,
  };
}
