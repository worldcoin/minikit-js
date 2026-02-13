import { ResponseEvent } from '../commands/types';
import {
  createVerifyAsyncCommand,
  type MiniAppVerifyActionPayload,
  type VerifyCommandPayload,
} from '../commands/verify';

describe('createVerifyAsyncCommand', () => {
  it('rejects when a second verify request is sent while one is in flight', async () => {
    const subscribers: Array<(payload: MiniAppVerifyActionPayload) => void> =
      [];
    const events = {
      subscribe: jest.fn(
        (
          _event: ResponseEvent,
          handler: (payload: MiniAppVerifyActionPayload) => void,
        ) => {
          subscribers.push(handler);
        },
      ),
      unsubscribe: jest.fn(),
    };

    const commandPayload = {
      action: 'test-action',
      signal: '0x01',
      verification_level: 'orb',
      timestamp: new Date().toISOString(),
    } as unknown as VerifyCommandPayload;

    const syncCommand = jest.fn().mockReturnValue(commandPayload);
    const verifyAsync = createVerifyAsyncCommand(
      { events, state: {} as any } as any,
      syncCommand as any,
    );

    const firstPromise = verifyAsync({ action: 'first' } as any);
    await expect(verifyAsync({ action: 'second' } as any)).rejects.toThrow(
      'A verify request is already in flight. Wait for the current request to complete before sending another.',
    );

    expect(syncCommand).toHaveBeenCalledTimes(1);

    const firstResponse: MiniAppVerifyActionPayload = {
      status: 'error',
      error_code: 'user_rejected',
      version: 1,
    };
    subscribers[0](firstResponse);

    await expect(firstPromise).resolves.toEqual({
      commandPayload,
      finalPayload: firstResponse,
    });
  });

  it('releases in-flight lock when sync command returns null', async () => {
    const subscribers: Array<(payload: MiniAppVerifyActionPayload) => void> =
      [];
    const events = {
      subscribe: jest.fn(
        (
          _event: ResponseEvent,
          handler: (payload: MiniAppVerifyActionPayload) => void,
        ) => {
          subscribers.push(handler);
        },
      ),
      unsubscribe: jest.fn(),
    };

    const secondCommandPayload = {
      action: 'test-action',
      signal: '0x01',
      verification_level: 'orb',
      timestamp: new Date().toISOString(),
    } as unknown as VerifyCommandPayload;

    const syncCommand = jest
      .fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(secondCommandPayload);
    const verifyAsync = createVerifyAsyncCommand(
      { events, state: {} as any } as any,
      syncCommand as any,
    );

    await expect(verifyAsync({ action: 'first' } as any)).rejects.toThrow(
      'Failed to send verify command. Ensure MiniKit is installed and the verify command is available.',
    );

    const secondPromise = verifyAsync({ action: 'second' } as any);
    const secondResponse: MiniAppVerifyActionPayload = {
      status: 'error',
      error_code: 'user_rejected',
      version: 1,
    };
    subscribers[1](secondResponse);

    await expect(secondPromise).resolves.toEqual({
      commandPayload: secondCommandPayload,
      finalPayload: secondResponse,
    });
  });
});
