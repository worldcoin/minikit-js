import { AppConfig } from 'src/types/client';

export interface TransactionStatus {
  transactionHash: `0x${string}`;
  transactionStatus: 'pending' | 'mined' | 'failed';
}

export async function fetchTransactionHash(
  appConfig: AppConfig,
  transactionId: string,
): Promise<TransactionStatus> {
  try {
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appConfig.app_id}&type=transaction`,
      {
        method: 'GET',
      },
    );

    console.log('Received response:', response.url);
    if (!response.ok) {
      throw new Error('Failed to fetch transaction status');
    }

    const data: TransactionStatus = await response.json();
    return data;
  } catch (error) {
    console.log('Error fetching transaction status', error);
    throw new Error('Failed to fetch transaction status');
  }
}
