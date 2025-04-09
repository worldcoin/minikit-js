import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  // Construct the base worldapp URL
  const worldAppUrl = new URL(
    `worldapp://worldcoin.org/mini-app?app_id=${process.env.WLD_CLIENT_ID}&path=`,
  );
  let path = '/api/auth/callback/google?';
  // Copy all search parameters to the new URL
  searchParams.forEach((value, key) => {
    path += `${key}=${value}&`;
  });
  // Remove the trailing '&'
  path = path.slice(0, -1);

  // Redirect to the constructed URL
  return NextResponse.redirect(
    worldAppUrl.toString() + encodeURIComponent(path),
  );
}
