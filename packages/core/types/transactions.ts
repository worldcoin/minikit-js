import type {
  Abi,
  AbiParametersToPrimitiveTypes,
  AbiStateMutability,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';

export type Permit2 = {
  permitted: {
    token: string;
    amount: string | unknown;
  };
  spender: string;
  nonce: string | unknown;
  deadline: string | unknown;
};

export type Transaction = {
  address: string;
  abi: Abi | readonly unknown[];
  functionName: ContractFunctionName<
    Abi | readonly unknown[],
    'payable' | 'nonpayable'
  >;
  value?: string | undefined;
  args: ContractFunctionArgs<
    Abi | readonly unknown[],
    'payable' | 'nonpayable',
    ContractFunctionName<Abi | readonly unknown[], 'payable' | 'nonpayable'>
  >;
};

export type ContractFunctionName<
  abi extends Abi | readonly unknown[] = Abi,
  mutability extends AbiStateMutability = AbiStateMutability,
> =
  ExtractAbiFunctionNames<
    abi extends Abi ? abi : Abi,
    mutability
  > extends infer functionName extends string
    ? [functionName] extends [never]
      ? string
      : functionName
    : string;

export type ContractFunctionArgs<
  abi extends Abi | readonly unknown[] = Abi,
  mutability extends AbiStateMutability = AbiStateMutability,
  functionName extends ContractFunctionName<
    abi,
    mutability
  > = ContractFunctionName<abi, mutability>,
> =
  AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<
      abi extends Abi ? abi : Abi,
      functionName,
      mutability
    >['inputs'],
    'inputs'
  > extends infer args
    ? [args] extends [never]
      ? readonly unknown[]
      : args
    : readonly unknown[];
