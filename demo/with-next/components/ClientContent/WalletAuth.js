'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/*
Note: This is not a secure implementation of Wallet Auth.
It is only for demo purposes.
*/
export const WalletAuth = () => {
  const [nonce, setNonce] = useState(null);
  const [walletAuthResult, setWalletAuthResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const onWalletAuthClick = useCallback(async () => {
    const generatedNonce = window.crypto.randomUUID().replace(/-/g, '');
    setNonce(generatedNonce);
    setWalletAuthResult(null);
    setStatusMessage(null);
    setVerificationMessage(null);
    setProfile(null);
    try {
      const result = await MiniKit.walletAuth({
        nonce: generatedNonce,
        expirationTime: new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
        ),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement:
          'This is my statement and here is a link https://worldcoin.com/apps',
      });
      const payload = {
        status: 'success',
        address: result.data.address,
        message: result.data.message,
        signature: result.data.signature,
      };
      setWalletAuthResult(payload);
      setStatusMessage(`Authenticated via ${result.executedWith}`);
      // Call the API to verify the message
      const response = await fetch('/api/verify-siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, nonce: generatedNonce }),
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
  }, []);
  return _jsxs('div', {
    className: 'grid gap-y-2',
    children: [
      _jsx('h2', { className: 'text-2xl font-bold', children: 'Wallet Auth' }),
      _jsx('button', {
        className: 'bg-black text-white rounded-lg p-4 w-full',
        onClick: onWalletAuthClick,
        children: 'Authenticate with wallet',
      }),
      _jsxs('div', {
        className: 'grid gap-y-1',
        children: [
          _jsx('p', { children: 'Result:' }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: JSON.stringify(walletAuthResult, null, 2),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-y-1',
            children: [
              _jsx('p', { children: 'Status:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children: statusMessage ?? 'No auth yet',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'grid gap-y-1',
            children: [
              _jsx('p', { children: 'Verification:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children: verificationMessage ?? 'No verification yet',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'grid gap-y-1',
            children: [
              _jsx('p', { children: 'Profile' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children: profile?.username,
              }),
              profile?.profilePictureUrl &&
                _jsx(Image, {
                  src: profile.profilePictureUrl,
                  alt: 'Profile',
                  width: 100,
                  height: 100,
                }),
            ],
          }),
        ],
      }),
    ],
  });
};
