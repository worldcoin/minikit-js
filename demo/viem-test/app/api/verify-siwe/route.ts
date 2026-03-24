import type { MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js/commands';
import { parseSiweMessage, verifySiweMessage } from '@worldcoin/minikit-js/siwe';
import { NextRequest, NextResponse } from 'next/server';
import {
  createPublicClient,
  getAddress,
  hashMessage,
  http,
  recoverAddress,
} from 'viem';
import { worldchain } from 'viem/chains';

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

async function isContract(address: `0x${string}`): Promise<boolean> {
  const client = createPublicClient({ chain: worldchain, transport: http() });
  const code = await client.getCode({ address });
  return !!code && code !== '0x';
}

async function verifyEOA(
  message: string,
  signature: `0x${string}`,
  expectedAddress: string,
  nonce: string,
): Promise<{ isValid: boolean }> {
  const siweData = parseSiweMessage(message);
  if (siweData.nonce !== nonce) {
    throw new Error(`Nonce mismatch. Got: ${siweData.nonce}, Expected: ${nonce}`);
  }
  if (siweData.expiration_time) {
    if (new Date(siweData.expiration_time) < new Date()) {
      throw new Error('Expired message');
    }
  }

  const hash = hashMessage(message);
  const recovered = await recoverAddress({ hash, signature });
  const isValid =
    getAddress(recovered) === getAddress(expectedAddress as `0x${string}`);
  return { isValid };
}

export async function POST(req: NextRequest) {
  const { payload, nonce } = (await req.json()) as IRequestPayload;

  try {
    if (!payload?.address || !payload?.message || !payload?.signature) {
      throw new Error('Invalid wallet auth payload');
    }

    const address = payload.address as `0x${string}`;
    const contract = await isContract(address);

    if (contract) {
      // Smart contract wallet (Safe / World App) → EIP-1271
      const validMessage = await verifySiweMessage(payload, nonce);
      return NextResponse.json({
        status: 'success',
        isValid: validMessage.isValid,
      });
    } else {
      // EOA (MetaMask, etc.) → ecrecover
      const result = await verifyEOA(
        payload.message,
        payload.signature as `0x${string}`,
        payload.address,
        nonce,
      );
      return NextResponse.json({
        status: 'success',
        isValid: result.isValid,
      });
    }
  } catch (error: unknown) {
    console.error('[verify-siwe] error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: errorMessage,
    });
  }
}
