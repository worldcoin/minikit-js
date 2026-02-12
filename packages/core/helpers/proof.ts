import {
  createPublicClient,
  decodeAbiParameters,
  encodeAbiParameters,
  http,
} from 'viem';
import { worldchain } from 'viem/chains';

const semaphoreVerifierAddress = '0x79f46b94d134109EbcbbddBAeD0E88790409A0e4';
const semaphoreVerifierAbi = [
  {
    inputs: [
      {
        internalType: 'uint256[8]',
        name: 'proof',
        type: 'uint256[8]',
      },
    ],
    name: 'compressProof',
    outputs: [
      {
        internalType: 'uint256[4]',
        name: 'compressed',
        type: 'uint256[4]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export const compressAndPadProof = async (
  proof: `0x${string}`,
  rpcUrl?: string,
): Promise<`0x${string}`> => {
  try {
    const publicClient = createPublicClient({
      chain: worldchain,
      transport: http(
        rpcUrl || 'https://worldchain-mainnet.g.alchemy.com/public',
      ),
    });

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

    const compressedProof = (await publicClient.readContract({
      address: semaphoreVerifierAddress,
      abi: semaphoreVerifierAbi,
      functionName: 'compressProof',
      args: [decodedProof],
    })) as [bigint, bigint, bigint, bigint];

    const paddedProof: [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ] = [...compressedProof, 0n, 0n, 0n, 0n];

    return encodeAbiParameters([{ type: 'uint256[8]' }], [paddedProof]);
  } catch (e) {
    return proof;
  }
};
