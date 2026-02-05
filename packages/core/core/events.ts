import { AppErrorCodes, VerificationLevel } from '@worldcoin/idkit-core';
import { ResponseEvent } from '../commands/types';
import type { MiniAppVerifyActionPayload } from '../commands/verify';
import { compressAndPadProof } from '../helpers/proof';

// Event handler and payload types
export type EventPayload<T extends ResponseEvent = ResponseEvent> = any; // Will be properly typed per-command

export type EventHandler<E extends ResponseEvent = ResponseEvent> = <
  T extends EventPayload<E>,
>(
  data: T,
) => void;

export class EventManager {
  private listeners: Record<ResponseEvent, EventHandler> = {
    [ResponseEvent.MiniAppVerifyAction]: () => {},
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

    // Process VerifyAction responses (error normalization + proof compression)
    if (event === ResponseEvent.MiniAppVerifyAction) {
      this.processVerifyActionPayload(
        payload as MiniAppVerifyActionPayload,
        this.listeners[event],
      );
      return;
    }

    this.listeners[event](payload);
  }

  private async processVerifyActionPayload(
    payload: MiniAppVerifyActionPayload,
    handler: EventHandler,
  ): Promise<void> {
    // Normalize error codes across iOS and Android
    if (
      payload.status === 'error' &&
      (payload.error_code as string) === 'user_rejected'
    ) {
      payload.error_code = AppErrorCodes.VerificationRejected;
    }

    if (payload.status === 'success') {
      if ('verifications' in payload) {
        // Multi-verification response - find and compress Orb proof if present
        const orbVerification = payload.verifications.find(
          (v) => v.verification_level === VerificationLevel.Orb,
        );
        if (orbVerification) {
          orbVerification.proof = await compressAndPadProof(
            orbVerification.proof as `0x${string}`,
          );
        }
      } else if (payload.verification_level === VerificationLevel.Orb) {
        // Single verification response
        payload.proof = await compressAndPadProof(
          payload.proof as `0x${string}`,
        );
      }
    }

    handler(payload);
  }
}
