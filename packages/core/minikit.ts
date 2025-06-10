import { VerificationLevel } from '@worldcoin/idkit-core';
import { encodeAction, generateSignal } from '@worldcoin/idkit-core/hashing';
import { setupMicrophone } from 'helpers/microphone';
import { validatePaymentPayload } from 'helpers/payment/client';
import { compressAndPadProof } from 'helpers/proof';
import { formatShareInput } from 'helpers/share';
import { generateSiweMessage } from 'helpers/siwe/siwe';
import { validateWalletAuthCommandInput } from 'helpers/siwe/validate-wallet-auth-command-input';
import { validateSendTransactionPayload } from 'helpers/transaction/validate-payload';
import { getUserProfile } from 'helpers/usernames';
import {
  AsyncHandlerReturn,
  Command,
  CommandReturnPayload,
  GetPermissionsPayload,
  MiniKitInstallReturnType,
  PayCommandInput,
  PayCommandPayload,
  RequestPermissionInput,
  RequestPermissionPayload,
  SendHapticFeedbackInput,
  SendHapticFeedbackPayload,
  SendTransactionInput,
  SendTransactionPayload,
  ShareContactsPayload,
  ShareInput,
  SharePayload,
  SignMessageInput,
  SignMessagePayload,
  SignTypedDataInput,
  SignTypedDataPayload,
  VerifyCommandInput,
  VerifyCommandPayload,
  WalletAuthInput,
  WalletAuthPayload,
  WebViewBasePayload,
} from 'types/commands';
import {
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from 'types/errors';
import { Network } from 'types/payment';
import { sendWebviewEvent } from './helpers/send-webview-event';
import { DeviceProperties, User, UserNameService } from './types/init';
import {
  EventHandler,
  EventPayload,
  MiniAppGetPermissionsPayload,
  MiniAppPaymentPayload,
  MiniAppRequestPermissionPayload,
  MiniAppSendHapticFeedbackPayload,
  MiniAppSendTransactionPayload,
  MiniAppShareContactsPayload,
  MiniAppSharePayload,
  MiniAppSignMessagePayload,
  MiniAppSignTypedDataPayload,
  MiniAppVerifyActionPayload,
  MiniAppWalletAuthPayload,
  ResponseEvent,
} from './types/responses';

export const sendMiniKitEvent = <
  T extends WebViewBasePayload = WebViewBasePayload,
>(
  payload: T,
) => {
  sendWebviewEvent(payload);
};

export class MiniKit {
  private static readonly MINIKIT_VERSION = 1;
  private static readonly MINIKIT_MINOR_VERSION = 96;

  private static readonly miniKitCommandVersion: Record<Command, number> = {
    [Command.Verify]: 1,
    [Command.Pay]: 1,
    [Command.WalletAuth]: 2,
    [Command.SendTransaction]: 1,
    [Command.SignMessage]: 1,
    [Command.SignTypedData]: 1,
    [Command.ShareContacts]: 1,
    [Command.RequestPermission]: 1,
    [Command.GetPermissions]: 1,
    [Command.SendHapticFeedback]: 1,
    [Command.Share]: 1,
  };

  private static isCommandAvailable = {
    [Command.Verify]: false,
    [Command.Pay]: false,
    [Command.WalletAuth]: false,
    [Command.SendTransaction]: false,
    [Command.SignMessage]: false,
    [Command.SignTypedData]: false,
    [Command.ShareContacts]: false,
    [Command.RequestPermission]: false,
    [Command.GetPermissions]: false,
    [Command.SendHapticFeedback]: false,
    [Command.Share]: false,
  };

  private static listeners: Record<ResponseEvent, EventHandler> = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
    [ResponseEvent.MiniAppPayment]: () => {},
    [ResponseEvent.MiniAppWalletAuth]: () => {},
    [ResponseEvent.MiniAppSendTransaction]: () => {},
    [ResponseEvent.MiniAppSignMessage]: () => {},
    [ResponseEvent.MiniAppSignTypedData]: () => {},
    [ResponseEvent.MiniAppShareContacts]: () => {},
    [ResponseEvent.MiniAppRequestPermission]: () => {},
    [ResponseEvent.MiniAppGetPermissions]: () => {},
    [ResponseEvent.MiniAppSendHapticFeedback]: () => {},
    [ResponseEvent.MiniAppShare]: () => {},
    [ResponseEvent.MiniAppMicrophone]: () => {},
  };

  public static appId: string | null = null;
  public static user: User = {};
  private static isReady: boolean = false;
  public static deviceProperties: DeviceProperties = {};
  private static sendInit() {
    sendWebviewEvent({
      command: 'init',
      payload: {
        version: this.MINIKIT_VERSION,
        minorVersion: this.MINIKIT_MINOR_VERSION,
      },
    });
  }

  public static subscribe<E extends ResponseEvent>(
    event: E,
    handler: EventHandler<E>,
  ) {
    if (event === ResponseEvent.MiniAppWalletAuth) {
      const originalHandler =
        handler as EventHandler<ResponseEvent.MiniAppWalletAuth>;

      const wrappedHandler: EventHandler<
        ResponseEvent.MiniAppWalletAuth
      > = async (payload) => {
        if (payload.status === 'success') {
          MiniKit.user.walletAddress = payload.address;
          try {
            const user = await MiniKit.getUserByAddress(payload.address);
            MiniKit.user = { ...MiniKit.user, ...user };
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }
        }

        originalHandler(payload);
      };

      this.listeners[event] = wrappedHandler as EventHandler<E>;
    } else if (event === ResponseEvent.MiniAppVerifyAction) {
      const originalHandler =
        handler as EventHandler<ResponseEvent.MiniAppVerifyAction>;
      const wrappedHandler: EventHandler<ResponseEvent.MiniAppVerifyAction> = (
        payload,
      ) => {
        if (
          payload.status === 'success' &&
          payload.verification_level === VerificationLevel.Orb
        ) {
          // Note: On Chain Proofs won't work on staging with this change
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
      this.listeners[event] = wrappedHandler as EventHandler<E>;
    } else {
      this.listeners[event] = handler;
    }
  }

  public static unsubscribe(event: ResponseEvent) {
    delete this.listeners[event];
  }

  public static trigger(event: ResponseEvent, payload: EventPayload) {
    if (!this.listeners[event]) {
      console.error(
        `No handler for event ${event}, payload: ${JSON.stringify(payload)}`,
      );
      return;
    }
    this.listeners[event](payload);
  }

  private static async awaitCommand<
    E extends ResponseEvent,
    C extends Command,
    T extends EventPayload<E>,
  >(
    event: E,
    command: C,
    executor: () => CommandReturnPayload<C> | null,
  ): AsyncHandlerReturn<CommandReturnPayload<C> | null, T> {
    return new Promise((resolve) => {
      let commandPayload: CommandReturnPayload<C> | null = null;
      const handleAndUnsubscribe = (payload: EventPayload<E>) => {
        this.unsubscribe(event);
        resolve({ commandPayload, finalPayload: payload as T });
      };
      this.subscribe(event, handleAndUnsubscribe);
      commandPayload = executor();
    });
  }

  private static commandsValid(
    worldAppSupportedCommands: NonNullable<
      typeof window.WorldApp
    >['supported_commands'],
  ) {
    let allCommandsValid = true;
    Object.entries(this.miniKitCommandVersion).forEach(
      ([minikitCommandName, version]) => {
        const commandInput = worldAppSupportedCommands.find(
          (command) => command.name === minikitCommandName,
        );
        let isCommandValid = false;
        if (!commandInput) {
          console.warn(
            `Command ${minikitCommandName} is not supported by the app. Try updating the app version`,
          );
        } else {
          if (commandInput.supported_versions.includes(version)) {
            // TODO: add proper support for multiple versions
            MiniKit.isCommandAvailable[minikitCommandName] = true;
            isCommandValid = true;
          } else {
            // For now we will allow the command to be used but we should warn the developer and add granular support for each version
            isCommandValid = true;
            console.warn(
              `Command ${minikitCommandName} version ${version} is not supported by the app. Supported versions: ${commandInput.supported_versions.join(', ')}. This is not an error, but it is recommended to update the World App version.`,
            );
            MiniKit.isCommandAvailable[minikitCommandName] = isCommandValid;
          }
        }
        if (!isCommandValid) {
          allCommandsValid = false;
        }
      },
    );
    return allCommandsValid;
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
    MiniKit.user.optedIntoOptionalAnalytics =
      window.WorldApp.is_optional_analytics;
    MiniKit.user.deviceOS = window.WorldApp.device_os;
    MiniKit.user.worldAppVersion = window.WorldApp.world_app_version;

    // Set device properties
    MiniKit.deviceProperties.safeAreaInsets = window.WorldApp.safe_area_insets;
    MiniKit.deviceProperties.deviceOS = window.WorldApp.device_os;
    MiniKit.deviceProperties.worldAppVersion =
      window.WorldApp.world_app_version;

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

    // If commands are missing we will install minikit regardless
    MiniKit.isReady = true;
    setupMicrophone();

    if (!this.commandsValid(window.WorldApp.supported_commands)) {
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
    if (!isInstalled)
      console.error(
        "MiniKit is not installed. Make sure you're running the application inside of World App",
      );
    if (debug && isInstalled) console.log('MiniKit is alive!');
    return isInstalled;
  }

  public static getUserByAddress = async (
    address?: string,
  ): Promise<UserNameService> => {
    const userProfile = await getUserProfile(
      address ?? MiniKit.user.walletAddress!,
    );

    return {
      walletAddress: address ?? MiniKit.user.walletAddress!,
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

  // Simply re-exporting the existing function
  public static getUserInfo = this.getUserByAddress;

  public static commands = {
    verify: (payload: VerifyCommandInput): VerifyCommandPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.Verify]
      ) {
        console.error(
          "'verify' command is unavailable. Check MiniKit.install() or update the app version",
        );

        return null;
      }

      const timestamp = new Date().toISOString();
      const eventPayload: VerifyCommandPayload = {
        action: encodeAction(payload.action),
        signal: generateSignal(payload.signal).digest,
        verification_level: payload.verification_level || VerificationLevel.Orb,
        timestamp,
      };

      sendMiniKitEvent({
        command: Command.Verify,
        version: this.miniKitCommandVersion[Command.Verify],
        payload: eventPayload,
      });

      return eventPayload;
    },

    pay: (payload: PayCommandInput): PayCommandPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.Pay]
      ) {
        console.error(
          "'pay' command is unavailable. Check MiniKit.install() or update the app version",
        );
        return null;
      }

      // Validate the payload
      if (!validatePaymentPayload(payload)) {
        return null;
      }

      const eventPayload: PayCommandPayload = {
        ...payload,
        network: Network.WorldChain,
      };

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.Pay,
        version: this.miniKitCommandVersion[Command.Pay],
        payload: eventPayload,
      });

      return eventPayload;
    },

    walletAuth: (payload: WalletAuthInput): WalletAuthPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.WalletAuth]
      ) {
        console.error(
          "'walletAuth' command is unavailable. Check MiniKit.install() or update the app version",
        );

        return null;
      }

      const validationResult = validateWalletAuthCommandInput(payload);

      if (!validationResult.valid) {
        console.error(
          'Failed to validate wallet auth input:\n\n -->',
          validationResult.message,
        );

        return null;
      }

      let protocol: string | null = null;

      try {
        const currentUrl = new URL(window.location.href);
        protocol = currentUrl.protocol.split(':')[0];
      } catch (error) {
        console.error('Failed to get current URL', error);
        return null;
      }

      const siweMessage = generateSiweMessage({
        scheme: protocol,
        domain: window.location.host,
        statement: payload.statement ?? undefined,
        uri: window.location.href,
        version: '1',
        chain_id: 480,
        nonce: payload.nonce,
        issued_at: new Date().toISOString(),
        expiration_time: payload.expirationTime?.toISOString() ?? undefined,
        not_before: payload.notBefore?.toISOString() ?? undefined,
        request_id: payload.requestId ?? undefined,
      });

      const walletAuthPayload = { siweMessage };

      // Wallet auth version 2 is only available for world app version 2087900 and above
      const walletAuthVersion =
        MiniKit.user.worldAppVersion && MiniKit.user.worldAppVersion > 2087900
          ? this.miniKitCommandVersion[Command.WalletAuth]
          : 1;

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.WalletAuth,
        version: walletAuthVersion,
        payload: walletAuthPayload,
      });

      return walletAuthPayload;
    },

    sendTransaction: (
      payload: SendTransactionInput,
    ): SendTransactionPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.SendTransaction]
      ) {
        console.error(
          "'sendTransaction' command is unavailable. Check MiniKit.install() or update the app version",
        );

        return null;
      }

      // Default to formatting the payload
      payload.formatPayload = payload.formatPayload !== false;
      const validatedPayload = validateSendTransactionPayload(payload);

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.SendTransaction,
        version: this.miniKitCommandVersion[Command.SendTransaction],
        payload: validatedPayload,
      });

      return validatedPayload;
    },

    signMessage: (payload: SignMessageInput): SignMessagePayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.SignMessage]
      ) {
        console.error(
          "'signMessage' command is unavailable. Check MiniKit.install() or update the app version",
        );

        return null;
      }

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.SignMessage,
        version: this.miniKitCommandVersion[Command.SignMessage],
        payload,
      });

      return payload;
    },

    signTypedData: (
      payload: SignTypedDataInput,
    ): SignTypedDataPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.SignTypedData]
      ) {
        console.error(
          "'signTypedData' command is unavailable. Check MiniKit.install() or update the app version",
        );

        return null;
      }

      // If no chainId is provided, use Worldchain
      if (!payload.chainId) {
        payload.chainId = 480;
      }

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.SignTypedData,
        version: this.miniKitCommandVersion[Command.SignTypedData],
        payload,
      });

      return payload;
    },

    shareContacts: (
      payload: ShareContactsPayload,
    ): ShareContactsPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.ShareContacts]
      ) {
        console.error(
          "'shareContacts' command is unavailable. Check MiniKit.install() or update the app version",
        );

        return null;
      }

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.ShareContacts,
        version: this.miniKitCommandVersion[Command.ShareContacts],
        payload,
      });

      return payload;
    },

    requestPermission: (
      payload: RequestPermissionInput,
    ): RequestPermissionPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.RequestPermission]
      ) {
        console.error(
          "'requestPermission' command is unavailable. Check MiniKit.install() or update the app version",
        );
        return null;
      }

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.RequestPermission,
        version: this.miniKitCommandVersion[Command.RequestPermission],
        payload,
      });

      return payload;
    },

    getPermissions: (): GetPermissionsPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.GetPermissions]
      ) {
        console.error(
          "'getPermissions' command is unavailable. Check MiniKit.install() or update the app version",
        );
        return null;
      }

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.GetPermissions,
        version: this.miniKitCommandVersion[Command.GetPermissions],
        payload: {},
      });

      return {
        status: 'sent',
      };
    },

    sendHapticFeedback: (
      payload: SendHapticFeedbackInput,
    ): SendHapticFeedbackPayload | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.SendHapticFeedback]
      ) {
        console.error(
          "'sendHapticFeedback' command is unavailable. Check MiniKit.install() or update the app version",
        );
        return null;
      }

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.SendHapticFeedback,
        version: this.miniKitCommandVersion[Command.SendHapticFeedback],
        payload,
      });

      return payload;
    },

    // We return share input here because the payload is formatted asynchronously
    share: (payload: ShareInput): ShareInput | null => {
      if (
        typeof window === 'undefined' ||
        !this.isCommandAvailable[Command.Share]
      ) {
        console.error(
          "'share' command is unavailable. Check MiniKit.install() or update the app version",
        );
        return null;
      }
      if (
        MiniKit.deviceProperties.deviceOS === 'ios' &&
        typeof navigator !== 'undefined'
      ) {
        // Send the payload to the World App for Analytics
        sendMiniKitEvent<WebViewBasePayload>({
          command: Command.Share,
          version: this.miniKitCommandVersion[Command.Share],
          payload: payload,
        });
        navigator.share(payload);
      } else {
        // Only for android
        formatShareInput(payload)
          .then((formattedResult: SharePayload) => {
            sendMiniKitEvent<WebViewBasePayload>({
              command: Command.Share,
              version: this.miniKitCommandVersion[Command.Share],
              payload: formattedResult,
            });
          })
          .catch((error) => {
            console.error('Failed to format share input', error);
          });

        MiniKit.subscribe(ResponseEvent.MiniAppShare, (payload) => {
          // Do nothing here to simply handle the error response
          console.log('Share Response', payload);
        });
      }
      return payload;
    },
  };

  /**
   * This object contains async versions of all the commands.
   * Instead of using event listeners, you can just `await` these.
   *
   * They return a standardized object
   *
   * commandPayload - object returned by the command function
   *
   * finalPayload - object returned by the event listener, or in other words, WorldApp response
   */
  public static commandsAsync = {
    verify: async (
      payload: VerifyCommandInput,
    ): AsyncHandlerReturn<
      VerifyCommandPayload | null,
      MiniAppVerifyActionPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppVerifyAction,
            Command.Verify,
            () => this.commands.verify(payload),
          );
          if (
            response.finalPayload.status === 'success' &&
            response.finalPayload.verification_level === VerificationLevel.Orb
          ) {
            response.finalPayload.proof = await compressAndPadProof(
              response.finalPayload.proof as `0x${string}`,
            );
          }
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    pay: async (
      payload: PayCommandInput,
    ): AsyncHandlerReturn<PayCommandPayload | null, MiniAppPaymentPayload> => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppPayment,
            Command.Pay,
            () => this.commands.pay(payload),
          );
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    walletAuth: async (
      payload: WalletAuthInput,
    ): AsyncHandlerReturn<
      WalletAuthPayload | null,
      MiniAppWalletAuthPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppWalletAuth,
            Command.WalletAuth,
            () => this.commands.walletAuth(payload),
          );
          return resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    sendTransaction: async (
      payload: SendTransactionInput,
    ): AsyncHandlerReturn<
      SendTransactionPayload | null,
      MiniAppSendTransactionPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppSendTransaction,
            Command.SendTransaction,
            () => this.commands.sendTransaction(payload),
          );
          return resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    signMessage: async (
      payload: SignMessageInput,
    ): AsyncHandlerReturn<
      SignMessagePayload | null,
      MiniAppSignMessagePayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppSignMessage,
            Command.SignMessage,
            () => this.commands.signMessage(payload),
          );
          return resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    signTypedData: async (
      payload: SignTypedDataInput,
    ): AsyncHandlerReturn<
      SignTypedDataPayload | null,
      MiniAppSignTypedDataPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppSignTypedData,
            Command.SignTypedData,
            () => this.commands.signTypedData(payload),
          );
          return resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    shareContacts: async (
      payload: ShareContactsPayload,
    ): AsyncHandlerReturn<
      ShareContactsPayload | null,
      MiniAppShareContactsPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppShareContacts,
            Command.ShareContacts,
            () => this.commands.shareContacts(payload),
          );
          return resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },

    requestPermission: async (
      payload: RequestPermissionInput,
    ): AsyncHandlerReturn<
      RequestPermissionPayload | null,
      MiniAppRequestPermissionPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppRequestPermission,
            Command.RequestPermission,
            () => this.commands.requestPermission(payload),
          );
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    getPermissions: async (): AsyncHandlerReturn<
      GetPermissionsPayload | null,
      MiniAppGetPermissionsPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppGetPermissions,
            Command.GetPermissions,
            () => this.commands.getPermissions(),
          );
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    sendHapticFeedback: async (
      payload: SendHapticFeedbackInput,
    ): AsyncHandlerReturn<
      SendHapticFeedbackPayload | null,
      MiniAppSendHapticFeedbackPayload
    > => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppSendHapticFeedback,
            Command.SendHapticFeedback,
            () => this.commands.sendHapticFeedback(payload),
          );
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    },
    share: async (
      payload: ShareInput,
    ): AsyncHandlerReturn<ShareInput | null, MiniAppSharePayload> => {
      return new Promise(async (resolve, reject) => {
        try {
          const response = await MiniKit.awaitCommand(
            ResponseEvent.MiniAppShare,
            Command.Share,
            (() => this.commands.share(payload)) as any,
          );
          resolve({
            commandPayload: response.commandPayload as ShareInput | null,
            finalPayload: response.finalPayload as MiniAppSharePayload,
          });
        } catch (error) {
          reject(error);
        }
      });
    },
  };
}
