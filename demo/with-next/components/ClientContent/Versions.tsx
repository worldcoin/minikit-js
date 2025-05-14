'use client';

import {
  MiniKit,
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from '@worldcoin/minikit-js';

const appId = 'your-app-id';

export const Versions = () => {
  const isValid = () => {
    if (
      typeof window === 'undefined' ||
      typeof window.WorldApp === 'undefined'
    ) {
      return { isValid: false, error: 'window.WorldApp is undefined' };
    }

    try {
      // @ts-ignore
      if (MiniKit.commandsValid(window.WorldApp?.supported_commands)) {
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error:
            MiniKitInstallErrorMessage[MiniKitInstallErrorCodes.AppOutOfDate],
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Something went wrong on version validation',
      };
    }
  };

  const reinstall = () => {
    MiniKit.install(appId);
    JSON.stringify(isValid() ?? null, null, 2);
  };
  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Versions</h2>

      <div>
        <p>window.WorldApp:</p>
        <button onClick={reinstall}>Install</button>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre
            suppressHydrationWarning
            className="break-all whitespace-break-spaces"
          >
            {JSON.stringify(window?.WorldApp ?? null, null, 2)}
          </pre>
        </div>
      </div>

      <div>
        <p>Is versions Valid:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(isValid() ?? null, null, 2)}
          </pre>
        </div>
      </div>

      <div>
        <p>MiniKit.user:</p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(MiniKit.user ?? null, null, 2)}
          </pre>
        </div>
      </div>
      <div>
        <p>Device Properties:</p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(MiniKit.deviceProperties ?? null, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
