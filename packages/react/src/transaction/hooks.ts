import { useState, useEffect, useCallback, useRef } from "react";
import { PublicClient, TransactionReceipt } from "viem";
import { fetchTransactionHash } from ".";
import { AppConfig } from "../types/client";

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
  cancel: () => void;
}

export function useWaitForTransactionReceipt(
  options: UseTransactionReceiptOptions
): UseTransactionReceiptResult {
  const {
    client,
    appConfig,
    transactionId,
    confirmations = 1,
    timeout,
    pollingInterval = 4000,
  } = options;

  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [receipt, setReceipt] = useState<TransactionReceipt | undefined>(
    undefined
  );
  const [isLoadingHash, setIsLoadingHash] = useState<boolean>(true);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const isMountedRef = useRef(true);
  const shouldCancelRef = useRef(false);
  const failureCountRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const isLoading =
    receipt === undefined && (isLoadingReceipt || isLoadingHash);
  const isSuccess = receipt !== undefined && receipt.status === "success";

  const cancel = useCallback(() => {
    shouldCancelRef.current = true;
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    if (!transactionId || shouldCancelRef.current) {
      setIsLoadingHash(false);
      return;
    }
    console.log(transactionId);
    const pollHash = async () => {
      try {
        console.log("Polling for transaction hash:", transactionId);
        const status = await fetchTransactionHash(appConfig, transactionId);
        console.log("Received status:", status);

        if (!isMountedRef.current || shouldCancelRef.current) return;

        failureCountRef.current = 0;

        if (status.transaction_status === "pending") {
          setIsLoadingHash(true);
        } else if (
          status.transaction_status === "mined" ||
          status.transaction_status === "failed"
        ) {
          console.log("Transaction hash received:", status.transaction_hash);
          setTransactionHash(status.transaction_hash);
          setIsLoadingHash(false);
        }
      } catch (err) {
        if (!isMountedRef.current || shouldCancelRef.current) return;

        failureCountRef.current += 1;

        if (failureCountRef.current > 3) {
          console.error("Polling failed more than 3 times. Stopping polling.");
          setIsError(true);
          setError(new Error("Polling failed repeatedly"));
          setIsLoadingHash(false);
          return;
        }
      }

      if (isMountedRef.current && !shouldCancelRef.current) {
        timeoutIdRef.current = setTimeout(pollHash, pollingInterval);
      }
    };

    pollHash();

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [appConfig, transactionId, pollingInterval]);

  useEffect(() => {
    if (!transactionHash || shouldCancelRef.current) {
      setIsLoadingReceipt(false);
      return;
    }

    const fetchReceipt = async () => {
      setIsLoadingReceipt(true);
      try {
        console.log("Fetching transaction receipt for hash:", transactionHash);
        const txnReceipt = await client.waitForTransactionReceipt({
          hash: transactionHash,
          confirmations,
          timeout,
        });
        console.log("Received transaction receipt:", txnReceipt);

        if (isMountedRef.current && !shouldCancelRef.current) {
          setReceipt(txnReceipt);
          setIsLoadingReceipt(false);
        }
      } catch (err: any) {
        if (isMountedRef.current && !shouldCancelRef.current) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoadingReceipt(false);
        }
      }
    };

    fetchReceipt();
  }, [transactionHash, confirmations, timeout, client]);

  return {
    transactionHash,
    receipt,
    isError,
    isLoading,
    isSuccess,
    error,
    cancel,
  };
}
