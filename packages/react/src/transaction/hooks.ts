import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  useWebSocket?: boolean;
  fallbackToPolling?: boolean;
}

interface UseTransactionReceiptResult {
  transactionHash?: `0x${string}`;
  receipt?: TransactionReceipt;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error?: Error;
  retrigger: () => void;
  webSocketFailed: boolean;
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
    pollingInterval = 4000,
    useWebSocket = false,
    fallbackToPolling = true,
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
  const [webSocketFailed, setWebSocketFailed] = useState<boolean>(false);
  const webSocketRef = useRef<WebSocket | null>(null);

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
    setWebSocketFailed(false);

    // Close WebSocket if it exists
    if (
      webSocketRef.current &&
      webSocketRef.current.readyState === WebSocket.OPEN
    ) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    return await fetchTransactionHash(appConfig, transactionId);
  }, [appConfig, transactionId]);

  // WebSocket connection setup
  useEffect(() => {
    if (!transactionId || !useWebSocket || webSocketFailed) {
      return;
    }

    // Create WebSocket URL
    const wsUrl = `wss://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}/ws?app_id=${appConfig.app_id}&type=transaction`;

    try {
      webSocketRef.current = new WebSocket(wsUrl);

      webSocketRef.current.onopen = () => {
        console.log('WebSocket connection established for transaction updates');
      };

      webSocketRef.current.onmessage = (event) => {
        try {
          const data: TransactionStatus = JSON.parse(event.data);

          if (data.transactionHash) {
            setTransactionHash(data.transactionHash);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setWebSocketFailed(true);
        }
      };

      webSocketRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setWebSocketFailed(true);
      };

      webSocketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        // Only set as failed if it closed unexpectedly
        if (isLoading && !transactionHash) {
          setWebSocketFailed(true);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setWebSocketFailed(true);
    }

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [transactionId, appConfig, useWebSocket, isLoading]);

  // Fallback to polling if WebSocket fails or if not using WebSocket
  useEffect(() => {
    if (
      !transactionId ||
      (useWebSocket && !webSocketFailed) ||
      !fallbackToPolling
    ) {
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
  }, [
    transactionId,
    pollCount,
    useWebSocket,
    webSocketFailed,
    fallbackToPolling,
  ]);

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
    webSocketFailed,
  };
}
