import { signRequest } from '@worldcoin/minikit-js';
import { NextResponse } from 'next/server';

const SIGNING_KEY = process.env.RP_SIGNING_KEY; // 32-byte hex private key

export async function POST(req: Request) {
  if (!SIGNING_KEY) {
    return NextResponse.json(
      { error: 'RP_SIGNING_KEY not configured' },
      { status: 500 },
    );
  }

  const { action } = await req.json();
  const sig = signRequest(action, SIGNING_KEY);

  return NextResponse.json({
    sig: sig.sig,
    nonce: sig.nonce,
    created_at: Number(sig.createdAt),
    expires_at: Number(sig.expiresAt),
  });
}
