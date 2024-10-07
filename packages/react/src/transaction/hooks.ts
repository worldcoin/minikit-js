"use client";
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
  const [shouldCancel, setShouldCancel] = useState<boolean>(false);

  const failureCountRef = useRef(0);

  const isLoading =
    receipt === undefined && (isLoadingReceipt || isLoadingHash);
  const isSuccess = receipt !== undefined && receipt.status === "success";

  const cancel = useCallback(() => {
    setShouldCancel(true);
  }, []);

  useEffect(() => {
    if (!transactionId || shouldCancel) {
      setIsLoadingHash(false);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const pollHash = async () => {
      try {
        const status = await fetchTransactionHash(appConfig, transactionId);

        if (!isMounted || shouldCancel) return;

        failureCountRef.current = 0;

        if (status.transaction_status === "pending") {
          setIsLoadingHash(true);
        } else if (
          status.transaction_status === "mined" ||
          status.transaction_status === "failed"
        ) {
          setTransactionHash(status.transaction_hash);
          setIsLoadingHash(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        if (!isMounted || shouldCancel) return;

        failureCountRef.current += 1;

        if (failureCountRef.current > 3) {
          console.error("Polling failed more than 3 times. Stopping polling.");
          setIsError(true);
          setError(new Error("Polling failed repeatedly"));
          setIsLoadingHash(false);
          clearInterval(intervalId);
        }
      }
    };

    intervalId = setInterval(pollHash, pollingInterval);
    pollHash();

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [appConfig, transactionId, pollingInterval, shouldCancel]);

  useEffect(() => {
    if (!transactionHash || shouldCancel) {
      setIsLoadingReceipt(false);
      return;
    }

    let isMounted = true;

    const fetchReceipt = async () => {
      setIsLoadingReceipt(true);
      try {
        const txnReceipt = await client.waitForTransactionReceipt({
          hash: transactionHash,
          confirmations,
          timeout,
        });

        if (isMounted && !shouldCancel) {
          setReceipt(txnReceipt);
          setIsLoadingReceipt(false);
        }
      } catch (err: any) {
        if (isMounted && !shouldCancel) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoadingReceipt(false);
        }
      }
    };

    fetchReceipt();

    return () => {
      isMounted = false;
    };
  }, [transactionHash, confirmations, timeout, shouldCancel, client]);

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
