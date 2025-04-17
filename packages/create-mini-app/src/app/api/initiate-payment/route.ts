import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const uuid = crypto.randomUUID().replace(/-/g, '');

  // TODO: Store the ID field in your database so you can verify the payment later

  return NextResponse.json({ id: uuid });
}
