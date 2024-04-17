import { IDKitConfig } from "@worldcoin/idkit-core";
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

export const sendMiniKitEvent = <
  T extends WebViewBasePayload = WebViewBasePayload,
>(
  payload: T
) => {
  sendWebviewEvent(payload);
};

export class MiniKit {
  private static appId: `app_${string}`;

  private static listeners: Record<ResponseEvent, EventHandler> = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
    [ResponseEvent.MiniAppPaymentInitiated]: () => {},
    [ResponseEvent.MiniAppPaymentCompleted]: () => {},
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

  public static install({ app_id }: { app_id: `app_${string}` }) {
    this.appId = app_id;

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

  public static isInstalled() {
    console.log("MiniKit is alive!");
    return true;
  }

  public static commands = {
    verify: (payload: VerifyCommandInput) => {
      sendMiniKitEvent({ command: Command.Verify, payload });
    },

    pay: (payload: PayCommandInput) => {
      sendMiniKitEvent<WebViewBasePayload & { app_id: IDKitConfig["app_id"] }>({
        command: Command.Pay,
        app_id: this.appId,
        payload,
      });
    },

    closeWebview: () => {
      sendWebviewEvent<{ command: string }>({ command: "close" });
    },
  };
}
