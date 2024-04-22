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
import { createReferenceId, mapTokensToAddresses } from "helpers/payment";
import { PayCommandPayload } from "types/commands";

export const sendMiniKitEvent = <
  T extends WebViewBasePayload = WebViewBasePayload,
>(
  payload: T
) => {
  sendWebviewEvent(payload);
};

export class MiniKit {
  private static provider;

  private static listeners: Record<ResponseEvent, EventHandler> = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
    [ResponseEvent.MiniAppPayment]: () => {},
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
      return;
    }

    this.listeners[event](payload);
  }

  public static install(params?: { alchemyKey?: string; provider?: any }) {
    const { alchemyKey, provider } = {
      alchemyKey: params?.alchemyKey,
      provider: params?.provider,
    };

    if (typeof window !== "undefined" && !Boolean(window.MiniKit)) {
      try {
        window.MiniKit = MiniKit;
      } catch (error) {
        console.error("Failed to install MiniKit", error);
        return { success: false, error };
      }
    }

    if (provider) {
      this.provider = provider;
    } else if (alchemyKey) {
      // Todo: Create provider
    }

    return { success: true };
  }

  public static isInstalled() {
    console.log("MiniKit is alive!");
    return true;
  }

  public static commands = {
    verify: (payload: VerifyCommandInput) => {
      sendMiniKitEvent({ command: Command.Verify, payload });
    },

    pay: (payload: PayCommandInput): string => {
      const reference = createReferenceId(); // We generate a reference ID that the app will sign in the response

      const accepted_payment_token_addresses = mapTokensToAddresses(
        payload.accepted_payment_tokens
      );

      const network = Network.Optimism; // MiniKit only supports Optimism for now

      const eventPayload: PayCommandPayload = {
        ...payload,
        accepted_payment_token_addresses,
        network,
        reference,
      };

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.Pay,
        payload: eventPayload,
      });

      return reference;
    },

    closeWebview: () => {
      sendWebviewEvent<{ command: string }>({ command: "close" });
    },
  };
}
