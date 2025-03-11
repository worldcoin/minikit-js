import { base64Wasm, compressProof, initSync } from 'semaphore-rs-js';

import { decodeAbiParameters, encodeAbiParameters } from 'viem';

function base64ToUint8Array(base64) {
  if (typeof atob === 'function') {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else if (typeof Buffer === 'function') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  } else {
    throw new Error('No base64 decoder available');
  }
}

const wasmBytes = base64ToUint8Array(base64Wasm);

// Initialize the generated bindings with the inlined wasm instance.
initSync({ module: wasmBytes });

export const compressAndPadProof = (proof: `0x${string}`): `0x${string}` => {
  try {
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

    const proofHexStrings = [...decodedProof].map(
      (p) => '0x' + p.toString(16).padStart(64, '0'),
    ) as [string, string, string, string, string, string, string, string];

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
  } catch (error) {
    console.error('Error compressing proof:', error);
    // Return the original proof if compression fails
    return proof;
  }
};
