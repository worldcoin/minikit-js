import {
  AsyncCommands,
  CommandContext,
  Commands,
  createAsyncCommands,
  createCommands,
  MiniAppWalletAuthPayload,
  ResponseEvent,
  validateCommands,
} from './commands';
import { MiniKitInstallReturnType } from './commands/types';
import { EventManager } from './events';
import { MiniKitState } from './state';
import { setupMicrophone } from './helpers/microphone';
import { sendWebviewEvent } from './helpers/send-webview-event';
import {
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from './types/errors';
import { UserNameService } from './types/init';

// Unified API imports
import type {
  ConstraintNode,
  IDKitRequest,
  IDKitRequestConfig,
  IDKitSessionConfig,
  Preset,
} from '@worldcoin/idkit-core';
import { IDKit, isInWorldApp } from '@worldcoin/idkit-core';
import {
  pay,
  sendTransaction,
  shareContacts,
  walletAuth,
} from './commands';

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
export type { MiniKitInstallReturnType } from './commands/types';

const MINIKIT_VERSION = 1;
const MINIKIT_MINOR_VERSION = 96;

export const sendMiniKitEvent = <T extends Record<string, any>>(payload: T) => {
  sendWebviewEvent(payload);
};

export class MiniKit {
  private static eventManager = new EventManager();
  private static stateManager = new MiniKitState();
  private static commandsInstance: Commands | null = null;
  private static asyncCommandsInstance: AsyncCommands | null = null;

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
  static walletAuth = walletAuth;

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
  static sendTransaction = sendTransaction;

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
  static pay = pay;

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
  static shareContacts = shareContacts;

  /**
   * Check if running inside World App
   */
  static isInWorldApp = isInWorldApp;

  // ============================================================================
  // Public State Accessors
  // ============================================================================

  public static get appId(): string | null {
    return this.stateManager.appId;
  }

  public static set appId(value: string | null) {
    this.stateManager.appId = value;
  }

  public static get user() {
    return this.stateManager.user;
  }

  public static set user(value: typeof MiniKit.stateManager.user) {
    this.stateManager.user = value;
  }

  public static get deviceProperties() {
    return this.stateManager.deviceProperties;
  }

  public static get location() {
    return this.stateManager.location;
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
          await this.stateManager.updateUserFromWalletAuth(payload.address);
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
    sendWebviewEvent({
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
      this.stateManager.appId = appId;
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
    this.stateManager.initFromWorldApp(window.WorldApp);

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

    this.stateManager.isReady = true;
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
    const isInstalled = this.stateManager.isReady && Boolean(window.MiniKit);
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
  // Commands
  // ============================================================================

  private static getContext(): CommandContext {
    return {
      events: this.eventManager,
      state: this.stateManager,
    };
  }

  public static get commands(): Commands {
    if (!this.commandsInstance) {
      this.commandsInstance = createCommands(this.getContext());
    }
    return this.commandsInstance;
  }

  public static get commandsAsync(): AsyncCommands {
    if (!this.asyncCommandsInstance) {
      this.asyncCommandsInstance = createAsyncCommands(
        this.getContext(),
        this.commands,
      );
    }
    return this.asyncCommandsInstance;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  public static getUserByAddress = async (
    address?: string,
  ): Promise<UserNameService> => {
    return this.stateManager.getUserByAddress(address);
  };

  public static getUserByUsername = async (
    username: string,
  ): Promise<UserNameService> => {
    return this.stateManager.getUserByUsername(username);
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
}
