import { NextResponse } from 'next/server';
/**
 * This route is used to verify the proof of the user
 * It is critical proofs are verified from the server side
 * Read More: https://docs.world.org/mini-apps/commands/verify#verifying-the-proof
 */
export async function POST(req) {
  const { payload, action, signal } = await req.json();
  const app_id = process.env.NEXT_PUBLIC_APP_ID;
  const response = await fetch(
    `https://developer.worldcoin.org/api/v2/verify/${app_id}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, action, signal }),
    },
  );
  const verifyRes = await response.json();
  if (verifyRes.success) {
    // This is where you should perform backend actions if the verification succeeds
    // Such as, setting a user as "verified" in a database
    return NextResponse.json({ verifyRes, status: 200 });
  } else {
    // This is where you should handle errors from the World ID /verify endpoint.
    // Usually these errors are due to a user having already verified.
    return NextResponse.json({ verifyRes, status: 400 });
  }
}
