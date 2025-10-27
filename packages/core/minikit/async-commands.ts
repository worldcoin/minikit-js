import {
  AsyncHandlerReturn,
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
} from 'types/commands';
import {
  MiniAppChatPayload,
  MiniAppGetPermissionsPayload,
  MiniAppPaymentPayload,
  MiniAppRequestPermissionPayload,
  MiniAppSendHapticFeedbackPayload,
  MiniAppSendTransactionPayload,
  MiniAppShareContactsPayload,
  MiniAppSharePayload,
  MiniAppSignMessagePayload,
  MiniAppSignTypedDataPayload,
  MiniAppVerifyActionPayload,
  MiniAppWalletAuthPayload,
  ResponseEvent,
} from 'types/responses';

import { awaitCommand } from './await-command';
import { commands } from './commands';

export const commandsAsync = {
  verify: async (
    payload: VerifyCommandInput,
  ): AsyncHandlerReturn<
    VerifyCommandPayload | null,
    MiniAppVerifyActionPayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppVerifyAction,
      Command.Verify,
      () => commands.verify(payload),
    );
  },
  pay: async (
    payload: PayCommandInput,
  ): AsyncHandlerReturn<PayCommandPayload | null, MiniAppPaymentPayload> => {
    return awaitCommand(
      ResponseEvent.MiniAppPayment,
      Command.Pay,
      () => commands.pay(payload),
    );
  },
  walletAuth: async (
    payload: WalletAuthInput,
  ): AsyncHandlerReturn<WalletAuthPayload | null, MiniAppWalletAuthPayload> => {
    return awaitCommand(
      ResponseEvent.MiniAppWalletAuth,
      Command.WalletAuth,
      () => commands.walletAuth(payload),
    );
  },
  sendTransaction: async (
    payload: SendTransactionInput,
  ): AsyncHandlerReturn<
    SendTransactionPayload | null,
    MiniAppSendTransactionPayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppSendTransaction,
      Command.SendTransaction,
      () => commands.sendTransaction(payload),
    );
  },
  signMessage: async (
    payload: SignMessageInput,
  ): AsyncHandlerReturn<
    SignMessagePayload | null,
    MiniAppSignMessagePayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppSignMessage,
      Command.SignMessage,
      () => commands.signMessage(payload),
    );
  },
  signTypedData: async (
    payload: SignTypedDataInput,
  ): AsyncHandlerReturn<
    SignTypedDataPayload | null,
    MiniAppSignTypedDataPayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppSignTypedData,
      Command.SignTypedData,
      () => commands.signTypedData(payload),
    );
  },
  shareContacts: async (
    payload: ShareContactsPayload,
  ): AsyncHandlerReturn<
    ShareContactsPayload | null,
    MiniAppShareContactsPayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppShareContacts,
      Command.ShareContacts,
      () => commands.shareContacts(payload),
    );
  },
  requestPermission: async (
    payload: RequestPermissionInput,
  ): AsyncHandlerReturn<
    RequestPermissionPayload | null,
    MiniAppRequestPermissionPayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppRequestPermission,
      Command.RequestPermission,
      () => commands.requestPermission(payload),
    );
  },
  getPermissions: async (): AsyncHandlerReturn<
    GetPermissionsPayload | null,
    MiniAppGetPermissionsPayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppGetPermissions,
      Command.GetPermissions,
      () => commands.getPermissions(),
    );
  },
  sendHapticFeedback: async (
    payload: SendHapticFeedbackInput,
  ): AsyncHandlerReturn<
    SendHapticFeedbackPayload | null,
    MiniAppSendHapticFeedbackPayload
  > => {
    return awaitCommand(
      ResponseEvent.MiniAppSendHapticFeedback,
      Command.SendHapticFeedback,
      () => commands.sendHapticFeedback(payload),
    );
  },
  share: async (
    payload: ShareInput,
  ): AsyncHandlerReturn<ShareInput | null, MiniAppSharePayload> => {
    const response = await awaitCommand<
      ResponseEvent.MiniAppShare,
      Command.Share,
      MiniAppSharePayload
    >(
      ResponseEvent.MiniAppShare,
      Command.Share,
      (() => commands.share(payload)) as () => SharePayload | null,
    );

    return {
      commandPayload: response.commandPayload as ShareInput | null,
      finalPayload: response.finalPayload,
    };
  },
  chat: async (
    payload: ChatPayload,
  ): AsyncHandlerReturn<ChatPayload | null, MiniAppChatPayload> => {
    return awaitCommand(
      ResponseEvent.MiniAppChat,
      Command.Chat,
      () => commands.chat(payload),
    );
  },
};
