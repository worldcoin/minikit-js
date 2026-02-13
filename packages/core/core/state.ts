import { getUserProfile } from '../helpers/usernames';
import {
  DeviceProperties,
  mapWorldAppLaunchLocation,
  MiniAppLaunchLocation,
  User,
  UserNameService,
} from '../types/init';

export class MiniKitState {
  appId: string | null = null;
  user: User = {};
  deviceProperties: DeviceProperties = {};
  location: MiniAppLaunchLocation | null = null;
  isReady: boolean = false;

  initFromWorldApp(worldApp: typeof window.WorldApp): void {
    if (!worldApp) return;

    // Set user properties
    this.user.optedIntoOptionalAnalytics = worldApp.is_optional_analytics;
    this.user.preferredCurrency = worldApp.preferred_currency;
    this.user.deviceOS = worldApp.device_os;
    this.user.worldAppVersion = worldApp.world_app_version;

    // Set device properties
    this.deviceProperties.safeAreaInsets = worldApp.safe_area_insets;
    this.deviceProperties.deviceOS = worldApp.device_os;
    this.deviceProperties.worldAppVersion = worldApp.world_app_version;

    // Set launch location
    this.location = mapWorldAppLaunchLocation(worldApp.location);
  }

  async updateUserFromWalletAuth(address: string): Promise<void> {
    this.user.walletAddress = address;
    try {
      const userProfile = await getUserProfile(address);
      this.user.username = userProfile.username;
      this.user.profilePictureUrl = userProfile.profile_picture_url;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }

  async getUserByAddress(address?: string): Promise<UserNameService> {
    const walletAddress = address ?? this.user.walletAddress!;
    const userProfile = await getUserProfile(walletAddress);

    return {
      walletAddress,
      username: userProfile.username,
      profilePictureUrl: userProfile.profile_picture_url,
    };
  }

  async getUserByUsername(username: string): Promise<UserNameService> {
    const res = await fetch(
      `https://usernames.worldcoin.org/api/v1/${username}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const user = await res.json();
    return {
      walletAddress: user.address,
      username: user.username,
      profilePictureUrl: user.profile_picture_url,
    };
  }
}
