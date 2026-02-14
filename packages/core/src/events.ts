import { ResponseEvent } from './commands/types';

// Event handler and payload types
export type EventPayload<T extends ResponseEvent = ResponseEvent> = any; // Will be properly typed per-command

export type EventHandler<E extends ResponseEvent = ResponseEvent> = <
  T extends EventPayload<E>,
>(
  data: T,
) => void;

export class EventManager {
  private listeners: Record<ResponseEvent, EventHandler> = {
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
    [ResponseEvent.MiniAppChat]: () => {},
  };

  subscribe<E extends ResponseEvent>(event: E, handler: EventHandler<E>): void {
    this.listeners[event] = handler;
  }

  unsubscribe(event: ResponseEvent): void {
    delete this.listeners[event];
  }

  trigger(event: ResponseEvent, payload: EventPayload): void {
    if (!this.listeners[event]) {
      console.error(
        `No handler for event ${event}, payload: ${JSON.stringify(payload)}`,
      );
      return;
    }

    this.listeners[event](payload);
  }
}
