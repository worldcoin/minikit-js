'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import {
  GetSearchedUsernameResult,
  UsernameSearch,
} from '@worldcoin/minikit-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState } from 'react';
import { CameraComponent } from './Camera';
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
  const [searchResults, setSearchResults] =
    useState<GetSearchedUsernameResult>();
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  return (
    <div className="p-2 lg:p-8 grid content-start min-h-[100dvh] gap-y-2">
      <Nav />
      <hr />

      <div className="grid gap-y-4 content-start">
        <User />
        <hr />

        <UsernameSearch
          value={searchValue}
          handleChange={handleChange}
          setSearchedUsernames={setSearchResults}
          className="p-2 border rounded"
          inputProps={{
            placeholder: 'Search usernames...',
          }}
        />

        {/* Display search results */}
        {searchResults && (
          <div className="mt-4">
            {searchResults.status === 200 ? (
              <ul>
                {searchResults.data?.map((user) => (
                  <li
                    key={user.address}
                    className="grid grid-cols-[auto_1fr] gap-x-2 items-center"
                  >
                    {user.profile_picture_url && (
                      <Image
                        src={user.profile_picture_url}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    {user.username} - {user.address}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Error: {searchResults.error}</p>
            )}
          </div>
        )}

        <div className="grid gap-y-8">
          {isProduction && (
            <button
              className="bg-black text-white p-2 rounded-lg"
              onClick={sendNotification}
            >
              Send Notification (auth and turn on notifications first)
            </button>
          )}
          <SearchParams />
          <VersionsNoSSR />
          <hr />
          <VerifyAction />
          <hr />
          <Pay />
          <hr />
          <WalletAuth />
          <hr />
          <SendTransaction />
          <hr />
          <SignMessage />
          <hr />
          <SignTypedData />
          <hr />
          <ShareContacts />
          <hr />
          <RequestPermission />
          <hr />
          <GetPermissions />
          <hr />
          <CheckRequests />
          <hr />
          <SendHapticFeedback />
          <hr />
          <Share />
          <hr />
          <input className="text-xs border-black border-2" />
          <ExternalLinks />
          <hr />
          <CameraComponent />
          <hr />
        </div>
      </div>
    </div>
  );
};
