import { Command, setCommandAvailable } from '../commands';
import { MiniKit } from '../minikit';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

describe('sendTransaction version compatibility', () => {
  let originalWindow: unknown;

  beforeEach(() => {
    originalWindow = (global as any).window;
    (global as any).window = {
      WorldApp: {
        supported_commands: [
          {
            name: Command.SendTransaction,
            supported_versions: [2],
          },
        ],
      },
      webkit: {
        messageHandlers: {
          minikit: {
            postMessage: jest.fn(),
          },
        },
      },
    };
    setCommandAvailable(Command.SendTransaction, true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setCommandAvailable(Command.SendTransaction, false);
    (global as any).window = originalWindow;
  });

  it('throws old app version when the app does not support v2', async () => {
    const postMessage = (global as any).window.webkit.messageHandlers.minikit
      .postMessage as jest.Mock;
    (global as any).window.WorldApp.supported_commands = [
      {
        name: Command.SendTransaction,
        supported_versions: [1],
      },
    ];

    await expect(
      MiniKit.sendTransaction({
        chainId: 480,
        transactions: [
          {
            to: ADDRESS,
            data: '0x1234',
            value: '0x1',
          },
        ],
      } as any),
    ).rejects.toMatchObject({
      name: 'CommandUnavailableError',
      reason: 'oldAppVersion',
    });

    expect(postMessage).not.toHaveBeenCalled();
  });
});
