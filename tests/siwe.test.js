import { parseSiweMessage } from "@worldcoin/minikit-js";

const siweMessage = `https://test.com wants you to sign in with your Ethereum account:\n\
{{address}}\n\n\
statement\n\n\
URI: https://test.com\n\
Version: 1\n\
Chain ID: 10\n\
Nonce: 12345678\n\
Issued At: ${new Date().toISOString()}\n\
Expiration Time: 2024-05-03T00:00:00Z\n\
Not Before: 2024-05-03T00:00:00Z\n\
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

describe("Test SIWE Message Parsing", () => {
  test("Correctly parses full SIWE message", () => {
    parseSiweMessage(siweMessage);
  });

  test("Correctly parses incomplete SIWE message", () => {
    parseSiweMessage(incompleteSiweMessage);
  });

  test("Correctly rejects missing required values", () => {
    console.log(invalidSiweMessage);
    expect(() => parseSiweMessage(invalidSiweMessage)).toThrow(
      "Missing 'Nonce: '"
    );
  });
});
