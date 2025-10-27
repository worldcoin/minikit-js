import { Command } from 'types/commands';
import { EventHandler, ResponseEvent } from 'types/responses';

export const MINIKIT_VERSION = 1;
export const MINIKIT_MINOR_VERSION = 96;

export const MINI_KIT_COMMAND_VERSION: Record<Command, number> = {
  [Command.Verify]: 1,
  [Command.Pay]: 1,
  [Command.WalletAuth]: 2,
  [Command.SendTransaction]: 1,
  [Command.SignMessage]: 1,
  [Command.SignTypedData]: 1,
  [Command.ShareContacts]: 1,
  [Command.RequestPermission]: 1,
  [Command.GetPermissions]: 1,
  [Command.SendHapticFeedback]: 1,
  [Command.Share]: 1,
  [Command.Chat]: 1,
};

export const DEFAULT_COMMAND_AVAILABILITY: Record<Command, boolean> = {
  [Command.Verify]: false,
  [Command.Pay]: false,
  [Command.WalletAuth]: false,
  [Command.SendTransaction]: false,
  [Command.SignMessage]: false,
  [Command.SignTypedData]: false,
  [Command.ShareContacts]: false,
  [Command.RequestPermission]: false,
  [Command.GetPermissions]: false,
  [Command.SendHapticFeedback]: false,
  [Command.Share]: false,
  [Command.Chat]: false,
};

const noOpHandler: EventHandler = () => {};

export const DEFAULT_LISTENERS: Record<ResponseEvent, EventHandler> = {
  [ResponseEvent.MiniAppVerifyAction]: noOpHandler,
  [ResponseEvent.MiniAppPayment]: noOpHandler,
  [ResponseEvent.MiniAppWalletAuth]: noOpHandler,
  [ResponseEvent.MiniAppSendTransaction]: noOpHandler,
  [ResponseEvent.MiniAppSignMessage]: noOpHandler,
  [ResponseEvent.MiniAppSignTypedData]: noOpHandler,
  [ResponseEvent.MiniAppShareContacts]: noOpHandler,
  [ResponseEvent.MiniAppRequestPermission]: noOpHandler,
  [ResponseEvent.MiniAppGetPermissions]: noOpHandler,
  [ResponseEvent.MiniAppSendHapticFeedback]: noOpHandler,
  [ResponseEvent.MiniAppShare]: noOpHandler,
  [ResponseEvent.MiniAppMicrophone]: noOpHandler,
  [ResponseEvent.MiniAppChat]: noOpHandler,
};
