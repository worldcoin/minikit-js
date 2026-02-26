import type {
  MiniAppWalletAuthSuccessPayload,
  WalletAuthResult,
} from '@worldcoin/minikit-js/commands';
import { verifySiweMessage } from '@worldcoin/minikit-js/siwe';
import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload | WalletAuthResult;
  nonce: string;
  executedWith: 'minikit' | 'wagmi' | 'fallback';
}

export async function POST(req: NextRequest) {
  const { payload, nonce, executedWith } = (await req.json()) as IRequestPayload;

  // const cookieStore = await cookies();
  // if (nonce !== cookieStore.get('siwe')?.value) {
  //   return NextResponse.json({
  //     status: 'error',
  //     isValid: false,
  //     message: 'Invalid nonce',
  //   });
  // }

  try {
    console.log('payload', payload);

    if (!payload?.address || !payload?.message || !payload?.signature) {
      throw new Error('Invalid wallet auth payload');
    }

    if (executedWith === 'wagmi') {
      const message = new SiweMessage(payload.message);
      if (message.address.toLowerCase() !== payload.address.toLowerCase()) {
        throw new Error('SIWE message address does not match payload address');
      }

      const verification = await message.verify({
        signature: payload.signature,
        nonce,
      });

      return NextResponse.json({
        status: 'success',
        isValid: verification.success,
        ...(verification.success
          ? {}
          : { message: verification.error?.type ?? 'SIWE verification failed' }),
      });
    }

    const validMessage = await verifySiweMessage(
      payload as MiniAppWalletAuthSuccessPayload,
      nonce,
    );
    return NextResponse.json({
      status: 'success',
      isValid: validMessage.isValid,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: errorMessage,
    });
  }
}
