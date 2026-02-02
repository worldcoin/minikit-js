import { VerificationLevel } from '@worldcoin/idkit-core';
import {
  AsyncCommands,
  CommandContext,
  Commands,
  createAsyncCommands,
  createCommands,
  MiniAppVerifyActionPayload,
  MiniAppWalletAuthPayload,
  ResponseEvent,
  validateCommands,
  VerificationErrorCodes,
} from './commands';
import { MiniKitInstallReturnType } from './commands/types';
import { EventManager } from './core/events';
import { MiniKitState } from './core/state';
import { setupMicrophone } from './helpers/microphone';
import { compressAndPadProof } from './helpers/proof';
import { sendWebviewEvent } from './helpers/send-webview-event';
import {
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from './types/errors';
import { UserNameService } from './types/init';

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
    }
    // Special handling for VerifyAction - normalize errors and compress proofs
    else if (event === ResponseEvent.MiniAppVerifyAction) {
      const originalHandler = handler;
      const wrappedHandler = (payload: MiniAppVerifyActionPayload) => {
        // Align error codes on iOS and Android
        if (
          payload.status === 'error' &&
          (payload.error_code as string) === 'user_rejected'
        ) {
          payload.error_code = VerificationErrorCodes.VerificationRejected;
        }

        if (
          payload.status === 'success' &&
          payload.verification_level === VerificationLevel.Orb
        ) {
          compressAndPadProof(payload.proof as `0x${string}`).then(
            (compressedProof) => {
              payload.proof = compressedProof;
              originalHandler(payload);
            },
          );
        } else {
          originalHandler(payload);
        }
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
