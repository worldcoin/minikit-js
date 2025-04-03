import { parseSiweMessage, verifySiweMessage } from 'helpers/siwe/siwe';
import { MiniAppWalletAuthSuccessPayload } from 'types/responses';
import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';

const siweMessage = `https://test.com wants you to sign in with your Ethereum account:\n\
{{address}}\n\n\
statement\n\n\
URI: https://test.com\n\
Version: 1\n\
Chain ID: 10\n\
Nonce: 12345678\n\
Issued At: ${new Date().toISOString()}\n\
Expiration Time: ${new Date(
  new Date().getTime() + 1000 * 60 * 60 * 24 * 7,
).toISOString()}\n\
Not Before: ${new Date(
  new Date().getTime() - 1000 * 60 * 60 * 24 * 7,
).toISOString()}\n\
Request ID: 0`;

const incompleteSiweMessage = `https://test.com wants you to sign in with your Ethereum account:\n\
{{address}}\n\n\n\
URI: https://test.com\n\
Version: 1\n\
Chain ID: 10\n\
Nonce: 12345678\n\
Issued At: ${new Date().toISOString()}\n\
Expiration Time: 2024-05-03T00:00:00Z\n\
Request ID: 0`;

const invalidSiweMessage = `https://test.com wants you to sign in with your Ethereum account:\n\
{{address}}\n\n\n\
URI: https://test.com\n\
Version: 1\n\
Chain ID: 10\n\
Issued At: ${new Date().toISOString()}\n\
Expiration Time: 2024-05-03T00:00:00Z\n\
Request ID: 0`;

const signedMessagePayload = `https://test.com wants you to sign in with your Ethereum account:
0x11A1801863e1F0941A663f0338aEa395Be1Ec8A4

statement

URI: https://test.com
Version: 1
Chain ID: 10
Nonce: 12345678
Issued At: 2025-04-02T00:47:36Z
Expiration Time: 2025-04-09T00:47:36Z
Not Before: 2025-04-02T00:47:36Z
Request ID: 0`;

const signatureSiweMessage = (
  issuedAt = new Date(),
  expirationDays = 7,
  notBeforeDays = -1,
) =>
  `http://localhost:3000 wants you to sign in with your Ethereum account:\n0xd809de3086ea4f53ed3979cead25e1ff72b564a3\n\n\nURI: http://localhost:3000/\nVersion: 1\nChain ID: 10\nNonce: 814434bd-ed2c-412e-aa2c-c4b266a42027\nIssued At: ${issuedAt.toISOString()}\nExpiration Time: ${new Date(issuedAt.getTime() + 1000 * 60 * 60 * 24 * expirationDays).toISOString()}\nNot Before: ${new Date(issuedAt.getTime() + 1000 * 60 * 60 * 24 * notBeforeDays).toISOString()}\nRequest ID: 0\n`;

const signature =
  '0x087f879a348393c98c4c8ec2364c92c83a73b90d28564dc42a875c395892491b5638211b13a86f76d38447c1f5316ec5b5bdf4b96dcaa515e5296253170326c21b';

describe('Test SIWE Message Parsing', () => {
  test('Correctly parses full SIWE message', () => {
    parseSiweMessage(siweMessage);
  });

  test('Correctly parses incomplete SIWE message', () => {
    parseSiweMessage(incompleteSiweMessage);
  });

  test('Correctly rejects missing required values', () => {
    console.log(invalidSiweMessage);
    expect(() => parseSiweMessage(invalidSiweMessage)).toThrow(
      "Missing 'Nonce: '",
    );
  });
});

describe('Test SIWE Message Verification', () => {
  it('should validate SIWE v2', async () => {
    const result = await verifySiweMessage(
      {
        status: 'success',
        message: signedMessagePayload,
        signature: signature,
        address: '0x11A1801863e1F0941A663f0338aEa395Be1Ec8A4',
        version: 2,
      },
      '12345678',
      undefined,
      undefined,
      createPublicClient({
        chain: optimism,
        transport: http(),
      }),
    );

    expect(result.isValid).toBe(true);
    expect(result.siweMessageData).toBeDefined();
  });

  test('Verify SIWE Message with invalid signature', async () => {
    const payload: MiniAppWalletAuthSuccessPayload = {
      status: 'success',
      message: signatureSiweMessage(new Date(), 7, -1),
      signature: 'random_signature',
      address: '0xd809de3086ea4f53ed3979cead25e1ff72b564a3',
      version: 1,
    };
    await expect(
      verifySiweMessage(payload, '814434bd-ed2c-412e-aa2c-c4b266a42027'),
    ).rejects.toThrow('Signature verification failed');
  });

  test('Verify SIWE Message with invalid address', async () => {
    const payload: MiniAppWalletAuthSuccessPayload = {
      status: 'success' as const,
      message: signatureSiweMessage(new Date(), 7, -1),
      signature: signature,
      address: '0x0000000000000000000000000000000000000000',
      version: 1,
    };

    await expect(
      verifySiweMessage(payload, '814434bd-ed2c-412e-aa2c-c4b266a42027'),
    ).rejects.toThrow('Signature verification failed');
  });
});
