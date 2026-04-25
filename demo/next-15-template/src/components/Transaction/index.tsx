'use client';

import TestContractABI from '@/abi/TestContract.json';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForUserOperationReceipt } from '@worldcoin/minikit-react';
import { useEffect, useState } from 'react';
import { createPublicClient, encodeFunctionData, http } from 'viem';
import { worldchain } from 'viem/chains';

const client = createPublicClient({
  chain: worldchain,
  transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
});

/**
 * This component is used to get a token from a contract
 * For this to work you need to add the contract address to contract entrypoints
 * inside of  Dev Portal > Configuration > Advanced
 * The general design pattern here is
 * 1. Trigger the transaction
 * 2. Poll for the receipt using the returned userOpHash
 * 3. Handle success/failure
 */
export const Transaction = () => {
  // See the code for this contract here: https://worldscan.org/address/0xF0882554ee924278806d708396F1a7975b732522#code
  const myContractToken = '0xF0882554ee924278806d708396F1a7975b732522';
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);
  const [whichButton, setWhichButton] = useState<'getToken' | 'transferToken'>(
    'getToken',
  );
  const [userOpHash, setUserOpHash] = useState('');

  const { isLoading, isSuccess, isError } = useWaitForUserOperationReceipt({
    client,
    userOpHash,
  });

  useEffect(() => {
    if (isSuccess) {
      console.log('Transaction confirmed!');
      setButtonState('success');
      setUserOpHash('');
      setTimeout(() => setButtonState(undefined), 3000);
    }

    if (isError) {
      setButtonState('failed');
      setUserOpHash('');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  }, [isError, isSuccess]);

  // This is a basic transaction call to mint a token
  const onClickGetToken = async () => {
    setWhichButton('getToken');
    setButtonState('pending');

    try {
      const result = await MiniKit.sendTransaction({
        chainId: 480,
        transactions: [
          {
            to: myContractToken,
            data: encodeFunctionData({
              abi: TestContractABI,
              functionName: 'mintToken',
              args: [],
            }),
          },
        ],
      });

      console.log(
        'Transaction submitted, waiting for confirmation:',
        result.data.userOpHash,
      );

      if (!result.data.userOpHash) {
        throw new Error('No userOpHash returned');
      }

      setUserOpHash(result.data.userOpHash);
    } catch (err) {
      console.error('Error:', err);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  // This is a basic ERC20 transfer using the token you minted
  // Make sure to call Mint Token first
  const onClickTransferToken = async () => {
    setWhichButton('transferToken');
    setButtonState('pending');
    const recipient = (await MiniKit.getUserByUsername('alex')).walletAddress;
    const transferAmount = '500000000000000000';

    try {
      const result = await MiniKit.sendTransaction({
        chainId: 480,
        transactions: [
          {
            to: myContractToken,
            data: encodeFunctionData({
              abi: TestContractABI,
              functionName: 'transfer',
              args: [recipient, transferAmount],
            }),
          },
        ],
      });

      console.log(
        'Transaction submitted, waiting for confirmation:',
        result.data.userOpHash,
      );

      if (!result.data.userOpHash) {
        throw new Error('No userOpHash returned');
      }

      setUserOpHash(result.data.userOpHash);
    } catch (err) {
      console.error('Error:', err);
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Transaction</p>
      <LiveFeedback
        label={{
          failed: 'Transaction failed',
          pending: 'Transaction pending',
          success: 'Transaction successful',
        }}
        state={whichButton === 'getToken' ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={onClickGetToken}
          disabled={isLoading}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Get Token
        </Button>
      </LiveFeedback>
      <LiveFeedback
        label={{
          failed: 'Transaction failed',
          pending: 'Transaction pending',
          success: 'Transaction successful',
        }}
        state={whichButton === 'transferToken' ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={onClickTransferToken}
          disabled={isLoading}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          Transfer Token
        </Button>
      </LiveFeedback>
    </div>
  );
};
