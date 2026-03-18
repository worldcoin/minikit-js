import { signRequest } from '@worldcoin/idkit/signing';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SIGNING_KEY = process.env.RP_SIGNING_KEY; // 32-byte hex private key
const RP_ID = process.env.RP_ID ?? 'rp_e87d44dbb7b76d91';

export async function POST(req: Request) {
  if (!SIGNING_KEY) {
    return NextResponse.json(
      { error: 'RP_SIGNING_KEY not configured' },
      { status: 500 },
    );
  }
  if (!RP_ID) {
    return NextResponse.json(
      { error: 'RP_ID (or NEXT_PUBLIC_RP_ID) is not configured' },
      { status: 500 },
    );
  }

  const { action } = await req.json();
  const sig = signRequest(action, SIGNING_KEY);

  return NextResponse.json({
    rp_id: RP_ID,
    sig: sig.sig,
    nonce: sig.nonce,
    created_at: Number(sig.createdAt),
    expires_at: Number(sig.expiresAt),
  });
}
