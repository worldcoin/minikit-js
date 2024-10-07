import { AppConfig } from "src/types/client";

export interface TransactionStatus {
  transaction_hash: `0x${string}`;
  transaction_status: "pending" | "mined" | "failed";
}

export async function fetchTransactionHash(
  appConfig: AppConfig,
  transactionId: string
): Promise<TransactionStatus> {
  const response = await fetch(
    `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appConfig.app_id}&type=transaction`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${appConfig.api_key}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transaction status");
  }

  const data: TransactionStatus = await response.json();
  return data;
}
