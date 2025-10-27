import { setupMicrophone } from 'helpers/microphone';
import { sendWebviewEvent } from 'helpers/send-webview-event';
import {
  MiniKitInstallReturnType,
  WebViewBasePayload,
} from 'types/commands';
import {
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from 'types/errors';
import {
  DeviceProperties,
  MiniAppLaunchLocation,
  User,
} from 'types/init';

import { commands } from './minikit/commands';
import { commandsAsync } from './minikit/async-commands';
import { syncCommandAvailability } from './minikit/command-support';
import { MINIKIT_MINOR_VERSION, MINIKIT_VERSION } from './minikit/constants';
import { sendMiniKitEvent } from './minikit/send-event';
import { resetCommandAvailability, state } from './minikit/state';
import { subscribe, trigger, unsubscribe } from './minikit/subscriptions';
import {
  getUserByAddress,
  getUserByUsername,
  getUserInfo,
} from './minikit/users';

export { sendMiniKitEvent } from './minikit/send-event';

export class MiniKit {
  private static readonly MINIKIT_VERSION = MINIKIT_VERSION;
  private static readonly MINIKIT_MINOR_VERSION = MINIKIT_MINOR_VERSION;

  public static get appId(): string | null {
    return state.appId;
  }

  public static set appId(value: string | null) {
    state.appId = value;
  }

  public static get user(): User {
    return state.user;
  }

  public static set user(value: User) {
    state.user = value;
  }

  public static get deviceProperties(): DeviceProperties {
    return state.deviceProperties;
  }

  public static set deviceProperties(value: DeviceProperties) {
    state.deviceProperties = value;
  }

  public static get location(): MiniAppLaunchLocation | null {
    return state.location;
  }

  public static set location(value: MiniAppLaunchLocation | null) {
    state.location = value;
  }

  private static get isReady(): boolean {
    return state.isReady;
  }

  private static set isReady(value: boolean) {
    state.isReady = value;
  }

  private static sendInit() {
    sendWebviewEvent({
      command: 'init',
      payload: {
        version: this.MINIKIT_VERSION,
        minorVersion: this.MINIKIT_MINOR_VERSION,
      },
    });
  }

  public static readonly commands = commands;
  public static readonly commandsAsync = commandsAsync;

  public static subscribe = subscribe;
  public static unsubscribe = unsubscribe;
  public static trigger = trigger;

  public static getUserByAddress = getUserByAddress;
  public static getUserByUsername = getUserByUsername;
  public static getUserInfo = getUserInfo;

  public static install(appId?: string): MiniKitInstallReturnType {
    if (typeof window === 'undefined' || Boolean(window.MiniKit)) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.AlreadyInstalled,
        errorMessage:
          MiniKitInstallErrorMessage[
            MiniKitInstallErrorCodes.AlreadyInstalled
          ],
      };
    }

    if (!appId) {
      console.warn('App ID not provided during install');
    } else {
      MiniKit.appId = appId;
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

    // Set user properties
    MiniKit.user = {
      ...MiniKit.user,
      optedIntoOptionalAnalytics: window.WorldApp.is_optional_analytics,
      deviceOS: window.WorldApp.device_os,
      worldAppVersion: window.WorldApp.world_app_version,
    };

    // Set device properties
    MiniKit.deviceProperties = {
      ...MiniKit.deviceProperties,
      safeAreaInsets: window.WorldApp.safe_area_insets,
      deviceOS: window.WorldApp.device_os,
      worldAppVersion: window.WorldApp.world_app_version,
    };

    // Set launch location
    MiniKit.location = window.WorldApp.location;

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

    resetCommandAvailability();

    MiniKit.isReady = true;
    setupMicrophone();

    if (!syncCommandAvailability(window.WorldApp.supported_commands)) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.AppOutOfDate,
        errorMessage:
          MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AppOutOfDate],
      };
    }

    return { success: true };
  }

  public static isInstalled(debug?: boolean) {
    const isInstalled = MiniKit.isReady && Boolean(window.MiniKit);
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
}
