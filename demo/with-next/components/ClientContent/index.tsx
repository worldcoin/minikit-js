'use client';

import {
  GetSearchedUsernameResult,
  UsernameSearch,
} from '@worldcoin/minikit-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState } from 'react';
import { CameraComponent } from './Camera';
import { ExternalLinks } from './ExternalLinks';
import { Nav } from './Nav';
import { Pay } from './Pay';
import { RequestPermission } from './RequestPermissions';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
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
          <input className="text-xs border-black border-2" />
          <ExternalLinks />
          <hr />
          <CameraComponent />
        </div>
      </div>
    </div>
  );
};
