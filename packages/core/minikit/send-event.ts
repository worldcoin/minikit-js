import { sendWebviewEvent } from 'helpers/send-webview-event';
import { WebViewBasePayload } from 'types/commands';

export const sendMiniKitEvent = <
  T extends WebViewBasePayload = WebViewBasePayload,
>(
  payload: T,
) => {
  sendWebviewEvent(payload);
};
