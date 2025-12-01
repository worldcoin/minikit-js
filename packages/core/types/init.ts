export type User = {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  permissions?: {
    notifications: boolean;
    contacts: boolean;
  };
  // verificationStatus: {
  //   orb: {
  //     isVerified: boolean;
  //     verifiedUntil: number;
  //   };
  //   device: {
  //     isVerified: boolean;
  //     verifiedUntil: number;
  //   };
  // };
  optedIntoOptionalAnalytics?: boolean;
  /** @deprecated Moved to DeviceProperties */
  worldAppVersion?: number;
  /** @deprecated Moved to DeviceProperties */
  deviceOS?: string;
};

export type DeviceProperties = {
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  deviceOS?: string;
  worldAppVersion?: number;
};

export type UserNameService = {
  walletAddress: string;
  username?: string;
  profilePictureUrl?: string;
};

export type MiniAppLocation = {
  countryCode?: string;
  regionCode?: string;
};

export enum MiniAppLaunchLocation {
  Chat = 'chat',
  Home = 'home',
  AppStore = 'app-store',
  DeepLink = 'deep-link',
  WalletTab = 'wallet-tab',
}

const WORLD_APP_LAUNCH_LOCATION_MAP: Record<string, MiniAppLaunchLocation> = {
  'app-store': MiniAppLaunchLocation.AppStore,
  carousel: MiniAppLaunchLocation.AppStore,
  explore: MiniAppLaunchLocation.AppStore,
  app_details: MiniAppLaunchLocation.AppStore,
  deeplink: MiniAppLaunchLocation.DeepLink,
  homepage: MiniAppLaunchLocation.Home,
  wallet_tab: MiniAppLaunchLocation.WalletTab,
  world_chat: MiniAppLaunchLocation.Chat,
};

export const mapWorldAppLaunchLocation = (
  location: string | null | undefined,
): MiniAppLaunchLocation | null => {
  if (!location || typeof location !== 'string') return null;
  console.log('MiniKit launch location mapped:', location);

  const normalizedLocation = location.toLowerCase();

  return WORLD_APP_LAUNCH_LOCATION_MAP[normalizedLocation] ?? null;
};
