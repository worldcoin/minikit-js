'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { useState } from 'react';

export const CloseMiniApp = () => {
  const [result, setResult] = useState<Record<string, any> | null>(null);

  const onCloseMiniApp = async () => {
    try {
      const response = await MiniKit.closeMiniApp();
      setResult(response);
    } catch (error) {
      setResult({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Close Mini App</h2>

      {result && (
        <div className="bg-gray-300 min-h-[40px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <button
        className="bg-black text-white rounded-lg p-4 w-full"
        onClick={onCloseMiniApp}
      >
        Close Mini App
      </button>
    </div>
  );
};
