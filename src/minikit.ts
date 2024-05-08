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
import { VerificationLevel } from "@worldcoin/idkit-core";
import {
  PayCommandPayload,
  VerifyCommandPayload,
  WalletAuthInput,
} from "types/commands";
import { generateSiweMessage } from "helpers/generate-siwe-message";

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
      sendMiniKitEvent({ command: Command.Verify, payload: eventPayload });

      return eventPayload;
    },

    pay: (payload: PayCommandInput): PayCommandPayload | null => {
      if (typeof window === "undefined") {
        console.error(
          "'pay' method is only available in a browser environment."
        );
        return null;
      }

      const network = Network.Optimism; // MiniKit only supports Optimism for now

      const eventPayload: PayCommandPayload = {
        ...payload,
        network,
      };

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.Pay,
        payload: eventPayload,
      });

      return eventPayload;
    },

    walletAuth: (payload: WalletAuthInput) => {
      if (typeof window === "undefined") {
        console.error(
          "'walletAuth' method is only available in a browser environment."
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

      const siweMessageResult = generateSiweMessage({
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
        // REVIEW: Should we include this field? What should be the fallback?
        // address: "0x1234567890",
      });

      if (!siweMessageResult.success) {
        console.error(siweMessageResult.error.message);
        return siweMessageResult;
      }

      const { siweMessage } = siweMessageResult;

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.WalletAuth,
        payload: { message: siweMessage },
      });

      return siweMessageResult;
    },

    closeWebview: () => {
      sendWebviewEvent<{ command: string }>({ command: "close" });
    },
  };
}
