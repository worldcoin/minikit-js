import { executeWithFallback } from '../fallback';
import type { CommandResultByVia } from '../types';
import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  sendMiniKitEvent,
} from '../types';
import type { CloseMiniAppResult, MiniKitCloseMiniAppOptions } from './types';

export * from './types';

export async function closeMiniApp<TFallback = CloseMiniAppResult>(
  options: MiniKitCloseMiniAppOptions<TFallback> = {},
  _ctx?: CommandContext,
): Promise<CommandResultByVia<CloseMiniAppResult, TFallback, 'minikit'>> {
  const result = await executeWithFallback({
    command: Command.CloseMiniApp,
    nativeExecutor: () => nativeCloseMiniApp(),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  return {
    executedWith: 'minikit',
    data: result.data as CloseMiniAppResult,
  };
}

async function nativeCloseMiniApp(): Promise<CloseMiniAppResult> {
  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.CloseMiniApp)
  ) {
    throw new Error(
      "'closeMiniApp' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  sendMiniKitEvent({
    command: Command.CloseMiniApp,
    version: COMMAND_VERSIONS[Command.CloseMiniApp],
    payload: {},
  });

  return {
    status: 'success',
    version: COMMAND_VERSIONS[Command.CloseMiniApp],
  };
}
