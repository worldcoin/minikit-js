import { VerificationLevel } from '@worldcoin/idkit-core';
import { encodeAction, generateSignal } from '@worldcoin/idkit-core/hashing';

import { validatePaymentPayload } from 'helpers/payment/client';
import { formatShareInput } from 'helpers/share';
import { generateSiweMessage } from 'helpers/siwe/siwe';
import { validateWalletAuthCommandInput } from 'helpers/siwe/validate-wallet-auth-command-input';
import { validateSendTransactionPayload } from 'helpers/transaction/validate-payload';

import {
  ChatPayload,
  Command,
  GetPermissionsPayload,
  PayCommandInput,
  PayCommandPayload,
  RequestPermissionInput,
  RequestPermissionPayload,
  SendHapticFeedbackInput,
  SendHapticFeedbackPayload,
  SendTransactionInput,
  SendTransactionPayload,
  ShareContactsPayload,
  ShareInput,
  SharePayload,
  SignMessageInput,
  SignMessagePayload,
  SignTypedDataInput,
  SignTypedDataPayload,
  VerifyCommandInput,
  VerifyCommandPayload,
  WalletAuthInput,
  WalletAuthPayload,
  WebViewBasePayload,
} from 'types/commands';
import { Network } from 'types/payment';
import { ResponseEvent } from 'types/responses';

import { MINI_KIT_COMMAND_VERSION } from './constants';
import { sendMiniKitEvent } from './send-event';
import { isCommandAvailable, state } from './state';
import { subscribe } from './subscriptions';

const assertCommandAvailability = (command: Command) => {
  if (typeof window === 'undefined' || !isCommandAvailable(command)) {
    console.error(
      `'${command}' command is unavailable. Check MiniKit.install() or update the app version`,
    );
    return false;
  }

  return true;
};

