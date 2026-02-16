import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTransactionHash } from '.';
export function useWaitForTransactionReceipt(options) {
  const {
    client,
    appConfig: _appConfig,
    transactionId,
    confirmations = 1,
    timeout,
    pollingInterval = 1000,
  } = options;
  const appConfig = useMemo(() => _appConfig, [_appConfig]);
  const [transactionHash, setTransactionHash] = useState(undefined);
  const [receipt, setReceipt] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(undefined);
  const [pollCount, setPollCount] = useState(0);
  const [transactionStatus, setTransactionStatus] = useState(undefined);
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
    let timeoutId = null;
    const fetchReceipt = async (hashToWaitFor) => {
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
