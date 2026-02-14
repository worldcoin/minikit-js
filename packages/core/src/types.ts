// ============================================================================
// Core Domain Types
// ============================================================================

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

// ============================================================================
// Install
// ============================================================================

export enum MiniKitInstallErrorCodes {
  Unknown = 'unknown',
  AlreadyInstalled = 'already_installed',
  OutsideOfWorldApp = 'outside_of_worldapp',
  NotOnClient = 'not_on_client',
  AppOutOfDate = 'app_out_of_date',
}

export const MiniKitInstallErrorMessage = {
  [MiniKitInstallErrorCodes.Unknown]: 'Failed to install MiniKit.',
  [MiniKitInstallErrorCodes.AlreadyInstalled]: 'MiniKit is already installed.',
  [MiniKitInstallErrorCodes.OutsideOfWorldApp]:
    'MiniApp launched outside of WorldApp.',
  [MiniKitInstallErrorCodes.NotOnClient]: 'Window object is not available.',
  [MiniKitInstallErrorCodes.AppOutOfDate]:
    'WorldApp is out of date. Please update the app.',
};

export type MiniKitInstallReturnType =
  | { success: true }
  | {
      success: false;
      errorCode: MiniKitInstallErrorCodes;
      errorMessage: (typeof MiniKitInstallErrorMessage)[MiniKitInstallErrorCodes];
    };
