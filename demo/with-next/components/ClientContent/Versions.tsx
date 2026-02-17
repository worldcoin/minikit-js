'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { validateCommands } from '@worldcoin/minikit-js/commands';
import clsx from 'clsx';
import { useState } from 'react';

const appId = process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID;

export const Versions = (): JSX.Element => {
  const [username, setUsername] = useState('andy');
  const isValid = () => {
    if (
      typeof window === 'undefined' ||
      typeof window.WorldApp === 'undefined'
    ) {
      return { isValid: false, error: 'window.WorldApp is undefined' };
    }
    console.log(validateCommands(window.WorldApp.supported_commands));
    return { isValid: validateCommands(window.WorldApp.supported_commands) };
  };

  const reinstall = () => {
    MiniKit.install(appId);
    JSON.stringify(isValid() ?? null, null, 2);
  };
  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Version Check</h2>

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
      <div>
        <p>Location:</p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(MiniKit.location ?? null, null, 2)}
          </pre>
        </div>
      </div>
      <div>
        <p>App URL:</p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(
              MiniKit.getMiniAppUrl(
                'app_dec1bff0efe878fea0011d5b8b17ce99',
                '/test',
              ) ?? null,
              null,
              2,
            )}
          </pre>
        </div>
      </div>
      <div>
        <p>Show profile card:</p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className="w-full p-2 border border-gray-300 rounded-lg mb-2"
        />
        <button
          className={clsx(
            'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
          )}
          onClick={() => MiniKit.showProfileCard(username)}
          disabled={!username.trim()}
        >
          Show Profile Card
        </button>
      </div>
    </div>
  );
};
