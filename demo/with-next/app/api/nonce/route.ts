import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export default function GET(req: NextRequest) {
  // Expects only alphanumeric characters
  const nonce = crypto.randomUUID().replace(/-/g, "");

  // The nonce should be stored somewhere that is not tamperable by the client
  cookies().set("siwe", nonce, { secure: true });
  return NextResponse.json({ nonce });
}
