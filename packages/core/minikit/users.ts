import { getUserProfile } from 'helpers/usernames';
import { UserNameService } from 'types/init';

import { state } from './state';

export const getUserByAddress = async (
  address?: string,
): Promise<UserNameService> => {
  const resolvedAddress = address ?? state.user.walletAddress!;
  const userProfile = await getUserProfile(resolvedAddress);

  return {
    walletAddress: resolvedAddress,
    username: userProfile.username,
    profilePictureUrl: userProfile.profile_picture_url,
  };
};

export const getUserByUsername = async (
  username: string,
): Promise<UserNameService> => {
  const res = await fetch(`https://usernames.worldcoin.org/api/v1/${username}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const user = await res.json();
  return {
    walletAddress: user.address,
    username: user.username,
    profilePictureUrl: user.profile_picture_url,
  };
};

export const getUserInfo = getUserByAddress;
