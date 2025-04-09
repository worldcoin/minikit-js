import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  // Construct the base worldapp URL
  const worldAppUrl = new URL('worldapp://worldcoin.org/mini-app');

  // Copy all search parameters to the new URL
  searchParams.forEach((value, key) => {
    worldAppUrl.searchParams.append(key, value);
  });

  // Redirect to the constructed URL
  return NextResponse.redirect(worldAppUrl.toString());
}
