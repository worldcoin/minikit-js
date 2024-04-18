import { TokenMapping, Tokens, tokenAddresses } from "types";

// // This function is used to verify an incoming payment event from the Mini App.
// export const verifySignature = async (
//   referenceId: string,
//   payload: MiniAppPaymentPayload
// ): Promise<boolean> => {
//   // Get the wallet address
//   // recreate the signature
//   // verify the payload
//   const recoveredPublicKey = await recoverPublicKey(data, signature);
//   return recoveredPublicKey === publicKey;
// };

// const getEOAFromSafe = async (safeAddress: string): Promise<string> => {
//   const safeContract = new ethers.Contract(
//     safeAddress,
//     ["function getOwner() view returns (address)"],
//     provider
//   );

//   const owner = await safeContract.getOwner();
//   return owner;
// };

export const createReferenceId = (): string => {
  const buffer = new Uint8Array(32); // Create a buffer of 32 bytes (256 bits)
  crypto.getRandomValues(buffer);
  const referenceId =
    "0x" +
    Array.from(buffer)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  return referenceId;
};

export const mapTokensToAddresses = (tokens: Tokens[]): string[] => {
  return tokens.map((token) => tokenAddresses[token]);
};
