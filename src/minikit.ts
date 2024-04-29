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
import { PayCommandPayload, VerifyCommandPayload } from "types/commands";

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
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const eventPayload: VerifyCommandPayload = {
        ...payload,
        timestamp,
      };
      sendMiniKitEvent({ command: Command.Verify, payload: eventPayload });

      return eventPayload;
    },

    pay: (payload: PayCommandInput): PayCommandPayload => {
      const reference = crypto.randomUUID();

      const network = Network.Optimism; // MiniKit only supports Optimism for now

      const eventPayload: PayCommandPayload = {
        ...payload,
        network,
        reference,
      };

      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.Pay,
        payload: eventPayload,
      });

      return eventPayload;
    },

    closeWebview: () => {
      sendWebviewEvent<{ command: string }>({ command: "close" });
    },
  };
}
