'use client';
import { CircularIcon, Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckCircleSolid } from 'iconoir-react';
import { useSession } from 'next-auth/react';

/**
 * Minikit is only available on client side. Thus user info needs to be rendered on client side.
 * UserInfo component displays user information including profile picture, username, and verification status.
 * It uses the Marble component from the mini-apps-ui-kit-react library to display the profile picture.
 * The component is client-side rendered.
 */
export const UserInfo = () => {
  // Fetching the user state client side
  const session = useSession();

  return (
    <div className="flex flex-row items-center justify-start gap-4 rounded-xl w-full border-2 border-gray-200 p-4">
      <Marble src={session?.data?.user?.profilePictureUrl} className="w-14" />
      <div className="flex flex-row items-center justify-center">
        <span className="text-lg font-semibold capitalize">
          {session?.data?.user?.username}
        </span>
        {session?.data?.user?.profilePictureUrl && (
          <CircularIcon size="sm" className="ml-0">
            <CheckCircleSolid className="text-blue-600" />
          </CircularIcon>
        )}
      </div>
    </div>
  );
};
