import { GenerateSiweMessageInput } from "types/wallet-auth";

export const generateSiweMessage = (
  siweMessageData: GenerateSiweMessageInput
) => {
  let siweMessage = "";

  if (siweMessageData.scheme) {
    siweMessage += `${siweMessageData.scheme}://${siweMessageData.domain} wants you to sign in with your Ethereum account:\n`;
  } else {
    siweMessage += `${siweMessageData.domain} wants you to sign in with your Ethereum account:\n`;
  }

  // NOTE: This is differs from the ERC-4361 spec where the address is required
  if (siweMessageData.address) {
    siweMessage += `${siweMessageData.address}\n\n`;
  }

  if (siweMessageData.statement) {
    siweMessage += `${siweMessageData.statement}\n\n`;
  }

  siweMessage += `URI: ${siweMessageData.uri}\n`;
  siweMessage += `Version: ${siweMessageData.version}\n`;
  siweMessage += `Chain ID: ${siweMessageData.chain_id}\n`;
  siweMessage += `Nonce: ${siweMessageData.nonce}\n`;
  siweMessage += `Issued At: ${siweMessageData.issued_at}\n`;

  if (siweMessageData.expiration_time) {
    siweMessage += `Expiration Time: ${siweMessageData.expiration_time}\n`;
  }

  if (siweMessageData.not_before) {
    siweMessage += `Not Before: ${siweMessageData.not_before}\n`;
  }

  if (siweMessageData.request_id) {
    siweMessage += `Request ID: ${siweMessageData.request_id}\n`;
  }

  return siweMessage;
};
