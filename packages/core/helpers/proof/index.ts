import __wbg_init, {
  compressProof as originalCompressProof,
} from 'semaphore-rs-js';
import { decodeAbiParameters, encodeAbiParameters } from 'viem';

// Create a wrapper that ensures WASM is initialized
let wasmInitialized = false;
let wasmInitializing = false;
let wasmInitPromise: Promise<void> | null = null;

const WASM_URL = 'https://cdn.jsdelivr.net/npm/wasm@1.0.0/wasm.min.js';

const ensureWasmInitialized = async () => {
  if (wasmInitialized) return;

  if (wasmInitializing) {
    // Wait for existing initialization to complete
    await wasmInitPromise;
    return;
  }

  wasmInitializing = true;

  // Initialize WASM module with URL
  wasmInitPromise = __wbg_init(WASM_URL)
    .then(() => {
      console.log('✅ WASM initialized from URL');
      wasmInitialized = true;
      wasmInitializing = false;
    })
    .catch((error) => {
      console.error('Failed to initialize WASM module:', error);
      wasmInitializing = false;
      throw error;
    });

  await wasmInitPromise;
};

export const compressAndPadProof = async (
  proof: `0x${string}`,
): Promise<`0x${string}`> => {
  try {
    // // Ensure WASM is initialized
    // await ensureWasmInitialized();

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
