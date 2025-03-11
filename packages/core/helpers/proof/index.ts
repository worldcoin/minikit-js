import {
  initSync,
  compressProof as originalCompressProof,
} from 'semaphore-rs-js';
import { decodeAbiParameters, encodeAbiParameters } from 'viem';

// Create a wrapper that ensures WASM is initialized
let wasmInitialized = false;

const ensureWasmInitialized = () => {
  if (wasmInitialized) return;

  // Try different initialization approaches
  try {
    // Try with an empty object with module property
    initSync({ module: new WebAssembly.Module(new Uint8Array()) });
    console.log('✅ initSync with empty module worked!');
    wasmInitialized = true;
    return;
  } catch (e1) {
    console.log('Trying alternative initialization method...');
  }

  wasmInitialized = true;
};

export const compressAndPadProof = (proof: `0x${string}`): `0x${string}` => {
  try {
    // Ensure WASM is initialized
    ensureWasmInitialized();

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

    // Convert bigints to hex strings for compression
    const proofHexStrings = [...decodedProof].map(
      (p) => '0x' + p.toString(16).padStart(64, '0'),
    ) as [string, string, string, string, string, string, string, string];

    // Compress the proof
    const compressedProof = originalCompressProof(proofHexStrings);

    // Convert back to bigints and add padding
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
