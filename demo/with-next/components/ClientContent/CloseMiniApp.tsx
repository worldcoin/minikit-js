import { MiniKit } from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';

export const CloseMiniApp = () => {
  const [result, setResult] = useState<boolean | null>(null);

  const onCloseMiniApp = useCallback(() => {
    const success = MiniKit.commands.closeMiniApp();
    setResult(success);
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Close Mini App</h2>

        {result !== null && (
          <div className="bg-gray-300 min-h-[40px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify({ sent: result }, null, 2)}
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
    </div>
  );
};
