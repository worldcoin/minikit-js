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
import { fetchTransactionHash, TransactionStatus } from '.';
import { AppConfig } from '../types/client';

interface UseTransactionReceiptOptions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> {
  client: PublicClient<
    transport,
    chain,
    ParseAccount<accountOrAddress>,
    rpcSchema
  >;
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
    client,
    appConfig: _appConfig,
    transactionId,
    confirmations = 1,
    timeout,
    pollingInterval = 1000,
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
  const [transactionStatus, setTransactionStatus] = useState<
    TransactionStatus | undefined
  >(undefined);

  const retrigger = useCallback(() => {
    reset();
    setIsLoading(false);
    setPollCount((count) => count + 1);
  }, []);

  const reset = useCallback(() => {
    setTransactionHash(undefined);
    setReceipt(undefined);
    setIsLoading(false);
    setPollCount(0);
    setIsError(false);
    setError(undefined);
    setTransactionStatus(undefined);
  }, []);

  const fetchStatus = useCallback(async () => {
    return await fetchTransactionHash(appConfig, transactionId);
  }, [appConfig, transactionId]);

  useEffect(() => {
    if (!transactionId) {
      reset();
      return;
    }

    console.log(
      '[Effect] Running for txId:',
      transactionId,
      'Poll count:',
      pollCount,
    );

    const abortController = new AbortController();
    const signal = abortController.signal;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchReceipt = async (hashToWaitFor: `0x${string}`) => {
      if (signal.aborted) return;
      try {
        const txnReceipt = await client.waitForTransactionReceipt({
          hash: hashToWaitFor,
          confirmations,
          timeout,
        });

        if (signal.aborted) return;
        setReceipt(txnReceipt);
        setIsLoading(false);
      } catch (err) {
        if (signal.aborted) return;
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    const pollHash = async () => {
      if (signal.aborted) return;

      try {
        // If we already have the hash, don't poll
        if (transactionHash) return;
        if (signal.aborted) return;

        const status = await fetchStatus();
        setTransactionStatus(status);
        // If we have the hash, fetch the receipt
        if (status.transactionHash) {
          setTransactionHash(status.transactionHash);
          await fetchReceipt(status.transactionHash);
        } else {
          // Otherwise, poll again
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
  }, [transactionId]);

  const isSuccess =
    (receipt !== undefined && receipt.status === 'success') ||
    transactionStatus?.transactionStatus === 'mined';

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
