import { getIsUserVerified } from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';

/**
 * Checks if a user is Orb verified
 *
 * @param walletAddress - The wallet address of the user
 * @param rpcUrl - Your preferred RPC node URL, https://worldchain-mainnet.g.alchemy.com/public by default
 */
export const useIsUserVerified = (walletAddress: string, rpcUrl?: string) => {
  const [isUserVerified, setIsUserVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<any>(null);

  useEffect(() => {
    const fetchIsUserVerified = async () => {
      try {
        const data = await getIsUserVerified(walletAddress);
        setIsUserVerified(data);
      } catch (err) {
        setIsError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIsUserVerified();
  }, [walletAddress]);

  return { isUserVerified, isLoading, isError };
};
