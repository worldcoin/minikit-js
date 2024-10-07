import { AppConfig } from "src/types/client";

export interface TransactionStatus {
  transaction_hash: `0x${string}`;
  transaction_status: "pending" | "mined" | "failed";
}

export async function fetchTransactionHash(
  appConfig: AppConfig,
  transactionId: string
): Promise<TransactionStatus> {
  console.log("Fetching transaction status for:", transactionId);
  try {
    const response = await fetch(
      `https://staging-developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appConfig.app_id}&type=transaction`,
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

    console.log("Received response:", response);

    const data: TransactionStatus = await response.json();
    return data;
  } catch (error) {
    console.log("Error fetching transaction status", error);
    throw new Error("Failed to fetch transaction status");
  }
}
