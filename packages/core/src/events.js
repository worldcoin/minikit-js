import { ResponseEvent } from './commands/types';
export class EventManager {
  constructor() {
    this.listeners = {
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
  }
  subscribe(event, handler) {
    this.listeners[event] = handler;
  }
  unsubscribe(event) {
    delete this.listeners[event];
  }
  trigger(event, payload) {
    if (!this.listeners[event]) {
      console.error(
        `No handler for event ${event}, payload: ${JSON.stringify(payload)}`,
      );
      return;
    }
    this.listeners[event](payload);
  }
}
