import {
  CommandContext,
  IDKit,
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
  share,
  shareContacts,
  signMessage,
  signTypedData,
  validateCommands,
  walletAuth,
} from './commands';
import type {
  ConstraintNode,
  IDKitRequest,
  IDKitRequestConfig,
  IDKitSessionConfig,
  Preset,
} from './commands';
import {
  MiniAppLaunchLocation,
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from './types';
import type {
  DeviceProperties,
  MiniKitInstallReturnType,
  User,
  UserNameService,
} from './types';
import { EventManager } from './events';
import { getUserProfile } from './helpers/usernames';
import { setupMicrophone } from './helpers/microphone';

/**
 * Builder interface for IDKit verification requests.
 * Local definition avoids DTS emit issues with IDKitBuilder's private fields.
 * Note: `constraints()` is optional — available when IDKit enables it (v4.0+).
 */
interface IDKitVerifyBuilder {
  preset(preset: Preset): Promise<IDKitRequest>;
  constraints?(constraints: ConstraintNode): Promise<IDKitRequest>;
}

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
   * Create a World ID verification request (delegates to IDKit)
   *
   * Works in both World App (native postMessage) and web (QR + polling).
   * Transport detection happens automatically inside the builder.
   *
   * @example
   * ```typescript
   * import { MiniKit, orbLegacy, CredentialRequest, any } from '@worldcoin/minikit-js';
   *
   * // With preset (legacy support)
   * const request = await MiniKit.request({
   *   app_id: 'app_xxx',
   *   action: 'login',
   *   rp_context: { ... },
   *   allow_legacy_proofs: true,
   * }).preset(orbLegacy({ signal: 'user-123' }));
   *
   * // With constraints (v4 only)
   * const request = await MiniKit.request({
   *   app_id: 'app_xxx',
   *   action: 'login',
   *   rp_context: { ... },
   *   allow_legacy_proofs: false,
   * }).constraints(any(CredentialRequest('orb'), CredentialRequest('device')));
   *
   * // In World App: connectorURI is empty, result via postMessage
   * // On web: connectorURI is QR URL
   * console.log(request.connectorURI);
   * const result = await request.pollUntilCompletion();
   * ```
   */
  static request(config: IDKitRequestConfig): IDKitVerifyBuilder {
    return IDKit.request(config);
  }

  /**
   * Create a new session (delegates to IDKit)
   */
  static createSession(config: IDKitSessionConfig): IDKitVerifyBuilder {
    return IDKit.createSession(config);
  }

  /**
   * Prove an existing session (delegates to IDKit)
   */
  static proveSession(
    sessionId: string,
    config: IDKitSessionConfig,
  ): IDKitVerifyBuilder {
    return IDKit.proveSession(sessionId, config);
  }

  /**
   * Authenticate user via wallet signature (SIWE)
   *
   * Works in World App (native SIWE) and web (Wagmi + SIWE fallback).
   *
   * @example
   * ```typescript
   * const result = await MiniKit.walletAuth({ nonce: 'random-nonce' });
   * console.log(result.data.address);
   * console.log(result.via); // 'minikit' | 'wagmi' | 'fallback'
   * ```
   */
  static walletAuth(...args: Parameters<typeof walletAuth>) {
    return walletAuth(args[0], this.getContext());
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
   *   transaction: [{
   *     address: '0x...',
   *     abi: ContractABI,
   *     functionName: 'mint',
   *     args: [],
   *   }],
   * });
   * ```
   */
  static sendTransaction(...args: Parameters<typeof sendTransaction>) {
    return sendTransaction(args[0], this.getContext());
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
  static pay(...args: Parameters<typeof pay>) {
    return pay(args[0], this.getContext());
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
  static shareContacts(...args: Parameters<typeof shareContacts>) {
    return shareContacts(args[0], this.getContext());
  }

  /**
   * Sign a message
   */
  static signMessage(...args: Parameters<typeof signMessage>) {
    return signMessage(args[0], this.getContext());
  }

  /**
   * Sign typed data (EIP-712)
   */
  static signTypedData(...args: Parameters<typeof signTypedData>) {
    return signTypedData(args[0], this.getContext());
  }

  /**
   * Send a chat message
   */
  static chat(...args: Parameters<typeof chat>) {
    return chat(args[0], this.getContext());
  }

  /**
   * Share files/text/URL
   */
  static share(...args: Parameters<typeof share>) {
    return share(args[0], this.getContext());
  }

  /**
   * Get current permission settings
   */
  static getPermissions() {
    return getPermissions(this.getContext());
  }

  /**
   * Request a permission from the user
   */
  static requestPermission(...args: Parameters<typeof requestPermission>) {
    return requestPermission(args[0], this.getContext());
  }

  /**
   * Trigger haptic feedback
   */
  static sendHapticFeedback(...args: Parameters<typeof sendHapticFeedback>) {
    return sendHapticFeedback(args[0], this.getContext());
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
      // VerifyAction processing (error normalization, proof compression) is
      // handled centrally in EventManager.trigger()
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
      console.error(
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
   * - `MiniKit.commands.verify(payload)` → `await MiniKit.request(config).preset(...)`
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
