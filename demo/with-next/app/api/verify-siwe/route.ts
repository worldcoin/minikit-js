import {
  MiniAppWalletAuthSuccessPayload,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import { NextRequest, NextResponse } from 'next/server';

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

export async function POST(req: NextRequest) {
  const { payload, nonce } = (await req.json()) as IRequestPayload;

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
    const validMessage = await verifySiweMessage(payload, nonce);
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