export const commands = {
  verify: (payload: VerifyCommandInput): VerifyCommandPayload | null => {
    if (!assertCommandAvailability(Command.Verify)) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const eventPayload: VerifyCommandPayload = {
      action: encodeAction(payload.action),
      signal: generateSignal(payload.signal).digest,
      verification_level: payload.verification_level || VerificationLevel.Orb,
      timestamp,
    };

    sendMiniKitEvent({
      command: Command.Verify,
      version: MINI_KIT_COMMAND_VERSION[Command.Verify],
      payload: eventPayload,
    });

    return eventPayload;
  },

  pay: (payload: PayCommandInput): PayCommandPayload | null => {
    if (!assertCommandAvailability(Command.Pay)) {
      return null;
    }

    if (!validatePaymentPayload(payload)) {
      return null;
    }

    const eventPayload: PayCommandPayload = {
      ...payload,
      network: Network.WorldChain,
    };

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.Pay,
      version: MINI_KIT_COMMAND_VERSION[Command.Pay],
      payload: eventPayload,
    });

    return eventPayload;
  },

  walletAuth: (payload: WalletAuthInput): WalletAuthPayload | null => {
    if (!assertCommandAvailability(Command.WalletAuth)) {
      return null;
    }

    const validationResult = validateWalletAuthCommandInput(payload);
    if (!validationResult.valid) {
      console.error(
        'Failed to validate wallet auth input:\n\n -->',
        validationResult.message,
      );

      return null;
    }

    let protocol: string | null = null;

    try {
      const currentUrl = new URL(window.location.href);
      protocol = currentUrl.protocol.split(':')[0];
    } catch (error) {
      console.error('Failed to get current URL', error);
      return null;
    }

    const siweMessage = generateSiweMessage({
      scheme: protocol,
      domain: window.location.host,
      statement: payload.statement ?? undefined,
      uri: window.location.href,
      version: '1',
      chain_id: 480,
      nonce: payload.nonce,
      issued_at: new Date().toISOString(),
      expiration_time: payload.expirationTime?.toISOString() ?? undefined,
      not_before: payload.notBefore?.toISOString() ?? undefined,
      request_id: payload.requestId ?? undefined,
    });

    const walletAuthPayload = { siweMessage };

    // Wallet auth version 2 is only available for world app version 2087900 and above
    const walletAuthVersion =
      state.user.worldAppVersion && state.user.worldAppVersion > 2087900
        ? MINI_KIT_COMMAND_VERSION[Command.WalletAuth]
        : 1;

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.WalletAuth,
      version: walletAuthVersion,
      payload: walletAuthPayload,
    });

    return walletAuthPayload;
  },

  sendTransaction: (
    payload: SendTransactionInput,
  ): SendTransactionPayload | null => {
    if (!assertCommandAvailability(Command.SendTransaction)) {
      return null;
    }

    // Default to formatting the payload
    payload.formatPayload = payload.formatPayload !== false;
    const validatedPayload = validateSendTransactionPayload(payload);

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.SendTransaction,
      version: MINI_KIT_COMMAND_VERSION[Command.SendTransaction],
      payload: validatedPayload,
    });

    return validatedPayload;
  },

  signMessage: (payload: SignMessageInput): SignMessagePayload | null => {
    if (!assertCommandAvailability(Command.SignMessage)) {
      return null;
    }

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.SignMessage,
      version: MINI_KIT_COMMAND_VERSION[Command.SignMessage],
      payload,
    });

    return payload;
  },

  signTypedData: (
    payload: SignTypedDataInput,
  ): SignTypedDataPayload | null => {
    if (!assertCommandAvailability(Command.SignTypedData)) {
      return null;
    }

    if (!payload.chainId) {
      payload.chainId = 480;
    }

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.SignTypedData,
      version: MINI_KIT_COMMAND_VERSION[Command.SignTypedData],
      payload,
    });

    return payload;
  },

  shareContacts: (
    payload: ShareContactsPayload,
  ): ShareContactsPayload | null => {
    if (!assertCommandAvailability(Command.ShareContacts)) {
      return null;
    }

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.ShareContacts,
      version: MINI_KIT_COMMAND_VERSION[Command.ShareContacts],
      payload,
    });

    return payload;
  },

  requestPermission: (
    payload: RequestPermissionInput,
  ): RequestPermissionPayload | null => {
    if (!assertCommandAvailability(Command.RequestPermission)) {
      return null;
    }

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.RequestPermission,
      version: MINI_KIT_COMMAND_VERSION[Command.RequestPermission],
      payload,
    });

    return payload;
  },

  getPermissions: (): GetPermissionsPayload | null => {
    if (!assertCommandAvailability(Command.GetPermissions)) {
      return null;
    }

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.GetPermissions,
      version: MINI_KIT_COMMAND_VERSION[Command.GetPermissions],
      payload: {},
    });

    return {
      status: 'sent',
    };
  },

  sendHapticFeedback: (
    payload: SendHapticFeedbackInput,
  ): SendHapticFeedbackPayload | null => {
    if (!assertCommandAvailability(Command.SendHapticFeedback)) {
      return null;
    }

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.SendHapticFeedback,
      version: MINI_KIT_COMMAND_VERSION[Command.SendHapticFeedback],
      payload,
    });

    return payload;
  },

  // We return share input here because the payload is formatted asynchronously
  share: (payload: ShareInput): ShareInput | null => {
    if (!assertCommandAvailability(Command.Share)) {
      return null;
    }

    if (
      state.deviceProperties.deviceOS === 'ios' &&
      typeof navigator !== 'undefined'
    ) {
      // Send the payload to the World App for Analytics
      sendMiniKitEvent<WebViewBasePayload>({
        command: Command.Share,
        version: MINI_KIT_COMMAND_VERSION[Command.Share],
        payload,
      });
      navigator.share(payload);
    } else {
      // Only for android
      formatShareInput(payload)
        .then((formattedResult: SharePayload) => {
          sendMiniKitEvent<WebViewBasePayload>({
            command: Command.Share,
            version: MINI_KIT_COMMAND_VERSION[Command.Share],
            payload: formattedResult,
          });
        })
        .catch((error) => {
          console.error('Failed to format share input', error);
        });

      subscribe(ResponseEvent.MiniAppShare, (payload) => {
        // Do nothing here to simply handle the error response
        console.log('Share Response', payload);
      });
    }

    return payload;
  },

  chat: (payload: ChatPayload): ChatPayload | null => {
    if (!assertCommandAvailability(Command.Chat)) {
      return null;
    }

    if (payload.message.length === 0) {
      console.error("'chat' command requires a non-empty message");
      return null;
    }

    sendMiniKitEvent<WebViewBasePayload>({
      command: Command.Chat,
      version: MINI_KIT_COMMAND_VERSION[Command.Chat],
      payload,
    });

    return payload;
  },
};
