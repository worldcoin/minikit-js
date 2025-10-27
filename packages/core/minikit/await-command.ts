import {
  AsyncHandlerReturn,
  Command,
  CommandReturnPayload,
} from 'types/commands';
import { EventPayload, ResponseEvent } from 'types/responses';

import { subscribe, unsubscribe } from './subscriptions';

export const awaitCommand = <
  E extends ResponseEvent,
  C extends Command,
  T extends EventPayload<E>,
>(
  event: E,
  _command: C,
  executor: () => CommandReturnPayload<C> | null,
): AsyncHandlerReturn<CommandReturnPayload<C> | null, T> => {
  return new Promise((resolve) => {
    let commandPayload: CommandReturnPayload<C> | null = null;

    const handleAndUnsubscribe = (payload: EventPayload<E>) => {
      unsubscribe(event);
      resolve({ commandPayload, finalPayload: payload as T });
    };

    subscribe(event, handleAndUnsubscribe as any);
    commandPayload = executor();
  });
};
