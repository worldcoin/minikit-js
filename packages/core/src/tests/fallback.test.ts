import { executeWithFallback } from '../commands/fallback';
import * as commandTypes from '../commands/types';
import * as wagmiFallback from '../commands/wagmi-fallback';

describe('executeWithFallback', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not use wagmi fallback in World App when native execution fails', async () => {
    const nativeError = new Error('native failed');
    const nativeExecutor = jest.fn().mockRejectedValue(nativeError);
    const wagmiExecutor = jest.fn().mockResolvedValue('wagmi-result');

    jest.spyOn(commandTypes, 'isInWorldApp').mockReturnValue(true);
    jest.spyOn(commandTypes, 'isCommandAvailable').mockReturnValue(true);
    const hasWagmiConfigSpy = jest
      .spyOn(wagmiFallback, 'hasWagmiConfig')
      .mockReturnValue(true);

    await expect(
      executeWithFallback({
        command: commandTypes.Command.SignMessage,
        nativeExecutor,
        wagmiFallback: wagmiExecutor,
      }),
    ).rejects.toThrow(nativeError);

    expect(nativeExecutor).toHaveBeenCalledTimes(1);
    expect(wagmiExecutor).not.toHaveBeenCalled();
    expect(hasWagmiConfigSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('uses wagmi fallback on web when wagmi config exists', async () => {
    const nativeExecutor = jest.fn().mockResolvedValue('native-result');
    const wagmiExecutor = jest.fn().mockResolvedValue('wagmi-result');

    jest.spyOn(commandTypes, 'isInWorldApp').mockReturnValue(false);
    jest.spyOn(commandTypes, 'isCommandAvailable').mockReturnValue(false);
    jest.spyOn(wagmiFallback, 'hasWagmiConfig').mockReturnValue(true);

    const result = await executeWithFallback({
      command: commandTypes.Command.SignMessage,
      nativeExecutor,
      wagmiFallback: wagmiExecutor,
    });

    expect(nativeExecutor).not.toHaveBeenCalled();
    expect(wagmiExecutor).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      executedWith: 'wagmi',
      data: 'wagmi-result',
    });
  });
});
