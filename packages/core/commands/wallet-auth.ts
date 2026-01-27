import { generateSiweMessage } from '../helpers/siwe/siwe';
import { validateWalletAuthCommandInput } from '../helpers/siwe/validate-wallet-auth-command-input';
import {
  Command,
  CommandContext,
  COMMAND_VERSIONS,
  isCommandAvailable,
  sendMiniKitEvent,
  ResponseEvent,
  AsyncHandlerReturn,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type WalletAuthInput = {
  nonce: string;
  statement?: string;
  requestId?: string;
  expirationTime?: Date;
  notBefore?: Date;
};

export type WalletAuthPayload = {
  siweMessage: string;
};

export enum WalletAuthErrorCodes {
  MalformedRequest = 'malformed_request',
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const WalletAuthErrorMessage = {
  [WalletAuthErrorCodes.MalformedRequest]:
    'Provided parameters in the request are invalid.',
  [WalletAuthErrorCodes.UserRejected]: 'User rejected the request.',
  [WalletAuthErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export type MiniAppWalletAuthSuccessPayload = {
  status: 'success';
  message: string;
  signature: string;
  address: string;
  version: number;
};

export type MiniAppWalletAuthErrorPayload = {
  status: 'error';
  error_code: WalletAuthErrorCodes;
  details: (typeof WalletAuthErrorMessage)[WalletAuthErrorCodes];
  version: number;
};

export type MiniAppWalletAuthPayload =
  | MiniAppWalletAuthSuccessPayload
  | MiniAppWalletAuthErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createWalletAuthCommand(ctx: CommandContext) {
  return (payload: WalletAuthInput): WalletAuthPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.WalletAuth)
    ) {
      console.error(
        "'walletAuth' command is unavailable. Check MiniKit.install() or update the app version",
      );
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
      ctx.state.user.worldAppVersion && ctx.state.user.worldAppVersion > 2087900
        ? COMMAND_VERSIONS[Command.WalletAuth]
        : 1;

    sendMiniKitEvent({
      command: Command.WalletAuth,
      version: walletAuthVersion,
      payload: walletAuthPayload,
    });

    return walletAuthPayload;
  };
}

export function createWalletAuthAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createWalletAuthCommand>,
) {
  return async (
    payload: WalletAuthInput,
  ): AsyncHandlerReturn<WalletAuthPayload | null, MiniAppWalletAuthPayload> => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: WalletAuthPayload | null = null;

        const handleResponse = async (response: MiniAppWalletAuthPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppWalletAuth);

          // Update user state on successful auth
          if (response.status === 'success') {
            await ctx.state.updateUserFromWalletAuth(response.address);
          }

          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(ResponseEvent.MiniAppWalletAuth, handleResponse as any);
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
