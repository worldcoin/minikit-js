import { VerificationLevel } from '@worldcoin/idkit-core';

import { compressAndPadProof } from 'helpers/proof';
import { VerificationErrorCodes } from 'types/errors';
import {
  EventHandler,
  EventPayload,
  ResponseEvent,
} from 'types/responses';

import { getUserByAddress } from './users';
import { removeListener, setListener, state } from './state';

export const subscribe = <E extends ResponseEvent>(
  event: E,
  handler: EventHandler<E>,
) => {
  if (event === ResponseEvent.MiniAppWalletAuth) {
    const originalHandler =
      handler as EventHandler<ResponseEvent.MiniAppWalletAuth>;

    const wrappedHandler: EventHandler<
      ResponseEvent.MiniAppWalletAuth
    > = async (payload) => {
      if (payload.status === 'success') {
        state.user.walletAddress = payload.address;
        try {
          const user = await getUserByAddress(payload.address);
          state.user = { ...state.user, ...user };
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }

      originalHandler(payload);
    };

    setListener(event, wrappedHandler as EventHandler<E>);
    return;
  }

  if (event === ResponseEvent.MiniAppVerifyAction) {
    const originalHandler =
      handler as EventHandler<ResponseEvent.MiniAppVerifyAction>;
    const wrappedHandler: EventHandler<ResponseEvent.MiniAppVerifyAction> = (
      payload,
    ) => {
      // Align error codes on iOS and Android
      if (
        payload.status === 'error' &&
        (payload.error_code as string) === 'user_rejected'
      ) {
        payload.error_code = VerificationErrorCodes.VerificationRejected;
      }

      if (
        payload.status === 'success' &&
        payload.verification_level === VerificationLevel.Orb
      ) {
        // Note: On Chain Proofs won't work on staging with this change
        compressAndPadProof(payload.proof as `0x${string}`).then(
          (compressedProof) => {
            payload.proof = compressedProof;
            originalHandler(payload);
          },
        );
      } else {
        originalHandler(payload);
      }
    };

    setListener(event, wrappedHandler as EventHandler<E>);
    return;
  }

  setListener(event, handler);
};

export const unsubscribe = (event: ResponseEvent) => {
  removeListener(event);
};

export const trigger = (event: ResponseEvent, payload: EventPayload) => {
  const listener = state.listeners[event];
  if (!listener) {
    console.error(
      `No handler for event ${event}, payload: ${JSON.stringify(payload)}`,
    );
    return;
  }

  listener(payload);
};
