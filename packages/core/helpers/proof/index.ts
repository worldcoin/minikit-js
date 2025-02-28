import { compressProof } from 'semaphore-rs-js';
import { decodeAbiParameters, encodeAbiParameters } from 'viem';

export const compressAndPadProof = (proof: `0x${string}`) => {
  // Decode the hex proof to array of 8 uints
  const decodedProof = decodeAbiParameters(
    [{ type: 'uint256[8]' }],
    proof,
  )[0] as readonly [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  // Convert to hex strings for compression
  const proofHexStrings = [...decodedProof].map(
    (p) => '0x' + p.toString(16).padStart(64, '0'),
  ) as [string, string, string, string, string, string, string, string];

  // Compress and pad the proof
  const compressedProof = compressProof(proofHexStrings);
  const paddedProof = [...compressedProof.map(BigInt), 0n, 0n, 0n, 0n] as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  // Encode back to hex string
  return encodeAbiParameters([{ type: 'uint256[8]' }], [paddedProof]);
};
