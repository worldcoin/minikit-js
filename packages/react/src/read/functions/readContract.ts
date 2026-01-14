import { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { client } from '../client';

interface ReadContract<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'view' | 'pure'>,
> {
  contractAddress: `0x${string}`;
  ABI: TAbi;
  functionName: TFunctionName;
  args?: ContractFunctionArgs<TAbi, 'view' | 'pure', TFunctionName>;
}

export async function readContract<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'view' | 'pure'>,
>({
  contractAddress,
  ABI,
  functionName,
  args,
}: ReadContract<TAbi, TFunctionName>) {
  const data = await client.readContract({
    address: contractAddress,
    abi: ABI,
    functionName,
    args: (args || []) as ContractFunctionArgs<
      TAbi,
      'view' | 'pure',
      TFunctionName
    >,
  });

  return data;
}
