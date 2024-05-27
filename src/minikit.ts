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

export const sendMiniKitEvent = <
  T extends WebViewBasePayload = WebViewBasePayload,
>(
  payload: T
) => {
  sendWebviewEvent(payload);
};

export class MiniKit {
  private static listeners: Record<ResponseEvent, EventHandler> = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
    [ResponseEvent.MiniAppPayment]: () => {},
    [ResponseEvent.MiniAppWalletAuth]: () => {},
  };

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
      } catch (error) {
        console.error("Failed to install MiniKit", error);
        return { success: false, error };
      }
    }

    return { success: true };
  }

  public static isInstalled(debug?: boolean) {
    if (debug) console.log("MiniKit is alive!");
    return true;
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
        version: 1,
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
        version: 1,
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
        version: 1,
        payload: walletAuthPayload,
      });

      return walletAuthPayload;
    },

    closeWebview: () => {
      sendWebviewEvent<{ command: string }>({ command: "close" });
    },
  };
}
