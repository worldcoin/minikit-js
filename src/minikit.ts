import { sendWebviewEvent } from "./helpers/send-webview-event";
import {
  VerifyCommandInput,
  PayCommandInput,
  EventPayload,
  EventHandler,
  WebViewBasePayload,
  Command,
} from "./types";
import { ResponseEvent } from "./types/responses";
import { Network } from "types/payment";
import {
  PayCommandPayload,
  SendTransactionInput,
  SendTransactionPayload,
  SignMessageInput,
  SignMessagePayload,
  SignTypedDataInput,
  SignTypedDataPayload,
  VerifyCommandPayload,
  WalletAuthInput,
  WalletAuthPayload,
} from "types/commands";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { validateWalletAuthCommandInput } from "helpers/siwe/validate-wallet-auth-command-input";
import { generateSiweMessage } from "helpers/siwe/siwe";
import {
  MiniKitInstallErrorCodes,
  MiniKitInstallReturnType,
  MiniKitInstallErrorMessage,
} from "types";
import { validatePaymentPayload } from "helpers/payment/client";

export const sendMiniKitEvent = <
  T extends WebViewBasePayload = WebViewBasePayload,
>(
  payload: T
) => {
  sendWebviewEvent(payload);
};

export class MiniKit {
  private static readonly MINIKIT_VERSION = 1;

  private static readonly commandVersion = {
    [Command.Verify]: 1,
    [Command.Pay]: 1,
    [Command.WalletAuth]: 1,
    [Command.SendTransaction]: 1,
    [Command.SignMessage]: 1,
    [Command.SignTypedData]: 1,
  };

  private static listeners: Record<ResponseEvent, EventHandler> = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
    [ResponseEvent.MiniAppPayment]: () => {},
    [ResponseEvent.MiniAppWalletAuth]: () => {},
    [ResponseEvent.MiniAppSendTransaction]: () => {},
    [ResponseEvent.MiniAppSignMessage]: () => {},
    [ResponseEvent.MiniAppSignTypedData]: () => {},
  };

  public static walletAddress: string | null = null;

  private static sendInit() {
    sendWebviewEvent({
      command: "init",
      payload: { version: this.MINIKIT_VERSION },
    });
  }

  public static subscribe<E extends ResponseEvent>(
    event: E,
    handler: EventHandler<E>
  ) {
    if (event === ResponseEvent.MiniAppWalletAuth) {
      const originalHandler =
        handler as EventHandler<ResponseEvent.MiniAppWalletAuth>;

      const wrappedHandler: EventHandler<ResponseEvent.MiniAppWalletAuth> = (
        payload
      ) => {
        if (payload.status === "success") {
          MiniKit.walletAddress = payload.address;
        }

        originalHandler(payload);
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
      console.error(`No handler for event ${event}`);
      return;
    }
    this.listeners[event](payload);
  }

  private static commandsValid(
    input: NonNullable<typeof window.WorldApp>["supported_commands"]
  ) {
    return Object.entries(this.commandVersion).every(
      ([commandName, version]) => {
        const commandInput = input.find(
          (command) => command.name === commandName
        );
        return commandInput
          ? commandInput.supported_versions.includes(version)
          : false;
      }
    );
  }

  public static install(): MiniKitInstallReturnType {
    if (typeof window === "undefined" || Boolean(window.MiniKit)) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.AlreadyInstalled,
        errorMessage:
          MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AlreadyInstalled],
      };
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

    if (!this.commandsValid(window.WorldApp.supported_commands)) {
      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.AppOutOfDate,
        errorMessage:
          MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AppOutOfDate],
      };
    }

    try {
      window.MiniKit = MiniKit;
      this.sendInit();
    } catch (error) {
      console.error(
        MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.Unknown],
        error
      );

      return {
        success: false,
        errorCode: MiniKitInstallErrorCodes.Unknown,
        errorMessage:
          MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.Unknown],
      };
    }

    return { success: true };
  }

  public static isInstalled(debug?: boolean) {
    if (debug) console.log("MiniKit is alive!");
    return Boolean(window.MiniKit);
  }

  public static commands = {
    verify: (payload: VerifyCommandInput): VerifyCommandPayload => {
      const timestamp = new Date().toISOString();
      const eventPayload: VerifyCommandPayload = {
        ...payload,
        signal: payload.signal || "",
        verification_level: payload.verification_level || VerificationLevel.Orb,
        timestamp,
      };
      sendMiniKitEvent({
        command: Command.Verify,
        version: this.commandVersion[Command.Verify],
        payload: eventPayload,
      });

      return eventPayload;
    },

    pay: (payload: PayCommandInput): PayCommandPayload | null => {
      if (typeof window === "undefined") {
        console.error(
          "'pay' method is only available in a browser environment."
        );
        return null;
      }

      // Validate the payload
      if (!validatePaymentPayload(payload)) {
        return null;
      }

      const network = Network.WorldChain; // MiniKit only supports Optimism for now

      const eventPayload: PayCommandPayload = {
        ...payload,
        network,
      };

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.Pay,
        version: this.commandVersion[Command.Pay],
        payload: eventPayload,
      });

      return eventPayload;
    },

    walletAuth: (payload: WalletAuthInput): WalletAuthPayload | null => {
      if (typeof window === "undefined") {
        console.error(
          "'walletAuth' method is only available in a browser environment."
        );

        return null;
      }

      const validationResult = validateWalletAuthCommandInput(payload);

      if (!validationResult.valid) {
        console.error(
          "Failed to validate wallet auth input:\n\n -->",
          validationResult.message
        );

        return null;
      }

      let protocol: string | null = null;

      try {
        const currentUrl = new URL(window.location.href);
        protocol = currentUrl.protocol.split(":")[0];
      } catch (error) {
        console.error("Failed to get current URL", error);
        return null;
      }

      const siweMessage = generateSiweMessage({
        scheme: protocol,
        domain: window.location.host,
        statement: payload.statement ?? undefined,
        uri: window.location.href,
        version: 1,
        chain_id: 10,
        nonce: payload.nonce,
        issued_at: new Date().toISOString(),
        expiration_time: payload.expirationTime?.toISOString() ?? undefined,
        not_before: payload.notBefore?.toISOString() ?? undefined,
        request_id: payload.requestId ?? undefined,
      });

      const walletAuthPayload = { siweMessage };

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.WalletAuth,
        version: this.commandVersion[Command.WalletAuth],
        payload: walletAuthPayload,
      });

      return walletAuthPayload;
    },

    sendTransaction: (
      payload: SendTransactionInput
    ): SendTransactionPayload => {
      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.SendTransaction,
        version: 1,
        payload,
      });

      return payload;
    },

    signMessage: (payload: SignMessageInput): SignMessagePayload => {
      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.SignMessage,
        version: 1,
        payload,
      });

      return payload;
    },

    signTypedData: (payload: SignTypedDataInput): SignTypedDataPayload => {
      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.SignTypedData,
        version: 1,
        payload,
      });

      return payload;
    },
  };
}
