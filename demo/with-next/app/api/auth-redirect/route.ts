// app/auth/resume/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}`);
  }

  const cookieName = `__Secure-next-auth.session-token`;

  const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}`);
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });

  return response;
}
