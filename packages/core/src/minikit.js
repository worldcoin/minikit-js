var _a;
import {
  ResponseEvent,
  chat,
  getPermissions,
  isInWorldApp,
  pay,
  requestPermission,
  share as runShare,
  sendHapticFeedback,
  sendMiniKitEvent,
  sendTransaction,
  shareContacts,
  signMessage,
  signTypedData,
  validateCommands,
  walletAuth,
} from './commands';
import { EventManager } from './events';
import { setupMicrophone } from './helpers/microphone';
import { getUserProfile } from './helpers/usernames';
import {
  MiniAppLaunchLocation,
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from './types';
const MINIKIT_VERSION = 1;
const MINIKIT_MINOR_VERSION = 96;
const WORLD_APP_LAUNCH_LOCATION_MAP = {
  'app-store': MiniAppLaunchLocation.AppStore,
  carousel: MiniAppLaunchLocation.AppStore,
  explore: MiniAppLaunchLocation.AppStore,
  app_details: MiniAppLaunchLocation.AppStore,
  deeplink: MiniAppLaunchLocation.DeepLink,
  homepage: MiniAppLaunchLocation.Home,
  wallet_tab: MiniAppLaunchLocation.WalletTab,
  world_chat: MiniAppLaunchLocation.Chat,
};
function mapWorldAppLaunchLocation(location) {
  if (!location || typeof location !== 'string') return null;
  console.log('MiniKit launch location mapped:', location);
  return WORLD_APP_LAUNCH_LOCATION_MAP[location.toLowerCase()] ?? null;
}
export class MiniKit {
  // ============================================================================
  // Unified API (auto-detects environment)
  // ============================================================================
  /**
   * Authenticate user via wallet signature (SIWE)
   *
   * Works in World App (native SIWE) and web (Wagmi + SIWE fallback).
   *
   * @example
   * ```typescript
   * const result = await MiniKit.walletAuth({ nonce: 'randomnonce123' });
   * console.log(result.data.address);
   * console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
   * ```
   */
  static walletAuth(options) {
    return walletAuth(options, this.getContext());
  }
  /**
   * Send one or more transactions
   *
   * World App: batch + permit2 + gas sponsorship
   * Web: sequential execution via Wagmi
   *
   * @example
   * ```typescript
   * const result = await MiniKit.sendTransaction({
   *   chainId: 480,
   *   transaction: [{
   *     address: '0x...',
   *     abi: ContractABI,
   *     functionName: 'mint',
   *     args: [],
   *   }],
   * });
   * ```
   */
  static sendTransaction(options) {
    return sendTransaction(options, this.getContext());
  }
  /**
   * Send a payment (World App only)
   *
   * Requires custom fallback on web.
   *
   * @example
   * ```typescript
   * const result = await MiniKit.pay({
   *   reference: crypto.randomUUID(),
   *   to: '0x...',
   *   tokens: [{ symbol: Tokens.WLD, token_amount: '1.0' }],
   *   description: 'Payment for coffee',
   *   fallback: () => showStripeCheckout(),
   * });
   * ```
   */
  static pay(options) {
    return pay(options, this.getContext());
  }
  /**
   * Open the contact picker (World App only)
   *
   * Requires custom fallback on web.
   *
   * @example
   * ```typescript
   * const result = await MiniKit.shareContacts({
   *   isMultiSelectEnabled: true,
   *   fallback: () => showManualAddressInput(),
   * });
   * ```
   */
  static shareContacts(options = {}) {
    return shareContacts(options, this.getContext());
  }
  /**
   * Sign a message
   */
  static signMessage(options) {
    return signMessage(options, this.getContext());
  }
  /**
   * Sign typed data (EIP-712)
   */
  static signTypedData(options) {
    return signTypedData(options, this.getContext());
  }
  /**
   * Send a chat message
   */
  static chat(options) {
    return chat(options, this.getContext());
  }
  /**
   * Share files/text/URL
   */
  static share(options) {
    return runShare(options, this.getContext());
  }
  /**
   * Get current permission settings
   */
  static getPermissions(options = {}) {
    return getPermissions(options, this.getContext());
  }
  /**
   * Request a permission from the user
   */
  static requestPermission(options) {
    return requestPermission(options, this.getContext());
  }
  /**
   * Trigger haptic feedback
   */
  static sendHapticFeedback(options) {
    return sendHapticFeedback(options, this.getContext());
  }
  // ============================================================================
  // Public State Accessors
  // ============================================================================
  static get appId() {
    return this._appId;
  }
  static set appId(value) {
    this._appId = value;
  }
  static get user() {
    return this._user;
  }
  static set user(value) {
    this._user = value;
  }
  static get deviceProperties() {
    return this._deviceProperties;
  }
  static get location() {
    return this._location;
  }
  // ============================================================================
  // Event System
  // ============================================================================
  static subscribe(event, handler) {
    // Special handling for WalletAuth - update user state on success
    if (event === ResponseEvent.MiniAppWalletAuth) {
      const originalHandler = handler;
      const wrappedHandler = async (payload) => {
        if (payload.status === 'success') {
          await this.updateUserFromWalletAuth(payload.address);
        }
        originalHandler(payload);
      };
      this.eventManager.subscribe(event, wrappedHandler);
    } else {
      this.eventManager.subscribe(event, handler);
    }
  }
  static unsubscribe(event) {
    this.eventManager.unsubscribe(event);
  }
  static trigger(event, payload) {
    this.eventManager.trigger(event, payload);
  }
  // ============================================================================
  // Installation
  // ============================================================================
  static sendInit() {
    sendMiniKitEvent({
      command: 'init',
      payload: {
        version: MINIKIT_VERSION,
        minorVersion: MINIKIT_MINOR_VERSION,
      },
    });
  }
  static install(appId) {
    if (typeof window === 'undefined' || Boolean(window.MiniKit)) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.AlreadyInstalled,
        errorMessage:
          MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AlreadyInstalled],
      };
    }
    if (!appId) {
      console.warn('App ID not provided during install');
    } else {
      this._appId = appId;
    }
    if (!window.WorldApp) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.OutsideOfWorldApp,
        errorMessage:
          MiniKitInstallErrorMessage[
            MiniKitInstallErrorCodes.OutsideOfWorldApp
          ],
      };
    }
    // Initialize state from WorldApp
    this.initFromWorldApp(window.WorldApp);
    try {
      window.MiniKit = _a;
      this.sendInit();
    } catch (error) {
      console.error(
        MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.Unknown],
        error,
      );
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.Unknown,
        errorMessage:
          MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.Unknown],
      };
    }
    this._isReady = true;
    setupMicrophone();
    if (!validateCommands(window.WorldApp.supported_commands)) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.AppOutOfDate,
        errorMessage:
          MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AppOutOfDate],
      };
    }
    return { success: true };
  }
  static isInstalled(debug) {
    const isInstalled = this._isReady && Boolean(window.MiniKit);
    if (!isInstalled) {
      console.warn(
        "MiniKit is not installed. Make sure you're running the application inside of World App",
      );
    }
    if (debug && isInstalled) {
      console.log('MiniKit is alive!');
    }
    return isInstalled;
  }
  // ============================================================================
  // Internal
  // ============================================================================
  static initFromWorldApp(worldApp) {
    if (!worldApp) return;
    // Set user properties
    this._user.optedIntoOptionalAnalytics = worldApp.is_optional_analytics;
    // Set device properties
    this._deviceProperties.safeAreaInsets = worldApp.safe_area_insets;
    this._deviceProperties.deviceOS = worldApp.device_os;
    this._deviceProperties.worldAppVersion = worldApp.world_app_version;
    // Set launch location
    this._location = mapWorldAppLaunchLocation(worldApp.location);
  }
  static async updateUserFromWalletAuth(address) {
    this._user.walletAddress = address;
    try {
      const userProfile = await getUserProfile(address);
      this._user.username = userProfile.username;
      this._user.profilePictureUrl = userProfile.profile_picture_url;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }
  static getContext() {
    return {
      events: this.eventManager,
      state: { deviceProperties: this._deviceProperties },
    };
  }
  // ============================================================================
  // Deprecated — remove in next major
  // ============================================================================
  /**
   * @deprecated Use `MiniKit.pay()`, `MiniKit.walletAuth()`, etc. directly.
   *
   * Migration guide:
   * - `MiniKit.commands.pay(payload)` → `await MiniKit.pay(options)`
   * - `MiniKit.commands.walletAuth(payload)` → `await MiniKit.walletAuth(options)`
   * - `MiniKit.commands.sendTransaction(payload)` → `await MiniKit.sendTransaction(options)`
   * - `MiniKit.commands.signMessage(payload)` → `await MiniKit.signMessage(input)`
   * - `MiniKit.commands.signTypedData(payload)` → `await MiniKit.signTypedData(input)`
   * - `MiniKit.commands.shareContacts(payload)` → `await MiniKit.shareContacts(options)`
   * - `MiniKit.commands.chat(payload)` → `await MiniKit.chat(input)`
   * - `MiniKit.commands.share(payload)` → `await MiniKit.share(input)`
   * - `MiniKit.commands.getPermissions()` → `await MiniKit.getPermissions()`
   * - `MiniKit.commands.requestPermission(payload)` → `await MiniKit.requestPermission(input)`
   * - `MiniKit.commands.sendHapticFeedback(payload)` → `await MiniKit.sendHapticFeedback(input)`
   */
  static get commands() {
    throw new Error(
      'MiniKit.commands has been removed. Use MiniKit.pay(), MiniKit.walletAuth(), etc. directly.',
    );
  }
  /**
   * @deprecated Use `MiniKit.pay()`, `MiniKit.walletAuth()`, etc. directly. All commands are now async by default.
   *
   * See `MiniKit.commands` deprecation notice for the full migration guide.
   */
  static get commandsAsync() {
    throw new Error(
      'MiniKit.commandsAsync has been removed. Use MiniKit.pay(), MiniKit.walletAuth(), etc. directly.',
    );
  }
}
_a = MiniKit;
MiniKit.eventManager = new EventManager();
// State (was MiniKitState)
MiniKit._appId = null;
MiniKit._user = {};
MiniKit._deviceProperties = {};
MiniKit._location = null;
MiniKit._isReady = false;
/**
 * Check if running inside World App
 */
