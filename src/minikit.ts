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
  VerifyCommandPayload,
  WalletAuthInput,
  WalletAuthPayload,
} from "types/commands";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { validateWalletAuthCommandInput } from "helpers/siwe/validate-wallet-auth-command-input";
import { generateSiweMessage } from "helpers/siwe/siwe";

type WorldAppInitInput = {
  world_app_version: number;
  device_os: "ios|android";
  supported_commands: Array<{
    name: Command;
    supported_versions: Array<number>;
  }>;
};

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
  };

  private static listeners: Record<ResponseEvent, EventHandler> = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
    [ResponseEvent.MiniAppPayment]: () => {},
    [ResponseEvent.MiniAppWalletAuth]: () => {},
  };

  private static sendInit() {
    sendWebviewEvent({
      command: "init",
      payload: { version: this.MINIKIT_VERSION },
    });
  }

  private static commandsValid(input: WorldAppInitInput["supported_commands"]) {
    return input.every((command) =>
      command.supported_versions.includes(this.commandVersion[command.name])
    );
  }

  public static subscribe<E extends ResponseEvent>(
    event: E,
    handler: EventHandler<E>
  ) {
    this.listeners[event] = handler;
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

  public static install() {
    if (typeof window !== "undefined" && !Boolean(window.MiniKit)) {
      try {
        window.MiniKit = MiniKit;
        this.sendInit();
      } catch (error) {
        console.error("Failed to install MiniKit", error);
        return { success: false, error };
      }
    }

    return { success: true };
  }

  public static isInstalled(debug?: boolean) {
    if (debug) console.log("MiniKit is alive!");

    if (typeof window !== "undefined" && !Boolean(window.WorldApp)) {
      return false;
    }

    return true;
  }

  public static worldAppInit(input: WorldAppInitInput) {
    if (typeof window === "undefined") {
      console.error("worldAppInit can only be called in the browser");
    }

    window.WorldApp = true;

    if (!this.commandsValid(input.supported_commands)) {
      throw new Error("Unsupported app version. Please update your app");
    }
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

      // User generated reference cannot exceed 36 characters in length
      if (payload.reference.length > 36) {
        console.error("Reference must not exceed 36 characters");
        return null;
      }

      const network = Network.Optimism; // MiniKit only supports Optimism for now

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
  };
}
