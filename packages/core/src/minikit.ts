import {
  CommandContext,
  MiniAppWalletAuthPayload,
  ResponseEvent,
  chat,
  getPermissions,
  isInWorldApp,
  pay,
  requestPermission,
  sendHapticFeedback,
  sendMiniKitEvent,
  sendTransaction,
  share as runShare,
  shareContacts,
  signMessage,
  signTypedData,
  validateCommands,
  walletAuth,
} from './commands';
import type {
  MiniKitChatOptions,
  CommandResultByVia,
  MiniKitGetPermissionsOptions,
  MiniAppChatSuccessPayload,
  MiniAppGetPermissionsSuccessPayload,
  MiniAppRequestPermissionSuccessPayload,
  MiniAppSendHapticFeedbackSuccessPayload,
  MiniAppShareSuccessPayload,
  MiniAppSignMessageSuccessPayload,
  MiniAppSignTypedDataSuccessPayload,
  MiniKitSignMessageOptions,
  MiniKitSignTypedDataOptions,
  MiniKitPayOptions,
  PayResult,
  MiniKitRequestPermissionOptions,
  MiniKitSendHapticFeedbackOptions,
  MiniKitSendTransactionOptions,
  SendTransactionResult,
  MiniKitShareContactsOptions,
  ShareContactsResult,
  MiniKitShareOptions,
  MiniKitWalletAuthOptions,
  WalletAuthResult,
} from './commands';
import { EventManager } from './events';
import { setupMicrophone } from './helpers/microphone';
import { getUserProfile } from './helpers/usernames';
import type {
  DeviceProperties,
  MiniKitInstallReturnType,
  User,
  UserNameService,
} from './types';
import {
  MiniAppLaunchLocation,
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from './types';

// Re-export for backwards compatibility
export type { MiniKitInstallReturnType } from './types';

const MINIKIT_VERSION = 1;
const MINIKIT_MINOR_VERSION = 96;

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

function mapWorldAppLaunchLocation(
  location: string | null | undefined,
): MiniAppLaunchLocation | null {
  if (!location || typeof location !== 'string') return null;
  console.log('MiniKit launch location mapped:', location);
  return WORLD_APP_LAUNCH_LOCATION_MAP[location.toLowerCase()] ?? null;
}

export class MiniKit {
  private static eventManager = new EventManager();

  // State (was MiniKitState)
  private static _appId: string | null = null;
  private static _user: User = {};
  private static _deviceProperties: DeviceProperties = {};
  private static _location: MiniAppLaunchLocation | null = null;
  private static _isReady: boolean = false;

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
  static walletAuth<TFallback = WalletAuthResult>(
    options: MiniKitWalletAuthOptions<TFallback>,
  ): Promise<CommandResultByVia<WalletAuthResult, TFallback>> {
    return walletAuth<TFallback>(options, this.getContext());
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
  static sendTransaction<TFallback = SendTransactionResult>(
    options: MiniKitSendTransactionOptions<TFallback>,
  ): Promise<CommandResultByVia<SendTransactionResult, TFallback>> {
    return sendTransaction<TFallback>(options, this.getContext());
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
  static pay<TFallback = PayResult>(
    options: MiniKitPayOptions<TFallback>,
  ): Promise<CommandResultByVia<PayResult, TFallback, 'minikit'>> {
    return pay<TFallback>(options, this.getContext());
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
  static shareContacts<TFallback = ShareContactsResult>(
    options: MiniKitShareContactsOptions<TFallback> = {},
  ): Promise<CommandResultByVia<ShareContactsResult, TFallback, 'minikit'>> {
    return shareContacts<TFallback>(options, this.getContext());
  }

  /**
   * Sign a message
   */
  static signMessage<TFallback = MiniAppSignMessageSuccessPayload>(
    options: MiniKitSignMessageOptions<TFallback>,
  ): Promise<CommandResultByVia<MiniAppSignMessageSuccessPayload, TFallback>> {
    return signMessage<TFallback>(options, this.getContext());
  }

  /**
   * Sign typed data (EIP-712)
   */
  static signTypedData<TFallback = MiniAppSignTypedDataSuccessPayload>(
    options: MiniKitSignTypedDataOptions<TFallback>,
  ): Promise<CommandResultByVia<MiniAppSignTypedDataSuccessPayload, TFallback>> {
    return signTypedData<TFallback>(options, this.getContext());
  }

  /**
   * Send a chat message
   */
  static chat<TFallback = MiniAppChatSuccessPayload>(
    options: MiniKitChatOptions<TFallback>,
  ): Promise<CommandResultByVia<MiniAppChatSuccessPayload, TFallback, 'minikit'>> {
    return chat<TFallback>(options, this.getContext());
  }

  /**
   * Share files/text/URL
   */
  static share<TFallback = MiniAppShareSuccessPayload>(
    options: MiniKitShareOptions<TFallback>,
  ): Promise<
    CommandResultByVia<MiniAppShareSuccessPayload, TFallback, 'minikit'>
  > {
    return runShare<TFallback>(options, this.getContext());
  }

  /**
   * Get current permission settings
   */
  static getPermissions<TFallback = MiniAppGetPermissionsSuccessPayload>(
    options: MiniKitGetPermissionsOptions<TFallback> = {},
  ): Promise<
    CommandResultByVia<
      MiniAppGetPermissionsSuccessPayload,
      TFallback,
      'minikit'
    >
  > {
    return getPermissions<TFallback>(options, this.getContext());
  }

  /**
   * Request a permission from the user
   */
  static requestPermission<
    TFallback = MiniAppRequestPermissionSuccessPayload,
  >(
    options: MiniKitRequestPermissionOptions<TFallback>,
  ): Promise<
    CommandResultByVia<
      MiniAppRequestPermissionSuccessPayload,
      TFallback,
      'minikit'
    >
  > {
    return requestPermission<TFallback>(options, this.getContext());
  }

  /**
   * Trigger haptic feedback
   */
  static sendHapticFeedback<
    TFallback = MiniAppSendHapticFeedbackSuccessPayload,
  >(
    options: MiniKitSendHapticFeedbackOptions<TFallback>,
  ): Promise<
    CommandResultByVia<
      MiniAppSendHapticFeedbackSuccessPayload,
      TFallback,
      'minikit'
    >
  > {
    return sendHapticFeedback<TFallback>(options, this.getContext());
  }

  /**
   * Check if running inside World App
   */
  static isInWorldApp = isInWorldApp;

  // ============================================================================
  // Public State Accessors
  // ============================================================================

  public static get appId(): string | null {
    return this._appId;
  }

  public static set appId(value: string | null) {
    this._appId = value;
  }

  public static get user() {
    return this._user;
  }

  public static set user(value: User) {
    this._user = value;
  }

  public static get deviceProperties() {
    return this._deviceProperties;
  }

  public static get location() {
    return this._location;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  public static subscribe<E extends ResponseEvent>(
    event: E,
    handler: (payload: any) => void,
  ) {
    // Special handling for WalletAuth - update user state on success
    if (event === ResponseEvent.MiniAppWalletAuth) {
      const originalHandler = handler;
      const wrappedHandler = async (payload: MiniAppWalletAuthPayload) => {
        if (payload.status === 'success') {
          await this.updateUserFromWalletAuth(payload.address);
        }
        originalHandler(payload);
      };
      this.eventManager.subscribe(event, wrappedHandler as any);
    } else {
      this.eventManager.subscribe(event, handler);
    }
  }

  public static unsubscribe(event: ResponseEvent) {
    this.eventManager.unsubscribe(event);
  }

  public static trigger(event: ResponseEvent, payload: any) {
    this.eventManager.trigger(event, payload);
  }

  // ============================================================================
  // Installation
  // ============================================================================

  private static sendInit() {
    sendMiniKitEvent({
      command: 'init',
      payload: {
        version: MINIKIT_VERSION,
        minorVersion: MINIKIT_MINOR_VERSION,
      },
    });
  }

  public static install(appId?: string): MiniKitInstallReturnType {
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
      window.MiniKit = MiniKit;
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

  public static isInstalled(debug?: boolean): boolean {
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

  private static initFromWorldApp(worldApp: typeof window.WorldApp): void {
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

  private static async updateUserFromWalletAuth(
    address: string,
  ): Promise<void> {
    this._user.walletAddress = address;
    try {
      const userProfile = await getUserProfile(address);
      this._user.username = userProfile.username;
      this._user.profilePictureUrl = userProfile.profile_picture_url;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  }

  private static getContext(): CommandContext {
    return {
      events: this.eventManager,
      state: { deviceProperties: this._deviceProperties },
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  public static getUserByAddress = async (
    address?: string,
  ): Promise<UserNameService> => {
    const walletAddress = address ?? this._user.walletAddress!;
    const userProfile = await getUserProfile(walletAddress);

    return {
      walletAddress,
      username: userProfile.username,
      profilePictureUrl: userProfile.profile_picture_url,
    };
  };

  public static getUserByUsername = async (
    username: string,
  ): Promise<UserNameService> => {
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

  public static getUserInfo = MiniKit.getUserByAddress;

  public static getMiniAppUrl = (appId: string, path?: string): string => {
    const baseUrl = new URL('https://world.org/mini-app');
    baseUrl.searchParams.append('app_id', appId);
    if (path) {
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      baseUrl.searchParams.append('path', encodeURIComponent(fullPath));
    }
    return baseUrl.toString();
  };

  public static showProfileCard = (
    username?: string,
    walletAddress?: string,
  ): void => {
    if (!username && !walletAddress) {
      console.error(
        'Either username or walletAddress must be provided to show profile card',
      );
      return;
    }
    if (username) {
      window.open(
        `worldapp://profile?username=${encodeURIComponent(username)}`,
      );
    } else {
      window.open(
        `worldapp://profile?address=${encodeURIComponent(walletAddress || '')}`,
      );
    }
  };

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
  static get commands(): never {
    throw new Error(
      'MiniKit.commands has been removed. Use MiniKit.pay(), MiniKit.walletAuth(), etc. directly.',
    );
  }

  /**
   * @deprecated Use `MiniKit.pay()`, `MiniKit.walletAuth()`, etc. directly. All commands are now async by default.
   *
   * See `MiniKit.commands` deprecation notice for the full migration guide.
   */
  static get commandsAsync(): never {
    throw new Error(
      'MiniKit.commandsAsync has been removed. Use MiniKit.pay(), MiniKit.walletAuth(), etc. directly.',
    );
  }
}
