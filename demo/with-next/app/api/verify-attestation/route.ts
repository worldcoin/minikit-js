import { createHash } from 'crypto';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWKS_URLS = {
  production: 'https://attestation.worldcoin.org/.well-known/jwks.json',
  staging: 'https://attestation.worldcoin.dev/.well-known/jwks.json',
};

export async function POST(req: NextRequest) {
  const attestationToken = req.headers.get('X-Attestation-Token');

  if (!attestationToken) {
    return NextResponse.json(
      { status: 'error', message: 'Missing X-Attestation-Token header' },
      { status: 400 },
    );
  }

  // Hash the raw request body server-side (same logic as frontend)
  const body = await req.text();
  const requestHash = createHash('sha256').update(body).digest('hex');

  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  const jwksUrl = isProduction ? JWKS_URLS.production : JWKS_URLS.staging;

  try {
    // Fetch the JWKS from the attestation gateway
    const jwks = jose.createRemoteJWKSet(new URL(jwksUrl));

    // Verify JWS signature and decode claims
    const { payload } = await jose.jwtVerify(attestationToken, jwks);

    const errors: string[] = [];

    // Verify jti matches the expected request hash
    if (payload.jti !== requestHash) {
      errors.push(
        `jti mismatch: expected "${requestHash}", got "${payload.jti}"`,
      );
    }

    // Verify pass claim is true
    if ((payload as Record<string, unknown>).pass !== true) {
      errors.push(
        `pass claim is not true: got "${(payload as Record<string, unknown>).pass}"`,
      );
    }

    if (errors.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Attestation claim verification failed',
        errors,
        claims: payload,
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Attestation token verified',
      claims: payload,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status: 'error',
        message: `Attestation verification failed: ${errorMessage}`,
      },
      { status: 401 },
    );
  }
}