MiniKit.isInWorldApp = isInWorldApp;
// ============================================================================
// Utility Methods
// ============================================================================
MiniKit.getUserByAddress = async (address) => {
  const walletAddress = address ?? _a._user.walletAddress;
  const userProfile = await getUserProfile(walletAddress);
  return {
    walletAddress,
    username: userProfile.username,
    profilePictureUrl: userProfile.profile_picture_url,
  };
};
MiniKit.getUserByUsername = async (username) => {
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
};
MiniKit.getUserInfo = _a.getUserByAddress;
MiniKit.getMiniAppUrl = (appId, path) => {
  const baseUrl = new URL('https://world.org/mini-app');
  baseUrl.searchParams.append('app_id', appId);
  if (path) {
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    baseUrl.searchParams.append('path', encodeURIComponent(fullPath));
  }
  return baseUrl.toString();
};
MiniKit.showProfileCard = (username, walletAddress) => {
  if (!username && !walletAddress) {
    console.error(
      'Either username or walletAddress must be provided to show profile card',
    );
    return;
  }
  if (username) {
    window.open(`worldapp://profile?username=${encodeURIComponent(username)}`);
  } else {
    window.open(
      `worldapp://profile?address=${encodeURIComponent(walletAddress || '')}`,
    );
  }
};
