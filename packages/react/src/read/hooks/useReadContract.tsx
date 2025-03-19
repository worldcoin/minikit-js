import { useEffect, useState } from 'react';
import { Abi } from 'viem';
import { client } from '../client';

interface ReadContract {
  contractAddress: `0x${string}`;
  ABI: Abi;
  functionName: string;
  args?: any[];
}

export function useReadContract({
  contractAddress,
  ABI,
  functionName,
  args = [],
}: ReadContract) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const result = await client.readContract({
          address: contractAddress,
          abi: ABI,
          functionName,
          args,
        });
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [contractAddress, ABI, functionName, JSON.stringify(args)]);

  return { data, isLoading, error };
}
