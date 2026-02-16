import { verifySiweMessage } from '@worldcoin/minikit-js';
import { NextResponse } from 'next/server';
export async function POST(req) {
  const { payload, nonce } = await req.json();
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: errorMessage,
    });
  }
}
