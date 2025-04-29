import { JsonRpcProvider } from 'ethers';
import { parseSiweMessage, verifySiweMessage } from 'helpers/siwe/siwe';
import { SiweMessage } from 'siwe';
import { MiniAppWalletAuthSuccessPayload } from 'types/responses';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

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

const signedMessagePayload = `test.com wants you to sign in with your Ethereum account:\n0x619525ED4E862B62cFEDACCc4dA5a9864D6f4A97\n\nstatement\n\nURI: https://test.com\nVersion: 1\nChain ID: 480\nNonce: 12345678\nIssued At: 2025-04-09T17:55:41Z\nExpiration Time: 2027-03-10T17:55:41Z\nNot Before: 2025-04-09T17:55:41Z\nRequest ID: 0`;

const signatureSiweMessage = (
  issuedAt = new Date(),
  expirationDays = 7,
  notBeforeDays = -1,
) =>
  `http://localhost:3000 wants you to sign in with your Ethereum account:\n0xd809de3086ea4f53ed3979cead25e1ff72b564a3\n\n\nURI: http://localhost:3000/\nVersion: 1\nChain ID: 10\nNonce: 814434bd-ed2c-412e-aa2c-c4b266a42027\nIssued At: ${issuedAt.toISOString()}\nExpiration Time: ${new Date(issuedAt.getTime() + 1000 * 60 * 60 * 24 * expirationDays).toISOString()}\nNot Before: ${new Date(issuedAt.getTime() + 1000 * 60 * 60 * 24 * notBeforeDays).toISOString()}\nRequest ID: 0\n`;

const signature =
  '0x4daac02daec8852202bba0694da942b1f4e20d1795cbb1c6740a71ee4660f1d77c4fd7fabfd4416d7e987030d41841c575a363a95e496a3264d282863ce5dc4d1b';

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
        address: '0x619525ED4E862B62cFEDACCc4dA5a9864D6f4A97',
        version: 2,
      },
      '12345678',
      undefined,
      undefined,
    );

    expect(result.isValid).toBe(true);
    expect(result.siweMessageData).toBeDefined();

    const publicClient = createPublicClient({
      chain: worldchain,
      transport: http(),
    });
    const valid = await publicClient.verifySiweMessage({
      message: signedMessagePayload,
      signature,
    });
    expect(valid).toBe(true);
  });

  it('should validate SIWE v2', async () => {
    const result = await verifySiweMessage(
      {
        status: 'success',
        message: signedMessagePayload,
        signature: signature,
        address: '0x619525ED4E862B62cFEDACCc4dA5a9864D6f4A97',
        version: 2,
      },
      '12345678',
      undefined,
      undefined,
    );

    expect(result.isValid).toBe(true);
    expect(result.siweMessageData).toBeDefined();
  });

  it('should validate SIWE using SIWE', async () => {
    const m = new SiweMessage(signedMessagePayload);
    const provider = new JsonRpcProvider(
      'https://worldchain-mainnet.g.alchemy.com/public',
    );

    const isValid = await m.verify(
      {
        signature,
        nonce: '12345678',
        // @ts-ignore
      },
      // @ts-ignore
      { provider: provider },
    );

    expect(isValid.success).toBe(true);
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
