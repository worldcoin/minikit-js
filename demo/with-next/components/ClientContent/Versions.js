'use client';
import {
  MiniKit,
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from '@worldcoin/minikit-js';
import clsx from 'clsx';
import { useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
const appId = 'your-app-id';
export const Versions = () => {
  const [username, setUsername] = useState('andy');
  const isValid = () => {
    if (
      typeof window === 'undefined' ||
      typeof window.WorldApp === 'undefined'
    ) {
      return { isValid: false, error: 'window.WorldApp is undefined' };
    }
    try {
      // @ts-ignore
      if (MiniKit.commandsValid(window.WorldApp?.supported_commands)) {
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error:
            MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AppOutOfDate],
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Something went wrong on version validation',
      };
    }
  };
  const reinstall = () => {
    MiniKit.install(appId);
    JSON.stringify(isValid() ?? null, null, 2);
  };
  return _jsxs('div', {
    className: 'grid gap-y-4',
    children: [
      _jsx('h2', { className: 'font-bold text-2xl', children: 'Versions' }),
      _jsxs('div', {
        children: [
          _jsx('p', { children: 'window.WorldApp:' }),
          _jsx('button', { onClick: reinstall, children: 'Install' }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              suppressHydrationWarning: true,
              className: 'break-all whitespace-break-spaces',
              children: JSON.stringify(window?.WorldApp ?? null, null, 2),
            }),
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('p', { children: 'Is versions Valid:' }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: JSON.stringify(isValid() ?? null, null, 2),
            }),
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('p', { children: 'MiniKit.user:' }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: JSON.stringify(MiniKit.user ?? null, null, 2),
            }),
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('p', { children: 'Device Properties:' }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: JSON.stringify(
                MiniKit.deviceProperties ?? null,
                null,
                2,
              ),
            }),
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('p', { children: 'Location:' }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: JSON.stringify(MiniKit.location ?? null, null, 2),
            }),
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('p', { children: 'App URL:' }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: JSON.stringify(
                MiniKit.getMiniAppUrl(
                  'app_dec1bff0efe878fea0011d5b8b17ce99',
                  '/test',
                ) ?? null,
                null,
                2,
              ),
            }),
          }),
        ],
      }),
      _jsxs('div', {
        children: [
          _jsx('p', { children: 'Show profile card:' }),
          _jsx('input', {
            type: 'text',
            value: username,
            onChange: (e) => setUsername(e.target.value),
            placeholder: 'Enter username',
            className: 'w-full p-2 border border-gray-300 rounded-lg mb-2',
          }),
          _jsx('button', {
            className: clsx(
              'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
            ),
            onClick: () => MiniKit.showProfileCard(username),
            disabled: !username.trim(),
            children: 'Show Profile Card',
          }),
        ],
      }),
    ],
  });
};
