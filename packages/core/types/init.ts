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
