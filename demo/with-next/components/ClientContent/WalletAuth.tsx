'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import type { User } from '@worldcoin/minikit-js/commands';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useConfig } from 'wagmi';
import {
  DemoExecutionMode,
  wagmiNativeWalletAuth,
} from './helpers/wagmi-native';

/*
Note: This is not a secure implementation of Wallet Auth.
It is only for demo purposes.
*/
export const WalletAuth = () => {
  const wagmiConfig = useConfig();
  const [nonce, setNonce] = useState<string | null>(null);
  const [executionMode, setExecutionMode] =
    useState<DemoExecutionMode>('minikit');
  const [walletAuthResult, setWalletAuthResult] = useState<Record<
    string,
    any
  > | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );

  const onWalletAuthClick = useCallback(async () => {
    const generatedNonce = window.crypto.randomUUID().replace(/-/g, '');
    setNonce(generatedNonce);
    setWalletAuthResult(null);
    setStatusMessage(null);
    setVerificationMessage(null);
    setProfile(null);

    try {
      const input = {
        nonce: generatedNonce,
        expirationTime: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
        ),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement:
          'This is my statement and here is a link https://worldcoin.com/apps',
      };

      console.log(executionMode, { input });
      const result =
        executionMode === 'wagmi'
          ? {
              executedWith: 'wagmi' as const,
              data: await wagmiNativeWalletAuth(wagmiConfig, input),
            }
          : await MiniKit.walletAuth(input);

      const payload = {
        status: 'success' as const,
        address: result.data.address,
        message: result.data.message,
        signature: result.data.signature,
      };

      console.log('here', { payload });

      setWalletAuthResult(result);
      setStatusMessage(`Authenticated via ${result.executedWith}`);

      // Call the API to verify the message
      const response = await fetch('/api/verify-siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          nonce: generatedNonce,
          executedWith: result.executedWith,
        }),
      });

      const responseJson = await response.json();
      setVerificationMessage(
        responseJson.isValid
          ? 'Valid! Successfully Signed In'
          : `Failed: ${responseJson.message}`,
      );

      // Fetch profile
      if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production') {
        const res = await fetch(
          'https://usernames.worldcoin.org/api/v1/query',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addresses: [result.data.address] }),
          },
        );
        const usernames = await res.json();
        setProfile(
          usernames?.[0] ?? { username: null, profilePictureUrl: null },
        );
      } else {
        const user = await MiniKit.getUserInfo();
        setProfile(user);
      }
    } catch (error) {
      setStatusMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, [executionMode, wagmiConfig]);

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Wallet Auth</h2>
      <div className="grid grid-cols-2 gap-2">
        <button
          className={`rounded-lg p-3 w-full ${
            executionMode === 'minikit'
              ? 'bg-black text-white'
              : 'bg-gray-200 text-black'
          }`}
          onClick={() => setExecutionMode('minikit')}
        >
          MiniKit Command
        </button>
        <button
          className={`rounded-lg p-3 w-full ${
            executionMode === 'wagmi'
              ? 'bg-black text-white'
              : 'bg-gray-200 text-black'
          }`}
          onClick={() => setExecutionMode('wagmi')}
        >
          Wagmi Native
        </button>
      </div>

      <button
        className="bg-black text-white rounded-lg p-4 w-full"
        onClick={onWalletAuthClick}
      >
        Authenticate with wallet
      </button>

      <div className="grid gap-y-1">
        <p>Result:</p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(walletAuthResult, null, 2)}
          </pre>
        </div>

        <div className="grid gap-y-1">
          <p>Status:</p>
          <p className="bg-gray-300 p-2">{statusMessage ?? 'No auth yet'}</p>
        </div>

        <div className="grid gap-y-1">
          <p>Verification:</p>
          <p className="bg-gray-300 p-2">
            {verificationMessage ?? 'No verification yet'}
          </p>
        </div>

        <div className="grid gap-y-1">
          <p>Profile</p>
          <p className="bg-gray-300 p-2">{profile?.username}</p>
          {profile?.profilePictureUrl && (
            <Image
              src={profile.profilePictureUrl}
              alt="Profile"
              width={100}
              height={100}
            />
          )}
        </div>
      </div>
    </div>
  );
};
