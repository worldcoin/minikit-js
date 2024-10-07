"use client";
import { useState, useEffect, useCallback } from "react";
import { PublicClient, TransactionReceipt } from "viem";
import { fetchTransactionHash, TransactionStatus } from ".";
import { AppConfig } from "../types/client";

/**
 * Arguments for the useTransactionReceipt hook.
 */
interface UseTransactionReceiptOptions {
  client: PublicClient; // Viem Client instance
  appConfig: AppConfig; // Developer Portal Config
  transactionId: string; // Required Transaction ID
  confirmations?: number; // Number of block confirmations to wait for
  timeout?: number;
  pollingInterval?: number;
}

interface UseTransactionReceiptResult {
  transactionHash?: string;
  receipt?: TransactionReceipt;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  error?: Error;
  cancel: () => void;
}

/**
 * Hook to fetch a transaction receipt and poll for updates.
 *
 * @param options - Configuration options for the hook.
 * @returns Similar to Wagmi's useTransactionReceipt hook.
 */
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

  // Derived boolean flags
  const isLoading =
    receipt === undefined && (isLoadingReceipt || isLoadingHash);
  const isSuccess = receipt !== undefined && receipt.status === "success";
  const isFailed = receipt !== undefined && receipt.status === "reverted";

  // Overall status flags
  const overallIsError = isError || isFailed;
  const overallIsSuccess = isSuccess;
  const cancel = useCallback(() => {
    setShouldCancel(true);
  }, []);

  // Part 1: Poll for the transaction hash
  useEffect(() => {
    if (!transactionId || shouldCancel) {
      setIsLoadingHash(false);
      return;
    }

    let isMounted = true;
    let intervalId;

    const pollHash = async () => {
      try {
        const status: TransactionStatus = await fetchTransactionHash(
          appConfig,
          transactionId
        );

        if (!isMounted || shouldCancel) return;

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
      } catch (err: any) {
        if (!isMounted || shouldCancel) return;
        setIsError(true);
        setError(err);
        setIsLoadingHash(false);
        clearInterval(intervalId);
      }
    };

    pollHash();

    intervalId = setInterval(pollHash, pollingInterval);

    // Cleanup on unmount or cancellation
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [appConfig, transactionId, pollingInterval, shouldCancel]);

  // Part 2: Fetch the transaction receipt
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
          setError(err);
          setIsLoadingReceipt(false);
        }
      }
    };

    fetchReceipt();

    return () => {
      isMounted = false;
    };
  }, [transactionHash, confirmations, timeout, shouldCancel]);

  return {
    transactionHash,
    receipt,
    isError: overallIsError,
    isLoading,
    isSuccess: overallIsSuccess,
    error: overallIsError ? error : undefined,
    cancel,
  };
}
