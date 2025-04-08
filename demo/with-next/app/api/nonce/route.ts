import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

export async function GET() {
  console.log('GET request received');
  return new Response(JSON.stringify({ nonce: randomUUID() }));
}
/* 
Note: This is not a secure implementation of Wallet Auth.
It is only for demo purposes.
*/
export async function POST(request: NextRequest) {
  console.log('POST request received');
  const body = await request.json();
  console.log('body', body);
  const localNonce = body.localNonce;

  return new Response(
    JSON.stringify({ nonce: randomUUID(), localNonce: localNonce }),
  );
}
