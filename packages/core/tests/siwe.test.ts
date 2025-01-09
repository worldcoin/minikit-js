import { parseSiweMessage, verifySiweMessage } from 'helpers/siwe/siwe';
import { MiniAppWalletAuthSuccessPayload } from 'types/responses';

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

const signatureSiweMessage = (
  issuedAt = new Date(),
  expirationDays = 7,
  notBeforeDays = -1,
) =>
  `http://localhost:3000 wants you to sign in with your Ethereum account:\n0xd809de3086ea4f53ed3979cead25e1ff72b564a3\n\n\nURI: http://localhost:3000/\nVersion: 1\nChain ID: 10\nNonce: 814434bd-ed2c-412e-aa2c-c4b266a42027\nIssued At: ${issuedAt.toISOString()}\nExpiration Time: ${new Date(issuedAt.getTime() + 1000 * 60 * 60 * 24 * expirationDays).toISOString()}\nNot Before: ${new Date(issuedAt.getTime() + 1000 * 60 * 60 * 24 * notBeforeDays).toISOString()}\nRequest ID: 0\n`;

const signature =
  'f75530590312f5b36b6ef0003800003ba0af04640c72838580f76a3883d2365f397670d785475c39514629345cec307bcbe8c81fb85430da0dc3ef43c9a946d91b';

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
  test('Verify SIWE Message', () => {
    // TODO: Implement this test
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
