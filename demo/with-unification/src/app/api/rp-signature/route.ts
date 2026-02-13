import { IDKit, signRequest } from "@worldcoin/idkit-core";
import { NextResponse } from "next/server";

// Initialize for Node.js (call once at startup)
const initPromise = IDKit.initServer();

const SIGNING_KEY = process.env.RP_SIGNING_KEY; // 32-byte hex private key

export async function POST(req: Request) {
  await initPromise;

  if (!SIGNING_KEY) {
    return NextResponse.json(
      { error: "RP_SIGNING_KEY not configured" },
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
