import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

const worldIdAddressBookContractAddress =
  '0x57b930D551e677CC36e2fA036Ae2fe8FdaE0330D';
const addressVerifiedUntilAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'addressVerifiedUntil',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export const getIsUserVerified = async (
  walletAddress: string,
  rpcUrl?: string,
): Promise<boolean> => {
  const publicClient = createPublicClient({
    chain: worldchain,
    transport: http(
      rpcUrl || 'https://worldchain-mainnet.g.alchemy.com/public',
    ),
  });

  try {
    const verifiedUntilResponse = (await publicClient.readContract({
      address: worldIdAddressBookContractAddress,
      abi: addressVerifiedUntilAbi,
      functionName: 'addressVerifiedUntil',
      args: [walletAddress],
    })) as BigInt;

    const verifiedUntil = Number(verifiedUntilResponse.toString());

    if (!Number.isFinite(verifiedUntil)) {
      console.warn('Invalid verifiedUntil value:', verifiedUntil);
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return verifiedUntil > currentTime;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};
