import { AppConfig } from '../types/client';

const DEFAULT_API_BASE_URL = 'https://developer.world.org';

export interface TransactionStatus {
  transactionHash: `0x${string}`;
  transactionStatus: 'pending' | 'mined' | 'failed';
}

export interface UserOperationStatus {
  userOpHash: `0x${string}`;
  transactionHash?: `0x${string}`;
  transactionStatus: 'pending' | 'mined' | 'failed';
  sender?: `0x${string}`;
  nonce?: string;
}

type UserOperationStatusResponse = {
  status: 'success' | 'pending' | 'failed';
  userOpHash: `0x${string}`;
  sender: `0x${string}` | null;
  transaction_hash: `0x${string}` | null;
  nonce: string | null;
};

type MiniKitApiConfig = {
  apiBaseUrl?: string;
};

function resolveMiniKitApiBaseUrl(config: MiniKitApiConfig = {}): string {
  if (config.apiBaseUrl) {
    return config.apiBaseUrl.replace(/\/$/, '');
  }

  return DEFAULT_API_BASE_URL;
}

async function fetchJson<T>(url: string, errorPrefix: string): Promise<T> {
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${errorPrefix}: ${error.message}`);
  }

  return (await response.json()) as T;
}

function normalizeUserOperationStatus(
  data: UserOperationStatusResponse,
): UserOperationStatus {
  return {
    userOpHash: data.userOpHash,
    transactionHash: data.transaction_hash ?? undefined,
    transactionStatus:
      data.status === 'success'
        ? 'mined'
        : data.status === 'failed'
          ? 'failed'
          : 'pending',
    ...(data.sender ? { sender: data.sender } : {}),
    ...(data.nonce ? { nonce: data.nonce } : {}),
  };
}

export async function fetchTransactionHash(
  appConfig: AppConfig,
  transactionId: string,
): Promise<TransactionStatus> {
  try {
    const baseUrl = resolveMiniKitApiBaseUrl();
    return await fetchJson<TransactionStatus>(
      `${baseUrl}/api/v2/minikit/transaction/${transactionId}?app_id=${appConfig.app_id}&type=transaction`,
      'Failed to fetch transaction status',
    );
  } catch (error) {
    console.log('Error fetching transaction status', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to fetch transaction status');
  }
}

export async function fetchUserOperationStatus(
  config: MiniKitApiConfig | undefined,
  userOpHash: string,
): Promise<UserOperationStatus> {
  try {
    const baseUrl = resolveMiniKitApiBaseUrl(config);
    const data = await fetchJson<UserOperationStatusResponse>(
      `${baseUrl}/api/v2/minikit/userop/${userOpHash}`,
      'Failed to fetch userOp status',
    );

    return normalizeUserOperationStatus(data);
  } catch (error) {
    console.log('Error fetching userOp status', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to fetch userOp status');
  }
}
