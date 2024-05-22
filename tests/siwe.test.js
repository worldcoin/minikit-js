import { parseSiweMessage, verifySiweMessage } from "@worldcoin/minikit-js";

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

const signatureSiweMessage =
  "http://localhost:3000 wants you to sign in with your Ethereum account:\n0xd809de3086ea4f53ed3979cead25e1ff72b564a3\n\n\nURI: http://localhost:3000/\nVersion: 1\nChain ID: 10\nNonce: 814434bd-ed2c-412e-aa2c-c4b266a42027\nIssued At: 2024-05-22T17:49:52.075Z\nExpiration Time: 2024-05-29T17:49:52.074Z\nNot Before: 2024-05-21T17:49:52.074Z\nRequest ID: 0\n";
const signature =
  "f75530590312f5b36b6ef0003800003ba0af04640c72838580f76a3883d2365f397670d785475c39514629345cec307bcbe8c81fb85430da0dc3ef43c9a946d91b";

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

  test("Verify SIWE Message", () => {
    const payload = {
      status: "success",
      message: signatureSiweMessage,
      signature: signature,
      address: "0xd809de3086ea4f53ed3979cead25e1ff72b564a3",
    };

    verifySiweMessage(payload, "814434bd-ed2c-412e-aa2c-c4b266a42027");
  });
});
