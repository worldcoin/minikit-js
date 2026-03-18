import type { MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js/commands';
import { verifySiweMessage } from '@worldcoin/minikit-js/siwe';
import { NextRequest, NextResponse } from 'next/server';

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

export async function POST(req: NextRequest) {
  const { payload, nonce } = (await req.json()) as IRequestPayload;

  try {
    if (!payload?.address || !payload?.message || !payload?.signature) {
      throw new Error('Invalid wallet auth payload');
    }

    // verifySiweMessage uses EIP-1271 on-chain verification via the Safe contract,
    // which works for both the MiniKit native path and the wagmi path.
    const validMessage = await verifySiweMessage(payload, nonce);
    return NextResponse.json({
      status: 'success',
      isValid: validMessage.isValid,
    });
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
