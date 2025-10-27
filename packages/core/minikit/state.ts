import { Command } from 'types/commands';
import {
  DeviceProperties,
  MiniAppLaunchLocation,
  User,
} from 'types/init';
import { EventHandler, ResponseEvent } from 'types/responses';

import {
  DEFAULT_COMMAND_AVAILABILITY,
  DEFAULT_LISTENERS,
} from './constants';

export interface MiniKitRuntimeState {
  appId: string | null;
  user: User;
  deviceProperties: DeviceProperties;
  location: MiniAppLaunchLocation | null;
  isReady: boolean;
  commandAvailability: Record<Command, boolean>;
  listeners: Partial<Record<ResponseEvent, EventHandler>>;
}

const cloneCommandAvailability = () => ({ ...DEFAULT_COMMAND_AVAILABILITY });
const cloneListeners = () => ({ ...DEFAULT_LISTENERS });

export const state: MiniKitRuntimeState = {
  appId: null,
  user: {},
  deviceProperties: {},
  location: null,
  isReady: false,
  commandAvailability: cloneCommandAvailability(),
  listeners: cloneListeners(),
};

export const resetCommandAvailability = () => {
  state.commandAvailability = cloneCommandAvailability();
};

export const resetListeners = () => {
  state.listeners = cloneListeners();
};

export const setCommandAvailability = (
  command: Command,
  isAvailable: boolean,
) => {
  state.commandAvailability[command] = isAvailable;
};

export const isCommandAvailable = (command: Command) =>
  Boolean(state.commandAvailability[command]);

export const setListener = (event: ResponseEvent, handler: EventHandler) => {
  state.listeners[event] = handler;
};

export const removeListener = (event: ResponseEvent) => {
  delete state.listeners[event];
};
