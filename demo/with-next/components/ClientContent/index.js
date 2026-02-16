'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import { UsernameSearch } from '@worldcoin/minikit-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { CameraComponent } from './Camera';
import { Chat } from './Chat';
import CheckRequests from './CheckRequests';
import { ExternalLinks } from './ExternalLinks';
import { GetPermissions } from './GetPermissions';
import { Nav } from './Nav';
import { Pay } from './Pay';
import { RequestPermission } from './RequestPermissions';
import { SearchParams } from './SearchParams';
import { SendHapticFeedback } from './SendHaptic';
import { Share } from './Share';
import { ShareContacts } from './ShareContacts';
import { SignMessage } from './SignMessage';
import { SignTypedData } from './SignTypedMessage';
import { SendTransaction } from './Transaction';
import { User } from './User';
import { VerifyAction } from './VerifyAction';
import { WalletAuth } from './WalletAuth';
const VersionsNoSSR = dynamic(
  () => import('./Versions').then((comp) => comp.Versions),
  { ssr: false },
);
export const ClientContent = () => {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState();
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  const handleChange = (e) => {
    setSearchValue(e.target.value);
  };
  const sendNotification = async () => {
    if (!MiniKit.user?.walletAddress) {
      console.error('No wallet address found, do wallet auth first');
      return;
    }
    const response = await fetch(`/api/notifications`, {
      method: 'POST',
      body: JSON.stringify({
        walletAddress: MiniKit.user?.walletAddress ?? '',
      }),
    });
    const data = await response.json();
    console.log(data);
  };
  return _jsxs('div', {
    className: 'p-2 lg:p-8 grid content-start min-h-[100dvh] gap-y-2',
    children: [
      _jsx(Nav, {}),
      _jsx('hr', {}),
      _jsxs('div', {
        className: 'grid gap-y-4 content-start',
        children: [
          _jsx(User, {}),
          _jsx('hr', {}),
          _jsx(UsernameSearch, {
            value: searchValue,
            handleChange: handleChange,
            setSearchedUsernames: setSearchResults,
            className: 'p-2 border rounded',
            inputProps: {
              placeholder: 'Search usernames...',
            },
          }),
          searchResults &&
            _jsx('div', {
              className: 'mt-4',
              children:
                searchResults.status === 200
                  ? _jsx('ul', {
                      children: searchResults.data?.map((user) =>
                        _jsxs(
                          'li',
                          {
                            className:
                              'grid grid-cols-[auto_1fr] gap-x-2 items-center',
                            children: [
                              user.profile_picture_url &&
                                _jsx(Image, {
                                  src: user.profile_picture_url,
                                  alt: user.username,
                                  width: 32,
                                  height: 32,
                                  className: 'w-10 h-10 rounded-full',
                                }),
                              user.username,
                              ' - ',
                              user.address,
                            ],
                          },
                          user.address,
                        ),
                      ),
                    })
                  : _jsxs('p', { children: ['Error: ', searchResults.error] }),
            }),
          _jsxs('div', {
            className: 'grid gap-y-8',
            children: [
              isProduction &&
                _jsx('button', {
                  className: 'bg-black text-white p-2 rounded-lg',
                  onClick: sendNotification,
                  children:
                    'Send Notification (auth and turn on notifications first)',
                }),
              _jsx(SearchParams, {}),
              _jsx(VersionsNoSSR, {}),
              _jsx('hr', {}),
              _jsx(VerifyAction, {}),
              _jsx('hr', {}),
              _jsx(Pay, {}),
              _jsx('hr', {}),
              _jsx(WalletAuth, {}),
              _jsx('hr', {}),
              _jsx(SendTransaction, {}),
              _jsx('hr', {}),
              _jsx(SignMessage, {}),
              _jsx('hr', {}),
              _jsx(SignTypedData, {}),
              _jsx('hr', {}),
              _jsx(ShareContacts, {}),
              _jsx('hr', {}),
              _jsx(RequestPermission, {}),
              _jsx('hr', {}),
              _jsx(GetPermissions, {}),
              _jsx('hr', {}),
              _jsx(CheckRequests, {}),
              _jsx('hr', {}),
              _jsx(SendHapticFeedback, {}),
              _jsx('hr', {}),
              _jsx(Share, {}),
              _jsx('hr', {}),
              _jsx(Chat, {}),
              _jsx('hr', {}),
              _jsx('input', { className: 'text-xs border-black border-2' }),
              _jsx(ExternalLinks, {}),
              _jsx('hr', {}),
              _jsx(CameraComponent, {}),
              _jsx('hr', {}),
            ],
          }),
        ],
      }),
    ],
  });
};
